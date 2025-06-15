
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const sessionId = searchParams.get('session_id');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    console.log('[PAYMENT-RESULT] Page loaded with:', { sessionId, canceled, user: !!user });
    
    if (canceled) {
      console.log('[PAYMENT-RESULT] Payment was canceled');
      setLoading(false);
      setSuccess(false);
      toast.error('Payment was canceled');
      return;
    }

    if (!user) {
      console.log('[PAYMENT-RESULT] No user found, redirecting to auth');
      toast.error("You need to be logged in");
      navigate('/auth');
      return;
    }

    if (!sessionId) {
      console.log('[PAYMENT-RESULT] No session ID found');
      setLoading(false);
      setSuccess(false);
      toast.error('Invalid payment session');
      return;
    }

    // Redirect immediately to checkout success for processing
    console.log('[PAYMENT-RESULT] Redirecting to checkout success for processing');
    navigate(`/checkout/success?session_id=${sessionId}`, { replace: true });
  }, [user, navigate, sessionId, canceled]);

  const handleRedirect = () => {
    if (success) {
      navigate('/account/orders');
    } else {
      navigate(-1);
    }
  };

  return (
    <Layout>
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
              ) : success ? (
                <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500 mr-2" />
              )}
              {loading ? 'Redirecting...' : success ? 'Payment Successful' : 'Payment Issues'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center">Redirecting you to process your order...</p>
            ) : success ? (
              <div className="text-center space-y-2">
                <p>Your payment has been processed successfully!</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p>There was an issue with your payment.</p>
                <p>Please try again or contact support for assistance.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleRedirect} disabled={loading}>
              {success ? 'View My Orders' : 'Go Back'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
