
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { launch } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const generateQRCode = (data: string): string => {
  // Simple QR code placeholder - in production, use a proper QR code library
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
};

const generateTicketHTML = (ticketData: any): string => {
  const qrData = JSON.stringify({
    ticketCode: ticketData.ticket_code,
    eventId: ticketData.event_id,
    bookingId: ticketData.booking_id,
    holderName: ticketData.ticket_holder_name
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
        }
        
        .ticket {
          width: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          overflow: hidden;
          position: relative;
        }
        
        .ticket::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        }
        
        .header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .event-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        
        .event-date {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }
        
        .content {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: center;
        }
        
        .ticket-info {
          display: grid;
          gap: 16px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 16px;
          color: #1e293b;
          font-weight: 600;
        }
        
        .qr-section {
          text-align: center;
        }
        
        .qr-code {
          width: 120px;
          height: 120px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
        }
        
        .ticket-code {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
          font-family: monospace;
        }
        
        .footer {
          background: #f8fafc;
          padding: 16px 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        
        .perforation {
          position: relative;
        }
        
        .perforation::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 24px;
          right: 24px;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 8px,
            #cbd5e1 8px,
            #cbd5e1 12px
          );
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h1 class="event-title">${ticketData.event_title}</h1>
          <p class="event-date">${new Date(ticketData.event_start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        
        <div class="content">
          <div class="ticket-info">
            <div class="info-row">
              <span class="info-label">Ticket Holder</span>
              <span class="info-value">${ticketData.ticket_holder_name}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Venue</span>
              <span class="info-value">${ticketData.event_location || 'Online Event'}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Ticket Type</span>
              <span class="info-value">${ticketData.ticket_type_name}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Seat/Reference</span>
              <span class="info-value">${ticketData.ticket_code}</span>
            </div>
          </div>
          
          <div class="qr-section">
            <img src="${generateQRCode(qrData)}" alt="QR Code" class="qr-code" />
            <div class="ticket-code">${ticketData.ticket_code}</div>
          </div>
        </div>
        
        <div class="footer perforation">
          <p>Present this ticket at the venue entrance. Keep your ticket until the end of the event.</p>
          <p>For questions, contact support@skillpulse.com</p>
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
    const { sessionId, bookingId } = await req.json();

    let bookings = [];

    if (bookingId) {
      // Generate ticket for specific booking
      const { data, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          event_bookings!inner(
            id,
            event_id,
            user_id,
            events!inner(title, start_time, location),
            event_tickets!inner(name)
          )
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;
      bookings = data || [];
    } else if (sessionId) {
      // Find bookings from session
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', sessionId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        
        const { data, error } = await supabase
          .from('generated_tickets')
          .select(`
            *,
            event_bookings!inner(
              id,
              event_id,
              user_id,
              order_id,
              events!inner(title, start_time, location),
              event_tickets!inner(name)
            )
          `)
          .in('event_bookings.order_id', orderIds);

        if (error) throw error;
        bookings = data || [];
      }
    }

    if (bookings.length === 0) {
      return new Response(JSON.stringify({ message: 'No tickets to generate' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const browser = await launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    for (const ticket of bookings) {
      try {
        const ticketData = {
          ticket_code: ticket.ticket_code,
          ticket_holder_name: ticket.ticket_holder_name,
          event_title: ticket.event_bookings.events.title,
          event_start_time: ticket.event_bookings.events.start_time,
          event_location: ticket.event_bookings.events.location,
          ticket_type_name: ticket.event_bookings.event_tickets.name,
          event_id: ticket.event_bookings.event_id,
          booking_id: ticket.booking_id
        };

        const ticketHTML = generateTicketHTML(ticketData);
        
        const page = await browser.newPage();
        await page.setContent(ticketHTML);
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
        });
        
        await page.close();

        // Upload to storage
        const fileName = `ticket_${ticket.id}_${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('tickets')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf'
          });

        if (uploadError) {
          console.error('Upload error for ticket:', ticket.id, uploadError);
          continue;
        }

        // Get signed URL (valid for 1 year)
        const { data: urlData } = await supabase.storage
          .from('tickets')
          .createSignedUrl(fileName, 31536000); // 1 year

        // Update ticket record
        const { error: updateError } = await supabase
          .from('generated_tickets')
          .update({
            pdf_url: urlData?.signedUrl,
            pdf_storage_path: fileName
          })
          .eq('id', ticket.id);

        if (updateError) {
          console.error('Update error for ticket:', ticket.id, updateError);
        } else {
          results.push({
            ticketId: ticket.id,
            ticketCode: ticket.ticket_code,
            pdfUrl: urlData?.signedUrl
          });
        }

      } catch (error) {
        console.error('Error processing ticket:', ticket.id, error);
      }
    }

    await browser.close();

    return new Response(JSON.stringify({ 
      success: true, 
      ticketsGenerated: results.length,
      tickets: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error generating tickets:", error);
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
