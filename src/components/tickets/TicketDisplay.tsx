
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, User, Ticket, QrCode } from 'lucide-react';
import QRCodeReact from 'qrcode.react';
import { format } from 'date-fns';

interface TicketDisplayProps {
  ticket: {
    id: string;
    ticket_code: string;
    qr_code_data: string;
    ticket_holder_name: string;
    ticket_status: string;
    event?: {
      id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      location?: string;
      event_type: string;
    };
    booking?: {
      booking_code: string;
      payment_amount?: number;
      payment_currency?: string;
    };
  };
}

const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket }) => {
  const event = ticket.event;
  const booking = ticket.booking;

  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Event information not available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white">
      {/* Ticket Header */}
      <Card className="mb-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              <span className="font-bold text-lg">TICKET</span>
            </div>
            <Badge className={`${getStatusColor(ticket.ticket_status)} text-xs`}>
              {ticket.ticket_status.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm opacity-90">
            Ticket ID: {ticket.ticket_code}
          </div>
        </CardContent>
      </Card>

      {/* Event Information */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-3 text-gray-800">{event.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <div className="font-medium">Date</div>
                <div className="text-gray-600">
                  {format(new Date(event.start_time), 'EEEE, MMMM dd, yyyy')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <div className="font-medium">Time</div>
                <div className="text-gray-600">
                  {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-gray-600">{event.location}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-medium">Ticket Holder</div>
                <div className="text-gray-600">{ticket.ticket_holder_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-orange-500" />
              <div>
                <div className="font-medium">Event Type</div>
                <div className="text-gray-600 capitalize">{event.event_type}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code and Booking Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* QR Code */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <QrCode className="h-4 w-4 text-gray-600 mr-2" />
              <span className="font-medium text-sm">Scan to Verify</span>
            </div>
            <div className="flex justify-center">
              <QRCodeReact
                value={ticket.qr_code_data}
                size={120}
                level="M"
                includeMargin={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 text-center">Booking Details</h3>
            <div className="space-y-2 text-sm">
              {booking?.booking_code && (
                <div>
                  <span className="font-medium">Booking Code:</span>
                  <div className="text-gray-600 font-mono">{booking.booking_code}</div>
                </div>
              )}
              
              {booking?.payment_amount && (
                <div>
                  <span className="font-medium">Amount Paid:</span>
                  <div className="text-gray-600">
                    {booking.payment_currency || 'USD'} {booking.payment_amount.toFixed(2)}
                  </div>
                </div>
              )}
              
              <div>
                <span className="font-medium">Issue Date:</span>
                <div className="text-gray-600">
                  {format(new Date(), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 text-sm">Important Notes:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Please arrive 15 minutes before the event start time</li>
            <li>• This ticket is non-transferable and non-refundable</li>
            <li>• Present this QR code for entry verification</li>
            <li>• Keep this ticket until the end of the event</li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-500">
        Powered by SkillPulse • For support, contact support@skillpulse.com
      </div>
    </div>
  );
};

export default TicketDisplay;
