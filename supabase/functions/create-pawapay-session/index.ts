
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PAWAPAY_API_URL = 'https://api.sandbox.pawapay.io/v1/widget/sessions';
const PAWAPAY_TOKEN = Deno.env.get('PAWAPAY_TOKEN');

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAWAPAY] ${step}${detailsStr}`);
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
    holderEmails: ticketData.ticket_holder_emails?.length 
  });
  
  const generatedTickets = [];
  
  for (let i = 0; i < ticketData.quantity; i++) {
    const ticketCode = `TCK-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    const holderName = ticketData.ticket_holder_names?.[i] || `Ticket Holder ${i + 1}`;
    const holderEmail = ticketData.ticket_holder_emails?.[i] || null;
    
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

  // Generate individual tickets
  await generateTickets(supabase, {
    bookingId: booking.id,
    eventId: ticketWithEvent.events.id,
    orderId: order.id,
    userId: user.id,
    eventTicketId: orderItem.item_id,
    quantity: orderItem.quantity,
    ticket_holder_names: ticketHolderNames,
    ticket_holder_emails: ticketHolderEmails
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PawaPay session creation...');
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);

    const {
      amount,
      currency,
      msisdn,
      country,
      returnUrl,
      items,
      tax_amount,
      discount_amount,
      promo_code
    } = requestBody;

    console.log('Request payload:', { amount, currency, msisdn, country, itemsCount: items?.length });

    if (!PAWAPAY_TOKEN) {
      console.error('PawaPay token not configured');
      throw new Error('PawaPay token not configured');
    }

    if (!amount || !currency || !msisdn || !country || !items || !returnUrl) {
      console.error('Missing required fields:', { amount, currency, msisdn, country, items: !!items, returnUrl: !!returnUrl });
      throw new Error('Missing required payment fields');
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate phone number format
    if (!msisdn.match(/^\d{10,15}$/)) {
      throw new Error('Invalid phone number format');
    }

    // Generate unique deposit ID
    const depositId = crypto.randomUUID();
    console.log('Generated deposit ID:', depositId);

    // Create order record in Supabase using service role
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const orderData = {
      user_id: user.id,
      total_amount: amount / 100, // Convert back from cents
      currency: currency || 'USD',
      payment_method: 'mobile_money',
      payment_status: 'completed',
      tax_amount: tax_amount || 0,
      email: user.email || '',
      payment_provider_id: depositId
    };

    console.log('Creating order with data:', orderData);

    const { data: order, error: orderError } = await serviceRoleClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order: ' + orderError.message);
    }

    console.log('Order created successfully:', order.id);

    // Create order items using service role
    const orderItems = items.map((item: any) => {
      const itemType = item.item_type || item.itemType || 'event_ticket';
      const itemId = item.item_id || item.itemId || item.id;
      const itemName = item.item_name || item.itemName || item.title || item.name || 'Item';
      
      return {
        order_id: order.id,
        item_id: itemId,
        item_type: itemType,
        item_name: itemName,
        quantity: item.quantity || 1,
        unit_price: item.price || 0,
        total_price: (item.price || 0) * (item.quantity || 1),
        metadata: {
          ticket_holder_names: item.ticket_holder_names || [],
          ticket_holder_emails: item.ticket_holder_emails || []
        }
      };
    });

    console.log('Creating order items:', orderItems);

    const { data: createdOrderItems, error: itemsError } = await serviceRoleClient
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items: ' + itemsError.message);
    }

    console.log('Order items created successfully');
    logStep("Created order items", createdOrderItems);

    // Process each order item
    for (const orderItem of createdOrderItems) {
      if (orderItem.item_type === 'event_ticket') {
        await processEventTicketPurchase(serviceRoleClient, orderItem, order, user);
      } else if (orderItem.item_type === 'course') {
        // Create course enrollment
        const { data: enrollment, error: enrollmentError } = await serviceRoleClient
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
      }
    }

    // Prepare statement description (4-22 characters as per PawaPay docs)
    let statementDescription = 'SkillPulse Purchase';
    if (items.length === 1 && items[0].item_name) {
      const itemName = items[0].item_name.substring(0, 18);
      statementDescription = itemName.length >= 4 ? itemName : 'SkillPulse Purchase';
    }

    // Determine reason based on items
    const hasEvents = items.some((item: any) => 
      (item.item_type || item.itemType) === 'event_ticket' || 
      (item.item_type || item.itemType) === 'event'
    );
    const hasCourses = items.some((item: any) => 
      (item.item_type || item.itemType) === 'course'
    );
    const reason = hasEvents && hasCourses ? 'Course & Event' : hasEvents ? 'Event' : 'Course';

    // Prepare metadata as per PawaPay documentation (simplified)
    const metadata = [
      {
        "fieldName": "orderId",
        "fieldValue": order.id
      },
      {
        "fieldName": "userId", 
        "fieldValue": user.id
      }
    ];

    // Create PawaPay session with exact format from documentation
    const pawapayPayload = {
      "depositId": depositId,
      "returnUrl": returnUrl,
      "statementDescription": statementDescription,
      "amount": Math.round(amount / 100).toString(),
      "msisdn": msisdn,
      "language": "EN",
      "country": country,
      "reason": reason,
      "metadata": metadata
    };

    console.log('Creating PawaPay session with payload:', pawapayPayload);

    const pawapayResponse = await fetch(PAWAPAY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pawapayPayload),
    });

    const responseText = await pawapayResponse.text();
    console.log('PawaPay API response status:', pawapayResponse.status);
    console.log('PawaPay API response:', responseText);

    if (!pawapayResponse.ok) {
      console.error('PawaPay API error:', pawapayResponse.status, responseText);
      
      let errorMessage = 'Payment service error';
      
      try {
        const errorData = JSON.parse(responseText);
        
        if (pawapayResponse.status === 400) {
          errorMessage = `Invalid request: ${errorData.errorMessage || 'Bad request'}`;
        } else if (pawapayResponse.status === 401) {
          errorMessage = 'Authentication failed with payment provider';
        } else if (pawapayResponse.status === 403) {
          errorMessage = 'Access denied by payment provider';
        } else if (pawapayResponse.status === 500) {
          errorMessage = 'Payment service temporarily unavailable';
        }
        
        console.error('Parsed error data:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    let pawapayData;
    try {
      pawapayData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse PawaPay response:', parseError);
      throw new Error('Invalid response from payment provider');
    }

    // Validate response format
    if (!pawapayData.redirectUrl) {
      console.error('Missing redirectUrl in response:', pawapayData);
      throw new Error('Payment provider did not return a valid payment URL');
    }

    console.log('PawaPay session created successfully:', pawapayData);

    // Update order with PawaPay session info
    await serviceRoleClient
      .from('orders')
      .update({
        receipt_url: pawapayData.redirectUrl
      })
      .eq('id', order.id);

    return new Response(JSON.stringify({
      success: true,
      redirectUrl: pawapayData.redirectUrl,
      depositId,
      orderId: order.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-pawapay-session:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);
