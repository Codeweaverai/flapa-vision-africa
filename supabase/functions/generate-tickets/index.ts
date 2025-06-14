
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
        @page { size: A4; margin: 20px; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; background: #f8f9fa; }
        .receipt { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; position: relative; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/></svg>') repeat; opacity: 0.3; }
        .header h1 { margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); position: relative; z-index: 1; }
        .header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; position: relative; z-index: 1; }
        .content { padding: 40px; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .info-block h3 { margin: 0 0 15px 0; color: #2d3748; font-size: 18px; border-bottom: 3px solid #f97316; padding-bottom: 8px; display: flex; align-items: center; }
        .info-block h3::before { content: '●'; color: #f97316; margin-right: 10px; }
        .info-block p { margin: 5px 0; color: #4a5568; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .items-table th { background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; padding: 15px; text-align: left; font-weight: bold; font-size: 16px; }
        .items-table td { padding: 15px; border-bottom: 1px solid #e2e8f0; background: #fafafa; }
        .items-table tr:last-child td { border-bottom: none; }
        .items-table tr:nth-child(even) td { background: #f7fafc; }
        .totals { text-align: right; margin-top: 30px; }
        .totals table { margin-left: auto; }
        .totals td { padding: 8px 15px; }
        .total-row { font-weight: bold; font-size: 20px; color: #2d3748; }
        .total-row td { background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; border-radius: 6px; }
        .footer { margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; text-align: center; color: #4a5568; font-size: 14px; border: 1px solid #e2e8f0; }
        .footer h4 { margin: 0 0 10px 0; color: #2d3748; font-size: 16px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 25px; font-size: 14px; font-weight: bold; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 4px rgba(72,187,120,0.3); }
        .receipt-number { font-family: 'Courier New', monospace; background: #f7fafc; padding: 10px; border-radius: 6px; font-weight: bold; color: #2d3748; border: 2px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>SkillPulse Payment Receipt</h1>
          <p>Order #${orderNumber}</p>
        </div>
        <div class="content">
          <div class="info-section">
            <div class="info-block">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${order.email}</p>
              <p><strong>Order ID:</strong> <span class="receipt-number">${orderNumber}</span></p>
            </div>
            <div class="info-block">
              <h3>Payment Details</h3>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${new Date(order.created_at).toLocaleTimeString('en-US')}</p>
              <p><strong>Status:</strong> <span class="status-badge">${order.payment_status}</span></p>
              <p><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
            </div>
          </div>
          <h3 style="color: #2d3748; border-bottom: 3px solid #f97316; padding-bottom: 8px; margin-bottom: 20px;">Items Purchased</h3>
          <table class="items-table">
            <thead>
              <tr><th>Item</th><th>Type</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td><strong>${item.item_name}</strong></td>
                  <td>${item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course Access'}</td>
                  <td>${item.quantity}</td>
                  <td>${order.currency} ${item.unit_price.toFixed(2)}</td>
                  <td><strong>${order.currency} ${item.total_price.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <table>
              <tr class="total-row">
                <td><strong>Total Amount:</strong></td>
                <td><strong>${order.currency} ${order.total_amount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          <div class="footer">
            <h4>Thank you for your purchase!</h4>
            <p>This receipt was generated on ${new Date().toLocaleString()}</p>
            <p>For support, contact us at support@skillpulse.cloud</p>
            <p style="margin-top: 15px; font-style: italic; color: #6b7280;">Keep this receipt for your records</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateTicketHTML = (ticketData: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Ticket - ${ticketData.eventTitle}</title>
      <style>
        @page { size: A4; margin: 20px; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .ticket { background: white; width: 650px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.3); border: 3px solid #e9ecef; position: relative; }
        .ticket::before { content: ''; position: absolute; top: 50%; left: -10px; width: 20px; height: 20px; background: #f97316; border-radius: 50%; }
        .ticket::after { content: ''; position: absolute; top: 50%; right: -10px; width: 20px; height: 20px; background: #f97316; border-radius: 50%; }
        .ticket-header { background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; padding: 40px; text-align: center; position: relative; }
        .ticket-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 60,35 85,35 65,55 75,80 50,65 25,80 35,55 15,35 40,35" fill="rgba(255,255,255,0.1)"/></svg>') repeat; opacity: 0.3; }
        .event-title { font-size: 36px; font-weight: bold; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); position: relative; z-index: 1; }
        .ticket-type { font-size: 18px; opacity: 0.9; text-transform: uppercase; letter-spacing: 3px; font-weight: 300; position: relative; z-index: 1; }
        .ticket-body { padding: 40px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); }
        .holder-name { font-size: 32px; font-weight: bold; color: #2c3e50; text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 15px; border-left: 6px solid #f97316; }
        .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px; }
        .detail-item { text-align: center; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border-radius: 15px; border: 2px solid #e9ecef; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .detail-item.full-width { grid-column: 1 / -1; }
        .detail-label { font-size: 14px; color: #7f8c8d; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
        .detail-value { font-size: 18px; color: #2c3e50; font-weight: bold; }
        .qr-section { text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 20px; margin-top: 30px; border: 2px solid #dee2e6; }
        .qr-code { width: 160px; height: 160px; margin: 0 auto 20px auto; border: 3px solid #f97316; border-radius: 15px; display: flex; align-items: center; justify-content: center; background: white; font-size: 14px; color: #7f8c8d; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .ticket-code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #2c3e50; background: white; padding: 15px 25px; border-radius: 10px; border: 3px solid #f97316; display: inline-block; margin-top: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .instructions { margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border: 2px solid #b6d7dd; border-radius: 10px; font-size: 14px; color: #0c5460; line-height: 1.6; }
        .instructions strong { color: #065d69; }
        .event-icon { width: 40px; height: 40px; margin: 0 auto 15px; background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
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
              <div class="event-icon">📅</div>
              <div class="detail-label">Event Date</div>
              <div class="detail-value">${ticketData.eventDate}</div>
            </div>
            <div class="detail-item">
              <div class="event-icon">⏰</div>
              <div class="detail-label">Start Time</div>
              <div class="detail-value">${ticketData.eventTime}</div>
            </div>
            <div class="detail-item full-width">
              <div class="event-icon">📍</div>
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
            <strong>🔔 Important Instructions:</strong><br/>
            • Please arrive 30 minutes before the event starts<br/>
            • Present this ticket (digital or printed) at the entrance<br/>
            • Keep your ticket safe as it cannot be replaced if lost<br/>
            • Contact support at support@skillpulse.cloud if you have any questions<br/>
            • This ticket is valid for one person only
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
    console.log('Processing order fulfillment for:', orderId)

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
    
    // Generate and upload receipt
    const receiptHTML = generateReceiptHTML(order, order.profiles, orderItems)
    const receiptFileName = `receipts/${order.user_id}/receipt-${order.id}.html`
    
    // For now, we'll store the receipt HTML directly in the database since storage buckets aren't set up
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
      // Find the event associated with this ticket
      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', item.item_id)
        .single()

      if (eventError || !event) {
        console.error('Event not found for item:', item.item_id)
        continue
      }

      // Create event booking if it doesn't exist
      const { data: existingBooking } = await supabaseClient
        .from('event_bookings')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('event_id', event.id)
        .eq('order_id', orderId)
        .single()

      let bookingId = existingBooking?.id

      if (!bookingId) {
        const { data: booking, error: bookingError } = await supabaseClient
          .from('event_bookings')
          .insert({
            user_id: order.user_id,
            event_id: event.id,
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

        if (bookingError) {
          console.error('Failed to create booking:', bookingError)
          continue
        }
        bookingId = booking.id
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
          ticketHolderEmail: order.email,
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
          qrData,
          ticketType: 'General Admission',
          orderNumber: order.id.slice(-8).toUpperCase(),
          eventId: event.id
        }

        const ticketHTML = generateTicketHTML(ticketData)

        // Save generated ticket record with HTML content
        const { data: generatedTicket, error: ticketSaveError } = await supabaseClient
          .from('generated_tickets')
          .insert({
            booking_id: bookingId,
            order_id: order.id,
            event_id: event.id,
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
          console.error('Failed to save ticket record:', ticketSaveError)
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

    console.log(`Order fulfillment completed: ${generatedTickets.length} tickets generated, receipt created`)

    return new Response(
      JSON.stringify({
        success: true,
        generatedTickets: generatedTickets.length,
        tickets: generatedTickets,
        receiptGenerated: true,
        message: `Successfully processed order with ${generatedTickets.length} tickets and receipt`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in order fulfillment:', error)
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
