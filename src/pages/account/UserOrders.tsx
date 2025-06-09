import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Download, Calendar, CreditCard, Ticket, Receipt } from 'lucide-react';
import { toast } from 'sonner';

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
    };
  };
}

const UserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);

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
              location
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
        // Generate ticket if not exists
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
      }
    } else {
      // Open existing ticket
      window.open(ticket.pdf_url, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h2>
        <p className="text-gray-600">View your purchase history and download receipts</p>
      </div>

      {/* Orders Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Order History</h3>
        
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {order.currency} {order.total_amount.toFixed(2)}
                      </div>
                      <Badge className={getStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {item.item_type} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {order.currency} {item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.receipt_url && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(order.receipt_url, '_blank')}
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
        <h3 className="text-xl font-semibold">My Tickets</h3>
        
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No tickets found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {ticket.event_bookings.events.title}
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(ticket.event_bookings.events.start_time).toLocaleDateString()}
                      </div>
                      {ticket.event_bookings.events.location && (
                        <p className="text-sm">📍 {ticket.event_bookings.events.location}</p>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Ticket Holder</p>
                      <p className="font-medium">{ticket.ticket_holder_name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Ticket Code</p>
                      <p className="font-mono text-sm">{ticket.ticket_code}</p>
                    </div>
                    
                    <Button
                      onClick={() => downloadTicket(ticket)}
                      className="w-full"
                      variant={ticket.pdf_url ? "default" : "outline"}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {ticket.pdf_url ? 'Download Ticket' : 'Generate Ticket'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;
