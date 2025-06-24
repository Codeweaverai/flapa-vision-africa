
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const PAWAPAY_TOKEN = Deno.env.get('PAWAPAY_TOKEN') || '';

const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false
  }
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the session user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Error getting authenticated user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const { 
      amount, 
      originalAmount,
      originalCurrency, 
      phone_number, 
      operator, 
      country, 
      creator_id 
    } = await req.json();

    console.log('PawaPay payout request:', { 
      amount, 
      originalAmount,
      originalCurrency,
      phone_number, 
      operator, 
      country, 
      creator_id 
    });

    // Validate required fields
    if (!amount || !phone_number || !operator || !country || !creator_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get creator profile to verify mobile money setup and get email
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('mobile_money_operator, mobile_money_number, full_name, username, email')
      .eq('id', creator_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Creator profile not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get user email from auth.users if not in profile
    let userEmail = profile.email;
    if (!userEmail) {
      const { data: authUser, error: authError } = await supabaseServiceClient.auth.admin.getUserById(creator_id);
      if (authUser && authUser.user) {
        userEmail = authUser.user.email;
      }
    }

    // Convert amount to appropriate currency for the operator's country
    const currencyMap: Record<string, string> = {
      'ZMB': 'ZMW',
      'KEN': 'KES',
      'UGA': 'UGX',
      'TZA': 'TZS',
      'GHA': 'GHS',
      'NGA': 'NGN',
      'RWA': 'RWF'
    };

    const targetCurrency = currencyMap[country] || 'USD';
    
    // Convert USD amount to target currency if needed
    let finalAmount = amount;
    if (targetCurrency !== 'USD') {
      // Use the original amount if it's already in the target currency
      if (originalCurrency === targetCurrency) {
        finalAmount = originalAmount;
      } else {
        // Convert USD to target currency (you might want to use a conversion service here)
        const conversionRates: Record<string, number> = {
          'ZMW': 23.2,
          'KES': 129.5,
          'UGX': 3680,
          'TZS': 2380,
          'GHS': 12.1,
          'NGN': 755,
          'RWF': 1024
        };
        finalAmount = Math.round(amount * (conversionRates[targetCurrency] || 1));
      }
    }

    // Generate unique payout ID
    const payoutId = crypto.randomUUID();

    // Create payout record in database
    const { data: payoutRecord, error: payoutError } = await supabaseServiceClient
      .from('creator_payouts')
      .insert({
        id: payoutId,
        creator_id,
        amount,
        currency: targetCurrency,
        method: 'mobile_money',
        payout_method: 'mobile_money',
        destination: `${operator} - ${phone_number}`,
        status: 'pending',
        mobile_money_details: {
          phone_number,
          operator,
          country,
          amount: finalAmount,
          currency: targetCurrency,
          original_amount: originalAmount,
          original_currency: originalCurrency
        }
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout record:', payoutError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to create payout record' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Map operator to PawaPay provider format
    const providerMap: Record<string, string> = {
      'mtn_zmb': 'MTN_MOMO_ZMB',
      'airtel_zmb': 'AIRTEL_OAPI_ZMB'
      // Add more mappings as needed
    };

    const provider = providerMap[operator] || operator.toUpperCase();

    // Prepare PawaPay request
    const pawapayPayload = {
      payoutId,
      recipient: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phone_number,
          provider: provider
        }
      },
      customerMessage: "Creator Payout",
      amount: finalAmount.toString(),
      currency: targetCurrency,
      metadata: [
        {
          orderId: payoutId
        },
        {
          customerId: creator_id,
          isPII: true
        }
      ]
    };

    console.log('PawaPay payout payload:', JSON.stringify(pawapayPayload, null, 2));

    // Make request to PawaPay
    const pawapayResponse = await fetch('https://api.sandbox.pawapay.io/v2/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pawapayPayload)
    });

    const pawapayResult = await pawapayResponse.json();
    console.log('PawaPay response:', JSON.stringify(pawapayResult, null, 2));

    // Update payout record based on PawaPay response
    let updateData: any = {
      pawapay_deposit_id: pawapayResult.payoutId,
      updated_at: new Date().toISOString()
    };

    if (pawapayResult.status === 'ACCEPTED') {
      updateData.status = 'processing';
      
      // Send confirmation email if we have user email
      if (userEmail) {
        try {
          await supabaseServiceClient.functions.invoke('payout-confirmation-email', {
            body: {
              email: userEmail,
              creatorId: creator_id,
              amount: finalAmount,
              currency: targetCurrency,
              payoutId,
              method: 'mobile_money',
              destination: `${operator} - ${phone_number}`
            }
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }
    } else if (pawapayResult.status === 'REJECTED') {
      updateData.status = 'failed';
    } else if (pawapayResult.status === 'DUPLICATE_IGNORED') {
      updateData.status = 'duplicate';
    }

    await supabaseServiceClient
      .from('creator_payouts')
      .update(updateData)
      .eq('id', payoutId);

    return new Response(
      JSON.stringify({ 
        success: pawapayResult.status === 'ACCEPTED',
        payoutId: pawapayResult.payoutId,
        status: pawapayResult.status,
        message: pawapayResult.status === 'ACCEPTED' 
          ? 'Payout request accepted successfully'
          : pawapayResult.failureReason?.failureMessage || 'Payout request failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error processing PawaPay payout:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
