
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Download, Eye, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
  order_items: {
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  event_bookings: {
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
  }[];
}

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            item_name,
            quantity,
            unit_price,
            total_price
          ),
          event_bookings (
            id,
            booking_code,
            ticket_quantity,
            status,
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
          )
        `)
        .eq('user_id', user?.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">View and manage your event tickets and bookings</p>
            </div>

            {orders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
                  <p className="text-gray-600 mb-6">You haven't made any event bookings yet.</p>
                  <Link to="/events">
                    <Button className="bg-gradient-to-r from-orange-500 to-purple-600">
                      Browse Events
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">Order #{order.id.slice(0, 8)}</CardTitle>
                          <p className="text-orange-100">
                            {format(new Date(order.created_at), 'PPP')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {order.currency} {order.total_amount.toFixed(2)}
                          </div>
                          <Badge className="bg-green-500 text-white">Paid</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {order.event_bookings.map((booking) => (
                        <div key={booking.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0 mb-6 last:mb-0">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Event Image */}
                            {booking.event.image_url && (
                              <div className="lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={booking.event.image_url}
                                  alt={booking.event.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Event Details */}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {booking.event.title}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(new Date(booking.event.start_time), 'PPP p')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{booking.event.location}</span>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{booking.event_ticket.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {booking.event_ticket.ticket_type} • Quantity: {booking.ticket_quantity}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-sm text-gray-600">
                                      Booking: {booking.booking_code}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4">
                            <Link to={`/tickets/${booking.id}`}>
                              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                <Eye className="h-4 w-4 mr-2" />
                                View Tickets
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              onClick={() => window.print()}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Print
                            </Button>
                          </div>
                        </div>
                      ))}
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

export default MyOrdersPage;
