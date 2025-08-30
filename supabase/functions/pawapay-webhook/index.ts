
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhook = await req.json();
    console.log('PawaPay webhook received:', webhook);

    const { depositId, status } = webhook;

    if (status === 'COMPLETED') {
      // Find the order by PawaPay deposit ID
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('pawapay_deposit_id', depositId)
        .single();

      if (order) {
        // Update order status
        await supabase
          .from('orders')
          .update({ payment_status: 'completed' })
          .eq('id', order.id);

        // Process gifts
        try {
          await supabase.functions.invoke('process-gifts', {
            body: { orderId: order.id }
          });
        } catch (error) {
          console.error('Error processing gifts:', error);
        }

        // Process regular enrollments/bookings
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (orderItems) {
          for (const item of orderItems) {
            if (item.item_type === 'course') {
              await supabase
                .from('course_enrollments')
                .insert({
                  user_id: order.user_id,
                  course_id: item.item_id,
                  payment_status: 'completed',
                  order_id: order.id
                });
            } else if (item.item_type === 'event_ticket') {
              const { data: ticket } = await supabase
                .from('event_tickets')
                .select('event_id')
                .eq('id', item.item_id)
                .single();

              if (ticket) {
                await supabase
                  .from('event_bookings')
                  .insert({
                    user_id: order.user_id,
                    event_id: ticket.event_id,
                    event_ticket_id: item.item_id,
                    status: 'confirmed',
                    payment_status: 'completed',
                    ticket_quantity: item.quantity,
                    order_id: order.id,
                    booking_code: `BK-${Date.now().toString(36).toUpperCase()}`
                  });
              }
            }
          }
        }
      }
    } else if (status === 'FAILED') {
      // Update order to failed status
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('pawapay_deposit_id', depositId)
        .single();

      if (order) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('PawaPay webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
