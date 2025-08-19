
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessGiftsRequest {
  orderId: string;
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

    const { orderId }: ProcessGiftsRequest = await req.json();

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Get sender info from order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Get sender email
    const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
    const senderEmail = userData?.user?.email || 'unknown@example.com';

    const processedGifts = [];
    const processedGiftCards = [];

    for (const item of orderItems) {
      const metadata = item.metadata || {};
      
      if (item.item_type === 'gift_course') {
        // Create gift record
        const giftCode = await generateUniqueCode('GIFT-');
        
        const { data: gift, error: giftError } = await supabase
          .from('gifts')
          .insert({
            order_id: orderId,
            item_type: 'course',
            item_id: item.item_id,
            gift_code: giftCode,
            sender_name: metadata.senderName,
            sender_email: senderEmail,
            recipient_name: metadata.recipientName,
            recipient_email: metadata.recipientEmail,
            personal_message: metadata.personalMessage
          })
          .select()
          .single();

        if (giftError) throw giftError;

        // Send gift email
        await supabase.functions.invoke('send-gift-email', {
          body: { giftId: gift.id, type: 'course' }
        });

        processedGifts.push(gift);
        
      } else if (item.item_type === 'gift_event') {
        // Create gift record
        const giftCode = await generateUniqueCode('GIFT-');
        
        const { data: gift, error: giftError } = await supabase
          .from('gifts')
          .insert({
            order_id: orderId,
            item_type: 'event',
            item_id: item.item_id,
            gift_code: giftCode,
            sender_name: metadata.senderName,
            sender_email: senderEmail,
            recipient_name: metadata.recipientName,
            recipient_email: metadata.recipientEmail,
            personal_message: metadata.personalMessage
          })
          .select()
          .single();

        if (giftError) throw giftError;

        // Send gift email
        await supabase.functions.invoke('send-gift-email', {
          body: { giftId: gift.id, type: 'event' }
        });

        processedGifts.push(gift);
        
      } else if (item.item_type === 'gift_card') {
        // Create gift card record
        const giftCardCode = await generateUniqueCode('GC-');
        
        const { data: giftCard, error: giftCardError } = await supabase
          .from('gift_cards')
          .insert({
            order_id: orderId,
            gift_card_code: giftCardCode,
            amount: metadata.amount,
            currency: 'USD',
            sender_name: metadata.senderName,
            sender_email: senderEmail,
            recipient_name: metadata.recipientName,
            recipient_email: metadata.recipientEmail,
            personal_message: metadata.personalMessage
          })
          .select()
          .single();

        if (giftCardError) throw giftCardError;

        // Send gift card email
        await supabase.functions.invoke('send-gift-card-email', {
          body: { giftCardId: giftCard.id }
        });

        processedGiftCards.push(giftCard);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      gifts: processedGifts,
      giftCards: processedGiftCards
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error processing gifts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

async function generateUniqueCode(prefix: string): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}-${random}`.toUpperCase();
}

serve(handler);
