
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

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    console.log("Received Stripe event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        console.error("No order_id in session metadata");
        return new Response("No order_id", { status: 400 });
      }

      // Update order status
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_session_id: session.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        return new Response("Error updating order", { status: 500 });
      }

      // Clear the cart for this user
      const { data: order } = await supabaseClient
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (order?.user_id) {
        await supabaseClient
          .from('carts')
          .delete()
          .eq('user_id', order.user_id);
      }

      console.log("Order payment completed, starting fulfillment process");

      // Trigger order fulfillment (tickets, receipts, enrollments)
      try {
        const fulfillmentResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({ orderId })
        });

        if (fulfillmentResponse.ok) {
          console.log("Order fulfillment completed successfully");
          
          // Send confirmation email
          try {
            const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-confirmation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
              },
              body: JSON.stringify({ orderId })
            });

            if (emailResponse.ok) {
              console.log("Order confirmation email sent successfully");
            } else {
              console.error("Failed to send confirmation email");
            }
          } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
          }
          
        } else {
          console.error("Order fulfillment failed");
        }
      } catch (fulfillmentError) {
        console.error("Error in order fulfillment:", fulfillmentError);
      }

      console.log("Successfully processed Stripe order:", orderId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }
});
