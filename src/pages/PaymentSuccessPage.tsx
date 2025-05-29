
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  
  // Get payment data from URL parameters
  const paymentType = searchParams.get('type');
  const referenceId = searchParams.get('id');
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    const processPayment = async () => {
      if (!user || !sessionId || !paymentType || !referenceId) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Processing payment success for:', { paymentType, referenceId, sessionId });
        
        // Verify payment with Stripe and update database
        const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
          body: {
            sessionId,
            userId: user.id,
            referenceType: paymentType,
            referenceId
          }
        });

        if (error) {
          console.error('Payment verification error:', error);
          throw error;
        }

        if (data?.success) {
          console.log('Payment verified successfully:', data);
          
          // Update enrollment or booking status locally
          if (paymentType === 'course') {
            await supabase
              .from('course_enrollments')
              .upsert({
                user_id: user.id,
                course_id: referenceId,
                enrollment_date: new Date().toISOString(),
                payment_status: 'completed',
                payment_id: sessionId
              }, { onConflict: 'user_id,course_id' });
          } else if (paymentType === 'event') {
            await supabase
              .from('event_bookings')
              .upsert({
                user_id: user.id,
                event_id: referenceId,
                status: 'confirmed',
                payment_status: 'completed',
                payment_id: sessionId,
                booking_date: new Date().toISOString()
              }, { onConflict: 'user_id,event_id' });
          }

          setPaymentData({
            type: paymentType,
            id: referenceId,
            amount: data.amount || '0',
            currency: data.currency || 'USD',
            date: new Date().toISOString(),
            title: data.title || 'Purchase'
          });
          
          toast.success('Payment successful!');
        } else {
          throw new Error(data?.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        toast.error('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };
    
    processPayment();
  }, [user, sessionId, paymentType, referenceId]);

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-xl">Processing payment...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container py-12 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground">Thank you for your purchase</p>
              </div>
              
              {paymentData && (
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <h2 className="font-medium mb-2">Purchase Details</h2>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Item:</span>
                        <span className="font-medium">{paymentData.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">
                          {paymentData.currency} {paymentData.amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {new Date(paymentData.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-medium">{paymentData.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    {paymentType === 'event' && (
                      <Button asChild>
                        <Link to="/my-events">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Your Events
                        </Link>
                      </Button>
                    )}
                    
                    {paymentType === 'course' && (
                      <Button asChild>
                        <Link to={`/learning/course/${referenceId}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Start Learning
                        </Link>
                      </Button>
                    )}
                    
                    {!paymentType && (
                      <Button asChild>
                        <Link to="/account">
                          Go to My Account
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {!paymentData && (
                <div className="text-center py-8">
                  <p className="mb-6">We couldn't find details for this payment, but your purchase has been confirmed.</p>
                  <Button asChild>
                    <Link to="/account">Go to My Account</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccessPage;
