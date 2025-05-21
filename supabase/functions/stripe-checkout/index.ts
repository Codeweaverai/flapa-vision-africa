
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

    // Create a Supabase client to verify user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Get user session
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
      currency = 'usd',
      itemName,
      itemId,
      itemType, // 'course', 'event', 'consultation'
      creatorId
    } = await req.json();

    if (!amount || amount <= 0 || !itemName || !itemId || !itemType) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
        }),
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

    // Create a customer if it doesn't exist
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
    }

    // Create a Supabase admin client to create the payment record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    // Create a payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        reference_type: itemType,
        reference_id: itemId,
        amount: amount,
        currency: currency,
        status: 'pending',
        provider: 'stripe',
        metadata: {
          item_name: itemName,
          customer_id: customerId
        }
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    // Create a checkout session
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: itemName,
              metadata: {
                itemId,
                itemType
              }
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment-success?id=${payment.id}&type=${itemType}&reference_id=${itemId}&amount=${amount}&currency=${currency}&title=${encodeURIComponent(itemName)}`,
      cancel_url: `${origin}/payment-cancel?type=${itemType}&reference_id=${itemId}&title=${encodeURIComponent(itemName)}`,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
        itemId,
        itemType,
        creatorId
      }
    });

    // Update the payment with the session ID
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        provider_transaction_id: session.id
      })
      .eq('id', payment.id);

    // Return the checkout URL
    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id,
        paymentId: payment.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
