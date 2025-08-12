
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface TicketDisplayProps {
  ticket: {
    id?: string;
    ticket_code: string;
    ticket_holder_name: string;
    event?: {
      title: string;
      event_date: string;
      location?: string;
      venue?: string;
    };
    events?: {
      title: string;
      event_date: string;
      location?: string;
      venue?: string;
    };
    qr_code_data?: string;
  };
  showPrintStyles?: boolean;
}

const TicketDisplay = ({ ticket, showPrintStyles = false }: TicketDisplayProps) => {
  // Get event data from either event or events property
  const eventData = ticket.event || ticket.events;
  
  if (!eventData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <p>Event information not available</p>
        </div>
      </div>
    );
  }

  const qrData = ticket.qr_code_data || JSON.stringify({
    ticket_code: ticket.ticket_code,
    ticket_id: ticket.id,
    holder_name: ticket.ticket_holder_name
  });

  return (
    <div className={`bg-gradient-to-r from-orange-100 to-purple-100 border border-orange-200 rounded-lg overflow-hidden ${showPrintStyles ? 'print:shadow-none print:border-2 print:border-black' : 'shadow-lg'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-1">{eventData.title}</h2>
            <p className="text-orange-100 text-sm">Event Ticket</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Ticket #</p>
            <p className="text-lg font-bold">{ticket.ticket_code}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ticket Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Ticket Holder
              </h3>
              <p className="text-lg font-bold text-gray-900">{ticket.ticket_holder_name}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Event Details
              </h3>
              <div className="space-y-1">
                <p className="text-gray-900 font-medium">{eventData.title}</p>
                <p className="text-gray-600">
                  {new Date(eventData.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600">
                  {new Date(eventData.event_date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {(eventData.location || eventData.venue) && (
                  <p className="text-gray-600">{eventData.location || eventData.venue}</p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-3">
              <QRCodeSVG
                value={qrData}
                size={120}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Scan this QR code at the event entrance
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <p>Please bring this ticket to the event</p>
            <p>Ticket ID: {ticket.id || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      {showPrintStyles && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .ticket-display {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          `
        }} />
      )}
    </div>
  );
};

export default TicketDisplay;
