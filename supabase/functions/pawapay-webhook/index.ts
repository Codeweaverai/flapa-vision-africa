
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("Received PawaPay webhook:", payload);

    const { 
      depositId, 
      status, 
      amount, 
      currency,
      referenceId,
      payer,
      timestamp 
    } = payload;

    if (status === "COMPLETED" || status === "ACCEPTED") {
      console.log("Processing successful payment for depositId:", depositId);

      // Find order by payment_provider_id (depositId)
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('payment_provider_id', depositId)
        .single();

      if (orderError || !order) {
        console.error("Order not found for depositId:", depositId, orderError);
        return new Response("Order not found", { status: 404 });
      }

      console.log("Found order:", order.id);

      // Update order status to completed
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        return new Response("Error updating order", { status: 500 });
      }

      console.log("Order status updated to completed for order:", order.id);

      // Create payment transaction record
      await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: order.user_id,
          reference_type: 'order',
          reference_id: order.id,
          amount: parseFloat(amount),
          currency: currency,
          status: 'completed',
          provider: 'pawapay',
          provider_transaction_id: depositId,
          phone_number: payer?.msisdn,
          correspondent: payer?.correspondent,
          metadata: payload
        });

      console.log("Payment transaction recorded");

      // Clear the cart for this user
      if (order.user_id) {
        await supabaseClient
          .from('carts')
          .delete()
          .eq('user_id', order.user_id);
        console.log("Cart cleared for user:", order.user_id);
      }

      // Generate tickets and receipts
      try {
        console.log("Starting ticket generation for order:", order.id);
        
        const ticketResponse = await supabaseClient.functions.invoke('generate-tickets', {
          body: { orderId: order.id }
        });

        if (ticketResponse.error) {
          console.error("Failed to generate tickets:", ticketResponse.error);
        } else {
          console.log("Tickets generated successfully for order:", order.id);
        }
      } catch (ticketError) {
        console.error("Error generating tickets:", ticketError);
      }

      // Send confirmation email
      try {
        console.log("Sending confirmation email for order:", order.id);
        
        const emailResponse = await supabaseClient.functions.invoke('send-order-confirmation', {
          body: { orderId: order.id }
        });

        if (emailResponse.error) {
          console.error("Failed to send confirmation email:", emailResponse.error);
        } else {
          console.log("Confirmation email sent for order:", order.id);
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      console.log("Successfully processed PawaPay payment for order:", order.id);
    } else {
      console.log("Payment not completed, status:", status);
    }

    return new Response(JSON.stringify({ status: "received" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("PawaPay webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }
});
