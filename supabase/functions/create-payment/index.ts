
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { bookingId, amount, currency, reason, userId, referenceType, referenceId, phoneNumber } = await req.json();
    
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
    
    // Integration with PawaPay API
    const pawaPayToken = Deno.env.get('PAWAPAY_TOKEN');
    if (!pawaPayToken) {
      console.error('PAWAPAY_TOKEN not found in environment');
      return new Response(JSON.stringify({ error: 'Payment provider configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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
        phone_number: phoneNumber
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
    
    // Prepare PawaPay payment request
    const paymentRequestBody = {
      reference: paymentTransaction.id,
      reason: reason || 'Payment for services',
      amount: {
        value: amount.toString(),
        currency: currency
      },
      redirectUrl: `${Deno.env.get('SUPABASE_URL') || 'https://rxqoczksnddbxcdwobnw.supabase.co'}/functions/v1/verify-payment?txnId=${paymentTransaction.id}`,
      cancelUrl: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-result?status=cancelled&txnId=${paymentTransaction.id}`,
      customer: {
        name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
        email: user.email || 'customer@example.com',
        phoneNumber: phoneNumber // Add phone number for mobile money payment
      }
    };
    
    console.log('PawaPay payment request:', JSON.stringify(paymentRequestBody));
    
    // Simulate PawaPay API response - in production you would call their API
    // This is a mock response for demonstration purposes
    const mockPawaPayResponse = {
      id: `pawa_${Math.random().toString(36).substring(2, 15)}`,
      status: 'pending',
      redirectUrl: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-result?status=success&txnId=${paymentTransaction.id}`,
    };
    
    // Update the payment transaction with the payment provider's transaction ID
    await supabaseClient
      .from('payment_transactions')
      .update({
        provider_transaction_id: mockPawaPayResponse.id,
        status: mockPawaPayResponse.status,
        metadata: { 
          pawaPayResponse: mockPawaPayResponse,
          customerPhone: phoneNumber
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
          phone_number: phoneNumber
        })
        .eq('id', referenceId);
    } else if (referenceType === 'event') {
      await supabaseClient
        .from('registrations')
        .update({
          payment_id: paymentTransaction.id,
          payment_status: 'processing',
          phone_number: phoneNumber
        })
        .eq('id', referenceId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentTransaction.id,
        redirectUrl: mockPawaPayResponse.redirectUrl,
        status: 'pending'
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
