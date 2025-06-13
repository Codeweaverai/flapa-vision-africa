
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
          receipt_url: session.receipt_email ? `Receipt sent to ${session.receipt_email}` : null,
          receipt_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        return new Response("Error updating order", { status: 500 });
      }

      // Get order details
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error("Error fetching order:", orderError);
        return new Response("Error fetching order", { status: 500 });
      }

      // Process order items
      for (const item of order.order_items) {
        if (item.item_type === 'course') {
          // Create course enrollment
          const { error: enrollmentError } = await supabaseClient
            .from('course_enrollments')
            .insert({
              user_id: order.user_id,
              course_id: item.item_id,
              payment_status: 'completed',
              order_id: orderId,
              enrollment_date: new Date().toISOString()
            });

          if (enrollmentError) {
            console.error("Error creating course enrollment:", enrollmentError);
          }
        } else if (item.item_type === 'event_ticket') {
          // Get event details
          const { data: ticket } = await supabaseClient
            .from('event_tickets')
            .select('event_id')
            .eq('id', item.item_id)
            .single();

          if (ticket) {
            // Create event booking
            const { data: booking, error: bookingError } = await supabaseClient
              .from('event_bookings')
              .insert({
                user_id: order.user_id,
                event_id: ticket.event_id,
                event_ticket_id: item.item_id,
                status: 'confirmed',
                payment_status: 'completed',
                payment_amount: item.total_price,
                payment_currency: 'USD',
                ticket_quantity: item.quantity,
                order_id: orderId,
                booking_date: new Date().toISOString()
              })
              .select()
              .single();

            if (bookingError) {
              console.error("Error creating booking:", bookingError);
            }
          }
        }
      }

      // Generate tickets for event orders
      const hasEventTickets = order.order_items.some(item => item.item_type === 'event_ticket');
      if (hasEventTickets) {
        try {
          const { data: ticketResponse, error: ticketError } = await supabaseClient.functions.invoke('generate-tickets', {
            body: { orderId: orderId }
          });

          if (ticketError) {
            console.error("Error generating tickets:", ticketError);
          } else {
            console.log("Tickets generated successfully:", ticketResponse);
          }
        } catch (ticketGenerationError) {
          console.error("Error invoking ticket generation:", ticketGenerationError);
        }
      }

      // Clear the cart
      await supabaseClient
        .from('carts')
        .delete()
        .eq('user_id', order.user_id);

      console.log("Successfully processed order:", orderId);
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
