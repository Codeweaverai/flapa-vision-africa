
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const txnId = searchParams.get('txnId');
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const statusParam = searchParams.get('status');
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!txnId) {
        setStatus('failed');
        toast.error("Missing payment information");
        return;
      }

      // If status is already provided in URL params, use it first
      if (statusParam) {
        if (statusParam === 'success' || statusParam === 'completed') {
          setStatus('success');
          toast.success("Your payment has been processed successfully");
        } else if (statusParam === 'failed' || statusParam === 'error') {
          setStatus('failed');
          toast.error("Your payment was not successful");
        } else if (statusParam === 'pending') {
          setStatus('pending');
          toast.info("Your payment is being processed");
        }
      }

      try {
        // First, fetch the payment details from our database
        const { data: transaction, error: txError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('id', txnId)
          .single();
          
        if (txError) {
          console.error('Error finding transaction:', txError);
          setStatus('failed');
          toast.error("Could not find your payment record");
          return;
        }
        
        setPaymentDetails(transaction);
        
        // If we didn't get status from URL, use the one in the database
        if (!statusParam && transaction) {
          if (transaction.status === 'completed') {
            setStatus('success');
            toast.success("Your payment has been processed successfully");
          } else if (transaction.status === 'failed') {
            setStatus('failed');
            toast.error("Your payment was not successful");
          } else {
            setStatus('pending');
          }
        }
        
        // Verify payment with the backend if still pending
        if (status === 'loading' || status === 'pending') {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: {
              txnId,
              type,
              id
            }
          });
          
          if (error) {
            console.error('Error verifying payment:', error);
            if (status === 'loading') {
              setStatus('pending');
              toast.info("Payment verification in progress");
            }
          } else if (data) {
            // Update status based on verification result
            if (data.status === 'completed') {
              setStatus('success');
              toast.success("Your payment has been processed successfully");
            } else if (data.status === 'failed') {
              setStatus('failed');
              toast.error("Your payment was not successful");
            } else {
              setStatus('pending');
              toast.info("Your payment is being processed");
            }
            
            // Update payment details if new information is available
            setPaymentDetails(prevDetails => ({
              ...prevDetails,
              ...data,
              verificationResult: data
            }));
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        if (status === 'loading') {
          setStatus('pending');
          toast.warning("Unable to verify payment status");
        }
      }
    };
    
    if (user) {
      verifyPayment();
    } else {
      // If no user is logged in, show a message and redirect to login
      toast.error("Please sign in to view payment details");
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [txnId, type, id, statusParam, user, navigate]);
  
  const handleNavigate = () => {
    if (type === 'event') {
      navigate('/events');
    } else if (type === 'consultation') {
      navigate('/account');
    } else {
      navigate('/');
    }
  };
  
  return (
    <Layout>
      <div className="section-container py-12">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                <p className="text-muted-foreground">Please wait while we verify your payment...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground">
                  {type === 'event' 
                    ? 'Your event registration is confirmed.' 
                    : 'Your consultation booking is confirmed.'}
                </p>
              </div>
            )}
            
            {status === 'pending' && (
              <div className="flex flex-col items-center">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Processing</h2>
                <p className="text-muted-foreground">
                  Your payment is being processed. We'll notify you when it's complete.
                </p>
              </div>
            )}
            
            {status === 'failed' && (
              <div className="flex flex-col items-center">
                <XCircle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                <p className="text-muted-foreground">
                  We couldn't process your payment. Please try again.
                </p>
              </div>
            )}
          </div>
          
          {paymentDetails && (
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h3 className="font-medium text-lg mb-2">Payment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Amount:</div>
                <div>{paymentDetails.amount} {paymentDetails.currency}</div>
                
                <div className="text-muted-foreground">Reference:</div>
                <div>{type || paymentDetails.reference_type} - {id?.substring(0, 8) || paymentDetails.reference_id?.substring(0, 8)}...</div>
                
                <div className="text-muted-foreground">Status:</div>
                <div className={
                  status === 'success' ? 'text-green-600' : 
                  status === 'failed' ? 'text-red-600' : 
                  'text-amber-600'
                }>
                  {status.toUpperCase()}
                </div>
                
                <div className="text-muted-foreground">Phone:</div>
                <div>{paymentDetails.phone_number}</div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleNavigate} className="w-full">
              {type === 'event' 
                ? 'View My Registrations' 
                : type === 'consultation'
                ? 'View My Bookings'
                : 'Return Home'}
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentResultPage;
