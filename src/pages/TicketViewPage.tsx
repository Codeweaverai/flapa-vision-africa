
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Download, QrCode, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
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

const TicketViewPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events (
            title,
            start_time,
            location,
            image_url
          ),
          event_ticket:event_tickets (
            name,
            ticket_type
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
              <p className="text-gray-600">View and manage all your event tickets</p>
            </div>

            {tickets.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Tickets Found</h3>
                  <p className="text-gray-600 mb-6">You don't have any event tickets yet.</p>
                  <Link to="/events">
                    <Button className="bg-gradient-to-r from-orange-500 to-purple-600">
                      Browse Events
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    {ticket.event.image_url && (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={ticket.event.image_url}
                          alt={ticket.event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg line-clamp-2">{ticket.event.title}</CardTitle>
                        {getStatusBadge(ticket.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(ticket.event.start_time), 'PPP p')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{ticket.event.location}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-orange-800">{ticket.event_ticket.name}</p>
                        <p className="text-xs text-orange-600">Qty: {ticket.ticket_quantity}</p>
                        <p className="text-xs text-orange-600 font-mono">
                          Code: {ticket.booking_code}
                        </p>
                      </div>
                      
                      <div className="flex justify-center mb-4">
                        <div className="bg-white p-2 rounded border">
                          <QRCodeSVG 
                            value={JSON.stringify({
                              booking_code: ticket.booking_code,
                              event_title: ticket.event.title,
                              ticket_quantity: ticket.ticket_quantity
                            })}
                            size={80}
                            level="M"
                          />
                        </div>
                      </div>
                      
                      <Link to={`/ticket/${ticket.id}`}>
                        <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-purple-600">
                          <QrCode className="h-4 w-4 mr-2" />
                          View Full Ticket
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketViewPage;
