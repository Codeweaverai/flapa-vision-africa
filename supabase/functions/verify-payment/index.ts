
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

    // Find or create order based on session metadata
    let orderId;
    if (session.metadata?.order_id) {
      orderId = session.metadata.order_id;
    } else {
      // Create a new order for this payment
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

      // Create order item
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

    // Update order status
    await supabaseClient
      .from('orders')
      .update({
        payment_status: 'completed',
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Process fulfillment based on type
    if (type === 'course') {
      // Create course enrollment
      const { error: enrollmentError } = await supabaseClient
        .from('course_enrollments')
        .upsert({
          user_id: userId,
          course_id: itemId,
          payment_status: 'completed',
          order_id: orderId,
          enrollment_date: new Date().toISOString()
        });

      if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError);
      }

      // Get course title for response
      const { data: course } = await supabaseClient
        .from('courses')
        .select('title')
        .eq('id', itemId)
        .single();

      return new Response(JSON.stringify({ 
        success: true, 
        title: course?.title || "Course",
        message: "Successfully enrolled in course"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === 'event') {
      // Create event booking
      const { data: booking, error: bookingError } = await supabaseClient
        .from('event_bookings')
        .upsert({
          user_id: userId,
          event_id: itemId,
          status: 'confirmed',
          payment_status: 'completed',
          payment_amount: session.amount_total / 100,
          payment_currency: session.currency?.toUpperCase() || 'USD',
          ticket_quantity: 1,
          order_id: orderId,
          booking_date: new Date().toISOString()
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);
      }

      // Generate tickets
      try {
        const ticketResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({ orderId })
        });

        if (!ticketResponse.ok) {
          console.error("Failed to generate tickets");
        } else {
          console.log("Tickets generated successfully");
        }
      } catch (error) {
        console.error("Error generating tickets:", error);
      }

      // Get event title for response
      const { data: event } = await supabaseClient
        .from('events')
        .select('title')
        .eq('id', itemId)
        .single();

      return new Response(JSON.stringify({ 
        success: true, 
        title: event?.title || "Event",
        message: "Successfully registered for event"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified successfully"
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
