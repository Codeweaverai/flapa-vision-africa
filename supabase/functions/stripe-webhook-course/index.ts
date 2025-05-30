
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

const webhookSecret = "whsec_K4yeuRL9olhnzQFyHEh7QK3UJXAhJWog";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Processing event:", event.type);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
        await handleCheckoutFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});

async function handleCheckoutCompleted(session: any) {
  try {
    const { user_id, reference_type, reference_id, creator_id, amount } = session.metadata;

    if (reference_type === "course") {
      // Create course enrollment
      const { error: enrollmentError } = await supabaseClient
        .from("course_enrollments")
        .insert({
          user_id,
          course_id: reference_id,
          payment_status: "completed",
          enrollment_date: new Date().toISOString()
        });

      if (enrollmentError) {
        console.error("Error creating enrollment:", enrollmentError);
        throw enrollmentError;
      }

      // Create payment transaction record
      const { error: transactionError } = await supabaseClient
        .from("payment_transactions")
        .insert({
          user_id,
          reference_type: "course",
          reference_id,
          amount: parseInt(amount) / 100, // Convert back from cents
          currency: session.currency,
          status: "completed",
          provider: "stripe",
          stripe_session_id: session.id,
          creator_id,
          platform_fee_amount: (parseInt(amount) / 100) * 0.1, // 10% platform fee
          creator_earning: (parseInt(amount) / 100) * 0.9, // 90% to creator
          payout_eligible_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        throw transactionError;
      }

      console.log(`Successfully enrolled user ${user_id} in course ${reference_id}`);
    }
  } catch (error) {
    console.error("Error handling checkout completed:", error);
    throw error;
  }
}

async function handleCheckoutFailed(session: any) {
  try {
    const { user_id, reference_type, reference_id } = session.metadata;

    // Log failed payment
    console.log(`Payment failed for user ${user_id}, ${reference_type} ${reference_id}`);

    // You could also create a failed transaction record here if needed
  } catch (error) {
    console.error("Error handling checkout failed:", error);
  }
}
