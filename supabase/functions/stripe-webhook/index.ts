
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Received Stripe event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const appliedGiftCard = session.metadata?.applied_gift_card;

      if (orderId) {
        // Update order payment status
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string
          })
          .eq('id', orderId);

        // Update applied gift card usage
        if (appliedGiftCard) {
          const { data: giftCard } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('gift_card_code', appliedGiftCard)
            .single();

          if (giftCard) {
            const discountAmount = parseFloat(session.metadata?.gift_card_discount || '0');
            await supabase
              .from('gift_cards')
              .update({ 
                used_amount: giftCard.used_amount + discountAmount,
                status: (giftCard.used_amount + discountAmount) >= giftCard.amount ? 'used' : 'active'
              })
              .eq('id', giftCard.id);
          }
        }

        // Process gifts (create gift cards and send emails)
        try {
          await supabase.functions.invoke('process-gifts', {
            body: { orderId }
          });
        } catch (error) {
          console.error('Error processing gifts:', error);
        }

        // Process regular enrollments/bookings
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (orderItems) {
          for (const item of orderItems) {
            if (item.item_type === 'course') {
              await supabase
                .from('course_enrollments')
                .insert({
                  user_id: session.metadata?.user_id,
                  course_id: item.item_id,
                  payment_status: 'completed',
                  order_id: orderId
                });
            } else if (item.item_type === 'event_ticket') {
              // Get event details
              const { data: ticket } = await supabase
                .from('event_tickets')
                .select('event_id')
                .eq('id', item.item_id)
                .single();

              if (ticket) {
                await supabase
                  .from('event_bookings')
                  .insert({
                    user_id: session.metadata?.user_id,
                    event_id: ticket.event_id,
                    event_ticket_id: item.item_id,
                    status: 'confirmed',
                    payment_status: 'completed',
                    ticket_quantity: item.quantity,
                    order_id: orderId,
                    booking_code: `BK-${Date.now().toString(36).toUpperCase()}`
                  });
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
