
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const generateTicketCode = (): string => {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
};

const generateReceiptHTML = (order: any, profile: any, items: any[]): string => {
  const customerName = profile?.full_name || profile?.username || 'Customer';
  const orderNumber = order.id.slice(-8).toUpperCase();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-block h3 { margin: 0 0 10px 0; color: #2d3748; font-size: 16px; border-bottom: 2px solid #f97316; padding-bottom: 5px; }
        .info-block p { margin: 3px 0; color: #4a5568; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #f7fafc; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .total-row { font-weight: bold; background: #f7fafc; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px; text-align: center; color: #6b7280; }
        .status-badge { background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>SkillPulse Receipt</h1>
          <p>Order #${orderNumber}</p>
        </div>
        <div class="content">
          <div class="info-section">
            <div class="info-block">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${order.email}</p>
              <p><strong>Order ID:</strong> ${orderNumber}</p>
            </div>
            <div class="info-block">
              <h3>Payment Details</h3>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge">${order.payment_status.toUpperCase()}</span></p>
              <p><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
            </div>
          </div>
          <h3>Items Purchased</h3>
          <table class="items-table">
            <thead>
              <tr><th>Item</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td><strong>${item.item_name}</strong></td>
                  <td>${item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'}</td>
                  <td>${item.quantity}</td>
                  <td>${order.currency} ${item.unit_price.toFixed(2)}</td>
                  <td><strong>${order.currency} ${item.total_price.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4"><strong>Total Amount:</strong></td>
                <td><strong>${order.currency} ${order.total_amount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateEventTicketHTML = (ticketData: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Ticket - ${ticketData.eventTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
        .ticket { background: white; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 2px solid #e5e7eb; }
        .ticket-header { background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; }
        .event-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .ticket-type { font-size: 16px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px; }
        .ticket-body { padding: 30px; }
        .holder-name { font-size: 24px; font-weight: bold; color: #1f2937; text-align: center; margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #f97316; }
        .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .detail-item { text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
        .detail-item.full-width { grid-column: 1 / -1; }
        .detail-label { font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .detail-value { font-size: 16px; color: #1f2937; font-weight: bold; }
        .qr-section { text-align: center; background: #f9fafb; padding: 25px; border-radius: 12px; margin-top: 25px; border: 1px solid #e5e7eb; }
        .qr-code { width: 120px; height: 120px; margin: 0 auto 15px auto; border: 2px solid #f97316; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: white; font-size: 12px; color: #6b7280; font-weight: bold; }
        .ticket-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #1f2937; background: white; padding: 10px 15px; border-radius: 6px; border: 2px solid #f97316; display: inline-block; margin-top: 10px; }
        .instructions { margin-top: 20px; padding: 15px; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px; font-size: 14px; color: #1e40af; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <div class="event-title">${ticketData.eventTitle}</div>
          <div class="ticket-type">${ticketData.ticketType} Ticket</div>
        </div>
        <div class="ticket-body">
          <div class="holder-name">🎫 ${ticketData.ticketHolderName}</div>
          <div class="event-details">
            <div class="detail-item">
              <div class="detail-label">Event Date</div>
              <div class="detail-value">${ticketData.eventDate}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Start Time</div>
              <div class="detail-value">${ticketData.eventTime}</div>
            </div>
            <div class="detail-item full-width">
              <div class="detail-label">Event Location</div>
              <div class="detail-value">${ticketData.eventLocation}</div>
            </div>
          </div>
          <div class="qr-section">
            <div class="detail-label">Scan for Entry</div>
            <div class="qr-code">QR: ${ticketData.ticketCode}</div>
            <div class="ticket-code">${ticketData.ticketCode}</div>
          </div>
          <div class="instructions">
            <strong>Instructions:</strong><br/>
            • Please arrive 30 minutes before the event<br/>
            • Present this ticket at the entrance<br/>
            • Keep this ticket safe - it cannot be replaced<br/>
            • Contact support@skillpulse.cloud for questions
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
    const { orderId } = await req.json()
    console.log('Generating tickets and receipt for order:', orderId)

    // Get order details with user information
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        profiles:user_id (full_name, username)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Get order items
    const { data: orderItems, error: orderItemsError } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (orderItemsError) {
      throw new Error('Failed to fetch order items')
    }

    const customerName = order.profiles?.full_name || order.profiles?.username || 'Customer'
    
    // Generate and store receipt
    const receiptHTML = generateReceiptHTML(order, order.profiles, orderItems)
    
    const { error: receiptUpdateError } = await supabaseClient
      .from('orders')
      .update({ 
        receipt_url: `data:text/html;base64,${btoa(receiptHTML)}`,
        receipt_generated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (receiptUpdateError) {
      console.error('Failed to update receipt:', receiptUpdateError)
    }

    // Process event tickets
    const eventItems = orderItems.filter(item => item.item_type === 'event_ticket')
    const generatedTickets = []

    for (const item of eventItems) {
      // Get event ticket details
      const { data: eventTicket, error: ticketError } = await supabaseClient
        .from('event_tickets')
        .select(`
          *,
          events (*)
        `)
        .eq('id', item.item_id)
        .single()

      if (ticketError || !eventTicket) {
        console.error('Event ticket not found for item:', item.item_id)
        continue
      }

      const event = eventTicket.events

      // Create event booking if it doesn't exist
      let { data: booking, error: bookingError } = await supabaseClient
        .from('event_bookings')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('event_id', event.id)
        .eq('order_id', orderId)
        .single()

      if (!booking) {
        const { data: newBooking, error: newBookingError } = await supabaseClient
          .from('event_bookings')
          .insert({
            user_id: order.user_id,
            event_id: event.id,
            event_ticket_id: eventTicket.id,
            status: 'confirmed',
            payment_status: 'completed',
            payment_amount: item.total_price,
            payment_currency: order.currency,
            ticket_quantity: item.quantity,
            order_id: orderId,
            booking_date: new Date().toISOString()
          })
          .select()
          .single()

        if (newBookingError) {
          console.error('Failed to create booking:', newBookingError)
          continue
        }
        booking = newBooking
      }

      // Generate tickets for each quantity
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = generateTicketCode()
        const holderName = customerName
        
        const qrData = JSON.stringify({
          ticketCode,
          orderId: order.id,
          eventId: event.id,
          holderName,
          generatedAt: new Date().toISOString()
        })

        const ticketData = {
          ticketHolderName: holderName,
          eventTitle: event.title,
          eventDate: new Date(event.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          eventTime: new Date(event.start_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          eventLocation: event.location || 'Online Event',
          ticketCode,
          ticketType: eventTicket.name
        }

        const ticketHTML = generateEventTicketHTML(ticketData)

        // Save generated ticket
        const { data: generatedTicket, error: ticketSaveError } = await supabaseClient
          .from('generated_tickets')
          .insert({
            booking_id: booking.id,
            order_id: order.id,
            event_id: event.id,
            event_ticket_id: eventTicket.id,
            user_id: order.user_id,
            ticket_code: ticketCode,
            ticket_holder_name: holderName,
            ticket_holder_email: order.email,
            qr_code_data: qrData,
            pdf_url: `data:text/html;base64,${btoa(ticketHTML)}`,
            ticket_status: 'active',
            generated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (ticketSaveError) {
          console.error('Failed to save ticket:', ticketSaveError)
          continue
        }

        generatedTickets.push(generatedTicket)
      }
    }

    // Process course enrollments
    const courseItems = orderItems.filter(item => item.item_type === 'course')
    for (const item of courseItems) {
      await supabaseClient
        .from('course_enrollments')
        .upsert({
          user_id: order.user_id,
          course_id: item.item_id,
          payment_status: 'completed',
          order_id: orderId,
          enrollment_date: new Date().toISOString()
        })
    }

    console.log(`Successfully generated ${generatedTickets.length} tickets and receipt for order ${orderId}`)

    return new Response(
      JSON.stringify({
        success: true,
        generatedTickets: generatedTickets.length,
        tickets: generatedTickets,
        receiptGenerated: true,
        message: `Generated ${generatedTickets.length} tickets and receipt`
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
