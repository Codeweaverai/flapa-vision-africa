
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

interface CreatePawaPayRequest {
  cartItems: CartItem[];
  phoneNumber: string;
  country: string;
  operator: string;
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

    const { cartItems, phoneNumber, country, operator, appliedGiftCard }: CreatePawaPayRequest = await req.json();

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const giftCardDiscount = appliedGiftCard?.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - giftCardDiscount);

    if (finalTotal <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        total_amount: Math.round(finalTotal * 100), // Store in cents
        currency: 'usd',
        payment_status: 'pending',
        payment_method: 'mobile_money'
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

    // Sanitize phone number for PawaPay
    const sanitizedPhoneNumber = phoneNumber
      .replace(/\D/g, '') // Remove all non-digits
      .replace(/^0+/, ''); // Remove leading zeros

    // Create PawaPay deposit request
    const pawaPayResponse = await fetch('https://api.pawapay.cloud/deposits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAWAPAY_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        depositId: `order_${order.id}`,
        amount: finalTotal.toString(),
        currency: 'USD',
        country: country.toUpperCase(),
        payer: {
          type: 'MSISDN',
          address: {
            value: sanitizedPhoneNumber
          }
        },
        correspondent: operator.toUpperCase(),
        customerTimestamp: new Date().toISOString(),
        statementDescription: `Payment for order ${order.id}`,
      }),
    });

    if (!pawaPayResponse.ok) {
      const errorText = await pawaPayResponse.text();
      throw new Error(`PawaPay API error: ${errorText}`);
    }

    const pawaPayData = await pawaPayResponse.json();

    // Update order with PawaPay details
    await supabase
      .from('orders')
      .update({ 
        pawapay_deposit_id: pawaPayData.depositId,
        payment_status: 'processing'
      })
      .eq('id', order.id);

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      depositId: pawaPayData.depositId,
      status: pawaPayData.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error creating PawaPay session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
