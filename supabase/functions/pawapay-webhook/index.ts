
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      console.log("Processing successful PawaPay payment:", depositId);

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
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw updateError;
      }

      console.log("Order status updated successfully:", order.id);

      // Call verify-payment function for fulfillment
      const { data: verifyData, error: verifyError } = await supabaseClient.functions.invoke('verify-payment', {
        body: { orderId: order.id }
      });

      if (verifyError) {
        console.error("Error calling verify-payment:", verifyError);
        // Don't throw here - payment is already processed
      } else {
        console.log("Verify-payment called successfully for order:", order.id, verifyData);
      }

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
    }

    return new Response(JSON.stringify({ status: "received" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("PawaPay webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
