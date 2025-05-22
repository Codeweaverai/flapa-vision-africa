
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | 'verifying'>('verifying');
  const [itemDetails, setItemDetails] = useState<{
    id: string;
    type: 'course' | 'event';
    title?: string;
  } | null>(null);

  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !user) {
        setPaymentStatus('error');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error || !data.success) {
          throw new Error(error?.message || 'Payment verification failed');
        }

        // Payment was successful
        setPaymentStatus('success');
        
        // Extract item details based on the result
        const result = data.result;
        
        if (result.enrollment) {
          // It was a course enrollment
          const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('title')
            .eq('id', result.enrollment.course_id)
            .single();
            
          if (!courseError && course) {
            setItemDetails({
              id: result.enrollment.course_id,
              type: 'course',
              title: course.title
            });
          }
        } else if (result.registration) {
          // It was an event registration
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('title')
            .eq('id', result.registration.event_id)
            .single();
            
          if (!eventError && event) {
            setItemDetails({
              id: result.registration.event_id,
              type: 'event',
              title: event.title
            });
          }
        }

        toast.success('Payment completed successfully!');
      } catch (error) {
        console.error('Payment verification error:', error);
        setPaymentStatus('error');
        toast.error('Payment verification failed. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, user]);

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-md py-20">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we verify your payment...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md py-20">
        <Card>
          <CardHeader className="text-center">
            {paymentStatus === 'success' ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                <CardDescription>
                  {itemDetails?.title 
                    ? `You have successfully paid for "${itemDetails.title}".` 
                    : 'Your payment has been completed successfully.'}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Payment Failed</CardTitle>
                <CardDescription>
                  We couldn't verify your payment. Please contact our support team for assistance.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardFooter className="flex flex-col space-y-2">
            {paymentStatus === 'success' && itemDetails && (
              <Button asChild className="w-full">
                <Link to={itemDetails.type === 'course' 
                  ? `/courses/${itemDetails.id}` 
                  : `/events/${itemDetails.id}`}
                >
                  {itemDetails.type === 'course' 
                    ? 'Go to Course'
                    : 'View Event Details'}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return to Homepage</Link>
            </Button>
            {paymentStatus === 'error' && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/help">Contact Support</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
