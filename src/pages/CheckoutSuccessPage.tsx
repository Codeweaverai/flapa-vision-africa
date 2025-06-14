
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
  const [generatingTickets, setGeneratingTickets] = useState(false);

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
        
        // Verify payment first
        const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-payment', {
          body: {
            sessionId,
            userId: user.id
          }
        });

        if (verificationError || !verificationData?.success) {
          throw new Error('Payment verification failed');
        }

        // Fetch order details
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('stripe_session_id', sessionId)
          .eq('user_id', user.id)
          .single();

        if (orderError || !order) {
          throw new Error('Order not found');
        }

        setOrderDetails(order);

        // Check if order has event tickets that need generation
        const hasEventTickets = order.order_items.some((item: any) => item.item_type === 'event_ticket');
        
        if (hasEventTickets) {
          setGeneratingTickets(true);
          
          // Generate tickets and receipts
          const { data: ticketData, error: ticketError } = await supabase.functions.invoke('generate-event-tickets', {
            body: { orderId: order.id }
          });

          if (ticketError) {
            console.error('Error generating tickets:', ticketError);
            toast.error('Failed to generate tickets. Please contact support.');
          } else if (ticketData?.success) {
            toast.success('Tickets and receipt generated successfully!');
            
            // Fetch generated tickets
            const { data: generatedTickets } = await supabase
              .from('generated_tickets')
              .select(`
                *,
                events (title, start_time, location)
              `)
              .eq('order_id', order.id);

            if (generatedTickets) {
              setTickets(generatedTickets);
            }
          }
          
          setGeneratingTickets(false);
        }

        // Clear cart after successful processing
        await clearCart();
        
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
            <p className="text-gray-600">Processing your payment...</p>
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
                        <span className="font-semibold">${orderDetails.total_amount.toFixed(2)} {orderDetails.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span>{orderDetails.order_items?.length || 0} item(s)</span>
                      </div>
                    </div>
                  </div>
                )}

                {generatingTickets && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-blue-800">Generating your tickets and receipt...</span>
                    </div>
                  </div>
                )}

                {tickets.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                      <Ticket className="h-5 w-5 mr-2" />
                      Your Event Tickets ({tickets.length})
                    </h3>
                    <div className="space-y-2">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div>
                            <div className="font-medium">{ticket.events?.title}</div>
                            <div className="text-sm text-gray-600">{ticket.ticket_holder_name}</div>
                            <div className="text-xs text-gray-500">Code: {ticket.ticket_code}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => downloadTicket(ticket)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => navigate('/account/orders')}
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      View My Orders
                    </Button>
                    
                    {orderDetails?.receipt_url && (
                      <Button 
                        onClick={downloadReceipt}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
