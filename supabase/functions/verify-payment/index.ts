
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, orderId, retry } = await req.json();
    logStep("Payment verification started", { sessionId, userId, orderId, retry });

    if (!sessionId && !orderId) {
      throw new Error("Session ID or Order ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let session;
    let targetOrderId = orderId;

    if (sessionId) {
      // Retrieve the checkout session from Stripe
      session = await stripe.checkout.sessions.retrieve(sessionId);
      logStep("Retrieved Stripe session", { sessionId: session.id, status: session.payment_status });

      if (session.payment_status !== "paid") {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Payment not completed" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Check for existing order with this session
      const { data: existingOrder } = await supabaseClient
        .from('orders')
        .select('id, payment_status')
        .eq('stripe_session_id', sessionId)
        .single();

      if (existingOrder) {
        targetOrderId = existingOrder.id;
        if (existingOrder.payment_status === 'completed') {
          logStep("Payment already processed", { orderId: existingOrder.id });
          return new Response(JSON.stringify({
            success: true,
            message: "Payment already processed",
            orderId: existingOrder.id
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (session.metadata?.order_id) {
        targetOrderId = session.metadata.order_id;
      } else {
        // Create new order for individual purchase
        const { type, item_id, user_id } = session.metadata || {};
        
        if (!type || !item_id || !user_id) {
          throw new Error("Invalid session metadata for individual purchase");
        }

        let itemName = "Unknown Item";
        let itemPrice = session.amount_total / 100;

        if (type === 'course') {
          const { data: course } = await supabaseClient
            .from('courses')
            .select('title, price')
            .eq('id', item_id)
            .single();
          
          if (course) {
            itemName = course.title;
            itemPrice = course.price || itemPrice;
          }
        } else if (type === 'event') {
          const { data: event } = await supabaseClient
            .from('events')
            .select('title, price')
            .eq('id', item_id)
            .single();
          
          if (event) {
            itemName = event.title;
            itemPrice = event.price || itemPrice;
          }
        }

        // Create order for individual purchase
        const { data: newOrder, error: orderError } = await supabaseClient
          .from('orders')
          .insert({
            user_id: user_id,
            email: session.customer_details?.email || 'unknown@example.com',
            total_amount: session.amount_total / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            payment_status: 'processing',
            payment_method: 'stripe',
            stripe_session_id: sessionId,
            stripe_payment_intent_id: session.payment_intent
          })
          .select()
          .single();

        if (orderError) throw orderError;
        targetOrderId = newOrder.id;
        logStep("Created new order", { orderId: targetOrderId });

        // Create order item
        let orderItemData;
        if (type === 'course') {
          orderItemData = {
            order_id: targetOrderId,
            item_id: item_id,
            item_type: 'course',
            item_name: itemName,
            quantity: 1,
            unit_price: itemPrice,
            total_price: itemPrice
          };
        } else if (type === 'event') {
          // Get event ticket for event
          const { data: eventTicket } = await supabaseClient
            .from('event_tickets')
            .select('id')
            .eq('event_id', item_id)
            .limit(1)
            .single();

          orderItemData = {
            order_id: targetOrderId,
            item_id: eventTicket?.id || item_id,
            item_type: 'event_ticket',
            item_name: itemName,
            quantity: 1,
            unit_price: itemPrice,
            total_price: itemPrice
          };
        }

        if (orderItemData) {
          await supabaseClient
            .from('order_items')
            .insert(orderItemData);
          logStep("Created order item", { itemType: type, itemId: item_id });
        }
      }
    }

    if (!targetOrderId) {
      throw new Error("No order found for processing");
    }

    logStep("Starting order fulfillment", { orderId: targetOrderId });

    // Get all order items for fulfillment
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', targetOrderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      logStep("Error fetching order items", { error: itemsError });
      throw new Error("No order items found for fulfillment");
    }

    logStep("Processing fulfillment for items", { itemCount: orderItems.length });

    // Get order details for user_id
    const { data: order, error: orderFetchError } = await supabaseClient
      .from('orders')
      .select('user_id, email')
      .eq('id', targetOrderId)
      .single();

    if (orderFetchError || !order) {
      throw new Error("Order not found");
    }

    const fulfillmentResults = [];

    // Process each order item for fulfillment
    for (const item of orderItems) {
      try {
        if (item.item_type === 'course') {
          // Create course enrollment
          const { data: enrollment, error: enrollmentError } = await supabaseClient
            .from('course_enrollments')
            .upsert({
              user_id: order.user_id,
              course_id: item.item_id,
              payment_status: 'completed',
              order_id: targetOrderId,
              enrollment_date: new Date().toISOString()
            }, {
              onConflict: 'user_id,course_id'
            })
            .select()
            .single();

          if (enrollmentError) {
            logStep("Error creating course enrollment", { error: enrollmentError, itemId: item.item_id });
            throw enrollmentError;
          }

          fulfillmentResults.push({ type: 'course', item_id: item.item_id, enrollment_id: enrollment.id });
          logStep("Created course enrollment", { courseId: item.item_id, enrollmentId: enrollment.id });

        } else if (item.item_type === 'event_ticket') {
          // Get event information from the ticket
          const { data: eventTicket } = await supabaseClient
            .from('event_tickets')
            .select('event_id')
            .eq('id', item.item_id)
            .single();

          if (eventTicket) {
            // Create event booking
            const { data: booking, error: bookingError } = await supabaseClient
              .from('event_bookings')
              .upsert({
                user_id: order.user_id,
                event_id: eventTicket.event_id,
                event_ticket_id: item.item_id,
                status: 'confirmed',
                payment_status: 'completed',
                payment_amount: item.total_price,
                payment_currency: 'USD',
                ticket_quantity: item.quantity,
                order_id: targetOrderId,
                booking_date: new Date().toISOString()
              }, {
                onConflict: 'user_id,event_id,order_id'
              })
              .select()
              .single();

            if (bookingError) {
              logStep("Error creating event booking", { error: bookingError, itemId: item.item_id });
              throw bookingError;
            }

            fulfillmentResults.push({ type: 'event', item_id: item.item_id, booking_id: booking.id });
            logStep("Created event booking", { eventId: eventTicket.event_id, bookingId: booking.id });
          }
        }
      } catch (fulfillmentError) {
        logStep("Fulfillment failed for item", { itemId: item.item_id, error: fulfillmentError });
        throw fulfillmentError;
      }
    }

    // Update order status to completed
    const updateData: any = {
      payment_status: 'completed',
      updated_at: new Date().toISOString()
    };

    if (sessionId && session) {
      updateData.stripe_session_id = sessionId;
      updateData.stripe_payment_intent_id = session.payment_intent;
    }

    const { error: orderUpdateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', targetOrderId);

    if (orderUpdateError) {
      logStep("Error updating order status", { error: orderUpdateError });
      throw orderUpdateError;
    }

    logStep("Order marked as completed", { orderId: targetOrderId });

    // Clear user's cart if this was a cart order
    if (order.user_id) {
      await supabaseClient
        .from('carts')
        .delete()
        .eq('user_id', order.user_id);
      logStep("Cleared user cart", { userId: order.user_id });
    }

    // Generate tickets for events (background task)
    const hasEventTickets = orderItems.some(item => item.item_type === 'event_ticket');
    if (hasEventTickets) {
      try {
        logStep("Starting ticket generation", { orderId: targetOrderId });
        const ticketResponse = await supabaseClient.functions.invoke('generate-event-tickets', {
          body: { orderId: targetOrderId }
        });

        if (ticketResponse.error) {
          logStep("Ticket generation failed", { error: ticketResponse.error });
        } else {
          logStep("Tickets generated successfully", { orderId: targetOrderId });
        }
      } catch (error) {
        logStep("Error in ticket generation", { error });
      }
    }

    const responseData = { 
      success: true, 
      message: "Payment verified and order completed successfully",
      orderId: targetOrderId,
      fulfillmentResults
    };

    logStep("Payment verification completed successfully", { orderId: targetOrderId, fulfillmentCount: fulfillmentResults.length });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in payment verification", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
