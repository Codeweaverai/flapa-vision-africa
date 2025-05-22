
// @ts-ignore - Deno imports will be available when deployed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports will be available when deployed
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - Deno imports will be available when deployed
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

// @ts-ignore - Deno namespace available at runtime
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

// @ts-ignore - Deno serve method available at runtime
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
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
    const { sessionId, userId, type, itemId } = await req.json();

    if (!sessionId || !userId || !type || !itemId) {
      throw new Error('Missing required parameters');
    }

    // Verify that the user ID matches the authenticated user
    if (userId !== user.id) {
      throw new Error('User ID mismatch');
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify that the session was paid
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment has not been completed',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let title = '';

    // Update the appropriate record based on the type
    if (type === 'course') {
      // Get the course details
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('title')
        .eq('id', itemId)
        .single();

      if (courseError) {
        throw new Error('Failed to fetch course');
      }

      title = course.title;

      // Update the course enrollment status
      const { error: enrollError } = await supabaseClient
        .from('course_enrollments')
        .upsert({
          user_id: userId,
          course_id: itemId,
          payment_status: 'paid',
          payment_id: sessionId,
          enrollment_date: new Date().toISOString(),
        });

      if (enrollError) {
        throw new Error('Failed to update course enrollment');
      }
    } else if (type === 'event') {
      // Get the event details
      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .select('title')
        .eq('id', itemId)
        .single();

      if (eventError) {
        throw new Error('Failed to fetch event');
      }

      title = event.title;

      // Update the event registration status
      const { error: regError } = await supabaseClient
        .from('registrations')
        .upsert({
          user_id: userId,
          event_id: itemId,
          status: 'confirmed',
          payment_status: 'paid',
          payment_id: sessionId,
          created_at: new Date().toISOString(),
        });

      if (regError) {
        throw new Error('Failed to update registration');
      }
    }

    // Create a payment transaction record
    const { error: paymentError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: userId,
        reference_id: itemId,
        reference_type: type,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || 'USD',
        status: 'completed',
        provider: 'stripe',
        provider_transaction_id: sessionId,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      throw new Error('Failed to create payment transaction record');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        title: title,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
