
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "whsec_K4yeuRL9olhnzQFyHEh7QK3UJXAhJWog";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing webhook event: ${event.type}`);

    // Store webhook event for tracking
    await supabaseClient.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'checkout.session.async_payment_failed':
        await handleCheckoutSessionFailed(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing completed checkout session:', session.id);
  
  const metadata = session.metadata;
  if (!metadata) return;

  const { user_id, reference_type, reference_id, creator_id, amount } = metadata;
  const amountValue = parseInt(amount) / 100; // Convert from cents
  
  // Calculate platform fee and creator earning
  const platformFee = amountValue * 0.08;
  const creatorEarning = amountValue * 0.92;
  const payoutEligibleDate = new Date();
  payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

  try {
    // Create payment transaction
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id,
        creator_id: creator_id || null,
        reference_type,
        reference_id,
        amount: amountValue,
        currency: 'usd',
        status: 'completed',
        provider: 'stripe',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        platform_fee_amount: platformFee,
        creator_earning: creatorEarning,
        payout_eligible_date: payoutEligibleDate.toISOString()
      })
      .select();

    if (paymentError) {
      console.error('Error creating payment transaction:', paymentError);
      return;
    }

    // Create enrollment or booking record
    if (reference_type === 'course') {
      const { error: enrollmentError } = await supabaseClient
        .from('course_enrollments')
        .insert({
          user_id,
          course_id: reference_id,
          payment_status: 'completed',
          payment_id: paymentData[0].id
        });

      if (enrollmentError) {
        console.error('Error creating course enrollment:', enrollmentError);
      }
    } else if (reference_type === 'event') {
      const { error: bookingError } = await supabaseClient
        .from('event_bookings')
        .insert({
          user_id,
          event_id: reference_id,
          payment_status: 'completed',
          status: 'confirmed',
          payment_amount: amountValue,
          payment_currency: 'USD',
          payment_id: paymentData[0].id
        });

      if (bookingError) {
        console.error('Error creating event booking:', bookingError);
      }
    }

    console.log('Successfully processed payment completion');
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  console.log('Processing failed checkout session:', session.id);
  
  const metadata = session.metadata;
  if (!metadata) return;

  const { user_id, reference_type, reference_id, creator_id, amount } = metadata;
  const amountValue = parseInt(amount) / 100;

  try {
    await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id,
        creator_id: creator_id || null,
        reference_type,
        reference_id,
        amount: amountValue,
        currency: 'usd',
        status: 'failed',
        provider: 'stripe',
        stripe_session_id: session.id
      });

    console.log('Recorded failed payment transaction');
  } catch (error) {
    console.error('Error handling failed checkout session:', error);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('Processing expired checkout session:', session.id);
  
  // Similar to failed, but with expired status
  const metadata = session.metadata;
  if (!metadata) return;

  const { user_id, reference_type, reference_id, creator_id, amount } = metadata;
  const amountValue = parseInt(amount) / 100;

  try {
    await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id,
        creator_id: creator_id || null,
        reference_type,
        reference_id,
        amount: amountValue,
        currency: 'usd',
        status: 'expired',
        provider: 'stripe',
        stripe_session_id: session.id
      });

    console.log('Recorded expired payment transaction');
  } catch (error) {
    console.error('Error handling expired checkout session:', error);
  }
}
