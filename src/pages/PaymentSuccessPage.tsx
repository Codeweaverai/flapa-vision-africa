import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Calendar, BookOpen, Ticket, Sparkles, Gift, Loader2, AlertCircle, Clock, Home } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'completed' | 'pending' | 'failed'>('checking');
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [itemInfo, setItemInfo] = useState<any>(null);
  const [itemType, setItemType] = useState<'course' | 'event' | 'gift_card' | null>(null);

  // Get parameters from URL
  const depositId = searchParams.get('deposit_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // First try to get deposit_id from URL parameters
      let targetDepositId = depositId;

      // If no deposit_id in URL, try localStorage as fallback
      if (!targetDepositId) {
        const lastPayment = localStorage.getItem('lastPaymentAttempt');
        if (lastPayment) {
          const paymentData = JSON.parse(lastPayment);
          targetDepositId = paymentData.depositId;
          console.log('Using deposit_id from localStorage:', targetDepositId);
        }
      }

      if (!targetDepositId) {
        toast.error('Invalid payment return URL - missing deposit ID');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase.functions.invoke('check-pawapay-session-status', {
          body: {
            deposit_id: targetDepositId
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to check payment status');
        }

        if (data.success) {
          setOrderDetails(data.order);
          
          switch (data.payment_status) {
            case 'completed':
              setPaymentStatus('completed');
              toast.success('Payment completed! Your purchase has been processed.');
              await fetchOrderDetails(data.order.id);
              // Clear localStorage on successful payment
              localStorage.removeItem('lastPaymentAttempt');
              break;
            case 'pending':
              setPaymentStatus('pending');
              startPolling(targetDepositId);
              break;
            case 'failed':
            case 'cancelled':
              setPaymentStatus('failed');
              toast.error(`Payment ${data.payment_status}. Please try again.`);
              // Clear localStorage on failed payment
              localStorage.removeItem('lastPaymentAttempt');
              break;
            default:
              setPaymentStatus('pending');
              startPolling(targetDepositId);
          }
        }
      } catch (error: any) {
        console.error('Error checking payment status:', error);
        toast.error('Failed to verify payment status');
        setPaymentStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    if (depositId || localStorage.getItem('lastPaymentAttempt')) {
      checkPaymentStatus();
    } else {
      toast.error('Invalid payment return URL');
      navigate('/');
    }
  }, [depositId, navigate]);

  const startPolling = (depositId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-pawapay-session-status', {
          body: { deposit_id: depositId }
        });

        if (data.success && data.payment_status === 'completed') {
          clearInterval(pollInterval);
          setPaymentStatus('completed');
          setOrderDetails(data.order);
          toast.success('Payment completed! Your purchase has been processed.');
          await fetchOrderDetails(data.order.id);
          localStorage.removeItem('lastPaymentAttempt');
        } else if (data.success && (data.payment_status === 'failed' || data.payment_status === 'cancelled')) {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          toast.error(`Payment ${data.payment_status}. Please try again.`);
          localStorage.removeItem('lastPaymentAttempt');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'pending') {
        toast.info('Payment is taking longer than expected. Your order will be processed automatically when payment completes.');
      }
    }, 300000); // 5 minutes
  };

  const fetchOrderDetails = async (orderIdToFetch?: string) => {
    try {
      const targetOrderId = orderIdToFetch || orderId;
      if (!targetOrderId) return;

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            courses(id, title, description, image_url),
            events(id, title, description, image_url, start_time, location),
            event_tickets(id, event_id)
          )
        `)
        .eq('id', targetOrderId)
        .single();

      if (error) throw error;

      setOrderDetails(order);

      // Determine item type and info from order items
      const firstItem = order.order_items[0];
      if (firstItem) {
        if (firstItem.item_type === 'course') {
          setItemType('course');
          if (firstItem.courses) {
            setItemInfo(firstItem.courses);
          } else {
            // Fallback: fetch course directly
            const { data: course } = await supabase
              .from('courses')
              .select('*')
              .eq('id', firstItem.item_id)
              .single();
            setItemInfo(course);
          }
        } else if (firstItem.item_type === 'event_ticket') {
          setItemType('event');
          if (firstItem.events) {
            setItemInfo(firstItem.events);
          } else if (firstItem.event_tickets) {
            // Fetch event from event_tickets relation
            const { data: event } = await supabase
              .from('events')
              .select('*')
              .eq('id', firstItem.event_tickets.event_id)
              .single();
            setItemInfo(event);
          } else {
            // Fallback: try to find event through event_tickets table
            const { data: eventTicket } = await supabase
              .from('event_tickets')
              .select('events(*)')
              .eq('id', firstItem.item_id)
              .single();
            if (eventTicket?.events) {
              setItemInfo(eventTicket.events);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'completed':
        return {
          icon: <Check className="h-12 w-12 text-green-500" />,
          title: "Payment Completed!",
          description: "Your purchase has been successfully processed",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-orange-500" />,
          title: "Payment Processing",
          description: "Your payment is being processed. This may take a few moments...",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200"
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      default:
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: "Checking Payment Status",
          description: "Please wait while we verify your payment...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
    }
  };

  const handleContinue = () => {
    if (itemType === 'course' && orderDetails?.order_items[0]?.item_id) {
      navigate(`/learning/course/${orderDetails.order_items[0].item_id}`);
    } else if (itemType === 'event') {
      navigate('/my-events');
    } else if (itemType === 'gift_card') {
      navigate('/gift-cards');
    } else {
      navigate('/my-orders');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = getStatusConfig();

  if (paymentStatus !== 'completed') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 w-full">
            {/* Status Card */}
            <Card className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} shadow-xl`}>
              <CardContent className="pt-8">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    {statusConfig.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className={`text-3xl font-bold ${statusConfig.color}`}>
                      {statusConfig.title}
                    </h1>
                    <p className="text-lg text-gray-600">
                      {statusConfig.description}
                    </p>
                  </div>

                  {loading && (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}

                  {/* Transaction Details */}
                  {(orderDetails || depositId) && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                      <h3 className="font-semibold text-gray-900">Order Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {orderDetails?.id && (
                          <div>
                            <span className="text-gray-600">Order ID:</span>
                            <p className="font-mono text-xs">{orderDetails.id}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-semibold">
                            {orderDetails?.total_amount} {orderDetails?.currency}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <Badge 
                            variant={
                              paymentStatus === 'completed' ? 'default' :
                              paymentStatus === 'pending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {paymentStatus}
                          </Badge>
                        </div>
                        {depositId && (
                          <div>
                            <span className="text-gray-600">Reference:</span>
                            <p className="font-mono text-xs">{depositId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              {paymentStatus === 'pending' && (
                <Button
                  onClick={() => depositId && startPolling(depositId)}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Checking...' : 'Check Status Again'}
                </Button>
              )}

              {paymentStatus === 'failed' && (
                <Button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Try Again
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* Help Text */}
            {paymentStatus === 'pending' && (
              <Card className="bg-blue-50 border-blue-200 mt-6">
                <CardContent className="pt-6">
                  <div className="text-center text-blue-800">
                    <p className="font-semibold">Payment Processing</p>
                    <p className="text-sm mt-1">
                      Mobile money payments can take 1-5 minutes to process. 
                      This page will automatically update when your payment is complete.
                      {depositId && (
                        <span className="block mt-1 font-mono text-xs">
                          Deposit ID: {depositId}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Show success page only when payment is completed
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Payment Successful!
                </CardTitle>
                <div className="flex justify-center">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {itemInfo && (
                  <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-6 rounded-xl border border-orange-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      {itemType === 'course' ? 'Welcome to' : 
                       itemType === 'event' ? 'You\'re registered for' : 
                       'Your purchase of'}
                    </h3>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {itemInfo.title}
                    </h2>
                    
                    {itemType === 'event' && itemInfo.start_time && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center justify-center gap-3 text-gray-700">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">{formatDate(itemInfo.start_time)}</span>
                        </div>
                        {itemInfo.location && (
                          <div className="flex items-center justify-center gap-3 text-gray-600 mt-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                            <span className="text-sm">{itemInfo.location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-center space-x-3 text-green-800">
                    <Check className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-lg">
                      {itemType === 'course' ? 'You have been successfully enrolled!' :
                       itemType === 'event' ? 'Your registration has been confirmed!' :
                       'Your purchase has been completed successfully!'}
                    </span>
                  </div>
                  {orderDetails && (
                    <p className="text-sm text-green-700 mt-2">
                      Order #: {orderDetails.id}
                    </p>
                  )}
                </div>

                {/* Benefits List */}
                <div className="space-y-4 text-sm text-gray-700">
                  {itemType === 'course' && (
                    <>
                      <div className="flex items-center justify-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Lifetime access to course materials</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Access on mobile and desktop</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Certificate upon completion</span>
                      </div>
                    </>
                  )}
                  
                  {itemType === 'event' && (
                    <>
                      <div className="flex items-center justify-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Digital tickets delivered to your account</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Calendar reminder sent to your email</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Access to event materials</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {itemType === 'course' && (
                    <Button 
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Start Learning
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  
                  {itemType === 'event' && (
                    <Button 
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3"
                    >
                      <Ticket className="w-5 h-5 mr-2" />
                      View My Tickets
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold py-3"
                  >
                    <Link to="/my-orders">
                      View All Orders
                    </Link>
                  </Button>

                  {itemType === 'course' && (
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold py-3"
                    >
                      <Link to="/my-courses">
                        My Courses
                      </Link>
                    </Button>
                  )}
                  
                  {itemType === 'event' && (
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold py-3"
                    >
                      <Link to="/my-events">
                        My Events
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    A confirmation email has been sent to {user?.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccessPage;
