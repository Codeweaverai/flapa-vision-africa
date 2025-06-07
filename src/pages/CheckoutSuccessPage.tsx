
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Download, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (sessionId || orderId) {
      verifyOrderAndClearCart();
    } else {
      setLoading(false);
    }
  }, [sessionId, orderId]);

  const verifyOrderAndClearCart = async () => {
    try {
      let order = null;
      
      if (orderId) {
        // Direct order ID provided
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              courses:item_id (title),
              event_tickets:item_id (name, event_id, events:event_id (title, start_time))
            )
          `)
          .eq('id', orderId)
          .single();
          
        if (!error) order = data;
      } else if (sessionId) {
        // Find order by payment provider ID (Stripe session)
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              courses:item_id (title),
              event_tickets:item_id (name, event_id, events:event_id (title, start_time))
            )
          `)
          .eq('payment_provider_id', sessionId)
          .single();
          
        if (!error) order = data;
      }

      if (order) {
        setOrderData(order);
        
        // Clear cart on successful order
        if (order.payment_status === 'completed') {
          await clearCart();
          toast.success('Order completed successfully!');
        }
      } else {
        toast.error('Order not found');
      }
    } catch (error) {
      console.error('Error verifying order:', error);
      toast.error('Error verifying order');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (orderData?.receipt_url) {
      window.open(orderData.receipt_url, '_blank');
    } else {
      toast.error('Receipt not available');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!orderData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Order Not Found</h2>
              <p className="text-gray-600 mb-4">We couldn't find your order. Please check your email for confirmation details.</p>
              <Button onClick={() => navigate('/')}>Return Home</Button>
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
          <div className="max-w-3xl mx-auto">
            <Card className="text-center mb-8">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
                <p className="text-gray-600">Order #{orderData.id.slice(-8)}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Your order has been confirmed!</span>
                  </div>
                </div>

                <div className="text-left space-y-4">
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  {orderData.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {item.item_type === 'course' ? item.courses?.title : item.event_tickets?.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.item_type === 'course' ? 'Course' : `Event Ticket (${item.quantity}x)`}
                        </p>
                        {item.event_tickets?.events && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(item.event_tickets.events.start_time).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold">${item.total_price}</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center text-lg font-bold pt-4 border-t">
                    <span>Total:</span>
                    <span>${orderData.total_amount}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {orderData.receipt_url && (
                    <Button onClick={downloadReceipt} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </Button>
                  )}
                  <Button onClick={() => navigate('/account/orders')}>
                    View My Orders
                    <ArrowRight className="w-4 h-4 ml-2" />
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

export default CheckoutSuccessPage;
