
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
    const { sessionId, userId, type, itemId } = await req.json();

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

    // Find existing order by stripe_session_id
    let { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    let orderId;
    let isCartOrder = false;

    if (existingOrder) {
      // This is a cart-based order
      orderId = existingOrder.id;
      isCartOrder = true;
      console.log("Found existing cart order:", orderId);
    } else if (session.metadata?.order_id) {
      // Order ID from metadata
      orderId = session.metadata.order_id;
    } else {
      // Create a new order for individual item purchase
      const { data: orderData, error: orderError } = await supabaseClient
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

      orderId = orderData.id;

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

        await supabaseClient
          .from('order_items')
          .insert({
            order_id: orderId,
            item_id: itemId,
            item_type: 'event_ticket',
            item_name: itemName,
            quantity: 1,
            unit_price: itemPrice,
            total_price: itemPrice
          });
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
      .eq('id', orderId);

    console.log("Updated order status to completed for order:", orderId);

    // If this was a cart order, clear the user's cart
    if (isCartOrder && userId) {
      await supabaseClient
        .from('carts')
        .delete()
        .eq('user_id', userId);
      console.log("Cleared cart for user:", userId);
    }

    // Process fulfillment - create enrollments and bookings
    const { data: orderItems } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (orderItems && orderItems.length > 0) {
      console.log("Processing fulfillment for", orderItems.length, "items");
      
      for (const item of orderItems) {
        if (item.item_type === 'course') {
          // Create course enrollment
          await supabaseClient
            .from('course_enrollments')
            .upsert({
              user_id: userId,
              course_id: item.item_id,
              payment_status: 'completed',
              order_id: orderId,
              enrollment_date: new Date().toISOString()
            });

          console.log("Created course enrollment for:", item.item_id);

        } else if (item.item_type === 'event_ticket') {
          // Find the event for this ticket
          const { data: event } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', item.item_id)
            .single();

          if (event) {
            // Create event booking
            await supabaseClient
              .from('event_bookings')
              .upsert({
                user_id: userId,
                event_id: event.id,
                status: 'confirmed',
                payment_status: 'completed',
                payment_amount: item.total_price,
                payment_currency: 'USD',
                ticket_quantity: item.quantity,
                order_id: orderId,
                booking_date: new Date().toISOString()
              });

            console.log("Created event booking for:", event.id);
          }
        }
      }

      // Generate tickets and receipts
      try {
        console.log("Generating tickets for order:", orderId);
        
        const ticketResponse = await supabaseClient.functions.invoke('generate-tickets', {
          body: { orderId }
        });

        if (ticketResponse.error) {
          console.error("Failed to generate tickets:", ticketResponse.error);
        } else {
          console.log("Tickets generated successfully for order:", orderId);
        }
      } catch (error) {
        console.error("Error generating tickets:", error);
      }
    }

    // Return success response with item information
    let responseData = { 
      success: true, 
      message: "Payment verified successfully",
      orderId: orderId
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

    return new Response(JSON.stringify(responseData), {
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
