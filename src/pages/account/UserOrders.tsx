
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Package, Users, Eye } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
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
  receipt_url?: string;
  order_items: OrderItem[];
}

const UserOrders = () => {
  const { user } = useAuth();
  const { currentCurrency } = useCurrency();
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
          order_items (*)
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
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadReceipt = (receiptUrl: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    } else {
      toast.error('Receipt not available');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Orders</h1>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">
                  When you make purchases, they will appear here.
                </p>
                <Button onClick={() => window.location.href = '/courses'}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <Badge className={getStatusColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          <PriceDisplay 
                            amount={order.total_amount} 
                            originalCurrency={order.currency as any}
                          />
                        </div>
                        {currentCurrency !== order.currency && (
                          <div className="text-sm text-gray-500">
                            {order.total_amount.toFixed(2)} {order.currency}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          via {order.payment_method}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Order Items:</h4>
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium">{item.item_name}</h5>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <Badge variant="outline">
                                {item.item_type === 'course' ? 'Course' : 'Event Ticket'}
                              </Badge>
                              {item.quantity > 1 && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>Qty: {item.quantity}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Show ticket holder names if available */}
                            {item.metadata?.ticket_holder_names && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border">
                                <div className="text-xs font-medium text-blue-800 mb-1">
                                  Ticket Holders:
                                </div>
                                <div className="text-xs text-blue-700">
                                  {item.metadata.ticket_holder_names
                                    .filter((holder: any) => holder.name)
                                    .map((holder: any, index: number) => (
                                      <div key={index}>• {holder.name}</div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold">
                              <PriceDisplay 
                                amount={item.total_price} 
                                originalCurrency={order.currency as any}
                              />
                            </div>
                            {currentCurrency !== order.currency && (
                              <div className="text-xs text-gray-500">
                                {item.total_price.toFixed(2)} {order.currency}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Payment Method: <span className="font-medium">{order.payment_method}</span>
                      </div>
                      <div className="flex gap-2">
                        {order.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReceipt(order.receipt_url!)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Receipt
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/order/${order.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserOrders;
