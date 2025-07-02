
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowLeft, Download, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface TicketData {
  id: string;
  booking_code: string;
  ticket_quantity: number;
  status: string;
  event: {
    title: string;
    start_time: string;
    location: string;
    image_url: string;
  };
  event_ticket: {
    name: string;
    ticket_type: string;
  };
}

const TicketPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchTicket();
    }
  }, [bookingId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events!event_bookings_event_id_fkey (
            title,
            start_time,
            location,
            image_url
          ),
          event_ticket:event_tickets!event_bookings_event_ticket_id_fkey (
            name,
            ticket_type
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  if (!ticket || !ticket.event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Ticket Not Found</h2>
              <p className="text-gray-600 mb-4">The ticket or event data could not be loaded.</p>
              <Button onClick={() => navigate('/account/orders')}>
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate('/account/orders')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                <CardTitle className="text-2xl">Event Ticket</CardTitle>
                <div className="flex justify-center mt-2">
                  {getStatusBadge(ticket.status)}
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {ticket.event.title}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {ticket.event_ticket.name}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-5 w-5" />
                        <span>{format(new Date(ticket.event.start_time), 'PPP p')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-5 w-5" />
                        <span>{ticket.event.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <QRCodeSVG 
                        value={JSON.stringify({
                          booking_code: ticket.booking_code,
                          event_title: ticket.event.title,
                          ticket_quantity: ticket.ticket_quantity
                        })}
                        size={150}
                        level="M"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">Booking Code</p>
                  <p className="font-mono text-xl font-bold text-orange-600">
                    {ticket.booking_code}
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => window.print()}
                    className="bg-gradient-to-r from-orange-500 to-purple-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Print Ticket
                  </Button>
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
