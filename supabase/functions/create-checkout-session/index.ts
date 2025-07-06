
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
        payment_amount: (existingBookingData.payment_amount || 0) + bookingData.total_price,
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
      status: 'confirmed',
      payment_status: 'completed',
      payment_amount: bookingData.total_price,
      payment_currency: bookingData.currency || 'USD',
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
    total_price: orderItem.total_price,
    currency: order.currency
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

    // Parse and log the full request body
    const requestBody = await req.json();
    logStep("Full request body received", requestBody);

    const { 
      courseId, 
      eventId, 
      eventTicketId, 
      returnUrl, 
      payment_method = 'stripe', 
      amount, 
      currency = 'USD' 
    } = requestBody;
    
    // Validate request completeness
    if (!courseId && !eventId && !eventTicketId) {
      logStep("Missing required identifiers", { courseId, eventId, eventTicketId });
      throw new Error("Missing required checkout details: please provide courseId, eventTicketId, or eventId");
    }

    logStep("Request validation passed", { courseId, eventId, eventTicketId, payment_method, amount, currency });

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
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=true`;
    
    logStep("Setting up URLs", { successUrl, cancelUrl });

    // Handle item-specific checkout
    let itemData;
    let itemName;
    let itemPrice;
    let itemType;
    let finalItemId;

    if (courseId) {
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('title, price')
        .eq('id', courseId)
        .single();

      if (courseError) {
        logStep("Course not found", { courseId, error: courseError });
        throw new Error(`Course not found: ${courseError.message}`);
      }
      
      itemData = course;
      itemName = course.title;
      // Use the higher of course price or provided amount, fallback to course price if amount is 0 or missing
      itemPrice = Math.max(course.price || 0, amount || 0);
      itemType = 'course';
      finalItemId = courseId;
      logStep("Course data retrieved", { courseId, title: itemName, coursePrice: course.price, providedAmount: amount, finalPrice: itemPrice });
      
    } else if (eventTicketId) {
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('event_tickets')
        .select('name, price, event_id')
        .eq('id', eventTicketId)
        .single();

      if (ticketError) {
        logStep("Event ticket not found", { eventTicketId, error: ticketError });
        throw new Error(`Event ticket not found: ${ticketError.message}`);
      }
      
      itemData = ticket;
      itemName = ticket.name;
      // Use the higher of ticket price or provided amount, fallback to ticket price if amount is 0 or missing
      itemPrice = Math.max(ticket.price || 0, amount || 0);
      itemType = 'event_ticket';
      finalItemId = eventTicketId;
      logStep("Event ticket data retrieved", { eventTicketId, name: itemName, ticketPrice: ticket.price, providedAmount: amount, finalPrice: itemPrice });
      
    } else if (eventId) {
      // If only eventId is provided, we need to get the default ticket or create one
      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .select('title, price')
        .eq('id', eventId)
        .single();

      if (eventError) {
        logStep("Event not found", { eventId, error: eventError });
        throw new Error(`Event not found: ${eventError.message}`);
      }
      
      itemData = event;
      itemName = event.title;
      // Use the higher of event price or provided amount, fallback to event price if amount is 0 or missing
      itemPrice = Math.max(event.price || 0, amount || 0);
      itemType = 'event';
      finalItemId = eventId;
      logStep("Event data retrieved", { eventId, title: itemName, eventPrice: event.price, providedAmount: amount, finalPrice: itemPrice });
    }

    // Now validate the final calculated price (not the raw amount)
    if (!itemPrice || itemPrice <= 0) {
      logStep("Invalid final item price after calculation", { 
        itemPrice, 
        originalAmount: amount, 
        itemData: itemData ? { price: itemData.price } : null 
      });
      throw new Error(`Cannot process payment: item has no valid price. Item price: ${itemData?.price || 'N/A'}, Provided amount: ${amount || 'N/A'}`);
    }

    logStep("Price validation passed", { finalPrice: itemPrice });

    // Create order first
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: itemPrice,
        currency: currency,
        payment_method: 'stripe',
        payment_status: 'pending',
        email: user.email
      })
      .select()
      .single();

    if (orderError) {
      logStep("Failed to create order", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }
    logStep("Order created", { orderId: order.id, amount: itemPrice });

    // Create order item
    const { data: orderItem, error: orderItemError } = await supabaseClient
      .from('order_items')
      .insert({
        order_id: order.id,
        item_id: finalItemId,
        item_type: itemType,
        item_name: itemName,
        quantity: 1,
        unit_price: itemPrice,
        total_price: itemPrice
      })
      .select()
      .single();

    if (orderItemError) {
      logStep("Failed to create order item", orderItemError);
      throw new Error(`Failed to create order item: ${orderItemError.message}`);
    }
    logStep("Order item created", { orderItemId: orderItem.id });

    // Create Stripe checkout session
    const sessionData = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: itemName },
            unit_amount: Math.round(itemPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: order.id,
        userId: user.id,
        itemType: itemType,
        itemId: finalItemId
      }
    });

    logStep("Stripe session created", { sessionId: sessionData.id, url: sessionData.url });

    // Process immediate enrollment for courses
    if (itemType === 'course') {
      await processCourseEnrollment(supabaseClient, orderItem, order, user);
      // Update order status to completed
      await supabaseClient
        .from('orders')
        .update({ payment_status: 'completed' })
        .eq('id', order.id);
      logStep("Course enrollment processed and order completed");
    }

    return new Response(JSON.stringify({ url: sessionData.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in checkout session creation", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check server logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
