import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, User, Ticket, Hash } from 'lucide-react';

interface TicketProps {
  ticket: {
    id: string;
    ticket_code: string;
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
        description?: string;
      };
      event_ticket: {
        name: string;
        ticket_type: string;
      };
    };
  };
  showPrintStyles?: boolean;
}

const TicketDisplay: React.FC<TicketProps> = ({ ticket, showPrintStyles = false }) => {
  const event = ticket.booking.event;
  const eventTicket = ticket.booking.event_ticket;

  return (
    <div className={`ticket-container ${showPrintStyles ? 'print-ticket' : ''}`}>
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-4xl mx-auto">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 text-white p-8">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">SkillPulse Event Ticket</h1>
                <p className="text-orange-100 text-lg">Your gateway to amazing experiences</p>
              </div>
              <div className="text-right">
                <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                  <Ticket className="h-8 w-8 mb-2 mx-auto" />
                  <p className="text-sm font-medium">E-TICKET</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 opacity-20">
            <div className="w-full h-full bg-white rounded-full transform rotate-45"></div>
          </div>
        </div>

        <div className="p-8">
          {/* Event Title */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">{event.title}</h2>
          </div>
        </div>

        {/* Event Image */}
        {event.image_url && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Date & Time</p>
                <p className="text-gray-700 text-lg">
                  {format(new Date(event.start_time), 'EEEE, MMMM do, yyyy')}
                </p>
                <p className="text-gray-600">
                  {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Venue</p>
                <p className="text-gray-700 text-lg">{event.location}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <User className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Ticket Holder</p>
                <p className="text-gray-700 text-lg">{ticket.ticket_holder_name}</p>
                <p className="text-sm text-gray-500">Ticket Type: {eventTicket.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <Hash className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Ticket Details</p>
                <p className="text-gray-700 font-mono text-lg">{ticket.ticket_code}</p>
                <p className="text-sm text-gray-500">Booking: {ticket.booking.booking_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 inline-block">
            <p className="font-semibold text-gray-900 mb-4 text-lg">Scan QR Code for Entry</p>
            <div className="bg-white p-6 rounded-xl shadow-lg inline-block">
              <QRCodeSVG 
                value={ticket.qr_code_data}
                size={200}
                level="M"
                includeMargin={true}
                fgColor="#1f2937"
              />
            </div>
            <p className="text-gray-600 mt-4 text-sm max-w-md mx-auto">
              Present this QR code at the event entrance. Save this ticket to your device for offline access.
            </p>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-800 mb-4 text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Important Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
            <ul className="space-y-2">
              <li>• Please arrive 30 minutes before the event starts</li>
              <li>• Keep this ticket safe - lost tickets cannot be replaced</li>
              <li>• Valid photo ID may be required for entry</li>
            </ul>
            <ul className="space-y-2">
              <li>• This ticket is non-transferable and non-refundable</li>
              <li>• Event organizers reserve the right to refuse entry</li>
              <li>• For support, contact: support@skillpulse.com</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Generated by SkillPulse Event Management • Ticket ID: {ticket.id.slice(0, 8)}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-6 h-6 bg-gray-100 rounded-full transform -translate-x-3 -translate-y-3"></div>
        <div className="absolute top-1/2 right-0 w-6 h-6 bg-gray-100 rounded-full transform translate-x-3 -translate-y-3"></div>
      </div>

      {showPrintStyles && (
        <style>
          {`
            @media print {
              .print-ticket {
                page-break-after: always;
                margin: 0;
                box-shadow: none;
              }
              .print-ticket:last-child {
                page-break-after: avoid;
              }
            }
          `}
        </style>
      )}
    </div>
  );
};

export default TicketDisplay;
