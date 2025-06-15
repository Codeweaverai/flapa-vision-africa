
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, type, itemId } = await req.json();
    logStep("Payment verification started", { sessionId, userId, type, itemId });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
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

    // Check if we already processed this session to prevent duplicate processing
    const { data: existingProcessing } = await supabaseClient
      .from('orders')
      .select('id, payment_status')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingProcessing?.payment_status === 'completed') {
      logStep("Payment already processed", { orderId: existingProcessing.id });
      return new Response(JSON.stringify({
        success: true,
        message: "Payment already processed",
        orderId: existingProcessing.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let orderId;
    let isCartOrder = false;

    if (existingProcessing) {
      // This is a cart-based order that needs completion
      orderId = existingProcessing.id;
      isCartOrder = true;
      logStep("Found existing cart order", { orderId });
    } else if (session.metadata?.order_id) {
      // Order ID from metadata
      orderId = session.metadata.order_id;
      logStep("Using order ID from metadata", { orderId });
    } else {
      // Create a new order for individual item purchase
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: userId,
          email: session.customer_details?.email || 'unknown@example.com',
          total_amount: session.amount_total / 100,
          currency: session.currency?.toUpperCase() || 'USD',
          payment_status: 'processing', // Set to processing first
          payment_method: 'stripe',
          stripe_session_id: sessionId,
          stripe_payment_intent_id: session.payment_intent
        })
        .select()
        .single();

      if (orderError) {
        logStep("Error creating order", { error: orderError });
        throw orderError;
      }

      orderId = orderData.id;
      logStep("Created new order", { orderId });

      // Create order item for individual purchase
      let itemName = "Unknown Item";
      let itemPrice = session.amount_total / 100;

      if (type === 'course') {
        const { data: course } = await supabaseClient
          .from('courses')
          .select('title, price')
          .eq('id', itemId)
          .single();
        
        if (course) {
          itemName = course.title;
          itemPrice = course.price || itemPrice;
        }

        await supabaseClient
          .from('order_items')
          .insert({
            order_id: orderId,
            item_id: itemId,
            item_type: 'course',
            item_name: itemName,
            quantity: 1,
            unit_price: itemPrice,
            total_price: itemPrice
          });

        logStep("Created course order item", { itemId, itemName });
      } else if (type === 'event') {
        const { data: event } = await supabaseClient
          .from('events')
          .select('id, title, price')
          .eq('id', itemId)
          .single();
        
        if (event) {
          itemName = event.title;
          itemPrice = event.price || itemPrice;

          // Get the default event ticket for this event
          const { data: eventTicket } = await supabaseClient
            .from('event_tickets')
            .select('id')
            .eq('event_id', event.id)
            .limit(1)
            .single();

          await supabaseClient
            .from('order_items')
            .insert({
              order_id: orderId,
              item_id: eventTicket?.id || itemId,
              item_type: 'event_ticket',
              item_name: itemName,
              quantity: 1,
              unit_price: itemPrice,
              total_price: itemPrice
            });

          logStep("Created event order item", { itemId, itemName });
        }
      }
    }

    // Begin transaction-like processing
    logStep("Starting order fulfillment", { orderId });

    // Get all order items for fulfillment
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      logStep("Error fetching order items", { error: itemsError });
      throw new Error("No order items found for fulfillment");
    }

    logStep("Processing fulfillment for items", { itemCount: orderItems.length });

    // Process each order item for fulfillment
    const fulfillmentResults = [];
    for (const item of orderItems) {
      try {
        if (item.item_type === 'course') {
          // Create course enrollment
          const { data: enrollment, error: enrollmentError } = await supabaseClient
            .from('course_enrollments')
            .upsert({
              user_id: userId,
              course_id: item.item_id,
              payment_status: 'completed',
              order_id: orderId,
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
                user_id: userId,
                event_id: eventTicket.event_id,
                event_ticket_id: item.item_id,
                status: 'confirmed',
                payment_status: 'completed',
                payment_amount: item.total_price,
                payment_currency: 'USD',
                ticket_quantity: item.quantity,
                order_id: orderId,
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

    // Only mark order as completed if all fulfillments succeeded
    const { error: orderUpdateError } = await supabaseClient
      .from('orders')
      .update({
        payment_status: 'completed',
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      logStep("Error updating order status", { error: orderUpdateError });
      throw orderUpdateError;
    }

    logStep("Order marked as completed", { orderId });

    // Clear user's cart if this was a cart order
    if (isCartOrder && userId) {
      await supabaseClient
        .from('carts')
        .delete()
        .eq('user_id', userId);
      logStep("Cleared user cart", { userId });
    }

    // Generate tickets asynchronously (don't wait for this)
    const hasEventTickets = orderItems.some(item => item.item_type === 'event_ticket');
    if (hasEventTickets) {
      // Use background task for ticket generation
      const ticketGeneration = async () => {
        try {
          logStep("Starting ticket generation", { orderId });
          const ticketResponse = await supabaseClient.functions.invoke('generate-event-tickets', {
            body: { orderId }
          });

          if (ticketResponse.error) {
            logStep("Ticket generation failed", { error: ticketResponse.error });
          } else {
            logStep("Tickets generated successfully", { orderId });
          }
        } catch (error) {
          logStep("Error in ticket generation", { error });
        }
      };

      // Don't await this - let it run in background
      ticketGeneration();
    }

    // Return success response
    let responseData = { 
      success: true, 
      message: "Payment verified and order completed successfully",
      orderId: orderId,
      fulfillmentResults
    };

    if (type === 'course') {
      const { data: course } = await supabaseClient
        .from('courses')
        .select('title')
        .eq('id', itemId)
        .single();

      responseData.title = course?.title || "Course";
      responseData.message = "Successfully enrolled in course";
    } else if (type === 'event') {
      const { data: event } = await supabaseClient
        .from('events')
        .select('title')
        .eq('id', itemId)
        .single();

      responseData.title = event?.title || "Event";
      responseData.message = "Successfully registered for event";
    } else if (isCartOrder) {
      responseData.message = "Order completed successfully";
      responseData.title = "Your Order";
    }

    logStep("Payment verification completed successfully", { orderId, fulfillmentCount: fulfillmentResults.length });

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
