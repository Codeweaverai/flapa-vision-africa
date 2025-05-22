
// @ts-ignore - Deno imports will be available when deployed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; 
// @ts-ignore - Deno imports will be available when deployed
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 
// @ts-ignore - Deno imports will be available when deployed
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

// @ts-ignore - Deno namespace available at runtime in Supabase Edge Functions
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

// @ts-ignore - Deno serve method available at runtime
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
      // @ts-ignore - Deno env available at runtime
      Deno.env.get('SUPABASE_URL') || '',
      // @ts-ignore - Deno env available at runtime
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
    const { courseId, eventId, returnUrl } = await req.json();

    if (!courseId && !eventId) {
      throw new Error('Missing courseId or eventId in request body');
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

    let lineItems = [];
    let successUrl = returnUrl;
    let metadata = {};

    // Set up the appropriate line items and success URL based on whether it's a course or event
    if (courseId) {
      // Get course details
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        throw new Error('Failed to fetch course');
      }

      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Course: ${course.title}`,
              description: course.description,
              images: course.thumbnail_url ? [course.thumbnail_url] : [],
            },
            unit_amount: Math.round(Number(course.price || 0) * 100),
          },
          quantity: 1,
        },
      ];

      metadata = {
        type: 'course',
        courseId: courseId,
        userId: user.id,
      };

      successUrl = `${returnUrl}?type=course&id=${courseId}&session={CHECKOUT_SESSION_ID}`;
    } else if (eventId) {
      // Get event details
      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw new Error('Failed to fetch event');
      }

      lineItems = [
        {
          price_data: {
            currency: event.currency?.toLowerCase() || 'usd',
            product_data: {
              name: `Event: ${event.title}`,
              description: event.description,
              images: event.image_url ? [event.image_url] : [],
            },
            unit_amount: Math.round(Number(event.price || 0) * 100),
          },
          quantity: 1,
        },
      ];

      metadata = {
        type: 'event',
        eventId: eventId,
        userId: user.id,
      };

      successUrl = `${returnUrl}?type=event&id=${eventId}&session={CHECKOUT_SESSION_ID}`;
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
