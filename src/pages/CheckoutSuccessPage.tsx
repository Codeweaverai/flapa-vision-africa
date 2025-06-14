
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Ticket, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handleSuccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (!sessionId) {
        toast.error('Invalid session. Please try again.');
        navigate('/checkout');
        return;
      }

      try {
        console.log('Processing payment verification for session:', sessionId);
        
        // Verify payment and process order
        const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-payment', {
          body: {
            sessionId,
            userId: user.id
          }
        });

        console.log('Verification response:', verificationData, verificationError);

        if (verificationError) {
          throw verificationError;
        }

        if (verificationData?.success) {
          setVerificationComplete(true);
          
          // Clear the cart after successful verification
          await clearCart();
          
          // Wait a moment for all processing to complete
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Fetch order details using the session ID
          const { data: order, error: orderError } = await supabase
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

          if (orderError) {
            console.error('Error fetching order:', orderError);
          } else {
            setOrderDetails(order);
          }

          toast.success('Payment successful! Your order has been confirmed.');
          
          // Auto-redirect to My Orders after 5 seconds
          setTimeout(() => {
            navigate('/account/orders');
          }, 5000);

        } else {
          throw new Error(verificationData?.message || 'Payment verification failed');
        }

      } catch (error) {
        console.error('Error handling success:', error);
        toast.error('There was an issue processing your order. Please contact support.');
        
        // Redirect to orders page anyway in case the order was processed
        setTimeout(() => {
          navigate('/account/orders');
        }, 3000);
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
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Processing your payment and generating tickets...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
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
                  Thank you for your purchase. Your order has been confirmed and is being processed.
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
                          COMPLETED
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span>{orderDetails.order_items?.length || 0} item(s)</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">What's happening now?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Payment processed successfully</li>
                    <li>✅ Order confirmed and saved</li>
                    <li>📧 Confirmation email being sent</li>
                    <li>🎫 Tickets and receipts being generated</li>
                    <li>📚 Course access being activated</li>
                  </ul>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    You will receive a confirmation email shortly with your receipt and any tickets.
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      🚀 Redirecting you to My Orders in a few seconds...
                    </p>
                  </div>
                  
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
