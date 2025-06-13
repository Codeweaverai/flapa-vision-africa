
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketData {
  ticketHolderName: string;
  ticketHolderEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  qrData: string;
  ticketType: string;
  orderNumber: string;
  eventId: string;
}

interface ReceiptData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
}

const generateReceiptHTML = (data: ReceiptData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${data.orderNumber}</title>
      <style>
        @page { size: A4; margin: 20px; }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
        }
        .receipt {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .info-block h3 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 16px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .info-block p {
          margin: 5px 0;
          color: #4a5568;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th {
          background: #f7fafc;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
          font-weight: bold;
          color: #2d3748;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
        }
        .totals table {
          margin-left: auto;
          border-collapse: collapse;
        }
        .totals td {
          padding: 8px 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        .totals .total-row {
          font-weight: bold;
          font-size: 18px;
          background: #f7fafc;
          border-top: 2px solid #667eea;
        }
        .footer {
          margin-top: 40px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          background: #48bb78;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>Payment Receipt</h1>
          <p>Order #${data.orderNumber}</p>
        </div>
        
        <div class="content">
          <div class="info-section">
            <div class="info-block">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${data.customerName}</p>
              <p><strong>Email:</strong> ${data.customerEmail}</p>
            </div>
            
            <div class="info-block">
              <h3>Order Details</h3>
              <p><strong>Date:</strong> ${data.orderDate}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Status:</strong> <span class="status-badge">${data.paymentStatus.toUpperCase()}</span></p>
            </div>
          </div>
          
          <h3>Items Purchased</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.type === 'event_ticket' ? 'Event Ticket' : 'Course'}</td>
                  <td>${item.quantity}</td>
                  <td>${data.currency} ${item.unitPrice.toFixed(2)}</td>
                  <td>${data.currency} ${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>${data.currency} ${data.subtotal.toFixed(2)}</td>
              </tr>
              ${data.tax > 0 ? `
                <tr>
                  <td>Tax:</td>
                  <td>${data.currency} ${data.tax.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total:</td>
                <td>${data.currency} ${data.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>This receipt was generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateTicketHTML = (data: TicketData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Ticket - ${data.eventTitle}</title>
      <style>
        @page { size: A4; margin: 20px; }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
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
          padding: 40px;
        }
        .holder-name {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3498db;
          padding-bottom: 15px;
        }
        .event-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-bottom: 30px;
        }
        .detail-item {
          text-align: center;
          padding: 15px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 10px;
          border-left: 4px solid #3498db;
        }
        .detail-label {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        .detail-value {
          font-size: 16px;
          color: #2c3e50;
          font-weight: bold;
        }
        .qr-section {
          text-align: center;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 25px;
          border-radius: 15px;
          margin-top: 25px;
        }
        .qr-code {
          width: 150px;
          height: 150px;
          margin: 0 auto 15px auto;
          border: 2px solid #3498db;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          font-size: 12px;
          color: #7f8c8d;
          font-weight: bold;
        }
        .ticket-code {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: bold;
          color: #2c3e50;
          background: white;
          padding: 10px 20px;
          border-radius: 6px;
          border: 2px solid #3498db;
          display: inline-block;
          margin-top: 10px;
        }
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 6px;
          font-size: 12px;
          color: #0c5460;
          line-height: 1.5;
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
              QR: ${data.ticketCode}
            </div>
            <div class="ticket-code">${data.ticketCode}</div>
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    
    // Generate receipt
    const receiptData: ReceiptData = {
      orderNumber: order.id.slice(-8).toUpperCase(),
      customerName,
      customerEmail: order.email,
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: orderItems.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price),
        type: item.item_type
      })),
      subtotal: parseFloat(order.total_amount) - parseFloat(order.tax_amount || 0),
      tax: parseFloat(order.tax_amount || 0),
      total: parseFloat(order.total_amount),
      currency: order.currency,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status
    }

    const receiptHTML = generateReceiptHTML(receiptData)
    const receiptFileName = `${order.user_id}/receipt-${order.id}.html`
    
    // Upload receipt
    const { data: receiptUpload, error: receiptUploadError } = await supabaseClient.storage
      .from('receipts')
      .upload(receiptFileName, new Blob([receiptHTML], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      })

    if (receiptUploadError) {
      console.error('Failed to upload receipt:', receiptUploadError)
    } else {
      const { data: receiptUrlData } = supabaseClient.storage
        .from('receipts')
        .getPublicUrl(receiptFileName)

      // Update order with receipt URL
      await supabaseClient
        .from('orders')
        .update({ receipt_url: receiptUrlData.publicUrl })
        .eq('id', orderId)
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
        console.error('Event ticket not found:', item.item_id)
        continue
      }

      // Create event booking
      const { data: booking, error: bookingError } = await supabaseClient
        .from('event_bookings')
        .insert({
          user_id: order.user_id,
          event_id: eventTicket.events.id,
          event_ticket_id: item.item_id,
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

      // Get ticket holder names from metadata
      let ticketHolderNames: string[] = []
      if (item.metadata && item.metadata.ticket_holder_names) {
        ticketHolderNames = item.metadata.ticket_holder_names.map((holder: any) => holder.name || holder)
      } else {
        for (let i = 0; i < item.quantity; i++) {
          ticketHolderNames.push(customerName)
        }
      }

      // Generate tickets for each quantity
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        const holderName = ticketHolderNames[i] || customerName
        
        const qrData = JSON.stringify({
          ticketCode,
          orderId: order.id,
          eventId: eventTicket.events.id,
          holderName,
          generatedAt: new Date().toISOString()
        })

        const ticketData: TicketData = {
          ticketHolderName: holderName,
          ticketHolderEmail: order.email,
          eventTitle: eventTicket.events.title,
          eventDate: new Date(eventTicket.events.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          eventTime: new Date(eventTicket.events.start_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          eventLocation: eventTicket.events.location || 'TBA',
          ticketCode,
          qrData,
          ticketType: eventTicket.name,
          orderNumber: order.id.slice(-8).toUpperCase(),
          eventId: eventTicket.events.id
        }

        const ticketHTML = generateTicketHTML(ticketData)
        const ticketFileName = `${order.user_id}/ticket-${orderId}-${ticketCode}.html`
        
        // Upload ticket
        const { data: ticketUpload, error: ticketUploadError } = await supabaseClient.storage
          .from('tickets')
          .upload(ticketFileName, new Blob([ticketHTML], { type: 'text/html' }), {
            contentType: 'text/html',
            upsert: true
          })

        if (ticketUploadError) {
          console.error('Failed to upload ticket:', ticketUploadError)
          continue
        }

        const { data: ticketUrlData } = supabaseClient.storage
          .from('tickets')
          .getPublicUrl(ticketFileName)

        // Save generated ticket record
        const { data: generatedTicket, error: ticketSaveError } = await supabaseClient
          .from('generated_tickets')
          .insert({
            booking_id: booking.id,
            order_id: order.id,
            event_id: eventTicket.events.id,
            event_ticket_id: eventTicket.id,
            user_id: order.user_id,
            ticket_code: ticketCode,
            ticket_holder_name: holderName,
            ticket_holder_email: order.email,
            qr_code_data: qrData,
            pdf_url: ticketUrlData.publicUrl,
            pdf_storage_path: ticketFileName,
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

      // Update ticket quantity sold
      await supabaseClient
        .from('event_tickets')
        .update({ 
          quantity_sold: supabaseClient.sql`quantity_sold + ${item.quantity}` 
        })
        .eq('id', item.item_id)
    }

    // Process course enrollments
    const courseItems = orderItems.filter(item => item.item_type === 'course')
    for (const item of courseItems) {
      await supabaseClient
        .from('course_enrollments')
        .insert({
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
        receiptGenerated: !!receiptUpload,
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
