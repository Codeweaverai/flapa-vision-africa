import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Calendar, BookOpen, Ticket, Sparkles, Gift, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(true);
  const [itemInfo, setItemInfo] = useState<any>(null);
  const [itemType, setItemType] = useState<'course' | 'event' | 'gift_card' | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  const depositId = searchParams.get('deposit_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (depositId && orderId) {
      verifyPaymentAndProcess();
    } else {
      setLoading(false);
      setProcessing(false);
      toast.error('Missing payment information');
    }
  }, [depositId, orderId]);

  const verifyPaymentAndProcess = async () => {
    try {
      setProcessing(true);

      // Call the check-pawapay-session-status function to verify and process payment
      const response = await fetch('/api/check-pawapay-session-status?depositId=' + depositId, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify payment');
      }

      if (result.processed) {
        // Payment was processed successfully, get order details
        await fetchOrderDetails();
        toast.success('Payment processed successfully!');
      } else {
        // Payment not completed yet, poll again
        setTimeout(() => {
          verifyPaymentAndProcess();
        }, 2000);
        return;
      }

    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error processing payment. Please contact support.');
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchOrderDetails = async () => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            courses:item_id(id, title, description, image_url),
            events:item_id(id, title, description, image_url, start_time, location),
            event_tickets:item_id(id, event_id, events(title, start_time, location))
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrderDetails(order);

      // Determine item type and info from order items
      const firstItem = order.order_items[0];
      if (firstItem) {
        if (firstItem.item_type === 'course' && firstItem.courses) {
          setItemType('course');
          setItemInfo(firstItem.courses);
        } else if (firstItem.item_type === 'event_ticket' && firstItem.events) {
          setItemType('event');
          setItemInfo(firstItem.events);
        } else if (firstItem.item_type === 'event_ticket' && firstItem.event_tickets) {
          setItemType('event');
          // Fetch event details from event_tickets relation
          const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', firstItem.event_tickets.event_id)
            .single();
          setItemInfo(event);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
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
      navigate('/');
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

  if (loading || processing) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="text-center border-0 shadow-2xl bg-white/90 backdrop-blur-sm max-w-md w-full">
            <CardContent className="p-8">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {processing ? 'Processing Your Payment...' : 'Loading...'}
              </h2>
              <p className="text-gray-600">
                {processing 
                  ? 'Please wait while we confirm your payment and enroll you in the course.'
                  : 'Getting your order details...'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

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
