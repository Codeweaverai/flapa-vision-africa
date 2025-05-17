
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
      referenceType, // 'event' or 'consultation'
      referenceId,
      userId,
      eventTitle
    } = await req.json();
    
    if (!amount || !currency || !referenceType || !referenceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get the origin for the redirect URL
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const successUrl = `${origin}/payment-result?status=success&type=${referenceType}&id=${referenceId}`;
    const cancelUrl = `${origin}/payment-result?status=canceled&type=${referenceType}&id=${referenceId}`;
    
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: eventTitle || `${referenceType.charAt(0).toUpperCase() + referenceType.slice(1)} Payment`,
              description: `Payment for ${referenceType} booking`
            },
            unit_amount: Math.round(amount * 100), // Stripe requires amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: referenceId,
      customer_email: user.email,
      metadata: {
        userId: userId,
        referenceType: referenceType,
        referenceId: referenceId
      }
    });

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
        provider: 'stripe',
        provider_transaction_id: session.id,
        metadata: {
          stripe_session_id: session.id,
          payment_intent_id: session.payment_intent
        }
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
    
    // Return the Stripe session URL
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        sessionId: session.id,
        url: session.url,
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
