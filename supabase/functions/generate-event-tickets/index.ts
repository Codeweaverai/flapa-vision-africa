
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();

    console.log('Processing ticket generation for:', { ticketId });

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('generated_tickets')
      .select(`
        *,
        event_bookings!inner(
          user_id,
          events!inner(
            title,
            start_time,
            end_time,
            location,
            image_url
          )
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket not found:', ticketError);
      throw new Error('Ticket not found');
    }

    // Generate HTML ticket
    const ticketHTML = createTicketHTML(ticket);

    // Generate PDF using HTML data URL (placeholder for PDF service)
    const pdfDataUrl = await generateTicketPDFFromHTML(ticketHTML);

    // Update ticket record with PDF URL
    const { error: updateError } = await supabase
      .from('generated_tickets')
      .update({ 
        pdf_url: pdfDataUrl
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Failed to update ticket record:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ticketUrl: pdfDataUrl
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error generating ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function generateTicketPDFFromHTML(html: string): Promise<string> {
  // For now, return HTML data URL since we can't use Puppeteer in Deno Deploy
  // In production, you'd want to use a PDF service
  const htmlDataUrl = `data:text/html;base64,${btoa(html)}`;
  return htmlDataUrl;
}

function createTicketHTML(ticket: any): string {
  const event = ticket.event_bookings.events;
  const eventDate = new Date(event.start_time).toLocaleDateString();
  const eventTime = new Date(event.start_time).toLocaleTimeString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Ticket</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20px;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ticket {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .ticket::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -10px;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          transform: translateY(-50%);
        }
        
        .ticket::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -10px;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          transform: translateY(-50%);
        }
        
        .ticket-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .ticket-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .ticket-subtitle {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        .ticket-body {
          padding: 30px 20px;
        }
        
        .event-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .event-title {
          font-size: 1.3rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .event-details {
          space-y: 10px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .detail-label {
          font-weight: 600;
          color: #666;
          font-size: 0.9rem;
        }
        
        .detail-value {
          color: #333;
          font-size: 0.9rem;
        }
        
        .ticket-code {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
          border: 2px dashed #667eea;
        }
        
        .code-label {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 5px;
        }
        
        .code-value {
          font-family: 'Courier New', monospace;
          font-size: 1.1rem;
          font-weight: bold;
          color: #667eea;
        }
        
        .qr-section {
          text-align: center;
          margin: 20px 0;
        }
        
        .qr-code {
          width: 120px;
          height: 120px;
          border: 2px solid #eee;
          border-radius: 10px;
          margin: 0 auto;
          display: block;
        }
        
        .instructions {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .instructions-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 5px;
          font-size: 0.9rem;
        }
        
        .instructions-text {
          color: #856404;
          font-size: 0.8rem;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <div class="ticket-title">🎫 Event Ticket</div>
          <div class="ticket-subtitle">Admit One</div>
        </div>
        
        <div class="ticket-body">
          ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="event-image">` : ''}
          
          <div class="event-title">${event.title}</div>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🕐 Time:</span>
              <span class="detail-value">${eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span class="detail-value">${event.location || 'TBA'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🎫 Holder:</span>
              <span class="detail-value">${ticket.ticket_holder_name}</span>
            </div>
          </div>
          
          <div class="ticket-code">
            <div class="code-label">Ticket Code</div>
            <div class="code-value">${ticket.ticket_code}</div>
          </div>
          
          <div class="qr-section">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.qr_code_data)}" 
                 alt="QR Code" class="qr-code">
            <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">
              Present this QR code at the event entrance
            </p>
          </div>
          
          <div class="instructions">
            <div class="instructions-title">Important Instructions:</div>
            <div class="instructions-text">
              • Please arrive 30 minutes before the event starts<br>
              • Keep this ticket safe - it's your proof of entry<br>
              • No refunds or exchanges allowed<br>
              • Contact support if you have any issues
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
