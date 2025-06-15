
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Ticket, BookOpen, Loader2, Download, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfillmentResults, setFulfillmentResults] = useState<any[]>([]);

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
        console.log('Processing payment success for session:', sessionId);
        
        // Use the consolidated verify-payment function
        const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-payment', {
          body: {
            sessionId,
            userId: user.id
          }
        });

        if (verificationError || !verificationData?.success) {
          throw new Error('Payment verification failed');
        }

        console.log('Payment verified successfully:', verificationData);
        
        setFulfillmentResults(verificationData.fulfillmentResults || []);

        // Fetch order details using the order ID from verification
        if (verificationData.orderId) {
          const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select(`
              *,
              order_items (*)
            `)
            .eq('id', verificationData.orderId)
            .single();

          if (orderError) {
            console.error('Error fetching order details:', orderError);
          } else {
            setOrderDetails(order);
          }

          // Check for generated tickets
          const { data: generatedTickets } = await supabaseClient
            .from('generated_tickets')
            .select(`
              *,
              events (title, start_time, location)
            `)
            .eq('order_id', verificationData.orderId);

          if (generatedTickets) {
            setTickets(generatedTickets);
          }
        }

        // Clear cart after successful processing
        await clearCart();
        
        // Show success message based on fulfillment results
        if (verificationData.fulfillmentResults) {
          const courses = verificationData.fulfillmentResults.filter((r: any) => r.type === 'course').length;
          const events = verificationData.fulfillmentResults.filter((r: any) => r.type === 'event').length;
          
          let message = 'Payment successful! ';
          if (courses > 0) message += `Enrolled in ${courses} course(s). `;
          if (events > 0) message += `Registered for ${events} event(s). `;
          
          toast.success(message);
        } else {
          toast.success('Payment successful! Your order has been confirmed.');
        }

      } catch (error) {
        console.error('Error handling success:', error);
        toast.error('There was an issue processing your order. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    handleSuccess();
  }, [sessionId, user, navigate, clearCart]);

  const downloadTicket = (ticket: any) => {
    if (ticket.pdf_url) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(atob(ticket.pdf_url.split(',')[1]));
        newWindow.document.close();
      }
      toast.success('Ticket opened in new window');
    } else {
      toast.error('Ticket not available for download');
    }
  };

  const downloadReceipt = () => {
    if (orderDetails?.receipt_url) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(atob(orderDetails.receipt_url.split(',')[1]));
        newWindow.document.close();
      }
      toast.success('Receipt opened in new window');
    } else {
      toast.error('Receipt not available');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Processing your payment and completing your order...</p>
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
                  Thank you for your purchase. Your order has been confirmed and processed.
                </p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Fulfillment Summary */}
                {fulfillmentResults.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3">Order Completed Successfully</h3>
                    <div className="space-y-2">
                      {fulfillmentResults.map((result, index) => (
                        <div key={index} className="flex items-center space-x-2 text-green-700">
                          {result.type === 'course' ? (
                            <BookOpen className="h-4 w-4" />
                          ) : (
                            <Ticket className="h-4 w-4" />
                          )}
                          <span>
                            {result.type === 'course' 
                              ? 'Successfully enrolled in course' 
                              : 'Successfully registered for event'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                        <span className="font-semibold">${orderDetails.total_amount.toFixed(2)} {orderDetails.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span>{orderDetails.order_items?.length || 0} item(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-green-600 font-semibold">Completed</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tickets Section */}
                {tickets.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Ticket className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">Your Event Tickets</h3>
                    </div>
                    <div className="space-y-2">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <div className="font-medium text-sm">{ticket.events?.title || 'Event'}</div>
                            <div className="text-xs text-gray-600">{ticket.ticket_holder_name}</div>
                            <div className="text-xs text-gray-500">Code: {ticket.ticket_code}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadTicket(ticket)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">What's Next?</h3>
                  <div className="space-y-2 text-sm text-orange-700">
                    {fulfillmentResults.some(r => r.type === 'course') && (
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Start learning by visiting your enrolled courses</span>
                      </div>
                    )}
                    {fulfillmentResults.some(r => r.type === 'event') && (
                      <div className="flex items-center space-x-2">
                        <Ticket className="h-4 w-4" />
                        <span>Your event tickets are ready for download</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Check your email for order confirmation and receipts</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => navigate('/account/orders')} 
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    View My Orders
                  </Button>
                  
                  {fulfillmentResults.some(r => r.type === 'course') && (
                    <Button 
                      onClick={() => navigate('/learning')} 
                      variant="outline"
                      className="flex-1"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Learning
                    </Button>
                  )}
                  
                  {fulfillmentResults.some(r => r.type === 'event') && (
                    <Button 
                      onClick={() => navigate('/my-events')} 
                      variant="outline"
                      className="flex-1"
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      My Events
                    </Button>
                  )}
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
