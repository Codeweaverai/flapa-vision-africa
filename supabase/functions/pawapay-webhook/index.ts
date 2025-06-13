
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

    // Verify PawaPay webhook signature here if needed
    // const signature = req.headers.get("x-pawapay-signature");

    // Extract payment information from PawaPay payload
    const { 
      depositId, 
      status, 
      amount, 
      currency,
      referenceId, // This should contain our order_id
      payer,
      timestamp 
    } = payload;

    if (status === "COMPLETED" || status === "ACCEPTED") {
      // Find the order using referenceId or another identifier
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', referenceId)
        .single();

      if (orderError || !order) {
        console.error("Order not found:", referenceId);
        return new Response("Order not found", { status: 404 });
      }

      // Update order status
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          payment_provider_id: depositId,
          receipt_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', referenceId);

      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        return new Response("Error updating order", { status: 500 });
      }

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

      // Process order items (same as Stripe webhook)
      for (const item of order.order_items) {
        if (item.item_type === 'course') {
          // Create course enrollment
          const { error: enrollmentError } = await supabaseClient
            .from('course_enrollments')
            .insert({
              user_id: order.user_id,
              course_id: item.item_id,
              payment_status: 'completed',
              order_id: referenceId,
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
                payment_currency: currency,
                ticket_quantity: item.quantity,
                order_id: referenceId,
                booking_date: new Date().toISOString()
              })
              .select()
              .single();

            if (bookingError) {
              console.error("Error creating booking:", bookingError);
            } else {
              // Generate tickets
              const ticketHolders = item.metadata?.ticket_holder_names || [];
              
              for (let i = 0; i < item.quantity; i++) {
                const ticketCode = `TKT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                const holderName = ticketHolders[i]?.name || `Ticket Holder ${i + 1}`;
                
                const qrData = JSON.stringify({
                  ticket_code: ticketCode,
                  booking_id: booking.id,
                  event_id: ticket.event_id,
                  holder_name: holderName,
                  generated_at: new Date().toISOString()
                });

                await supabaseClient
                  .from('generated_tickets')
                  .insert({
                    booking_id: booking.id,
                    order_id: referenceId,
                    event_id: ticket.event_id,
                    event_ticket_id: item.item_id,
                    ticket_code: ticketCode,
                    ticket_holder_name: holderName,
                    qr_code_data: qrData,
                    ticket_status: 'active'
                  });
              }

              // Update ticket quantity sold
              await supabaseClient
                .from('event_tickets')
                .update({ 
                  quantity_sold: supabaseClient.sql`quantity_sold + ${item.quantity}` 
                })
                .eq('id', item.item_id);
            }
          }
        }
      }

      // Clear the cart
      await supabaseClient
        .from('carts')
        .delete()
        .eq('user_id', order.user_id);

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
