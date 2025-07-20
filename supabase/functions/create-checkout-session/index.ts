
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
    console.log('Create checkout session started');

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

    console.log('User authenticated:', user.email);

    const requestBody = await req.json();
    console.log('Request body:', requestBody);

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

    // Handle cart-based checkout (multiple items)
    if (items && Array.isArray(items) && items.length > 0) {
      console.log('Processing cart-based checkout with items:', items);
      
      for (const item of items) {
        const { item_id, item_type, item_name, quantity = 1, price } = item;
        
        console.log(`Processing item: ${item_name}, type: ${item_type}, price: ${price}`);
        
        // Validate price exists and is a valid number
        if (price === null || price === undefined || typeof price !== 'number' || isNaN(price)) {
          console.error(`Invalid price for item ${item_name}: ${price}`);
          throw new Error(`Invalid price for item "${item_name}": price must be a valid number, got ${price}`);
        }

        if (price <= 0) {
          console.error(`Price must be greater than 0 for item ${item_name}: ${price}`);
          throw new Error(`Price must be greater than $0.00 for item "${item_name}": got $${price}`);
        }

        // Convert to cents and validate
        const unitAmount = Math.round(price * 100);
        if (isNaN(unitAmount) || unitAmount <= 0) {
          console.error(`Invalid unit_amount calculated for ${item_name}: ${unitAmount} (from price: ${price})`);
          throw new Error(`Failed to calculate valid unit_amount for "${item_name}": ${unitAmount}`);
        }

        console.log(`Item ${item_name}: price ${price} USD = ${unitAmount} cents`);

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
      }
    } 
    // Handle single item checkout (legacy support)
    else {
      let itemPrice = 0;
      let itemName = "";
      let itemDescription = "";

      // Validate and fetch item details
      if (courseId) {
        console.log('Fetching course:', courseId);
        const { data: course, error: courseError } = await supabaseClient
          .from('courses')
          .select('title, price, description')
          .eq('id', courseId)
          .single();

        console.log('Course query result:', { data: course, error: courseError });

        if (courseError) {
          console.error('Course fetch error:', courseError);
          throw new Error(`Course not found: ${courseError.message}`);
        }

        if (!course) {
          throw new Error(`Course with ID ${courseId} not found`);
        }

        // Validate course price
        if (course.price === null || course.price === undefined || typeof course.price !== 'number' || isNaN(course.price)) {
          console.error(`Invalid course price: ${course.price}`);
          throw new Error(`Course "${course.title}" has invalid price: ${course.price}. Price must be a valid number.`);
        }

        itemPrice = course.price;
        itemName = course.title;
        itemDescription = course.description || "";
        console.log('Course details:', { title: itemName, price: itemPrice });
      } else if (eventTicketId) {
        console.log('Fetching event ticket:', eventTicketId);
        const { data: ticket, error: ticketError } = await supabaseClient
          .from('event_tickets')
          .select('name, price, description, events(title)')
          .eq('id', eventTicketId)
          .single();

        console.log('Ticket query result:', { data: ticket, error: ticketError });

        if (ticketError) {
          console.error('Ticket fetch error:', ticketError);
          throw new Error(`Event ticket not found: ${ticketError.message}`);
        }

        if (!ticket) {
          throw new Error(`Event ticket with ID ${eventTicketId} not found`);
        }

        // Validate ticket price
        if (ticket.price === null || ticket.price === undefined || typeof ticket.price !== 'number' || isNaN(ticket.price)) {
          console.error(`Invalid ticket price: ${ticket.price}`);
          throw new Error(`Event ticket "${ticket.name}" has invalid price: ${ticket.price}. Price must be a valid number.`);
        }

        itemPrice = ticket.price;
        itemName = `${ticket.events?.title} - ${ticket.name}`;
        itemDescription = ticket.description || "";
        console.log('Ticket details:', { name: itemName, price: itemPrice });
      } else if (eventId) {
        console.log('Fetching event:', eventId);
        const { data: event, error: eventError } = await supabaseClient
          .from('events')
          .select('title, price, description')
          .eq('id', eventId)
          .single();

        console.log('Event query result:', { data: event, error: eventError });

        if (eventError) {
          console.error('Event fetch error:', eventError);
          throw new Error(`Event not found: ${eventError.message}`);
        }

        if (!event) {
          throw new Error(`Event with ID ${eventId} not found`);
        }

        // Validate event price
        if (event.price === null || event.price === undefined || typeof event.price !== 'number' || isNaN(event.price)) {
          console.error(`Invalid event price: ${event.price}`);
          throw new Error(`Event "${event.title}" has invalid price: ${event.price}. Price must be a valid number.`);
        }

        itemPrice = event.price;
        itemName = event.title;
        itemDescription = event.description || "";
        console.log('Event details:', { title: itemName, price: itemPrice });
      } else {
        throw new Error("No valid item identifier provided (courseId, eventId, eventTicketId) or items array");
      }

      // Use provided amount if itemPrice is 0, but validate it
      let finalPrice = itemPrice;
      if (amount !== undefined && amount !== null) {
        if (typeof amount !== 'number' || isNaN(amount)) {
          throw new Error(`Invalid amount provided: ${amount}. Amount must be a valid number.`);
        }
        finalPrice = Math.max(itemPrice, amount);
      }

      console.log('Final calculated price:', finalPrice);

      // Validate final price
      if (finalPrice <= 0) {
        console.error('Invalid price calculated:', finalPrice);
        throw new Error(`Invalid price: Items must have a price greater than $0.00. Got $${finalPrice}`);
      }

      if (finalPrice < 0.5) {
        console.error('Price too low for Stripe:', finalPrice);
        throw new Error(`Price too low: Stripe requires a minimum of $0.50 USD for payments. Got $${finalPrice}`);
      }

      // Convert to cents and validate unit_amount
      const unitAmount = Math.round(finalPrice * 100);
      if (isNaN(unitAmount) || unitAmount <= 0) {
        console.error('Invalid unit_amount calculated:', unitAmount);
        throw new Error(`Failed to calculate valid unit_amount: ${unitAmount} from price ${finalPrice}`);
      }

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
    }

    // Validate we have line items
    if (lineItems.length === 0) {
      throw new Error("No valid items to process for checkout");
    }

    console.log('Final line items:', JSON.stringify(lineItems, null, 2));

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Existing customer found:', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
      console.log('New customer created:', customerId);
    }

    // Create checkout session
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
        items_count: lineItems.length.toString()
      }
    });

    console.log('Checkout session created successfully:', session.id);

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
    console.error('Error creating checkout session:', error);
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
