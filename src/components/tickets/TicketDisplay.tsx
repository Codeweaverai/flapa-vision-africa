
import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

export interface TicketDisplayProps {
  ticket: {
    id?: string;
    ticket_code: string;
    ticket_holder_name: string;
    ticket_holder_email?: string;
    user_name?: string;
    booking_code?: string;
    status?: string;
    event?: {
      title: string;
      start_time: string;
      end_time?: string;
      location?: string;
      venue?: string;
      image_url?: string;
    };
    events?: {
      title: string;
      start_time: string;
      end_time?: string;
      location?: string;
      venue?: string;
      image_url?: string;
    };
    event_ticket?: {
      name: string;
      ticket_type: string;
    };
    qr_code_data?: string;
  };
  showPrintStyles?: boolean;
  index?: number;
}

const TicketDisplay = ({ ticket, showPrintStyles = false, index = 0 }: TicketDisplayProps) => {
  // Get event data from either event or events property
  const eventData = ticket.event || ticket.events;
  
  useEffect(() => {
    // Generate QR code after component mounts
    const qrData = ticket.qr_code_data || JSON.stringify({
      ticket_code: ticket.ticket_code || ticket.booking_code,
      ticket_id: ticket.id,
      holder_name: ticket.ticket_holder_name || ticket.user_name,
      event_title: eventData?.title
    });

    const qrContainer = document.getElementById(`qr-code-${ticket.ticket_code || ticket.booking_code}-${index}`);
    if (qrContainer) {
      qrContainer.innerHTML = '';
      
      // Create QR code element
      const qrElement = document.createElement('div');
      qrElement.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;';
      
      // We'll create a simple QR representation since we can't use React components in innerHTML
      qrElement.innerHTML = `
        <svg width="120" height="120" style="border: 2px solid #e5e7eb; border-radius: 8px; background: white;">
          <rect width="120" height="120" fill="white"/>
          <text x="60" y="50" text-anchor="middle" font-size="10" fill="#6b7280">QR Code</text>
          <text x="60" y="65" text-anchor="middle" font-size="8" fill="#6b7280">${(ticket.ticket_code || ticket.booking_code || '').substring(0, 12)}</text>
          <text x="60" y="80" text-anchor="middle" font-size="6" fill="#9ca3af">Scan at entrance</text>
        </svg>
      `;
      
      qrContainer.appendChild(qrElement);
    }
  }, [ticket, index]);

  if (!eventData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <p>Event information not available</p>
        </div>
      </div>
    );
  }

  // Enhanced ticket design HTML
  const ticketHTML = `
    <div style="max-width: 800px; margin: 0 auto 30px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🎫 EVENT TICKET</h1>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block;">
          <span style="font-size: 14px; font-weight: 500;">#${ticket.ticket_code || ticket.booking_code}</span>
        </div>
      </div>

      <div style="padding: 40px;">
        <!-- Event Image and Title -->
        <div style="display: flex; gap: 20px; margin-bottom: 30px; align-items: center;">
          ${eventData.image_url ? `
            <div style="width: 120px; height: 120px; border-radius: 15px; overflow: hidden; flex-shrink: 0; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
              <img src="${eventData.image_url}" alt="${eventData.title || 'Event'}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          ` : ''}
          <div style="flex: 1;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #1f2937; font-weight: bold;">${eventData.title || 'Event Title'}</h2>
            <div style="background: linear-gradient(135deg, #fef7ed, #faf5ff); padding: 12px 16px; border-radius: 10px; border-left: 4px solid #f97316;">
              <div style="font-weight: 600; color: #ea580c; margin-bottom: 5px;">${ticket.event_ticket?.name || 'Standard Ticket'}</div>
              <div style="font-size: 14px; color: #7c2d12;">${ticket.event_ticket?.ticket_type || 'Regular'}</div>
            </div>
          </div>
        </div>

        <!-- Event Details Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px;">
          <div>
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                📅 Date & Time
              </div>
              <div style="color: #6b7280; font-size: 16px; line-height: 1.4;">
                ${eventData.start_time ? format(new Date(eventData.start_time), 'EEEE, MMMM do, yyyy') : 'TBD'}<br>
                ${eventData.start_time ? format(new Date(eventData.start_time), 'h:mm a') : ''} ${eventData.end_time ? '- ' + format(new Date(eventData.end_time), 'h:mm a') : ''}
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                📍 Location
              </div>
              <div style="color: #6b7280; font-size: 16px; line-height: 1.4;">
                ${eventData.location || eventData.venue || 'TBD'}
              </div>
            </div>
          </div>

          <div>
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                👤 Ticket Holder
              </div>
              <div style="color: #6b7280; font-size: 16px; line-height: 1.4;">
                ${ticket.ticket_holder_name || ticket.user_name || 'Ticket Holder'}
                ${ticket.ticket_holder_email ? `<br><span style="font-size: 14px;">${ticket.ticket_holder_email}</span>` : ''}
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                ✅ Status
              </div>
              <div>
                <span style="background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                  ${(ticket.status || 'confirmed').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- QR Code Section -->
        <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 15px; margin-bottom: 20px;">
          <div style="margin-bottom: 15px;">
            <div style="width: 150px; height: 150px; margin: 0 auto; padding: 15px; background: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
              <div id="qr-code-${ticket.ticket_code || ticket.booking_code}-${index}" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="width: 100%; height: 100%; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">
                  Loading QR...
                </div>
              </div>
            </div>
          </div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Scan this code at the event entrance</div>
          <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #f97316; letter-spacing: 1px;">
            ${ticket.ticket_code || ticket.booking_code}
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; border-top: 2px dashed #e5e7eb; color: #6b7280; font-size: 14px; line-height: 1.6;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151;">Important:</strong> Please bring this ticket (digital or printed) to the event.
          </div>
          <div>
            For questions, contact us at support@skillpulse.com
          </div>
        </div>
      </div>
    </div>
  `;

  return (
    <div className={`${showPrintStyles ? 'print:shadow-none print:border-2 print:border-black' : ''}`}>
      <div dangerouslySetInnerHTML={{ __html: ticketHTML }} />
      
      {/* Print Styles */}
      {showPrintStyles && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .ticket-display {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              @page {
                margin: 0.5in;
              }
            }
          `
        }} />
      )}
    </div>
  );
};

export default TicketDisplay;
