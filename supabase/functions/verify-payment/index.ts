
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, type, itemId, orderId } = await req.json();

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
    console.log("Retrieved session:", session.id, "status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let targetOrderId = orderId;
    let orderData;

    // If we have an orderId from cart checkout, use it
    if (orderId) {
      const { data: existingOrder, error: orderFetchError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderFetchError) {
        console.error("Error fetching existing order:", orderFetchError);
        throw orderFetchError;
      }

      orderData = existingOrder;
    } else {
      // Legacy flow - create order if it doesn't exist
      const { data: existingOrder } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (existingOrder) {
        targetOrderId = existingOrder.id;
        orderData = existingOrder;
      } else {
        // Create a new order for this payment
        const { data: newOrder, error: orderError } = await supabaseClient
          .from('orders')
          .insert({
            user_id: userId,
            email: session.customer_details?.email || 'unknown@example.com',
            total_amount: session.amount_total / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            payment_status: 'completed',
            payment_method: 'stripe',
            stripe_session_id: sessionId,
            stripe_payment_intent_id: session.payment_intent
          })
          .select()
          .single();

        if (orderError) {
          console.error("Error creating order:", orderError);
          throw orderError;
        }

        targetOrderId = newOrder.id;
        orderData = newOrder;

        // Create order item for legacy single-item purchases
        if (type && itemId) {
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
          } else if (type === 'event') {
            const { data: event } = await supabaseClient
              .from('events')
              .select('title, price')
              .eq('id', itemId)
              .single();
            
            if (event) {
              itemName = event.title;
              itemPrice = event.price || itemPrice;
            }
          }

          await supabaseClient
            .from('order_items')
            .insert({
              order_id: targetOrderId,
              item_id: itemId,
              item_type: type === 'event' ? 'event_ticket' : 'course',
              item_name: itemName,
              quantity: 1,
              unit_price: itemPrice,
              total_price: itemPrice
            });
        }
      }
    }

    // Update order status to completed
    await supabaseClient
      .from('orders')
      .update({
        payment_status: 'completed',
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetOrderId);

    // Get order items to process fulfillment
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', targetOrderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw itemsError;
    }

    // Process fulfillment for each item
    for (const item of orderItems) {
      if (item.item_type === 'course') {
        // Create course enrollment
        const { error: enrollmentError } = await supabaseClient
          .from('course_enrollments')
          .upsert({
            user_id: userId,
            course_id: item.item_id,
            payment_status: 'completed',
            order_id: targetOrderId,
            enrollment_date: new Date().toISOString()
          });

        if (enrollmentError) {
          console.error("Enrollment error:", enrollmentError);
        }
      } else if (item.item_type === 'event_ticket') {
        // Create event booking
        const { data: booking, error: bookingError } = await supabaseClient
          .from('event_bookings')
          .upsert({
            user_id: userId,
            event_id: item.item_id,
            status: 'confirmed',
            payment_status: 'completed',
            payment_amount: item.total_price,
            payment_currency: orderData.currency || 'USD',
            ticket_quantity: item.quantity,
            order_id: targetOrderId,
            booking_date: new Date().toISOString()
          })
          .select()
          .single();

        if (bookingError) {
          console.error("Booking error:", bookingError);
        }
      }
    }

    // Generate tickets and receipts
    try {
      const ticketResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({ orderId: targetOrderId })
      });

      if (!ticketResponse.ok) {
        console.error("Failed to generate tickets and receipts");
      } else {
        console.log("Tickets and receipts generated successfully");
      }
    } catch (error) {
      console.error("Error generating tickets and receipts:", error);
    }

    // Get order title for response
    let orderTitle = "Order";
    if (orderItems.length === 1) {
      orderTitle = orderItems[0].item_name;
    } else if (orderItems.length > 1) {
      orderTitle = `${orderItems.length} items`;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      title: orderTitle,
      message: "Payment verified and order processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
