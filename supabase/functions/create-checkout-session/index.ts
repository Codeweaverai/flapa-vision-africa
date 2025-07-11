
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
      cancelUrl 
    } = requestBody;

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

      if (courseError) {
        console.error('Course fetch error:', courseError);
        throw new Error(`Course not found: ${courseError.message}`);
      }

      itemPrice = course.price || 0;
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

      if (ticketError) {
        console.error('Ticket fetch error:', ticketError);
        throw new Error(`Event ticket not found: ${ticketError.message}`);
      }

      itemPrice = ticket.price || 0;
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

      if (eventError) {
        console.error('Event fetch error:', eventError);
        throw new Error(`Event not found: ${eventError.message}`);
      }

      itemPrice = event.price || 0;
      itemName = event.title;
      itemDescription = event.description || "";
      console.log('Event details:', { title: itemName, price: itemPrice });
    } else {
      throw new Error("No valid item identifier provided (courseId, eventId, or eventTicketId)");
    }

    // Use provided amount if itemPrice is 0, but ensure minimum price
    const finalPrice = Math.max(itemPrice, amount || 0);
    console.log('Final calculated price:', finalPrice);

    // Validate price - must be at least $0.50 for Stripe
    if (finalPrice <= 0) {
      console.error('Invalid price calculated:', finalPrice);
      throw new Error("Invalid price: Items must have a price greater than $0.00. Free items should be handled separately.");
    }

    if (finalPrice < 0.5) {
      console.error('Price too low for Stripe:', finalPrice);
      throw new Error("Price too low: Stripe requires a minimum of $0.50 USD for payments.");
    }

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
      line_items: [
        {
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
            unit_amount: Math.round(finalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/payment-success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/payment-cancel`,
      metadata: {
        user_id: user.id,
        course_id: courseId || '',
        event_id: eventId || '',
        event_ticket_id: eventTicketId || '',
        amount: finalPrice.toString()
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
