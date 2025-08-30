
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  itemId: string;
  itemType: 'course' | 'event_ticket' | 'gift_card';
  itemName: string;
  price: number;
  quantity: number;
  giftMetadata?: {
    senderName: string;
    recipientName: string;
    recipientEmail: string;
    personalMessage?: string;
    amount?: number;
  };
}

interface CreateCheckoutRequest {
  cartItems: CartItem[];
  successUrl: string;
  cancelUrl: string;
  appliedGiftCard?: {
    code: string;
    discountAmount: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const { cartItems, successUrl, cancelUrl, appliedGiftCard }: CreateCheckoutRequest = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const giftCardDiscount = appliedGiftCard?.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - giftCardDiscount);

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        total_amount: Math.round(finalTotal * 100), // Store in cents
        currency: 'usd',
        payment_status: 'pending',
        payment_method: 'stripe'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    for (const item of cartItems) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          item_id: item.itemId,
          item_type: item.itemType,
          item_name: item.itemName,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          metadata: item.giftMetadata ? {
            ...item.giftMetadata,
            isGift: true
          } : null
        });

      if (itemError) throw itemError;
    }

    // Create line items for Stripe
    const lineItems = [];

    // Add cart items
    for (const item of cartItems) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.itemName,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      });
    }

    // Add gift card discount as negative line item if applicable
    if (appliedGiftCard && appliedGiftCard.discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Gift Card Discount (${appliedGiftCard.code})`,
          },
          unit_amount: -Math.round(appliedGiftCard.discountAmount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: order.id,
        user_id: userData.user.id,
        applied_gift_card: appliedGiftCard?.code || '',
      },
    });

    // Update order with session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url,
      orderId: order.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
