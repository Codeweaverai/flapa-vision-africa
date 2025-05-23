
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the user from the client
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get the request body
    const { eventId, returnUrl } = await req.json();

    if (!eventId) {
      throw new Error('Missing eventId in request body');
    }

    if (!returnUrl) {
      throw new Error('Missing returnUrl in request body');
    }

    // Check if the user already exists as a Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Get event details from Supabase
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Failed to fetch event details');
    }

    // Create line items for Stripe checkout
    const lineItems = [
      {
        price_data: {
          currency: event.currency?.toLowerCase() || 'usd',
          product_data: {
            name: `Event: ${event.title}`,
            description: event.description || 'Event registration',
            images: event.image_url ? [event.image_url] : [],
          },
          unit_amount: Math.round(Number(event.price || 0) * 100),
        },
        quantity: 1,
      },
    ];

    // Set up metadata for the session
    const metadata = {
      type: 'event',
      eventId: eventId,
      userId: user.id,
    };

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: returnUrl,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
