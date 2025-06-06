
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
      items,
      total_amount,
      tax_amount,
      discount_amount,
      promo_code,
      currency,
      success_url,
      cancel_url
    } = await req.json();

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        email: user.email,
        total_amount,
        tax_amount: tax_amount || 0,
        currency: currency || 'USD',
        payment_method: 'card',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      item_type: item.item_type,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: orderItemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) throw orderItemsError;

    // Update promo code usage if used
    if (promo_code) {
      await supabaseClient
        .from('promo_codes')
        .update({ current_uses: supabaseClient.rpc('increment_uses') })
        .eq('code', promo_code);
    }

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
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: currency || 'usd',
        product_data: {
          name: item.item_name,
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

    // Add tax as a line item if applicable
    if (tax_amount > 0) {
      lineItems.push({
        price_data: {
          currency: currency || 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: Math.round(tax_amount * 100),
        },
        quantity: 1,
      });
    }

    // Add discount as a negative line item if applicable
    if (discount_amount > 0) {
      lineItems.push({
        price_data: {
          currency: currency || 'usd',
          product_data: {
            name: `Discount${promo_code ? ` (${promo_code})` : ''}`,
          },
          unit_amount: -Math.round(discount_amount * 100),
        },
        quantity: 1,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        user_id: user.id,
        order_id: order.id,
        promo_code: promo_code || ''
      }
    });

    // Update order with Stripe session ID
    await supabaseClient
      .from('orders')
      .update({ payment_provider_id: session.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({ url: session.url, order_id: order.id }),
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
