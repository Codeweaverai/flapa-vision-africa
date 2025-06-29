
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowLeft, Download, QrCode, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface TicketDetail {
  id: string;
  booking_code: string;
  ticket_quantity: number;
  status: string;
  event: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url: string;
  };
  event_ticket: {
    name: string;
    ticket_type: string;
  };
}

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events (
            title,
            description,
            start_time,
            end_time,
            location,
            image_url
          ),
          event_ticket:event_tickets (
            name,
            ticket_type
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Failed to load ticket details');
      navigate('/account/orders');
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

  const handlePrintTicket = () => {
    window.print();
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

  if (!ticket) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Ticket Not Found</h2>
              <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist.</p>
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => navigate('/account/orders')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ticket Information */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{ticket.event.title}</CardTitle>
                    {getStatusBadge(ticket.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {ticket.event.image_url && (
                    <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={ticket.event.image_url}
                        alt={ticket.event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(ticket.event.start_time), 'PPP p')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{ticket.event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Quantity: {ticket.ticket_quantity}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">Ticket Information</h3>
                    <p className="text-sm text-orange-700">
                      <strong>Type:</strong> {ticket.event_ticket.name}
                    </p>
                    <p className="text-sm text-orange-700">
                      <strong>Category:</strong> {ticket.event_ticket.ticket_type}
                    </p>
                    <p className="text-sm text-orange-700 font-mono">
                      <strong>Booking Code:</strong> {ticket.booking_code}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>{ticket.event.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code and Actions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Digital Ticket
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCodeSVG 
                        value={JSON.stringify({
                          booking_code: ticket.booking_code,
                          event_title: ticket.event.title,
                          ticket_quantity: ticket.ticket_quantity,
                          status: ticket.status
                        })}
                        size={200}
                        level="M"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Show this QR code at the event entrance
                    </p>
                    <p className="font-mono text-lg font-bold text-orange-600">
                      {ticket.booking_code}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handlePrintTicket}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600"
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
      </div>
    </Layout>
  );
};

export default TicketDetailPage;
