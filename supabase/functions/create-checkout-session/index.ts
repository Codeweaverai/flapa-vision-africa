
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting checkout session creation");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { courseId, eventId, eventTicketId, returnUrl, payment_method = 'stripe' } = await req.json();
    logStep("Request data", { courseId, eventId, eventTicketId, payment_method });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    if (payment_method !== 'stripe') {
      throw new Error('Only Stripe payments supported in this function');
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    let sessionData;
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=true`;
    
    logStep("Setting up URLs", { successUrl, cancelUrl });

    // Check if this is a direct item purchase (course or event ticket)
    if (courseId || eventId || eventTicketId) {
      let itemData;
      let itemName;
      let itemPrice;
      let itemType;

      if (courseId) {
        const { data: course, error: courseError } = await supabaseClient
          .from('courses')
          .select('title, price')
          .eq('id', courseId)
          .single();

        if (courseError) throw new Error(`Course not found: ${courseError.message}`);
        
        itemData = course;
        itemName = course.title;
        itemPrice = course.price || 0;
        itemType = 'course';
        logStep("Course data retrieved", { courseId, title: itemName, price: itemPrice });
      } else if (eventTicketId) {
        const { data: ticket, error: ticketError } = await supabaseClient
          .from('event_tickets')
          .select(`
            name,
            price,
            event:events (
              title
            )
          `)
          .eq('id', eventTicketId)
          .single();

        if (ticketError) throw new Error(`Event ticket not found: ${ticketError.message}`);
        
        itemData = ticket;
        itemName = `${ticket.event.title} - ${ticket.name}`;
        itemPrice = ticket.price || 0;
        itemType = 'event_ticket';
        logStep("Event ticket data retrieved", { eventTicketId, title: itemName, price: itemPrice });
      } else if (eventId) {
        const { data: event, error: eventError } = await supabaseClient
          .from('events')
          .select('title, price')
          .eq('id', eventId)
          .single();

        if (eventError) throw new Error(`Event not found: ${eventError.message}`);
        
        itemData = event;
        itemName = event.title;
        itemPrice = event.price || 0;
        itemType = 'event';
        logStep("Event data retrieved", { eventId, title: itemName, price: itemPrice });
      }

      // Create order for direct purchase
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: user.id,
          email: user.email,
          total_amount: itemPrice,
          currency: 'USD',
          payment_status: 'processing',
          payment_method: 'stripe'
        })
        .select()
        .single();

      if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);
      logStep("Order created", { orderId: order.id, totalAmount: itemPrice });

      // Create order item
      const { error: itemError } = await supabaseClient
        .from('order_items')
        .insert({
          order_id: order.id,
          item_id: courseId || eventTicketId || eventId,
          item_type: itemType,
          item_name: itemName,
          quantity: 1,
          unit_price: itemPrice,
          total_price: itemPrice
        });

      if (itemError) throw new Error(`Failed to create order item: ${itemError.message}`);
      logStep("Order item created");

      sessionData = {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: itemName },
            unit_amount: Math.round(itemPrice * 100), // Convert to cents
          },
          quantity: 1,
        }],
        mode: "payment",
        metadata: {
          user_id: user.id,
          order_id: order.id,
          type: 'direct',
          item_type: itemType,
          item_id: courseId || eventTicketId || eventId
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
    } else {
      // Cart-based purchase
      const { data: cartItems, error: cartError } = await supabaseClient
        .from('carts')
        .select('*')
        .eq('user_id', user.id);

      if (cartError || !cartItems || cartItems.length === 0) {
        throw new Error('No items in cart and no direct item specified');
      }

      logStep("Cart items retrieved", { itemCount: cartItems.length });

      // Create order first for cart-based purchase
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: user.id,
          email: user.email,
          total_amount: totalAmount,
          currency: 'USD',
          payment_status: 'processing',
          payment_method: 'stripe'
        })
        .select()
        .single();

      if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);
      logStep("Order created", { orderId: order.id, totalAmount });

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        item_id: item.item_id,
        item_type: item.item_type,
        item_name: `${item.item_type} Item`,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);
      logStep("Order items created", { itemCount: orderItems.length });

      // Create Stripe line items
      const lineItems = cartItems.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: `${item.item_type} - ${item.item_id}` },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      sessionData = {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "payment",
        metadata: {
          user_id: user.id,
          order_id: order.id,
          type: 'cart'
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    // Update order with stripe session ID
    await supabaseClient
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', sessionData.metadata.order_id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in checkout session creation", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
