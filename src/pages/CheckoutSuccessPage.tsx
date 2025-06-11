
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Ticket, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handleSuccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Clear the cart immediately
        await clearCart();

        if (sessionId) {
          // Fetch order details using the session ID
          const { data: order, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *
              )
            `)
            .eq('stripe_session_id', sessionId)
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching order:', error);
          } else {
            setOrderDetails(order);
          }
        }

        toast.success('Payment successful! Your order has been confirmed.');
      } catch (error) {
        console.error('Error handling success:', error);
        toast.error('There was an issue processing your order. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    handleSuccess();
  }, [sessionId, user, navigate, clearCart]);

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
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center bg-gradient-to-r from-green-100 to-emerald-100">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">
                  Payment Successful!
                </CardTitle>
                <p className="text-green-700">
                  Thank you for your purchase. Your order has been confirmed.
                </p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {orderDetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Order Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Order ID:</span>
                        <span className="font-mono">{orderDetails.id.slice(-8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">${orderDetails.total_amount.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className="text-green-600 font-semibold">
                          {orderDetails.payment_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    You will receive a confirmation email shortly with your receipt and order details.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => navigate('/account/orders')}
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      View My Orders
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/my-courses')}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Courses
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/my-events')}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      My Events
                    </Button>
                  </div>

                  <Button 
                    onClick={() => navigate('/')}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Continue Shopping
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
