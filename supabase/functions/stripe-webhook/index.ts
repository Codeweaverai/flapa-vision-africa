
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log("Received Stripe webhook:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing checkout session:", session.id);
      
      // Extract order ID from metadata
      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        console.error("No orderId found in session metadata");
        return new Response("No orderId in metadata", { status: 400 });
      }

      // Update order status to completed
      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          receipt_url: session.receipt_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) {
        console.error("Error updating order:", orderError);
        throw orderError;
      }

      console.log("Order updated successfully:", orderId);

      // Call verify-payment function for fulfillment
      const { error: verifyError } = await supabaseClient.functions.invoke('verify-payment', {
        body: { orderId }
      });

      if (verifyError) {
        console.error("Error calling verify-payment:", verifyError);
        // Don't throw here - payment is already processed
      } else {
        console.log("Verify-payment called successfully for order:", orderId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
