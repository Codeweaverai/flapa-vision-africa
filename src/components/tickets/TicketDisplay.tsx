
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, User, Ticket as TicketIcon, QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface TicketDisplayProps {
  ticket: {
    id: string;
    ticket_code: string;
    ticket_number?: string;
    ticket_holder_name: string;
    qr_code_data: string;
    ticket_status: string;
    booking: {
      booking_code: string;
      event: {
        title: string;
        start_time: string;
        end_time: string;
        location: string;
        image_url?: string;
        event_type: string;
      };
      event_ticket: {
        name: string;
        ticket_type: string;
      };
    };
  };
  showPrintStyles?: boolean;
}

const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket, showPrintStyles = false }) => {
  const generateQRCode = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  return (
    <div className={`ticket-container ${showPrintStyles ? 'print-optimized' : ''}`}>
      <style>
        {showPrintStyles && `
          @media print {
            .ticket-container {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      
      <Card className="bg-white shadow-2xl overflow-hidden max-w-2xl mx-auto">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TicketIcon className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Event Ticket</h1>
                <p className="text-orange-100">#{ticket.ticket_code}</p>
              </div>
            </div>
            <Badge 
              className={`${
                ticket.ticket_status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-500 text-white'
              }`}
            >
              {ticket.ticket_status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <CardContent className="p-8">
          {/* Event Image */}
          {ticket.booking.event.image_url && (
            <div className="mb-6">
              <img 
                src={ticket.booking.event.image_url} 
                alt={ticket.booking.event.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {ticket.booking.event.title}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-700">Date</p>
                      <p className="text-orange-600">
                        {format(new Date(ticket.booking.event.start_time), 'PPP')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-700">Time</p>
                      <p className="text-purple-600">
                        {format(new Date(ticket.booking.event.start_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg md:col-span-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-700">Location</p>
                      <p className="text-blue-600">{ticket.booking.event.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Holder Info */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Ticket Holder Information
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {ticket.ticket_holder_name}</p>
                  <p><span className="font-medium">Ticket Type:</span> {ticket.booking.event_ticket.name}</p>
                  <p><span className="font-medium">Category:</span> {ticket.booking.event_ticket.ticket_type}</p>
                  <p><span className="font-medium">Booking Code:</span> {ticket.booking.booking_code}</p>
                  {ticket.ticket_number && (
                    <p><span className="font-medium">Ticket Number:</span> {ticket.ticket_number}</p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code & Important Info */}
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Entry Code
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-gray-300">
                  <img 
                    src={generateQRCode(ticket.qr_code_data)} 
                    alt="QR Code"
                    className="w-32 h-32 mx-auto"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Scan at venue entrance
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Arrive 30 minutes early</li>
                  <li>• Bring valid ID</li>
                  <li>• Keep this ticket safe</li>
                  <li>• No refunds or exchanges</li>
                  <li>• Present QR code for entry</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              This is your official event ticket. Please keep it safe and present it at the venue.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Generated on {format(new Date(), 'PPP p')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDisplay;
