
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

interface TicketData {
  ticketHolderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  qrData: string;
  ticketType: string;
  orderNumber: string;
  eventDescription?: string;
  eventImageUrl?: string;
}

const generateTicketHTML = (data: TicketData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Ticket - ${data.eventTitle}</title>
      <style>
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ticket {
          background: white;
          width: 600px;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border: 3px solid #e9ecef;
        }
        .ticket-header {
          background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        .ticket-header::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
          border-top: 25px solid #a855f7;
        }
        .event-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .ticket-type {
          font-size: 16px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 300;
        }
        .ticket-body {
          padding: 50px 40px;
        }
        .holder-name {
          font-size: 36px;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #f97316;
          padding-bottom: 20px;
        }
        .event-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }
        .detail-item {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border-left: 6px solid #f97316;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .detail-label {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .detail-value {
          font-size: 20px;
          color: #2c3e50;
          font-weight: bold;
        }
        .qr-section {
          text-align: center;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 30px;
          border-radius: 15px;
          margin-top: 30px;
          box-shadow: inset 0 4px 8px rgba(0,0,0,0.1);
        }
        .qr-code {
          width: 180px;
          height: 180px;
          margin: 0 auto 20px auto;
          border: 3px solid #f97316;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          font-size: 14px;
          color: #7f8c8d;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .ticket-code {
          font-family: 'Courier New', monospace;
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          background: white;
          padding: 15px 30px;
          border-radius: 8px;
          border: 3px solid #f97316;
          display: inline-block;
          margin-top: 15px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .order-info {
          margin-top: 30px;
          padding: 20px;
          background: #fff3cd;
          border: 2px solid #ffeaa7;
          border-radius: 8px;
          text-align: center;
        }
        .order-number {
          font-size: 14px;
          color: #856404;
          font-weight: bold;
        }
        .instructions {
          margin-top: 25px;
          padding: 20px;
          background: #d1ecf1;
          border: 2px solid #bee5eb;
          border-radius: 8px;
          font-size: 14px;
          color: #0c5460;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <div class="event-title">${data.eventTitle}</div>
          <div class="ticket-type">${data.ticketType} Ticket</div>
        </div>
        
        <div class="ticket-body">
          <div class="holder-name">${data.ticketHolderName}</div>
          
          <div class="event-details">
            <div class="detail-item">
              <div class="detail-label">Date</div>
              <div class="detail-value">${data.eventDate}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Time</div>
              <div class="detail-value">${data.eventTime}</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
              <div class="detail-label">Location</div>
              <div class="detail-value">${data.eventLocation}</div>
            </div>
          </div>
          
          <div class="qr-section">
            <div class="detail-label">Scan for Entry</div>
            <div class="qr-code">
              QR Code: ${data.ticketCode}
            </div>
            <div class="ticket-code">${data.ticketCode}</div>
          </div>
          
          <div class="order-info">
            <div class="order-number">Order #${data.orderNumber}</div>
          </div>
          
          <div class="instructions">
            <strong>Important Instructions:</strong><br/>
            • Please arrive 30 minutes before the event starts<br/>
            • Present this ticket (digital or printed) at the entrance<br/>
            • Keep your ticket safe as it cannot be replaced if lost<br/>
            • Contact support if you have any questions
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    console.log("Generating tickets for order:", orderId);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Get order items for event tickets
    const { data: orderItems, error: orderItemsError } = await supabaseClient
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("item_type", "event_ticket");

    if (orderItemsError) {
      throw new Error("Failed to fetch order items");
    }

    if (!orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No event tickets in this order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generatedTickets = [];

    // Process each order item
    for (const item of orderItems) {
      console.log("Processing order item:", item.id);

      // Get event ticket and event details
      const { data: eventTicket, error: ticketError } = await supabaseClient
        .from("event_tickets")
        .select(`
          *,
          event:events (*)
        `)
        .eq("id", item.item_id)
        .single();

      if (ticketError || !eventTicket) {
        console.error("Event ticket not found:", item.item_id);
        continue;
      }

      // Get or create event booking
      let { data: booking, error: bookingError } = await supabaseClient
        .from("event_bookings")
        .select("*")
        .eq("order_id", orderId)
        .eq("event_ticket_id", item.item_id)
        .single();

      if (bookingError || !booking) {
        // Create booking if it doesn't exist
        const { data: newBooking, error: createBookingError } = await supabaseClient
          .from("event_bookings")
          .insert({
            user_id: order.user_id,
            event_id: eventTicket.event.id,
            event_ticket_id: item.item_id,
            status: "confirmed",
            payment_status: "completed",
            payment_amount: item.total_price,
            payment_currency: "USD",
            ticket_quantity: item.quantity,
            order_id: orderId,
            booking_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (createBookingError) {
          console.error("Error creating booking:", createBookingError);
          continue;
        }
        booking = newBooking;
      }

      // Get ticket holder names from metadata or use defaults
      let ticketHolderNames: string[] = [];
      if (item.metadata && item.metadata.ticket_holder_names) {
        ticketHolderNames = item.metadata.ticket_holder_names.map((holder: any) => holder.name || "Guest");
      } else {
        // Generate default names
        for (let i = 0; i < item.quantity; i++) {
          ticketHolderNames.push(`Ticket Holder ${i + 1}`);
        }
      }

      // Generate tickets for each quantity
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        const holderName = ticketHolderNames[i] || `Ticket Holder ${i + 1}`;

        const qrData = JSON.stringify({
          ticketCode,
          orderId: order.id,
          eventId: eventTicket.event.id,
          holderName,
          generatedAt: new Date().toISOString(),
        });

        // Generate ticket data
        const ticketData: TicketData = {
          ticketHolderName: holderName,
          eventTitle: eventTicket.event.title,
          eventDate: new Date(eventTicket.event.start_time).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          eventTime: new Date(eventTicket.event.start_time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          eventLocation: eventTicket.event.location || "TBA",
          ticketCode,
          qrData,
          ticketType: eventTicket.name,
          orderNumber: order.id.slice(-8).toUpperCase(),
          eventDescription: eventTicket.event.description,
          eventImageUrl: eventTicket.event.image_url,
        };

        const ticketHTML = generateTicketHTML(ticketData);

        // Save or update ticket record in generated_tickets
        const { data: existingTicket } = await supabaseClient
          .from("generated_tickets")
          .select("*")
          .eq("order_id", order.id)
          .eq("event_ticket_id", item.item_id)
          .eq("ticket_holder_name", holderName)
          .single();

        let generatedTicket;
        if (existingTicket) {
          // Update existing ticket
          const { data: updatedTicket, error: updateError } = await supabaseClient
            .from("generated_tickets")
            .update({
              ticket_code: ticketCode,
              qr_code_data: qrData,
              ticket_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingTicket.id)
            .select()
            .single();

          if (updateError) {
            console.error("Failed to update ticket record:", updateError);
            continue;
          }
          generatedTicket = updatedTicket;
        } else {
          // Create new ticket record
          const { data: newTicket, error: ticketSaveError } = await supabaseClient
            .from("generated_tickets")
            .insert({
              order_id: order.id,
              booking_id: booking.id,
              event_id: eventTicket.event.id,
              event_ticket_id: eventTicket.id,
              ticket_holder_name: holderName,
              ticket_code: ticketCode,
              qr_code_data: qrData,
              ticket_status: "active",
            })
            .select()
            .single();

          if (ticketSaveError) {
            console.error("Failed to save ticket record:", ticketSaveError);
            continue;
          }
          generatedTicket = newTicket;
        }

        generatedTickets.push({
          ...generatedTicket,
          html_content: ticketHTML,
        });
      }

      // Update ticket quantity sold
      await supabaseClient
        .from("event_tickets")
        .update({
          quantity_sold: supabaseClient.sql`quantity_sold + ${item.quantity}`,
        })
        .eq("id", item.item_id);
    }

    console.log(`Generated ${generatedTickets.length} tickets`);

    return new Response(
      JSON.stringify({
        success: true,
        generatedTickets: generatedTickets.length,
        tickets: generatedTickets,
        message: `Successfully generated ${generatedTickets.length} tickets`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating tickets:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
