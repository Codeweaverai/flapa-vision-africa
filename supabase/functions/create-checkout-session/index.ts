
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

// Helper function to create or get existing event booking
const createOrGetEventBooking = async (supabase: any, bookingData: any) => {
  logStep("Creating or getting event booking", bookingData);
  
  // First, try to get existing booking
  const { data: existingBooking, error: existingError } = await supabase
    .from('event_bookings')
    .select('*')
    .eq('user_id', bookingData.user_id)
    .eq('event_id', bookingData.event_id)
    .maybeSingle();

  if (existingError) {
    logStep("Error checking existing booking", existingError);
    throw new Error(`Failed to check existing booking: ${existingError.message}`);
  }

  if (existingBooking) {
    logStep("Found existing booking", { bookingId: existingBooking.id });
    
    // Update the existing booking with new order info
    const { data: updatedBooking, error: updateError } = await supabase
      .from('event_bookings')
      .update({
        order_id: bookingData.order_id,
        ticket_quantity: existingBooking.ticket_quantity + bookingData.quantity,
        payment_amount: (existingBooking.payment_amount || 0) + bookingData.total_price,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingBooking.id)
      .select()
      .single();

    if (updateError) {
      logStep("Error updating existing booking", updateError);
      throw new Error(`Failed to update existing booking: ${updateError.message}`);
    }

    logStep("Updated existing booking successfully", { bookingId: updatedBooking.id });
    return updatedBooking;
  }

  // Create new booking if none exists
  const { data: booking, error: bookingError } = await supabase
    .from('event_bookings')
    .insert({
      user_id: bookingData.user_id,
      event_id: bookingData.event_id,
      event_ticket_id: bookingData.event_ticket_id,
      order_id: bookingData.order_id,
      ticket_quantity: bookingData.quantity,
      status: 'confirmed', // Set to confirmed
      payment_status: 'completed', // Set to completed
      payment_amount: bookingData.total_price,
      payment_currency: 'USD',
      booking_date: new Date().toISOString(),
      booking_code: `EVT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
    })
    .select()
    .single();

  if (bookingError) {
    logStep("Error creating new booking", bookingError);
    throw new Error(`Failed to create booking: ${bookingError.message}`);
  }

  logStep("New booking created successfully", { bookingId: booking.id });
  return booking;
};

// Helper function to generate tickets
const generateTickets = async (supabase: any, ticketData: any) => {
  logStep("Generating individual tickets", { 
    bookingId: ticketData.bookingId, 
    quantity: ticketData.quantity,
    holderNames: ticketData.ticket_holder_names?.length,
    holderEmails: ticketData.ticket_holder_emails?.length,
    userEmail: ticketData.userEmail,
    userFullName: ticketData.userFullName
  });
  
  const generatedTickets = [];
  
  for (let i = 0; i < ticketData.quantity; i++) {
    const ticketCode = `TCK-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    const holderName = ticketData.ticket_holder_names?.[i] || ticketData.userFullName || `Ticket Holder ${i + 1}`;
    const holderEmail = ticketData.ticket_holder_emails?.[i] || ticketData.userEmail || null;
    
    const qrData = JSON.stringify({
      ticketCode,
      bookingId: ticketData.bookingId,
      eventId: ticketData.eventId,
      orderId: ticketData.orderId,
      userId: ticketData.userId,
      ticketHolderName: holderName,
      ticketHolderEmail: holderEmail,
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
        ticket_holder_email: holderEmail,
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
    logStep("Generated ticket", { ticketCode, holderName, holderEmail });
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

  // Get event details from ticket - Fix the relationship issue
  const { data: ticketWithEvent, error: ticketError } = await supabase
    .from('event_tickets')
    .select(`
      *,
      events!event_tickets_event_id_fkey (
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

  // Verify event exists
  if (!ticketWithEvent.events) {
    logStep("No event found for ticket", { ticketId: orderItem.item_id });
    throw new Error(`No event found for ticket: ${orderItem.item_id}`);
  }

  // Update ticket inventory
  await updateTicketInventory(supabase, orderItem.item_id, orderItem.quantity);

  // Create or get event booking
  const booking = await createOrGetEventBooking(supabase, {
    user_id: user.id,
    event_id: ticketWithEvent.events.id,
    event_ticket_id: orderItem.item_id,
    order_id: order.id,
    quantity: orderItem.quantity,
    total_price: orderItem.total_price
  });

  // Safely parse metadata
  let ticketHolderNames = [];
  let ticketHolderEmails = [];
  try {
    const metadata = orderItem.metadata || {};
    ticketHolderNames = metadata.ticket_holder_names || [];
    ticketHolderEmails = metadata.ticket_holder_emails || [];
  } catch (e) {
    logStep("Error parsing metadata", e);
    ticketHolderNames = [];
    ticketHolderEmails = [];
  }

  // Generate individual tickets with user info
  await generateTickets(supabase, {
    bookingId: booking.id,
    eventId: ticketWithEvent.events.id,
    orderId: order.id,
    userId: user.id,
    eventTicketId: orderItem.item_id,
    quantity: orderItem.quantity,
    ticket_holder_names: ticketHolderNames,
    ticket_holder_emails: ticketHolderEmails,
    userEmail: user.email,
    userFullName: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email
  });

  logStep("Event ticket purchase processed successfully", { 
    bookingId: booking.id,
    ticketsGenerated: orderItem.quantity 
  });
};

// Helper function to process course enrollment
const processCourseEnrollment = async (supabase: any, orderItem: any, order: any, user: any) => {
  logStep("Processing course enrollment", { 
    courseId: orderItem.item_id, 
    quantity: orderItem.quantity 
  });

  // Check if enrollment already exists
  const { data: existingEnrollment, error: checkError } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', orderItem.item_id)
    .eq('order_id', order.id)
    .maybeSingle();

  if (checkError) {
    logStep("Error checking existing enrollment", checkError);
    throw new Error(`Failed to check existing enrollment: ${checkError.message}`);
  }

  if (existingEnrollment) {
    logStep("Course enrollment already exists", { enrollmentId: existingEnrollment.id });
    return existingEnrollment;
  }

  // Create course enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .insert({
      user_id: user.id,
      course_id: orderItem.item_id,
      order_id: order.id,
      payment_status: 'completed',
      enrollment_date: new Date().toISOString()
    })
    .select()
    .single();

  if (enrollmentError) {
    logStep("Error creating course enrollment", enrollmentError);
    throw new Error(`Failed to create course enrollment: ${enrollmentError.message}`);
  }

  logStep("Course enrollment created successfully", { enrollmentId: enrollment.id });
  return enrollment;
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

    const requestBody = await req.json();
    const { courseId, eventId, eventTicketId, returnUrl, payment_method = 'stripe', items } = requestBody;
    
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
            events!event_tickets_event_id_fkey (
              title
            )
          `)
          .eq('id', eventTicketId)
          .single();

        if (ticketError) throw new Error(`Event ticket not found: ${ticketError.message}`);
        
        itemData = ticket;
        itemName = `${ticket.events?.title} - ${ticket.name}`;
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

      // Create order for direct purchase with completed payment status
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: user.id,
          email: user.email,
          total_amount: itemPrice,
          currency: 'USD',
          payment_status: 'completed',
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

      // Process based on item type
      if (itemType === 'course') {
        await processCourseEnrollment(supabaseClient, orderItem, order, user);
      } else if (itemType === 'event_ticket') {
        await processEventTicketPurchase(supabaseClient, orderItem, order, user);
      }

      sessionData = {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: itemName },
            unit_amount: Math.round(itemPrice * 100),
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
          payment_status: 'completed',
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
          ticket_holder_names: item.ticket_holder_names || [],
          ticket_holder_emails: item.ticket_holder_emails || []
        }
      }));

      const { data: createdOrderItems, error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);
      logStep("Created order items", createdOrderItems);

      // Process each order item
      for (const orderItem of createdOrderItems) {
        if (orderItem.item_type === 'event_ticket') {
          await processEventTicketPurchase(supabaseClient, orderItem, order, user);
        } else if (orderItem.item_type === 'course') {
          await processCourseEnrollment(supabaseClient, orderItem, order, user);
        }
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
      throw new Error('No items provided for checkout');
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
