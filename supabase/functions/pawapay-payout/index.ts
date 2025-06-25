
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const PAWAPAY_TOKEN = Deno.env.get('PAWAPAY_TOKEN') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false
  }
});

const resend = new Resend(RESEND_API_KEY);

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
      targetAmount,
      targetCurrency,
      phone_number, 
      operator, 
      country, 
      creator_id 
    } = await req.json();

    console.log('PawaPay payout request:', { 
      amount, 
      targetAmount,
      targetCurrency,
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

    // Get creator profile
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('mobile_money_operator, mobile_money_number, full_name, username')
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

    // Get user email from auth
    const { data: { user: creatorUser }, error: creatorUserError } = await supabaseServiceClient.auth.admin.getUserById(creator_id);
    
    if (creatorUserError || !creatorUser?.email) {
      console.error('Error getting creator user email:', creatorUserError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Creator email not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
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

    const payoutCurrency = currencyMap[country] || 'USD';
    
    // Use target amount and currency if provided, otherwise convert USD
    let finalAmount = targetAmount || amount;
    let finalCurrency = targetCurrency || payoutCurrency;
    
    if (!targetAmount) {
      // Convert USD to target currency if no target amount provided
      const conversionRates: Record<string, number> = {
        'ZMW': 23.2,
        'KES': 129.5,
        'UGX': 3680,
        'TZS': 2380,
        'GHS': 12.1,
        'NGN': 755,
        'RWF': 1024
      };
      finalAmount = Math.round(amount * (conversionRates[payoutCurrency] || 1));
      finalCurrency = payoutCurrency;
      console.log(`Converting ${amount} USD to ${finalAmount} ${payoutCurrency} using rate ${conversionRates[payoutCurrency]}`);
    }

    // Generate unique payout ID
    const payoutId = crypto.randomUUID();

    // Create payout record in database
    const { data: payoutRecord, error: payoutError } = await supabaseServiceClient
      .from('creator_payouts')
      .insert({
        id: payoutId,
        creator_id,
        amount: finalAmount,
        currency: finalCurrency,
        method: 'mobile_money',
        payout_method: 'mobile_money',
        destination: `${operator} - ${phone_number}`,
        status: 'pending',
        mobile_money_details: {
          phone_number,
          operator,
          country,
          amount: finalAmount,
          currency: finalCurrency,
          original_usd_amount: amount
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
      'airtel_zmb': 'AIRTEL_OAPI_ZMB',
      'mtn_ken': 'MTN_MOMO_KEN',
      'airtel_ken': 'AIRTEL_OAPI_KEN',
      'mtn_uga': 'MTN_MOMO_UGA',
      'airtel_uga': 'AIRTEL_OAPI_UGA'
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
      currency: finalCurrency,
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
      updateData.status = 'completed'; // Set to completed instead of processing
      
      // Send confirmation email using Resend
      try {
        const emailResponse = await resend.emails.send({
          from: "SkillPulse <onboarding@resend.dev>",
          to: creatorUser.email,
          subject: "Payout Request Confirmed - SkillPulse",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Payout Confirmed</h1>
              
              <p>Hello ${profile.full_name || profile.username || 'Creator'},</p>
              
              <p>Your payout request has been confirmed and processed successfully!</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Payout Details:</h3>
                <p><strong>Amount:</strong> ${finalCurrency} ${finalAmount.toFixed(2)}</p>
                <p><strong>Method:</strong> Mobile Money</p>
                <p><strong>Destination:</strong> ${operator} - ${phone_number}</p>
                <p><strong>Payout ID:</strong> ${payoutId}</p>
                <p><strong>Status:</strong> Completed</p>
              </div>
              
              <p>Your funds should arrive in your mobile money account within 24 hours.</p>
              
              <p>Thank you for being a valued creator on SkillPulse!</p>
              
              <p>Best regards,<br>The SkillPulse Team</p>
            </div>
          `,
        });

        console.log('Confirmation email sent successfully:', emailResponse);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
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
        status: pawapayResult.status === 'ACCEPTED' ? 'completed' : pawapayResult.status,
        amount: finalAmount,
        currency: finalCurrency,
        message: pawapayResult.status === 'ACCEPTED' 
          ? 'Payout request accepted and completed successfully'
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
