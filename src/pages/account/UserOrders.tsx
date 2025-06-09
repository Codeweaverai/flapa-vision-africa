
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Download, Calendar, CreditCard, Ticket, Receipt, FileText, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
  receipt_url?: string;
  order_items: {
    id: string;
    item_name: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

interface UserTicket {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  pdf_url?: string;
  event_bookings: {
    events: {
      title: string;
      start_time: string;
      location?: string;
      image_url?: string;
    };
  };
}

const UserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTicket, setGeneratingTicket] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserOrders();
      loadUserTickets();
    }
  }, [user]);

  const loadUserOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          currency,
          payment_status,
          created_at,
          receipt_url,
          order_items (
            id,
            item_name,
            item_type,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const loadUserTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_tickets')
        .select(`
          id,
          ticket_code,
          ticket_holder_name,
          pdf_url,
          event_bookings!inner (
            user_id,
            events!inner (
              title,
              start_time,
              location,
              image_url
            )
          )
        `)
        .eq('event_bookings.user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async (ticket: UserTicket) => {
    if (!ticket.pdf_url) {
      try {
        setGeneratingTicket(ticket.id);
        
        // Generate ticket using edge function
        const { data, error } = await supabase.functions.invoke('generate-event-tickets', {
          body: { ticketId: ticket.id }
        });

        if (error) throw error;
        
        // Reload tickets to get updated URL
        await loadUserTickets();
        toast.success('Ticket generated successfully!');
      } catch (error) {
        console.error('Error generating ticket:', error);
        toast.error('Failed to generate ticket');
      } finally {
        setGeneratingTicket(null);
      }
    } else {
      // Open existing ticket
      window.open(ticket.pdf_url, '_blank');
    }
  };

  const viewTicket = (ticket: UserTicket) => {
    window.open(`/ticket/${ticket.id}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'failed':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              My Orders & Tickets
            </h1>
            <p className="text-gray-600 text-lg">
              View your purchase history, download receipts, and manage your event tickets
            </p>
          </div>

          <div className="space-y-8">
            {/* Orders Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
              </div>
              
              {orders.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="text-center py-12">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-4">When you make purchases, they'll appear here</p>
                    <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                      <a href="/explore/courses">Browse Courses</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <Card key={order.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                              Order #{order.id.slice(-8)}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600 mb-2">
                              {order.currency} {order.total_amount.toFixed(2)}
                            </div>
                            <Badge className={`${getStatusColor(order.payment_status)} text-white`}>
                              {order.payment_status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 mb-3">Items Purchased:</h4>
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-lg flex items-center justify-center">
                                  {item.item_type === 'course' ? (
                                    <FileText className="h-6 w-6 text-white" />
                                  ) : (
                                    <Ticket className="h-6 w-6 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{item.item_name}</p>
                                  <p className="text-sm text-gray-600 capitalize">
                                    {item.item_type} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-purple-600 text-lg">
                                  {order.currency} {item.total_price.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {order.currency} {item.unit_price.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {order.receipt_url && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <Button
                              variant="outline"
                              onClick={() => window.open(order.receipt_url, '_blank')}
                              className="w-full sm:w-auto border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Download Receipt
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Ticket className="h-6 w-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">My Event Tickets</h2>
              </div>
              
              {tickets.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="text-center py-12">
                    <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
                    <p className="text-gray-500 mb-4">When you book events, your tickets will appear here</p>
                    <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                      <a href="/explore/events">Browse Events</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                      <CardHeader className="pb-3">
                        <div className="relative">
                          {ticket.event_bookings.events.image_url && (
                            <img 
                              src={ticket.event_bookings.events.image_url} 
                              alt={ticket.event_bookings.events.title}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2">
                            {ticket.event_bookings.events.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span>{new Date(ticket.event_bookings.events.start_time).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span>{new Date(ticket.event_bookings.events.start_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {ticket.event_bookings.events.location && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-green-500">📍</span>
                              <span className="line-clamp-2">{ticket.event_bookings.events.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg border border-orange-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">Ticket Holder</div>
                          <div className="font-semibold text-gray-900">{ticket.ticket_holder_name}</div>
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-mono bg-white px-2 py-1 rounded border">
                              {ticket.ticket_code}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => viewTicket(ticket)}
                            className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => downloadTicket(ticket)}
                            disabled={generatingTicket === ticket.id}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {generatingTicket === ticket.id 
                              ? 'Generating...' 
                              : ticket.pdf_url ? 'Download' : 'Generate'
                            }
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserOrders;
