
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Package, Ticket, Eye, Printer, FileText, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  receipt_url: string;
  order_items: Array<{
    id: string;
    item_name: string;
    item_type: string;
    quantity: number;
    total_price: number;
  }>;
  generated_tickets?: Array<{
    id: string;
    ticket_code: string;
    ticket_holder_name: string;
    pdf_url: string;
    ticket_status: string;
  }>;
}

const UserOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          generated_tickets (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (receiptUrl: string, orderNumber: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    } else {
      toast.error('Receipt not available');
    }
  };

  const handleViewTickets = (orderId: string) => {
    navigate(`/tickets/${orderId}`);
  };

  const handlePrintTicket = (ticketUrl: string) => {
    if (ticketUrl) {
      window.open(ticketUrl, '_blank');
    } else {
      toast.error('Ticket not available');
    }
  };

  const handleRegenerateTickets = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-tickets', {
        body: { orderId }
      });

      if (error) throw error;
      
      toast.success('Tickets regenerated successfully');
      loadOrders(); // Refresh the orders
    } catch (error) {
      console.error('Error regenerating tickets:', error);
      toast.error('Failed to regenerate tickets');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              My Orders
            </h1>
          </div>

          {orders.length === 0 ? (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold mb-4">No orders found</h2>
                <p className="text-gray-600 mb-6">You haven't made any purchases yet.</p>
                <Button 
                  onClick={() => navigate('/courses')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const hasEventTickets = order.order_items.some(item => item.item_type === 'event_ticket');
                const tickets = order.generated_tickets || [];
                
                return (
                  <Card key={order.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {format(new Date(order.created_at), 'PPP')}
                              </span>
                            </div>
                            <Badge className={getStatusBadgeColor(order.payment_status)}>
                              {order.payment_status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-lg lg:text-right">
                          <div className="font-bold text-orange-600">
                            {order.total_amount.toFixed(2)} {order.currency}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            via {order.payment_method}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {/* Order Items */}
                      <div className="mb-6">
                        <h3 className="font-semibold mb-3">Items</h3>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{item.item_name}</div>
                                <div className="text-sm text-gray-600">
                                  {item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'} • 
                                  Quantity: {item.quantity}
                                </div>
                              </div>
                              <div className="font-semibold">
                                {item.total_price.toFixed(2)} {order.currency}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tickets Section */}
                      {hasEventTickets && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Ticket className="h-5 w-5 text-green-600" />
                              <h3 className="font-semibold text-green-800">Event Tickets</h3>
                              {tickets.length > 0 && (
                                <Badge className="bg-green-100 text-green-800">
                                  {tickets.length} ticket(s)
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {tickets.length > 0 ? (
                            <div className="space-y-2">
                              {tickets.slice(0, 3).map((ticket) => (
                                <div key={ticket.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div>
                                    <div className="font-medium text-sm">{ticket.ticket_holder_name}</div>
                                    <div className="text-xs text-gray-600">Code: {ticket.ticket_code}</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePrintTicket(ticket.pdf_url)}
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                  >
                                    <Printer className="h-3 w-3 mr-1" />
                                    Print
                                  </Button>
                                </div>
                              ))}
                              {tickets.length > 3 && (
                                <div className="text-sm text-gray-600 text-center">
                                  +{tickets.length - 3} more tickets
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              Tickets are being generated...
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {/* Receipt Download */}
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadReceipt(order.receipt_url, order.id.slice(-8).toUpperCase())}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          disabled={!order.receipt_url}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>

                        {/* Ticket Actions */}
                        {hasEventTickets && (
                          <>
                            <Button
                              onClick={() => handleViewTickets(order.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                              disabled={tickets.length === 0}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Tickets
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => handleRegenerateTickets(order.id)}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              Regenerate Tickets
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserOrders;
