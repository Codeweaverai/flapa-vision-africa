
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
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Generating tickets for order:", orderId);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get order items that are event tickets
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('item_type', 'event_ticket');

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    if (!orderItems || orderItems.length === 0) {
      console.log("No event tickets found in this order");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No event tickets to generate" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ticketsGenerated = 0;

    // Process each event ticket item
    for (const item of orderItems) {
      console.log("Processing event ticket item:", item.item_id);

      // Get event details
      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', item.item_id)
        .single();

      if (eventError || !event) {
        console.error("Event not found for item:", item.item_id, eventError);
        continue;
      }

      // Create or update event booking
      const { data: booking, error: bookingError } = await supabaseClient
        .from('event_bookings')
        .upsert({
          user_id: order.user_id,
          event_id: event.id,
          status: 'confirmed',
          payment_status: 'completed',
          payment_amount: item.total_price,
          payment_currency: order.currency || 'USD',
          ticket_quantity: item.quantity,
          order_id: orderId,
          booking_date: new Date().toISOString()
        }, { 
          onConflict: 'user_id,event_id,order_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Failed to create booking:", bookingError);
        continue;
      }

      console.log("Created booking:", booking.id);

      // Generate tickets for this booking
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        
        const qrData = JSON.stringify({
          ticket_code: ticketCode,
          booking_id: booking.id,
          event_id: event.id,
          order_id: orderId,
          generated_at: new Date().toISOString()
        });

        // Create ticket record
        const { data: ticket, error: ticketError } = await supabaseClient
          .from('generated_tickets')
          .insert({
            booking_id: booking.id,
            order_id: orderId,
            event_id: event.id,
            user_id: order.user_id,
            ticket_holder_name: `Ticket Holder ${i + 1}`,
            ticket_code: ticketCode,
            qr_code_data: qrData,
            ticket_status: 'active',
            generated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (ticketError) {
          console.error("Failed to create ticket:", ticketError);
          continue;
        }

        console.log("Generated ticket:", ticket.id);
        ticketsGenerated++;
      }
    }

    // Generate receipt (simple HTML-based receipt)
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-details { margin-bottom: 20px; }
          .items { width: 100%; border-collapse: collapse; }
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SkillPulse Receipt</h1>
          <p>Order ID: ${order.id}</p>
          <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        
        <div class="order-details">
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Payment Method:</strong> ${order.payment_method}</p>
          <p><strong>Status:</strong> ${order.payment_status}</p>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map(item => `
              <tr>
                <td>${item.item_name}</td>
                <td>${item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price} ${order.currency}</td>
                <td>${item.total_price} ${order.currency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          <p>Total: ${order.total_amount} ${order.currency}</p>
        </div>
      </body>
      </html>
    `;

    // Store receipt as base64 encoded HTML
    const receiptBase64 = btoa(receiptHtml);
    const receiptUrl = `data:text/html;base64,${receiptBase64}`;

    // Update order with receipt URL
    await supabaseClient
      .from('orders')
      .update({
        receipt_url: receiptUrl,
        receipt_generated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    console.log(`Successfully generated ${ticketsGenerated} tickets for order ${orderId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      ticketsGenerated,
      receiptGenerated: true,
      message: `Generated ${ticketsGenerated} tickets and receipt`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating tickets:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
