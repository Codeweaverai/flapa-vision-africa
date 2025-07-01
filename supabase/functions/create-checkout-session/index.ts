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

// Helper function to update event ticket inventory
const updateTicketInventory = async (supabase: any, ticketId: string, quantity: number) => {
  logStep("Updating ticket inventory", { ticketId, quantity });
  
  const { data: currentTicket, error: fetchError } = await supabase
    .from('event_tickets')
    .select('quantity_available, quantity_sold')
    .eq('id', ticketId)
    .single();

  if (fetchError) {
    logStep("Error fetching ticket data", fetchError);
    throw new Error(`Failed to fetch ticket data: ${fetchError.message}`);
  }

  if (currentTicket.quantity_available < quantity) {
    logStep("Insufficient inventory", { available: currentTicket.quantity_available, requested: quantity });
    throw new Error(`Insufficient ticket inventory. Available: ${currentTicket.quantity_available}, Requested: ${quantity}`);
  }

  const { error: updateError } = await supabase
    .from('event_tickets')
    .update({
      quantity_available: currentTicket.quantity_available - quantity,
      quantity_sold: currentTicket.quantity_sold + quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  if (updateError) {
    logStep("Error updating ticket inventory", updateError);
    throw new Error(`Failed to update ticket inventory: ${updateError.message}`);
  }

  logStep("Ticket inventory updated successfully", { 
    newAvailable: currentTicket.quantity_available - quantity,
    newSold: currentTicket.quantity_sold + quantity
  });
};

// Helper function to create event booking
const createEventBooking = async (supabase: any, bookingData: any) => {
  logStep("Creating event booking", bookingData);
  
  const { data: booking, error: bookingError } = await supabase
    .from('event_bookings')
    .insert({
      user_id: bookingData.user_id,
      event_id: bookingData.event_id,
      event_ticket_id: bookingData.event_ticket_id,
      order_id: bookingData.order_id,
      ticket_quantity: bookingData.quantity,
      status: 'confirmed',
      payment_status: 'completed',
      payment_amount: bookingData.total_price,
      payment_currency: 'USD',
      booking_date: new Date().toISOString(),
      booking_code: `EVT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
    })
    .select()
    .single();

  if (bookingError) {
    logStep("Error creating booking", bookingError);
    throw new Error(`Failed to create booking: ${bookingError.message}`);
  }

  logStep("Event booking created successfully", { bookingId: booking.id });
  return booking;
};

// Helper function to generate tickets
const generateTickets = async (supabase: any, ticketData: any) => {
  logStep("Generating individual tickets", { 
    bookingId: ticketData.bookingId, 
    quantity: ticketData.quantity,
    holderNames: ticketData.ticket_holder_names?.length 
  });
  
  const generatedTickets = [];
  
  for (let i = 0; i < ticketData.quantity; i++) {
    const ticketCode = `TCK-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    const holderName = ticketData.ticket_holder_names?.[i] || `Ticket Holder ${i + 1}`;
    
    const qrData = JSON.stringify({
      ticketCode,
      bookingId: ticketData.bookingId,
      eventId: ticketData.eventId,
      orderId: ticketData.orderId,
      userId: ticketData.userId,
      ticketHolderName: holderName,
      generatedAt: new Date().toISOString()
    });

    const { data: ticket, error: ticketError } = await supabase
      .from('generated_tickets')
      .insert({
        booking_id: ticketData.bookingId,
        event_id: ticketData.eventId,
        order_id: ticketData.orderId,
        user_id: ticketData.userId,
        event_ticket_id: ticketData.eventTicketId,
        ticket_code: ticketCode,
        ticket_holder_name: holderName,
        qr_code_data: qrData,
        ticket_status: 'active',
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ticketError) {
      logStep("Error generating ticket", ticketError);
      throw new Error(`Failed to generate ticket: ${ticketError.message}`);
    }

    generatedTickets.push(ticket);
    logStep("Generated ticket", { ticketCode, holderName });
  }

  logStep("All tickets generated successfully", { count: generatedTickets.length });
  return generatedTickets;
};

// Helper function to process event ticket purchase
const processEventTicketPurchase = async (supabase: any, orderItem: any, order: any, user: any) => {
  logStep("Processing event ticket purchase", { 
    ticketId: orderItem.item_id, 
    quantity: orderItem.quantity 
  });

  // Get event details from ticket
  const { data: ticketWithEvent, error: ticketError } = await supabase
    .from('event_tickets')
    .select(`
      *,
      event:events (
        id,
        title
      )
    `)
    .eq('id', orderItem.item_id)
    .single();

  if (ticketError) {
    logStep("Error fetching ticket with event", ticketError);
    throw new Error(`Failed to fetch ticket details: ${ticketError.message}`);
  }

  // Update ticket inventory
  await updateTicketInventory(supabase, orderItem.item_id, orderItem.quantity);

  // Create event booking
  const booking = await createEventBooking(supabase, {
    user_id: user.id,
    event_id: ticketWithEvent.event.id,
    event_ticket_id: orderItem.item_id,
    order_id: order.id,
    quantity: orderItem.quantity,
    total_price: orderItem.total_price
  });

  // Generate individual tickets
  await generateTickets(supabase, {
    bookingId: booking.id,
    eventId: ticketWithEvent.event.id,
    orderId: order.id,
    userId: user.id,
    eventTicketId: orderItem.item_id,
    quantity: orderItem.quantity,
    ticket_holder_names: orderItem.metadata?.ticket_holder_names || []
  });

  logStep("Event ticket purchase processed successfully", { 
    bookingId: booking.id,
    ticketsGenerated: orderItem.quantity 
  });
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

    const { courseId, eventId, eventTicketId, returnUrl, payment_method = 'stripe', items } = await req.json();
    logStep("Request data", { courseId, eventId, eventTicketId, payment_method, itemsCount: items?.length });

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
      const { data: orderItem, error: itemError } = await supabaseClient
        .from('order_items')
        .insert({
          order_id: order.id,
          item_id: courseId || eventTicketId || eventId,
          item_type: itemType,
          item_name: itemName,
          quantity: 1,
          unit_price: itemPrice,
          total_price: itemPrice
        })
        .select()
        .single();

      if (itemError) throw new Error(`Failed to create order item: ${itemError.message}`);
      logStep("Order item created");

      // Process event ticket purchase if applicable
      if (itemType === 'event_ticket') {
        await processEventTicketPurchase(supabaseClient, orderItem, order, user);
        
        // Update order status to completed after successful processing
        const { error: updateOrderError } = await supabaseClient
          .from('orders')
          .update({ 
            payment_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateOrderError) {
          logStep("Error updating order status", updateOrderError);
          throw new Error(`Failed to update order status: ${updateOrderError.message}`);
        }
        
        logStep("Order status updated to completed");
      }

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
    } else if (items && items.length > 0) {
      // Cart-based purchase using items from request
      logStep("Processing cart items from request", { itemCount: items.length });

      // Calculate total amount from items
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
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
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        item_id: item.itemId || item.item_id,
        item_type: item.itemType || item.item_type,
        item_name: item.itemName || item.item_name || 'Item',
        quantity: item.quantity || 1,
        unit_price: item.price,
        total_price: item.price * (item.quantity || 1),
        metadata: {
          ticket_holder_names: item.ticket_holder_names || []
        }
      }));

      const { data: createdOrderItems, error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);
      logStep("Order items created", { itemCount: createdOrderItems.length });

      // Process each event ticket item
      for (const orderItem of createdOrderItems) {
        if (orderItem.item_type === 'event_ticket') {
          await processEventTicketPurchase(supabaseClient, orderItem, order, user);
        }
      }

      // Update order status to completed after all processing
      const hasEventTickets = createdOrderItems.some(item => item.item_type === 'event_ticket');
      if (hasEventTickets) {
        const { error: updateOrderError } = await supabaseClient
          .from('orders')
          .update({ 
            payment_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateOrderError) {
          logStep("Error updating order status", updateOrderError);
          throw new Error(`Failed to update order status: ${updateOrderError.message}`);
        }
        
        logStep("Order status updated to completed");
      }

      // Create Stripe line items
      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.itemName || item.item_name || 'Item' },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
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
    } else {
      // Fallback: try to get cart items from database
      const { data: cartItems, error: cartError } = await supabaseClient
        .from('carts')
        .select('*')
        .eq('user_id', user.id);

      if (cartError || !cartItems || cartItems.length === 0) {
        throw new Error('No items provided and no items in cart');
      }

      logStep("Cart items retrieved from database", { itemCount: cartItems.length });

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
      .update({ 
        stripe_session_id: session.id
      })
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
