
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
      // Update order status
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          payment_provider_id: depositId,
          updated_at: new Date().toISOString()
        })
        .eq('id', referenceId);

      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        return new Response("Error updating order", { status: 500 });
      }

      // Get order details for user_id
      const { data: order } = await supabaseClient
        .from('orders')
        .select('user_id')
        .eq('id', referenceId)
        .single();

      // Create payment transaction record
      await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: order.user_id,
          reference_type: 'order',
          reference_id: referenceId,
          amount: parseFloat(amount),
          currency: currency,
          status: 'completed',
          provider: 'pawapay',
          provider_transaction_id: depositId,
          phone_number: payer?.msisdn,
          correspondent: payer?.correspondent,
          metadata: payload
        });

      // Clear the cart
      if (order?.user_id) {
        await supabaseClient
          .from('carts')
          .delete()
          .eq('user_id', order.user_id);
      }

      console.log("PawaPay payment completed, starting fulfillment process");

      // Trigger order fulfillment (tickets, receipts, enrollments)
      try {
        const fulfillmentResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({ orderId: referenceId })
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
              body: JSON.stringify({ orderId: referenceId })
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

      console.log("Successfully processed PawaPay order:", referenceId);
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
