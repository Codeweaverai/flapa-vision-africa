import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
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

  logStep("Ticket inventory updated successfully");
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
      booking_code: `EVT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      status: 'confirmed',
      payment_status: 'completed',
      payment_amount: bookingData.total_price,
      payment_currency: bookingData.currency || 'USD',
      ticket_quantity: bookingData.quantity,
      booking_date: new Date().toISOString()
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
    quantity: ticketData.quantity 
  });
  
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

    const { error: ticketError } = await supabase
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
      });

    if (ticketError) {
      logStep("Error generating ticket", ticketError);
      throw new Error(`Failed to generate ticket: ${ticketError.message}`);
    }

    logStep("Generated ticket", { ticketCode, holderName });
  }

  logStep("All tickets generated successfully");
};

// Helper function to create course enrollment
const createCourseEnrollment = async (supabase: any, enrollmentData: any) => {
  logStep("Creating course enrollment", enrollmentData);
  
  // Check if enrollment already exists
  const { data: existingEnrollment, error: checkError } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', enrollmentData.user_id)
    .eq('course_id', enrollmentData.course_id)
    .maybeSingle();

  if (checkError) {
    logStep("Error checking existing enrollment", checkError);
    throw new Error(`Failed to check existing enrollment: ${checkError.message}`);
  }

  if (existingEnrollment) {
    logStep("Course enrollment already exists", { enrollmentId: existingEnrollment.id });
    return existingEnrollment;
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .insert({
      user_id: enrollmentData.user_id,
      course_id: enrollmentData.course_id,
      order_id: enrollmentData.order_id,
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
    logStep('Create checkout session started');

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    logStep('User authenticated', { userId: user.id, email: user.email });

    const requestBody = await req.json();
    logStep('Request body', requestBody);

    const { 
      courseId, 
      eventId, 
      eventTicketId,
      amount,
      currency = 'usd',
      successUrl,
      cancelUrl,
      items // For cart-based checkout
    } = requestBody;

    let lineItems = [];
    let orderItems = []; // To store for database insertion

    // Handle cart-based checkout (multiple items)
    if (items && Array.isArray(items) && items.length > 0) {
      logStep('Processing cart-based checkout with items', items);
      
      for (const item of items) {
        const { item_id, item_type, item_name, quantity = 1, price, ticket_holder_names, ticket_holder_emails } = item;
        
        logStep(`Processing item: ${item_name}, type: ${item_type}, price: ${price}`);
        
        // Validate price
        if (price === null || price === undefined || typeof price !== 'number' || isNaN(price) || price <= 0) {
          throw new Error(`Invalid price for item "${item_name}": ${price}`);
        }

        const unitAmount = Math.round(price * 100);
        
        lineItems.push({
          price_data: {
            currency: currency,
            product_data: {
              name: item_name,
              metadata: {
                item_id: item_id,
                item_type: item_type
              }
            },
            unit_amount: unitAmount,
          },
          quantity: quantity,
        });

        // Store for database insertion
        orderItems.push({
          item_id,
          item_type,
          item_name,
          quantity,
          unit_price: price,
          total_price: price * quantity,
          metadata: {
            ticket_holder_names: ticket_holder_names || [],
            ticket_holder_emails: ticket_holder_emails || []
          }
        });
      }
    } 
    // Handle single item checkout
    else {
      let itemPrice = 0;
      let itemName = "";
      let itemDescription = "";
      let itemId = "";
      let itemType = "";

      if (courseId) {
        logStep('Fetching course', courseId);
        const { data: course, error: courseError } = await supabaseClient
          .from('courses')
          .select('title, price, description')
          .eq('id', courseId)
          .single();

        if (courseError || !course) {
          throw new Error(`Course not found: ${courseError?.message}`);
        }

        if (course.price === null || course.price === undefined || typeof course.price !== 'number' || isNaN(course.price)) {
          throw new Error(`Course "${course.title}" has invalid price: ${course.price}`);
        }

        itemPrice = course.price;
        itemName = course.title;
        itemDescription = course.description || "";
        itemId = courseId;
        itemType = "course";
      } else if (eventTicketId) {
        logStep('Fetching event ticket', eventTicketId);
        const { data: ticket, error: ticketError } = await supabaseClient
          .from('event_tickets')
          .select('name, price, description, events(title)')
          .eq('id', eventTicketId)
          .single();

        if (ticketError || !ticket) {
          throw new Error(`Event ticket not found: ${ticketError?.message}`);
        }

        if (ticket.price === null || ticket.price === undefined || typeof ticket.price !== 'number' || isNaN(ticket.price)) {
          throw new Error(`Event ticket "${ticket.name}" has invalid price: ${ticket.price}`);
        }

        itemPrice = ticket.price;
        itemName = `${ticket.events?.title} - ${ticket.name}`;
        itemDescription = ticket.description || "";
        itemId = eventTicketId;
        itemType = "event_ticket";
      } else if (eventId) {
        logStep('Fetching event', eventId);
        const { data: event, error: eventError } = await supabaseClient
          .from('events')
          .select('title, price, description')
          .eq('id', eventId)
          .single();

        if (eventError || !event) {
          throw new Error(`Event not found: ${eventError?.message}`);
        }

        if (event.price === null || event.price === undefined || typeof event.price !== 'number' || isNaN(event.price)) {
          throw new Error(`Event "${event.title}" has invalid price: ${event.price}`);
        }

        itemPrice = event.price;
        itemName = event.title;
        itemDescription = event.description || "";
        itemId = eventId;
        itemType = "event";
      } else {
        throw new Error("No valid item identifier provided");
      }

      let finalPrice = itemPrice;
      if (amount !== undefined && amount !== null) {
        if (typeof amount !== 'number' || isNaN(amount)) {
          throw new Error(`Invalid amount provided: ${amount}`);
        }
        finalPrice = Math.max(itemPrice, amount);
      }

      if (finalPrice <= 0) {
        throw new Error(`Invalid price: Items must have a price greater than $0.00. Got $${finalPrice}`);
      }

      if (finalPrice < 0.5) {
        throw new Error(`Price too low: Stripe requires a minimum of $0.50 USD for payments. Got $${finalPrice}`);
      }

      const unitAmount = Math.round(finalPrice * 100);

      lineItems.push({
        price_data: {
          currency: currency,
          product_data: {
            name: itemName,
            description: itemDescription,
            metadata: {
              course_id: courseId || '',
              event_id: eventId || '',
              event_ticket_id: eventTicketId || ''
            }
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      });

      // Store for database insertion
      orderItems.push({
        item_id: itemId,
        item_type: itemType,
        item_name: itemName,
        quantity: 1,
        unit_price: finalPrice,
        total_price: finalPrice,
        metadata: {}
      });
    }

    // Validate we have line items
    if (lineItems.length === 0) {
      throw new Error("No valid items to process for checkout");
    }

    logStep('Final line items', lineItems);

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Existing customer found', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
      logStep('New customer created', customerId);
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    // Create Supabase admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create checkout session with metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/payment-success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/payment-cancel`,
      metadata: {
        user_id: user.id,
        course_id: courseId || '',
        event_id: eventId || '',
        event_ticket_id: eventTicketId || '',
        items_count: lineItems.length.toString(),
        order_items: JSON.stringify(orderItems)
      }
    });

    logStep('Stripe checkout session created', { sessionId: session.id });

    // Insert order into database
    logStep('Creating order in database');
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        currency: currency.toUpperCase(),
        payment_status: 'pending',
        payment_method: 'stripe',
        payment_provider_id: session.id,
        email: user.email,
        tax_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      logStep('Error creating order', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep('Order created successfully', { orderId: order.id });

    // Insert order items
    logStep('Creating order items');
    const orderItemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { data: createdOrderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert)
      .select();

    if (itemsError) {
      logStep('Error creating order items', itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    logStep('Order items created successfully', { count: createdOrderItems.length });

    // Process each order item for fulfillment
    for (const orderItem of createdOrderItems) {
      if (orderItem.item_type === 'event_ticket') {
        // Get event details from ticket
        const { data: ticketWithEvent, error: ticketError } = await supabaseAdmin
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

        if (ticketError || !ticketWithEvent.events) {
          logStep("Error fetching ticket with event", ticketError);
          throw new Error(`Failed to fetch ticket details: ${ticketError.message}`);
        }

        // Update ticket inventory
        await updateTicketInventory(supabaseAdmin, orderItem.item_id, orderItem.quantity);

        // Create event booking
        const booking = await createEventBooking(supabaseAdmin, {
          user_id: user.id,
          event_id: ticketWithEvent.events.id,
          event_ticket_id: orderItem.item_id,
          order_id: order.id,
          quantity: orderItem.quantity,
          total_price: orderItem.total_price,
          currency: currency.toUpperCase()
        });

        // Generate individual tickets
        await generateTickets(supabaseAdmin, {
          bookingId: booking.id,
          eventId: ticketWithEvent.events.id,
          orderId: order.id,
          userId: user.id,
          eventTicketId: orderItem.item_id,
          quantity: orderItem.quantity,
          ticket_holder_names: orderItem.metadata?.ticket_holder_names || [],
          ticket_holder_emails: orderItem.metadata?.ticket_holder_emails || [],
          userEmail: user.email,
          userFullName: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email
        });

      } else if (orderItem.item_type === 'course') {
        // Create course enrollment
        await createCourseEnrollment(supabaseAdmin, {
          user_id: user.id,
          course_id: orderItem.item_id,
          order_id: order.id
        });
      }
    }

    // Update order status to completed
    logStep('Updating order status to completed');
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      logStep('Error updating order status', updateError);
      // Don't throw here as the payment was successful
    }

    // Trigger payment confirmation email in background
    logStep('Triggering payment confirmation email');
    const emailPayload = {
      orderId: order.id,
      userId: user.id,
      userEmail: user.email,
      customerName: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email,
      orderItems: orderItems.map(item => ({
        item_id: item.item_id,
        item_type: item.item_type,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })),
      totalAmount: totalAmount,
      currency: currency.toUpperCase(),
      paymentMethod: 'Stripe'
    };

    // Send email in background without waiting
    EdgeRuntime.waitUntil(
      supabaseAdmin.functions.invoke('send-payment-success-email', {
        body: emailPayload
      }).then(({ error: emailError }) => {
        if (emailError) {
          console.error('[CREATE-CHECKOUT] Email sending failed:', emailError);
        } else {
          console.log('[CREATE-CHECKOUT] Payment confirmation email sent successfully');
        }
      }).catch(emailError => {
        console.error('[CREATE-CHECKOUT] Email sending error:', emailError);
      })
    );

    logStep('Checkout session and order processing completed successfully');

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200 
      }
    );

  } catch (error) {
    logStep('Error creating checkout session', { error: error.message });
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout session',
        details: error.toString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 400 
      }
    );
  }
});
