
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
    const { 
      amount, 
      currency, 
      phone_number, 
      mobile_operator,
      referenceType, // 'event' or 'consultation'
      referenceId,
      userId
    } = await req.json();
    
    if (!amount || !currency || !phone_number || !mobile_operator || !referenceType || !referenceId || !userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          fields: { amount, currency, phone_number, mobile_operator, referenceType, referenceId, userId }
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a payment record in the database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        amount: amount,
        currency: currency,
        status: 'pending',
        phone_number: phone_number,
        correspondent: mobile_operator,
        payer_type: 'MSISDN',
        payer_address: phone_number
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // In a production environment, we would integrate with PawaPay here
    // For this example, we'll simulate a successful payment response
    
    // Get the origin for the redirect URL
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const redirectUrl = `${origin}/payment-result?status=success&txnId=${payment.id}&type=${referenceType}&id=${referenceId}`;
    
    // Update the transaction with a success status (simulating successful payment)
    // In production, this would be handled by a webhook or callback from PawaPay
    await supabaseClient
      .from('payment_transactions')
      .update({ status: 'completed' })
      .eq('id', payment.id);
      
    // Update the registration/booking status
    if (referenceType === 'event') {
      await supabaseClient
        .from('registrations')
        .update({
          payment_status: 'confirmed',
          status: 'confirmed',
          payment_id: payment.id,
          payment_amount: amount,
          payment_currency: currency
        })
        .eq('id', referenceId);
    } else if (referenceType === 'consultation') {
      await supabaseClient
        .from('consultation_bookings')
        .update({
          payment_status: 'confirmed',
          status: 'confirmed',
          payment_id: payment.id,
          payment_amount: amount,
          payment_currency: currency
        })
        .eq('id', referenceId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        redirectUrl: redirectUrl,
        status: 'success'
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
