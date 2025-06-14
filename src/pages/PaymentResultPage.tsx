
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [itemType, setItemType] = useState<'course' | 'event' | 'order' | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState<string>('');

  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type') as 'course' | 'event';
  const id = searchParams.get('id');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (canceled) {
      setLoading(false);
      setSuccess(false);
      return;
    }

    if (!user) {
      toast.error("You need to be logged in");
      navigate('/auth');
      return;
    }

    if (!sessionId) {
      setLoading(false);
      setSuccess(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log("Verifying payment with session:", sessionId);
        
        // For cart-based checkout, we don't have type and id
        const requestBody: any = {
          sessionId,
          userId: user.id
        };

        // Add type and itemId only if they exist (individual purchases)
        if (type && id) {
          requestBody.type = type;
          requestBody.itemId = id;
          setItemType(type);
          setItemId(id);
        } else {
          // This is likely a cart-based order
          setItemType('order');
        }

        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: requestBody
        });

        console.log("Verification response:", data, error);

        if (error) throw error;

        if (data?.success) {
          setSuccess(true);
          setItemTitle(data.title || 'Your Order');
          toast.success(data.message || 'Payment successful!');
        } else {
          setSuccess(false);
          toast.error(data?.message || 'Unable to verify payment');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [user, navigate, sessionId, type, id, canceled]);

  const handleRedirect = () => {
    if (success) {
      if (itemType === 'course') {
        navigate(`/learning/course/${itemId}`);
      } else if (itemType === 'event') {
        navigate(`/my-events`);
      } else {
        navigate('/account/orders');
      }
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
              {loading ? 'Processing Payment' : success ? 'Payment Successful' : 'Payment Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center">Please wait while we verify your payment and process your order...</p>
            ) : success ? (
              <div className="text-center space-y-2">
                <p>Your payment has been processed successfully!</p>
                {itemTitle && <p className="font-medium">{itemTitle}</p>}
                <p>Thank you for your purchase.</p>
                {itemType === 'event' && (
                  <p className="text-sm text-blue-600">Your tickets and receipt are being generated and will be available in My Orders.</p>
                )}
                {itemType === 'course' && (
                  <p className="text-sm text-blue-600">You now have access to the course materials.</p>
                )}
                {itemType === 'order' && (
                  <p className="text-sm text-blue-600">Your order is complete. Tickets and receipts are being generated and will be available in My Orders.</p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p>We couldn't process your payment at this time.</p>
                <p>Please try again or contact support for assistance.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleRedirect} disabled={loading}>
              {success 
                ? itemType === 'course' 
                  ? 'Go to Course' 
                  : itemType === 'event' 
                    ? 'View My Events' 
                    : 'View My Orders' 
                : 'Go Back'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
