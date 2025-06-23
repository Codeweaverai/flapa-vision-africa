
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayoutRequest {
  amount: number;
  phone_number: string;
  operator: string;
  country: string;
  creator_id: string;
}

// Map operator codes to PawaPay provider codes
const getProviderCode = (operator: string, country: string): string => {
  const providerMap: { [key: string]: string } = {
    // Zambia
    'mtn_zmb': 'MTN_MOMO_ZMB',
    'airtel_zmb': 'AIRTEL_OAPI_ZMB',
    
    // Kenya
    'mpesa_ken': 'MPESA_KEN',
    'airtel_ken': 'AIRTEL_OAPI_KEN',
    'equitel_ken': 'EQUITEL_KEN',
    
    // Uganda
    'mtn_uga': 'MTN_MOMO_UGA',
    'airtel_uga': 'AIRTEL_OAPI_UGA',
    
    // Tanzania
    'vodacom_tza': 'VODACOM_LIPA_TZA',
    'tigo_tza': 'TIGO_TZA',
    'airtel_tza': 'AIRTEL_OAPI_TZA',
    
    // Ghana
    'mtn_gha': 'MTN_MOMO_GHA',
    'vodafone_gha': 'VODAFONE_GHA',
    'airteltigo_gha': 'AIRTELTIGO_GHA',
    
    // Nigeria
    'mtn_nga': 'MTN_MOMO_NGA',
    'airtel_nga': 'AIRTEL_OAPI_NGA',
    'glo_nga': 'GLO_NGA',
    '9mobile_nga': '9MOBILE_NGA',
    
    // Rwanda
    'mtn_rwa': 'MTN_MOMO_RWA',
    'airtel_rwa': 'AIRTEL_OAPI_RWA',
    
    // Add more mappings as needed
  };
  
  return providerMap[operator] || operator.toUpperCase();
};

// Get currency for country
const getCurrencyForCountry = (countryCode: string): string => {
  const currencyMap: { [key: string]: string } = {
    'ZMB': 'ZMW',
    'KEN': 'KES',
    'UGA': 'UGX',
    'TZA': 'TZS',
    'GHA': 'GHS',
    'NGA': 'NGN',
    'RWA': 'RWF',
    'MWI': 'MWK',
    'MOZ': 'MZN',
    'SEN': 'XOF',
    'BEN': 'XOF',
    'BFA': 'XOF',
    'CMR': 'XAF',
    'COG': 'XAF',
    'COD': 'CDF',
    'GAB': 'XAF',
    'CIV': 'XOF',
    'LSO': 'LSL',
    'SLE': 'SLL',
  };
  
  return currencyMap[countryCode] || 'USD';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { amount, phone_number, operator, country, creator_id }: PayoutRequest = await req.json();
    
    // Validate that the authenticated user matches the creator_id
    if (user.id !== creator_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const pawaPayToken = Deno.env.get("PAWAPAY_TOKEN");
    if (!pawaPayToken) {
      throw new Error("PawaPay token not configured");
    }

    // Create Supabase client for database operations with service role
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get creator profile for email
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', creator_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('Creator profile not found');
    }

    // Generate a unique payout ID
    const payoutId = crypto.randomUUID();
    
    // Get provider code and currency
    const providerCode = getProviderCode(operator, country);
    const currency = getCurrencyForCountry(country);
    
    // Convert USD amount to local currency (simplified - in production you'd use real exchange rates)
    let localAmount = amount;
    if (currency !== 'USD') {
      // This is a simplified conversion - you should use real exchange rates
      const exchangeRates: { [key: string]: number } = {
        'ZMW': 23.5, 'KES': 129, 'UGX': 3700, 'TZS': 2300, 
        'GHS': 12, 'NGN': 1500, 'RWF': 1200, 'MWK': 1200
      };
      localAmount = amount * (exchangeRates[currency] || 1);
    }
    
    // Round to 2 decimal places for most currencies
    const roundedAmount = Math.round(localAmount * 100) / 100;

    // Create payout record first
    const { data: payoutRecord, error: payoutError } = await supabaseServiceClient
      .from('creator_payouts')
      .insert({
        creator_id: creator_id,
        amount: amount,
        currency: 'usd',
        method: 'mobile_money',
        payout_method: 'mobile_money',
        destination: `${operator} - ${phone_number}`,
        status: 'pending',
        mobile_money_details: {
          phone_number,
          operator,
          country,
          provider_code: providerCode,
          local_currency: currency,
          local_amount: roundedAmount
        },
        pawapay_deposit_id: payoutId
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Payout record error:', payoutError);
      throw new Error(`Failed to create payout record: ${payoutError.message}`);
    }

    // PawaPay payout request using new API
    const pawaPayPayload = {
      payoutId: payoutId,
      recipient: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phone_number,
          provider: providerCode
        }
      },
      customerMessage: "Creator Payout",
      amount: roundedAmount.toString(),
      currency: currency,
      metadata: [
        {
          orderId: payoutRecord.id,
        },
        {
          customerId: profile.email || 'unknown@email.com',
          isPII: true
        }
      ]
    };

    console.log('PawaPay payout payload:', JSON.stringify(pawaPayPayload, null, 2));
    
    const pawaPayResponse = await fetch("https://api.sandbox.pawapay.io/v2/payouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pawaPayToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pawaPayPayload),
    });

    const pawaPayResult = await pawaPayResponse.json();
    console.log('PawaPay response:', JSON.stringify(pawaPayResult, null, 2));

    if (!pawaPayResponse.ok) {
      console.error("PawaPay error:", pawaPayResult);
      
      // Handle different error types
      let errorMessage = 'Payment failed';
      if (pawaPayResult.failureReason) {
        const { failureCode, failureMessage } = pawaPayResult.failureReason;
        
        switch (failureCode) {
          case 'INVALID_PHONE_NUMBER':
            errorMessage = 'Invalid phone number for the selected provider';
            break;
          case 'INVALID_CURRENCY':
            errorMessage = `Currency ${currency} not supported by ${providerCode}`;
            break;
          case 'INVALID_AMOUNT':
            errorMessage = 'Invalid amount format for this provider';
            break;
          case 'AMOUNT_OUT_OF_BOUNDS':
            errorMessage = 'Amount is outside the allowed limits for this provider';
            break;
          case 'PROVIDER_TEMPORARILY_UNAVAILABLE':
            errorMessage = 'Mobile money provider is temporarily unavailable';
            break;
          case 'AUTHENTICATION_ERROR':
            errorMessage = 'Payment service authentication failed';
            break;
          default:
            errorMessage = failureMessage || 'Payment processing failed';
        }
      }
      
      // Update payout record with error
      await supabaseServiceClient
        .from('creator_payouts')
        .update({ 
          status: 'failed',
          mobile_money_details: {
            ...payoutRecord.mobile_money_details,
            error_code: pawaPayResult.failureReason?.failureCode,
            error_message: pawaPayResult.failureReason?.failureMessage
          }
        })
        .eq('id', payoutRecord.id);
        
      throw new Error(errorMessage);
    }

    // Update the payout record based on PawaPay response
    let updateData: any = {
      provider_payout_id: payoutId
    };

    if (pawaPayResult.status === 'ACCEPTED') {
      updateData.status = 'processing';
    } else if (pawaPayResult.status === 'DUPLICATE_IGNORED') {
      updateData.status = 'completed';
    } else if (pawaPayResult.status === 'REJECTED') {
      updateData.status = 'failed';
      updateData.mobile_money_details = {
        ...payoutRecord.mobile_money_details,
        error_code: pawaPayResult.failureReason?.failureCode,
        error_message: pawaPayResult.failureReason?.failureMessage
      };
    }

    const { error: updateError } = await supabaseServiceClient
      .from('creator_payouts')
      .update(updateData)
      .eq('id', payoutRecord.id);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // Send confirmation email only if payout was accepted
    if (pawaPayResult.status === 'ACCEPTED') {
      try {
        await supabaseServiceClient.functions.invoke('payout-confirmation-email', {
          body: {
            email: profile.email,
            amount: amount,
            currency: 'USD',
            method: 'Mobile Money',
            destination: `${providerCode} - ${phone_number}`,
            creatorName: profile.full_name || profile.username || 'Creator'
          }
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the payout if email fails
      }
    }

    return new Response(JSON.stringify({
      success: pawaPayResult.status === 'ACCEPTED',
      payoutId: payoutRecord.id,
      status: pawaPayResult.status,
      pawapayId: payoutId,
      message: pawaPayResult.status === 'ACCEPTED' 
        ? 'Payout request accepted and being processed'
        : pawaPayResult.status === 'DUPLICATE_IGNORED'
        ? 'Duplicate payout request ignored'
        : 'Payout request rejected',
      failureReason: pawaPayResult.failureReason
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payout error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to process payout"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
