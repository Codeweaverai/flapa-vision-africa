
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Eye, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  receipt_url?: string;
  created_at: string;
  order_items: Array<{
    id: string;
    item_type: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    courses?: { title: string; id: string };
    event_tickets?: { 
      name: string; 
      id: string;
      events: { title: string; start_time: string; id: string } 
    };
  }>;
}

const UserOrders = () => {
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
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            courses:item_id (id, title),
            event_tickets:item_id (
              id, 
              name, 
              events:event_id (id, title, start_time)
            )
          )
        `)
        .eq('user_id', user?.id)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadReceipt = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-4">You haven't made any purchases yet.</p>
          <Button onClick={() => window.location.href = '/explore/courses'}>
            Browse Courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Orders</h2>
        <p className="text-gray-600">{orders.length} total orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(-8)}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.created_at), 'PPP')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                  <p className="text-lg font-semibold mt-1">
                    ${order.total_amount}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.item_type === 'course' ? item.courses?.title : item.event_tickets?.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline">
                          {item.item_type === 'course' ? 'Course' : 'Event Ticket'}
                        </Badge>
                        {item.quantity > 1 && (
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        )}
                        {item.event_tickets?.events && (
                          <span className="text-sm text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(item.event_tickets.events.start_time), 'PPP')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.total_price}</p>
                      {item.item_type === 'course' && order.payment_status === 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => window.location.href = `/learning/course/${item.courses?.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Access Course
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Payment Method:</span>
                  <Badge variant="outline">{order.payment_method}</Badge>
                </div>
                
                {order.receipt_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadReceipt(order.receipt_url!)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Receipt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserOrders;
