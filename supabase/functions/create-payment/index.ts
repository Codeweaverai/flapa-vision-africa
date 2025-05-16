
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-digest',
};

// Helper function to create SHA-512 hash digest
async function createSha512Digest(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(String.fromCharCode.apply(null, hashArray)); // Base64 encoding
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );
    
    // Verify the user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse the request body
    const { bookingId, amount, currency, reason, userId, referenceType, referenceId, phoneNumber, mobileOperator } = await req.json();
    
    // Check that all required fields are present
    if (!amount || !currency || !userId || !referenceType || !referenceId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for mobile money phone number for payment processing
    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: 'Missing phone number for mobile money payment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine the mobile operator/correspondent
    const correspondent = mobileOperator || "MTN_MOMO_ZMB"; // Default to MTN if not specified
    
    // Integration with PawaPay API
    const pawaPayToken = Deno.env.get('PAWAPAY_TOKEN');
    if (!pawaPayToken) {
      console.error('PAWAPAY_TOKEN not found in environment');
      return new Response(JSON.stringify({ error: 'Payment provider configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique deposit ID
    const depositId = crypto.randomUUID();
    
    // Format phone number properly - ensure it has country code without any symbols
    const formattedPhoneNumber = phoneNumber.replace(/[^0-9]/g, ''); // Remove any non-numeric characters
    const phoneWithCountryCode = formattedPhoneNumber.startsWith('260') 
      ? formattedPhoneNumber 
      : `260${formattedPhoneNumber.replace(/^0+/, '')}`; // Add country code if missing and remove leading zeros
    
    // Create a payment transaction record
    const { data: paymentTransaction, error: paymentError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        amount,
        currency,
        status: 'pending',
        provider: 'pawapay',
        phone_number: phoneWithCountryCode,
        metadata: {
          depositId,
          correspondent,
          reason
        }
      })
      .select()
      .single();
      
    if (paymentError) {
      console.error('Error creating payment transaction:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the user's profile for contact information
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    // Current timestamp in ISO format
    const customerTimestamp = new Date().toISOString();
    
    // Prepare PawaPay payment request
    const paymentRequestBody = {
      depositId,
      amount: amount.toString(),
      currency,
      correspondent,
      payer: {
        type: "MSISDN",
        address: {
          value: phoneWithCountryCode
        }
      },
      customerTimestamp,
      statementDescription: reason || 'Payment for services'
    };
    
    // Create the content digest
    const requestBodyString = JSON.stringify(paymentRequestBody);
    const digest = await createSha512Digest(requestBodyString);
    const contentDigestHeader = `sha-512=:${digest}:`;
    
    console.log('PawaPay payment request:', JSON.stringify(paymentRequestBody));
    console.log('Content-Digest:', contentDigestHeader);
    
    // Simulate PawaPay API response - in production you would call their API
    // This is a mock response for demonstration purposes
    const mockPawaPayResponse = {
      id: depositId,
      status: 'pending',
      redirectUrl: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-result?status=success&txnId=${paymentTransaction.id}`,
    };
    
    // In production, you would call the actual PawaPay API
    // const pawaPayResponse = await fetch('https://api.sandbox.pawapay.io/deposits', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${pawaPayToken}`,
    //     'Content-Digest': contentDigestHeader,
    //   },
    //   body: requestBodyString
    // });
    // const responseData = await pawaPayResponse.json();
    
    // Update the payment transaction with the payment provider's transaction ID
    await supabaseClient
      .from('payment_transactions')
      .update({
        provider_transaction_id: mockPawaPayResponse.id,
        status: mockPawaPayResponse.status,
        metadata: { 
          pawaPayResponse: mockPawaPayResponse,
          customerPhone: phoneWithCountryCode,
          correspondent,
          depositId,
          customerTimestamp
        }
      })
      .eq('id', paymentTransaction.id);
      
    // Update the reference (consultation or event) with the payment ID
    if (referenceType === 'consultation') {
      await supabaseClient
        .from('consultation_bookings')
        .update({
          payment_id: paymentTransaction.id,
          payment_status: 'processing',
          phone_number: phoneWithCountryCode
        })
        .eq('id', referenceId);
    } else if (referenceType === 'event') {
      await supabaseClient
        .from('registrations')
        .update({
          payment_id: paymentTransaction.id,
          payment_status: 'processing',
          phone_number: phoneWithCountryCode
        })
        .eq('id', referenceId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentTransaction.id,
        redirectUrl: mockPawaPayResponse.redirectUrl,
        status: 'pending',
        depositId
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
