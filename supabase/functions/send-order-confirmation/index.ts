
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { orderId } = await req.json();

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          courses:item_id (title),
          event_tickets:item_id (name, events:event_id (title, start_time))
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Here you would integrate with your email service (Resend, etc.)
    // For now, we'll just log the order confirmation
    console.log('Order confirmation email would be sent for order:', order);

    // Example email content structure:
    const emailContent = {
      to: order.email,
      subject: `Order Confirmation #${order.id.slice(-8)}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Order #${order.id.slice(-8)}</p>
        <p>Total: $${order.total_amount}</p>
        <h2>Items:</h2>
        <ul>
          ${order.order_items.map((item: any) => `
            <li>
              ${item.item_type === 'course' ? item.courses?.title : item.event_tickets?.name}
              - $${item.total_price}
              ${item.quantity > 1 ? ` (Qty: ${item.quantity})` : ''}
            </li>
          `).join('')}
        </ul>
        ${order.receipt_url ? `<p><a href="${order.receipt_url}">Download Receipt</a></p>` : ''}
      `
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order confirmation email queued',
        emailContent 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending order confirmation:', error);
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
