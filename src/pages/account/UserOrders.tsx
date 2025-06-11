
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package, CreditCard, Download, Ticket, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  metadata?: any;
}

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

const UserOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTickets, setGeneratingTickets] = useState<string | null>(null);

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
          order_items (*)
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

  const generateTickets = async (orderId: string) => {
    try {
      setGeneratingTickets(orderId);
      const { data, error } = await supabase.functions.invoke('generate-tickets', {
        body: { orderId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Generated ${data.generatedTickets} tickets successfully!`);
        // Refresh orders to get updated ticket data
        await loadOrders();
      } else {
        toast.error('Failed to generate tickets');
      }
    } catch (error) {
      console.error('Error generating tickets:', error);
      toast.error('Failed to generate tickets');
    } finally {
      setGeneratingTickets(null);
    }
  };

  const printTicket = async (orderId: string) => {
    try {
      // Get generated tickets for this order
      const { data: tickets, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          event:events (
            title, start_time, location, description
          ),
          event_ticket:event_tickets (
            name, ticket_type
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      if (!tickets || tickets.length === 0) {
        toast.error('No tickets found for this order');
        return;
      }

      // Generate and print ticket HTML for each ticket
      tickets.forEach((ticket, index) => {
        setTimeout(() => {
          const ticketHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Event Ticket - ${ticket.event?.title}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .ticket {
                  background: white;
                  width: 600px;
                  border-radius: 15px;
                  overflow: hidden;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                  border: 3px solid #e9ecef;
                }
                .ticket-header {
                  background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
                  color: white;
                  padding: 40px;
                  text-align: center;
                }
                .event-title {
                  font-size: 32px;
                  font-weight: bold;
                  margin-bottom: 15px;
                }
                .ticket-body {
                  padding: 50px 40px;
                }
                .holder-name {
                  font-size: 36px;
                  font-weight: bold;
                  color: #2c3e50;
                  text-align: center;
                  margin-bottom: 40px;
                  border-bottom: 3px solid #f97316;
                  padding-bottom: 20px;
                }
                .event-details {
                  margin-bottom: 30px;
                }
                .detail-item {
                  margin: 15px 0;
                  padding: 15px;
                  background: #f8f9fa;
                  border-radius: 8px;
                  border-left: 4px solid #f97316;
                }
                .detail-label {
                  font-weight: bold;
                  color: #666;
                  font-size: 14px;
                  text-transform: uppercase;
                }
                .detail-value {
                  font-size: 18px;
                  color: #333;
                  margin-top: 5px;
                }
                .ticket-code {
                  text-align: center;
                  margin: 30px 0;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 10px;
                  border: 2px dashed #f97316;
                }
                .code {
                  font-family: monospace;
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
                }
              </style>
            </head>
            <body>
              <div class="ticket">
                <div class="ticket-header">
                  <div class="event-title">${ticket.event?.title || 'Event'}</div>
                  <div>${ticket.event_ticket?.ticket_type || 'Standard'} Ticket</div>
                </div>
                
                <div class="ticket-body">
                  <div class="holder-name">${ticket.ticket_holder_name}</div>
                  
                  <div class="event-details">
                    <div class="detail-item">
                      <div class="detail-label">Date & Time</div>
                      <div class="detail-value">
                        ${ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'PPP p') : 'TBD'}
                      </div>
                    </div>
                    
                    <div class="detail-item">
                      <div class="detail-label">Location</div>
                      <div class="detail-value">${ticket.event?.location || 'TBD'}</div>
                    </div>
                  </div>
                  
                  <div class="ticket-code">
                    <div class="detail-label">Ticket Code</div>
                    <div class="code">${ticket.ticket_code}</div>
                  </div>
                  
                  <div style="text-align: center; color: #666; font-size: 14px;">
                    Present this ticket at the venue entrance
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;
          
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(ticketHTML);
            printWindow.document.close();
            printWindow.print();
          }
        }, index * 500); // Stagger multiple tickets
      });
      
      toast.success('Tickets sent to printer');
    } catch (error) {
      console.error('Error printing tickets:', error);
      toast.error('Failed to print tickets');
    }
  };

  const hasEventTickets = (order: Order) => {
    return order.order_items.some(item => item.item_type === 'event_ticket');
  };

  const getStatusColor = (status: string) => {
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Button 
            onClick={() => navigate('/courses')}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
          >
            Browse Courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-orange-600" />
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(order.created_at), 'PPP')}
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className="text-2xl font-bold text-orange-600">
                    ${order.total_amount.toFixed(2)} {order.currency}
                  </div>
                  <Badge className={getStatusColor(order.payment_status)}>
                    {order.payment_status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Items Ordered</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Badge variant="secondary">
                              {item.item_type === 'course' ? 'Course' : 'Event Ticket'}
                            </Badge>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${item.total_price.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">${item.unit_price.toFixed(2)} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment Method: {order.payment_method}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {hasEventTickets(order) && order.payment_status === 'completed' && (
                    <>
                      <Button
                        onClick={() => navigate(`/ticket-details/${order.id}`)}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Tickets
                      </Button>
                      
                      <Button
                        onClick={() => printTicket(order.id)}
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Tickets
                      </Button>
                      
                      <Button
                        onClick={() => generateTickets(order.id)}
                        disabled={generatingTickets === order.id}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        {generatingTickets === order.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        ) : (
                          <Ticket className="h-4 w-4 mr-2" />
                        )}
                        {generatingTickets === order.id ? 'Generating...' : 'Regenerate Tickets'}
                      </Button>
                    </>
                  )}
                  
                  <Button
                    onClick={() => navigate(`/order-details/${order.id}`)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserOrders;
