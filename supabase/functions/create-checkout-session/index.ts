
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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { 
      payment_method = 'stripe',
      success_url,
      cancel_url
    } = await req.json();

    // Fetch cart items for the user
    const { data: cartItems, error: cartError } = await supabaseClient
      .from('carts')
      .select('*')
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.1; // 10% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        email: user.email,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        currency: 'USD',
        payment_method: payment_method,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      item_type: item.item_type,
      item_id: item.item_id,
      item_name: `Item ${item.item_id}`, // Will be updated with actual names
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      metadata: {
        ticket_holder_names: item.ticket_holder_names || []
      }
    }));

    const { error: orderItemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) throw orderItemsError;

    // Get item details and update order items with proper names
    for (const item of cartItems) {
      let itemName = 'Unknown Item';
      
      if (item.item_type === 'course') {
        const { data: course } = await supabaseClient
          .from('courses')
          .select('title')
          .eq('id', item.item_id)
          .single();
        itemName = course?.title || 'Course';
      } else if (item.item_type === 'event_ticket') {
        const { data: ticket } = await supabaseClient
          .from('event_tickets')
          .select('name, event:events(title)')
          .eq('id', item.item_id)
          .single();
        itemName = ticket?.event?.title || ticket?.name || 'Event Ticket';
      }

      await supabaseClient
        .from('order_items')
        .update({ item_name: itemName })
        .eq('order_id', order.id)
        .eq('item_id', item.item_id);
    }

    if (payment_method === 'stripe') {
      // Check if customer exists
      const customers = await stripe.customers.list({ 
        email: user.email, 
        limit: 1 
      });

      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
            order_id: order.id
          }
        });
        customerId = customer.id;
      }

      // Create line items for Stripe
      const lineItems = cartItems.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Item ${item.item_id}`,
            metadata: {
              item_type: item.item_type,
              item_id: item.item_id,
              order_id: order.id
            }
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      // Add tax as a line item
      if (taxAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tax',
            },
            unit_amount: Math.round(taxAmount * 100),
          },
          quantity: 1,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: lineItems,
        mode: "payment",
        success_url: success_url || `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url || `${req.headers.get("origin")}/checkout`,
        metadata: {
          user_id: user.id,
          order_id: order.id
        }
      });

      // Update order with Stripe session ID
      await supabaseClient
        .from('orders')
        .update({ 
          payment_provider_id: session.id,
          stripe_session_id: session.id 
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ 
          url: session.url, 
          order_id: order.id,
          session_id: session.id 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
          status: 200 
        }
      );
    } else {
      // For PawaPay or other payment methods, return order info
      return new Response(
        JSON.stringify({ 
          order_id: order.id,
          total_amount: totalAmount,
          currency: 'USD'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
          status: 200 
        }
      );
    }

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 500 
      }
    );
  }
});
