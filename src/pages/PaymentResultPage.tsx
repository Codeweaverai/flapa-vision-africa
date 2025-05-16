
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const paymentId = searchParams.get('paymentId');
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!type || !id) {
        setStatus('failed');
        toast({
          title: "Error",
          description: "Missing payment information",
          variant: "destructive"
        });
        return;
      }

      try {
        // Find the payment transaction
        const { data: transactions, error: txError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('reference_type', type)
          .eq('reference_id', id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (txError || !transactions || transactions.length === 0) {
          console.error('Error finding transaction:', txError);
          setStatus('failed');
          toast({
            title: "Payment Error",
            description: "Could not find your payment record",
            variant: "destructive"
          });
          return;
        }
        
        const transaction = transactions[0];
        setPaymentDetails(transaction);
        
        // Verify payment with the backend
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: {
            paymentId: transaction.id,
            referenceType: type,
            referenceId: id
          }
        });
        
        if (error) {
          console.error('Error verifying payment:', error);
          setStatus('failed');
          toast({
            title: "Verification Failed",
            description: "Unable to verify your payment status",
            variant: "destructive"
          });
          return;
        }
        
        // Update the UI based on the payment status
        if (data.status === 'completed') {
          setStatus('success');
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully"
          });
        } else if (data.status === 'failed') {
          setStatus('failed');
          toast({
            title: "Payment Failed",
            description: "Your payment was not successful",
            variant: "destructive"
          });
        } else {
          setStatus('pending');
          toast({
            title: "Payment Pending",
            description: "Your payment is being processed",
            variant: "default"
          });
        }
        
        setPaymentDetails({
          ...transaction,
          verificationResult: data
        });
        
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('failed');
        toast({
          title: "System Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    };
    
    if (user) {
      verifyPayment();
    }
  }, [type, id, paymentId, toast, user]);
  
  const handleNavigate = () => {
    if (type === 'event') {
      navigate('/events');
    } else if (type === 'consultation') {
      navigate('/consult');
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
                <div>{paymentDetails.reference_type} - {paymentDetails.reference_id.substring(0, 8)}...</div>
                
                <div className="text-muted-foreground">Status:</div>
                <div className={
                  status === 'success' ? 'text-green-600' : 
                  status === 'failed' ? 'text-red-600' : 
                  'text-amber-600'
                }>
                  {status.toUpperCase()}
                </div>
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
