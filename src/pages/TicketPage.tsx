
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Download, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';

interface TicketData {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  qr_code_data: string;
  ticket_status: string;
  booking: {
    id: string;
    event: {
      title: string;
      start_time: string;
      end_time: string;
      location: string;
      image_url: string;
    };
  };
}

const TicketPage = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings (
            id,
            event:events (
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

      if (error) throw error;

      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (data: string) => {
    // Simple QR code placeholder - in production, use a proper QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const downloadTicket = () => {
    // Generate PDF or print ticket
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Ticket Not Found</h2>
              <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Event Ticket</CardTitle>
                    <p className="text-blue-100">#{ticket.ticket_code}</p>
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
              </CardHeader>
              
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

                {/* Event Details */}
                <div className="space-y-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {ticket.booking.event.title}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p>{format(new Date(ticket.booking.event.start_time), 'PPP')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p>{format(new Date(ticket.booking.event.start_time), 'h:mm a')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p>{ticket.booking.event.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Holder */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Ticket Holder</h3>
                  <p className="text-lg">{ticket.ticket_holder_name}</p>
                </div>

                {/* QR Code */}
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Scan for Entry</h3>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img 
                      src={generateQRCode(ticket.qr_code_data)} 
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Present this QR code at the event entrance
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <Button onClick={downloadTicket} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download/Print
                  </Button>
                </div>

                {/* Important Notes */}
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Please arrive 30 minutes before the event starts</li>
                    <li>• Keep this ticket safe - it's your proof of entry</li>
                    <li>• No refunds or exchanges allowed</li>
                    <li>• Contact support if you have any issues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketPage;
