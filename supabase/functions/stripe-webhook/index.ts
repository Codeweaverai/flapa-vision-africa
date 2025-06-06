
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
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
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
  
  try {
    // Find order by Stripe session ID
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('payment_provider_id', session.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found for session:', session.id);
      return;
    }

    // Update receipt URL from Stripe if available
    let receiptUrl = null;
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
      if (paymentIntent.charges?.data?.[0]?.receipt_url) {
        receiptUrl = paymentIntent.charges.data[0].receipt_url;
      }
    }

    // Update order with receipt URL
    if (receiptUrl) {
      await supabaseClient
        .from('orders')
        .update({ receipt_url: receiptUrl })
        .eq('id', order.id);
    }

    // Use our payment processing function
    const { data: result, error: processError } = await supabaseClient.rpc(
      'process_payment_success',
      {
        p_order_id: order.id,
        p_payment_intent_id: session.payment_intent as string || null,
        p_session_id: session.id
      }
    );

    if (processError) {
      console.error('Error processing payment:', processError);
      throw processError;
    }

    console.log(`Successfully processed payment for order ${order.id}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment intent succeeded:', paymentIntent.id);
  
  try {
    // Find order by payment intent ID
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (orderError || !order) {
      console.log('No order found for payment intent:', paymentIntent.id);
      return;
    }

    // Get receipt URL if available
    let receiptUrl = null;
    if (paymentIntent.charges?.data?.[0]?.receipt_url) {
      receiptUrl = paymentIntent.charges.data[0].receipt_url;
    }

    // Update order with receipt URL
    if (receiptUrl) {
      await supabaseClient
        .from('orders')
        .update({ receipt_url: receiptUrl })
        .eq('id', order.id);
    }

    // Process payment success
    const { error: processError } = await supabaseClient.rpc(
      'process_payment_success',
      {
        p_order_id: order.id,
        p_payment_intent_id: paymentIntent.id
      }
    );

    if (processError) {
      console.error('Error processing payment intent:', processError);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  console.log('Processing failed checkout session:', session.id);
  
  try {
    const { data: order } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('payment_provider_id', session.id)
      .single();

    if (order) {
      await supabaseClient
        .from('orders')
        .update({ 
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }
  } catch (error) {
    console.error('Error handling failed checkout session:', error);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('Processing expired checkout session:', session.id);
  
  try {
    const { data: order } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('payment_provider_id', session.id)
      .single();

    if (order) {
      await supabaseClient
        .from('orders')
        .update({ 
          payment_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
    }
  } catch (error) {
    console.error('Error handling expired checkout session:', error);
  }
}
