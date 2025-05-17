
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('status') || 'unknown');
  const navigate = useNavigate();
  
  const type = searchParams.get('type') || '';
  const id = searchParams.get('id') || '';
  const sessionId = searchParams.get('sessionId');
  
  // Redirect to appropriate page based on payment type
  const handleContinue = () => {
    if (type === 'event') {
      navigate('/events');
    } else if (type === 'consultation') {
      navigate('/consult');
    } else {
      navigate('/');
    }
  };
  
  useEffect(() => {
    // If we have a Stripe session ID, verify the payment status
    const verifyStripePayment = async () => {
      if (sessionId) {
        try {
          setVerifying(true);
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.error('No authentication session');
            return;
          }
          
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rxqoczksnddbxcdwobnw.supabase.co";
          const response = await fetch(`${supabaseUrl}/functions/v1/verify-stripe-payment?sessionId=${sessionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          const result = await response.json();
          if (result.status) {
            setPaymentStatus(result.status);
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
        } finally {
          setVerifying(false);
        }
      }
    };
    
    verifyStripePayment();
  }, [sessionId]);
  
  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'success':
      case 'completed':
        return (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <CardTitle className="text-2xl mb-2">Payment Successful!</CardTitle>
            <CardDescription className="text-lg">
              {type === 'event' 
                ? 'Your registration has been confirmed.' 
                : 'Your booking has been confirmed.'}
            </CardDescription>
          </div>
        );
      
      case 'pending':
      case 'processing':
        return (
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <CardTitle className="text-2xl mb-2">Payment Processing</CardTitle>
            <CardDescription className="text-lg">
              Your payment is being processed. We'll update you once it's confirmed.
            </CardDescription>
          </div>
        );
      
      case 'canceled':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <CardTitle className="text-2xl mb-2">Payment Cancelled</CardTitle>
            <CardDescription className="text-lg">
              You've cancelled the payment. No charges were made.
            </CardDescription>
          </div>
        );
      
      case 'failed':
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-2xl mb-2">Payment Failed</CardTitle>
            <CardDescription className="text-lg">
              We couldn't process your payment. Please try again later.
            </CardDescription>
          </div>
        );
      
      default:
        return (
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <CardTitle className="text-2xl mb-2">Verifying Payment</CardTitle>
            <CardDescription className="text-lg">
              Please wait while we verify your payment status...
            </CardDescription>
          </div>
        );
    }
  };
  
  return (
    <Layout>
      <div className="section-container">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <h1 className="text-2xl font-bold text-center">Payment Result</h1>
              </div>
            </CardHeader>
            
            <CardContent>
              {verifying ? (
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Verifying payment status...</p>
                </div>
              ) : (
                renderPaymentStatus()
              )}
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Button onClick={handleContinue}>
                {type === 'event' ? 'Back to Events' : type === 'consultation' ? 'Back to Consultations' : 'Back to Home'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
