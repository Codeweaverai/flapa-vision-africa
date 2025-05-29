
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const referenceId = searchParams.get('reference_id');
  
  useEffect(() => {
    const verifyAndUpdatePayment = async () => {
      if (!sessionId || !user) {
        setLoading(false);
        return;
      }

      try {
        // Verify payment with Stripe
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: {
            sessionId,
            userId: user.id,
            type: type || 'event',
            itemId: referenceId
          }
        });

        if (verifyError) throw verifyError;

        if (verifyData?.success) {
          setPaymentData({
            type: type || 'event',
            id: referenceId,
            title: verifyData.title,
            amount: verifyData.amount || '0',
            currency: 'USD',
            date: new Date().toISOString()
          });
          
          toast.success('Payment verified successfully!');
        } else {
          toast.error('Payment verification failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };
    
    verifyAndUpdatePayment();
  }, [sessionId, user, type, referenceId]);

  const handleRedirect = () => {
    if (paymentData?.type === 'event') {
      navigate('/my-events');
    } else if (paymentData?.type === 'course') {
      navigate('/my-courses');
    } else {
      navigate('/account');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{paymentData.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {new Date(paymentData.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button onClick={handleRedirect}>
                      {paymentData.type === 'event' ? (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          View My Events
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          View My Courses
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {!paymentData && (
                <div className="text-center py-8">
                  <p className="mb-6">Your purchase has been confirmed.</p>
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
