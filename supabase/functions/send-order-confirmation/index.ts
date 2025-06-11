
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderId: string;
}

const generateEmailHTML = (orderData: any, tickets: any[], receiptUrl: string) => {
  const hasTickets = tickets && tickets.length > 0;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
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
          font-size: 16px;
        }
        .content {
          padding: 30px;
        }
        .order-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .order-info h2 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 600;
          color: #4a5568;
        }
        .info-value {
          color: #2d3748;
        }
        .items-section {
          margin-bottom: 30px;
        }
        .items-section h3 {
          color: #2d3748;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .item {
          background: #f7fafc;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 10px;
          border-left: 4px solid #667eea;
        }
        .item-name {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 5px;
        }
        .item-details {
          font-size: 14px;
          color: #4a5568;
        }
        .tickets-section {
          background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid #9ae6b4;
        }
        .tickets-section h3 {
          color: #22543d;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .ticket-item {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 10px;
          border-left: 4px solid #48bb78;
        }
        .ticket-code {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #22543d;
          background: #f0fff4;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
        }
        .download-section {
          background: #fff5f5;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid #feb2b2;
        }
        .download-section h3 {
          color: #742a2a;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .download-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          margin: 5px 10px 5px 0;
          transition: transform 0.2s;
        }
        .download-button:hover {
          transform: translateY(-1px);
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }
        .total {
          font-size: 20px;
          font-weight: bold;
          color: #2d3748;
          text-align: right;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <p>Thank you for your purchase</p>
        </div>
        
        <div class="content">
          <div class="order-info">
            <h2>Order Details</h2>
            <div class="info-row">
              <span class="info-label">Order Number:</span>
              <span class="info-value">#${orderData.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span class="info-value">${new Date(orderData.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Status:</span>
              <span class="info-value" style="color: #48bb78; font-weight: bold;">${orderData.payment_status.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${orderData.payment_method}</span>
            </div>
            <div class="total">
              Total: ${orderData.currency} ${parseFloat(orderData.total_amount).toFixed(2)}
            </div>
          </div>
          
          <div class="items-section">
            <h3>Items Purchased</h3>
            ${orderData.order_items.map((item: any) => `
              <div class="item">
                <div class="item-name">${item.item_name}</div>
                <div class="item-details">
                  ${item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'} • 
                  Quantity: ${item.quantity} • 
                  ${orderData.currency} ${parseFloat(item.total_price).toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>
          
          ${hasTickets ? `
            <div class="tickets-section">
              <h3>🎫 Your Event Tickets</h3>
              <p>Your tickets have been generated and are ready for download:</p>
              ${tickets.map((ticket: any) => `
                <div class="ticket-item">
                  <div><strong>${ticket.ticket_holder_name}</strong></div>
                  <div>Ticket Code: <span class="ticket-code">${ticket.ticket_code}</span></div>
                  <div style="margin-top: 10px;">
                    <a href="${ticket.pdf_url}" class="download-button">Download Ticket</a>
                  </div>
                </div>
              `).join('')}
              <p style="margin-top: 15px; font-size: 14px; color: #4a5568;">
                💡 <strong>Tip:</strong> Save these tickets to your phone or print them. You'll need to present them at the event entrance.
              </p>
            </div>
          ` : ''}
          
          <div class="download-section">
            <h3>📄 Download Your Receipt</h3>
            <p>Keep this receipt for your records:</p>
            <a href="${receiptUrl}" class="download-button">Download Receipt</a>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #edf2f7; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #2d3748;">What's Next?</h3>
            <ul style="color: #4a5568; padding-left: 20px;">
              ${hasTickets ? '<li>Download and save your event tickets</li>' : ''}
              <li>Check your account dashboard for access to purchased courses</li>
              <li>Download your receipt for tax records</li>
              <li>Contact support if you have any questions</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing our platform!</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
            This email was sent to ${orderData.email}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId }: OrderConfirmationRequest = await req.json();

    // Get order details with items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*),
        profiles:user_id (full_name, username)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get generated tickets for this order
    const { data: tickets } = await supabaseClient
      .from('generated_tickets')
      .select('*')
      .eq('order_id', orderId);

    const customerName = order.profiles?.full_name || order.profiles?.username || 'Customer';
    const receiptUrl = order.receipt_url || '';

    const emailHTML = generateEmailHTML(order, tickets || [], receiptUrl);

    const emailResponse = await resend.emails.send({
      from: "Orders <orders@resend.dev>",
      to: [order.email],
      subject: `Order Confirmation #${order.id.slice(-8).toUpperCase()} - Thank you for your purchase!`,
      html: emailHTML,
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: "Order confirmation email sent successfully" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
