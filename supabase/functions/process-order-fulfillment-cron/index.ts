
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

interface OrderData {
  id: string;
  user_id: string;
  email: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
  receipt_url?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  metadata?: any;
}

interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
}

const generateReceiptHTML = (order: OrderData, profile: UserProfile, items: OrderItem[]): string => {
  const customerName = profile.full_name || profile.username || 'Customer';
  const orderNumber = order.id.slice(-8).toUpperCase();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${orderNumber}</title>
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
          background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
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
          border-top: 2px solid #f97316;
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
          <p>Order #${orderNumber}</p>
        </div>
        
        <div class="content">
          <div class="info-section">
            <div class="info-block">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${order.email}</p>
            </div>
            
            <div class="info-block">
              <h3>Order Details</h3>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge">${order.payment_status.toUpperCase()}</span></p>
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
              ${items.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'}</td>
                  <td>${item.quantity}</td>
                  <td>${order.currency} ${item.unit_price.toFixed(2)}</td>
                  <td>${order.currency} ${item.total_price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <table>
              <tr class="total-row">
                <td>Total:</td>
                <td>${order.currency} ${order.total_amount.toFixed(2)}</td>
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

const generateTicketHTML = (ticketData: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Ticket - ${ticketData.eventTitle}</title>
      <style>
        @page { size: A4; margin: 20px; }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
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
          border-bottom: 3px solid #f97316;
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
          border-left: 4px solid #f97316;
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
          border: 2px solid #f97316;
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
          border: 2px solid #f97316;
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
          <div class="event-title">${ticketData.eventTitle}</div>
          <div class="ticket-type">${ticketData.ticketType} Ticket</div>
        </div>
        
        <div class="ticket-body">
          <div class="holder-name">${ticketData.ticketHolderName}</div>
          
          <div class="event-details">
            <div class="detail-item">
              <div class="detail-label">Date</div>
              <div class="detail-value">${ticketData.eventDate}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Time</div>
              <div class="detail-value">${ticketData.eventTime}</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
              <div class="detail-label">Location</div>
              <div class="detail-value">${ticketData.eventLocation}</div>
            </div>
          </div>
          
          <div class="qr-section">
            <div class="detail-label">Scan for Entry</div>
            <div class="qr-code">
              QR: ${ticketData.ticketCode}
            </div>
            <div class="ticket-code">${ticketData.ticketCode}</div>
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

const convertHtmlToPdf = async (html: string): Promise<Uint8Array> => {
  // For now, we'll use a simple HTML to PDF conversion
  // In production, you would use Puppeteer or similar
  const encoder = new TextEncoder();
  return encoder.encode(html);
};

const sendEmailWithResend = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
      return false;
    }

    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const generateTicketCode = (): string => {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting order fulfillment cron job...');
    
    let processedOrders = 0;
    let generatedTickets = 0;
    let sentEmails = 0;

    // Find orders that need processing
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        profiles:user_id (full_name, username)
      `)
      .eq('payment_status', 'completed')
      .is('receipt_url', null);

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`Found ${orders?.length || 0} orders to process`);

    for (const order of orders || []) {
      try {
        console.log(`Processing order: ${order.id}`);
        
        // Get order items
        const { data: orderItems, error: itemsError } = await supabaseClient
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) {
          console.error(`Failed to fetch order items for ${order.id}:`, itemsError);
          continue;
        }

        const profile = order.profiles || {};

        // Generate receipt
        const receiptHtml = generateReceiptHTML(order, profile, orderItems);
        const receiptPdf = await convertHtmlToPdf(receiptHtml);
        
        // Upload receipt to storage
        const receiptFileName = `${order.user_id}/receipt-${order.id}.pdf`;
        const { data: receiptUpload, error: receiptUploadError } = await supabaseClient.storage
          .from('receipts')
          .upload(receiptFileName, receiptPdf, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (receiptUploadError) {
          console.error('Failed to upload receipt:', receiptUploadError);
          continue;
        }

        // Get signed URL for receipt
        const { data: receiptSignedUrl } = await supabaseClient.storage
          .from('receipts')
          .createSignedUrl(receiptFileName, 86400); // 24 hours

        // Update order with receipt URL
        await supabaseClient
          .from('orders')
          .update({ receipt_url: receiptSignedUrl?.signedUrl })
          .eq('id', order.id);

        // Process event tickets
        const eventItems = orderItems.filter(item => item.item_type === 'event_ticket');
        const ticketUrls: string[] = [];

        for (const item of eventItems) {
          // Get event and ticket details
          const { data: eventTicket, error: ticketError } = await supabaseClient
            .from('event_tickets')
            .select(`
              *,
              events (*)
            `)
            .eq('id', item.item_id)
            .single();

          if (ticketError || !eventTicket) {
            console.error('Event ticket not found:', item.item_id);
            continue;
          }

          // Create event booking if it doesn't exist
          const { data: existingBooking } = await supabaseClient
            .from('event_bookings')
            .select('id')
            .eq('order_id', order.id)
            .eq('event_ticket_id', item.item_id)
            .single();

          let bookingId = existingBooking?.id;

          if (!bookingId) {
            const { data: newBooking, error: bookingError } = await supabaseClient
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
                order_id: order.id,
                booking_date: new Date().toISOString()
              })
              .select()
              .single();

            if (bookingError) {
              console.error('Failed to create booking:', bookingError);
              continue;
            }
            bookingId = newBooking.id;
          }

          // Generate tickets for each quantity
          for (let i = 0; i < item.quantity; i++) {
            const ticketCode = generateTicketCode();
            const holderName = profile.full_name || profile.username || `Ticket Holder ${i + 1}`;
            
            const ticketData = {
              ticketHolderName: holderName,
              eventTitle: eventTicket.events.title,
              eventDate: new Date(eventTicket.events.start_time).toLocaleDateString(),
              eventTime: new Date(eventTicket.events.start_time).toLocaleTimeString(),
              eventLocation: eventTicket.events.location || 'TBA',
              ticketCode,
              ticketType: eventTicket.name
            };

            const ticketHtml = generateTicketHTML(ticketData);
            const ticketPdf = await convertHtmlToPdf(ticketHtml);
            
            // Upload ticket to storage
            const ticketFileName = `${order.user_id}/ticket-${order.id}-${ticketCode}.pdf`;
            const { data: ticketUpload, error: ticketUploadError } = await supabaseClient.storage
              .from('tickets')
              .upload(ticketFileName, ticketPdf, {
                contentType: 'application/pdf',
                upsert: true
              });

            if (ticketUploadError) {
              console.error('Failed to upload ticket:', ticketUploadError);
              continue;
            }

            // Get signed URL for ticket
            const { data: ticketSignedUrl } = await supabaseClient.storage
              .from('tickets')
              .createSignedUrl(ticketFileName, 86400); // 24 hours

            if (ticketSignedUrl?.signedUrl) {
              ticketUrls.push(ticketSignedUrl.signedUrl);
            }

            // Save generated ticket record
            await supabaseClient
              .from('generated_tickets')
              .insert({
                booking_id: bookingId,
                order_id: order.id,
                event_id: eventTicket.events.id,
                event_ticket_id: eventTicket.id,
                user_id: order.user_id,
                ticket_code: ticketCode,
                ticket_holder_name: holderName,
                ticket_holder_email: order.email,
                qr_code_data: JSON.stringify({
                  ticketCode,
                  orderId: order.id,
                  eventId: eventTicket.events.id,
                  holderName,
                  generatedAt: new Date().toISOString()
                }),
                pdf_url: ticketSignedUrl.signedUrl,
                pdf_storage_path: ticketFileName,
                ticket_status: 'active',
                generated_at: new Date().toISOString()
              });

            generatedTickets++;
          }

          // Update ticket quantity sold
          await supabaseClient
            .from('event_tickets')
            .update({ 
              quantity_sold: supabaseClient.sql`quantity_sold + ${item.quantity}` 
            })
            .eq('id', item.item_id);
        }

        // Process course enrollments
        const courseItems = orderItems.filter(item => item.item_type === 'course');
        for (const item of courseItems) {
          const { data: existingEnrollment } = await supabaseClient
            .from('course_enrollments')
            .select('id')
            .eq('user_id', order.user_id)
            .eq('course_id', item.item_id)
            .eq('order_id', order.id)
            .single();

          if (!existingEnrollment) {
            await supabaseClient
              .from('course_enrollments')
              .insert({
                user_id: order.user_id,
                course_id: item.item_id,
                payment_status: 'completed',
                order_id: order.id,
                enrollment_date: new Date().toISOString()
              });
          }
        }

        // Send confirmation email
        const customerName = profile.full_name || profile.username || 'Customer';
        const orderNumber = order.id.slice(-8).toUpperCase();
        
        const emailHtml = `
          <h1>Thank you for your purchase!</h1>
          <p>Hi ${customerName},</p>
          <p>Your order #${orderNumber} has been confirmed and processed.</p>
          
          ${receiptSignedUrl?.signedUrl ? `
            <h3>📄 Your Receipt</h3>
            <p><a href="${receiptSignedUrl.signedUrl}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Receipt</a></p>
          ` : ''}
          
          ${ticketUrls.length > 0 ? `
            <h3>🎟️ Your Tickets</h3>
            <ul>
              ${ticketUrls.map((url, index) => `
                <li><a href="${url}" style="color: #f97316;">Download Ticket ${index + 1}</a></li>
              `).join('')}
            </ul>
          ` : ''}
          
          <p>Thank you for choosing us!</p>
          <p>Best regards,<br>Your Event Team</p>
        `;

        const emailSent = await sendEmailWithResend(
          order.email,
          `Your Tickets and Receipt for Order #${orderNumber}`,
          emailHtml
        );

        if (emailSent) {
          sentEmails++;
        }

        processedOrders++;
        console.log(`Successfully processed order: ${order.id}`);

      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
      }
    }

    console.log(`Cron job completed: ${processedOrders} orders processed, ${generatedTickets} tickets generated, ${sentEmails} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        processedOrders,
        generatedTickets,
        sentEmails,
        message: `Successfully processed ${processedOrders} orders`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in order fulfillment cron job:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
