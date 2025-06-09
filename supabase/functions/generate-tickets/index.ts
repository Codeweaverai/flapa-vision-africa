
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketData {
  ticketHolderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  qrData: string;
  ticketType: string;
}

const generateTicketHTML = (data: TicketData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: #f8f9fa;
        }
        .ticket {
          background: white;
          width: 600px;
          margin: 0 auto;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 2px solid #e9ecef;
        }
        .ticket-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          position: relative;
        }
        .ticket-header::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-top: 20px solid #764ba2;
        }
        .event-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .ticket-type {
          font-size: 14px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .ticket-body {
          padding: 40px 30px;
        }
        .holder-name {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3498db;
          padding-bottom: 15px;
        }
        .event-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .detail-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }
        .detail-label {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 16px;
          color: #2c3e50;
          font-weight: bold;
        }
        .qr-section {
          text-align: center;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
        }
        .qr-code {
          width: 150px;
          height: 150px;
          margin: 0 auto 15px auto;
          border: 2px solid #3498db;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          font-size: 12px;
          color: #7f8c8d;
        }
        .ticket-code {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          background: white;
          padding: 10px 20px;
          border-radius: 5px;
          border: 2px solid #3498db;
          display: inline-block;
          margin-top: 10px;
        }
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          font-size: 12px;
          color: #856404;
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
          
          <div class="instructions">
            <strong>Important:</strong> Please arrive 30 minutes before the event starts. 
            Present this ticket (digital or printed) at the entrance. 
            Keep your ticket safe as it cannot be replaced if lost.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, sessionId } = await req.json()

    // Get order details and associated bookings
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Get ticket holder names from cart if available
    const { data: cartItems } = await supabaseClient
      .from('carts')
      .select('ticket_holder_names')
      .eq('user_id', order.user_id)

    let ticketHolderNames: string[] = []
    if (cartItems && cartItems[0]?.ticket_holder_names) {
      ticketHolderNames = cartItems[0].ticket_holder_names
    }

    const generatedTickets = []

    // Process each order item (for events)
    for (const item of order.order_items) {
      if (item.item_type === 'event_ticket') {
        // Get event and ticket details
        const { data: eventTicket, error: ticketError } = await supabaseClient
          .from('event_tickets')
          .select(`
            *,
            event:events(*)
          `)
          .eq('id', item.item_id)
          .single()

        if (ticketError || !eventTicket) {
          console.error('Event ticket not found:', item.item_id)
          continue
        }

        // Get the booking for this order item
        const { data: booking } = await supabaseClient
          .from('event_bookings')
          .select('*')
          .eq('order_id', orderId)
          .eq('event_ticket_id', item.item_id)
          .single()

        if (!booking) {
          console.error('Booking not found for order item:', item.id)
          continue
        }

        // Generate tickets for each quantity
        for (let i = 0; i < item.quantity; i++) {
          const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          const holderName = ticketHolderNames[i] || `Ticket Holder ${i + 1}`
          
          const qrData = JSON.stringify({
            ticketCode,
            bookingId: booking.id,
            eventId: eventTicket.event.id,
            holderName,
            generatedAt: new Date().toISOString()
          })

          // Generate ticket HTML
          const ticketData: TicketData = {
            ticketHolderName: holderName,
            eventTitle: eventTicket.event.title,
            eventDate: new Date(eventTicket.event.start_time).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            eventTime: new Date(eventTicket.event.start_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            eventLocation: eventTicket.event.location || 'TBA',
            ticketCode,
            qrData,
            ticketType: eventTicket.name
          }

          const ticketHTML = generateTicketHTML(ticketData)
          
          // Upload ticket to storage
          const ticketFileName = `tickets/${booking.id}_${ticketCode}.pdf`
          
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('tickets')
            .upload(ticketFileName, new Blob([ticketHTML], { type: 'text/html' }), {
              contentType: 'application/pdf',
              upsert: true
            })

          if (uploadError) {
            console.error('Failed to upload ticket:', uploadError)
            continue
          }

          // Get signed URL
          const { data: urlData } = supabaseClient.storage
            .from('tickets')
            .getPublicUrl(ticketFileName)

          const ticketUrl = urlData.publicUrl

          // Save ticket record
          const { data: generatedTicket, error: ticketSaveError } = await supabaseClient
            .from('generated_tickets')
            .insert({
              booking_id: booking.id,
              ticket_holder_name: holderName,
              ticket_code: ticketCode,
              qr_code_data: qrData,
              pdf_url: ticketUrl,
              pdf_storage_path: ticketFileName,
              ticket_status: 'active'
            })
            .select()
            .single()

          if (ticketSaveError) {
            console.error('Failed to save ticket record:', ticketSaveError)
            continue
          }

          generatedTickets.push(generatedTicket)
        }
      }
    }

    // Clear cart for this user
    await supabaseClient
      .from('carts')
      .delete()
      .eq('user_id', order.user_id)

    return new Response(
      JSON.stringify({
        success: true,
        generatedTickets: generatedTickets.length,
        message: `Successfully generated ${generatedTickets.length} tickets`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating tickets:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
