import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, CheckCircle, Clock, AlertCircle, ArrowRight, Home } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useTokens } from '@/hooks/useTokens';

const TokenTopUpSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchTokens } = useTokens();
  
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'completed' | 'pending' | 'failed'>('checking');
  const [loading, setLoading] = useState(true);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  const depositId = searchParams.get('deposit_id');
  const transactionId = searchParams.get('transaction_id');
  const userId = searchParams.get('user_id');

  useEffect(() => {
    if (depositId) {
      checkPaymentStatus();
    } else {
      toast.error('Invalid payment return URL');
      navigate('/creator/tokens');
    }
  }, [depositId, navigate]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: {
          deposit_id: depositId
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to check payment status');
      }

      if (data.success) {
        setTransactionDetails(data);
        
        switch (data.payment_status) {
          case 'completed':
            setPaymentStatus('completed');
            toast.success(`Payment completed! ${data.transaction.amount} tokens added to your account.`);
            await refetchTokens();
            break;
          case 'pending':
            setPaymentStatus('pending');
            // Start polling if still pending
            startPolling();
            break;
          case 'failed':
          case 'cancelled':
            setPaymentStatus('failed');
            toast.error(`Payment ${data.payment_status}. Please try again.`);
            break;
          default:
            setPaymentStatus('pending');
            startPolling();
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

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-payment-status', {
          body: { deposit_id: depositId }
        });

        if (data.success && data.payment_status === 'completed') {
          clearInterval(pollInterval);
          setPaymentStatus('completed');
          setTransactionDetails(data);
          toast.success(`Payment completed! ${data.transaction.amount} tokens added to your account.`);
          await refetchTokens();
        } else if (data.success && (data.payment_status === 'failed' || data.payment_status === 'cancelled')) {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          toast.error(`Payment ${data.payment_status}. Please try again.`);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'pending') {
        toast.info('Payment is taking longer than expected. Tokens will be added automatically when payment completes.');
      }
    }, 300000); // 5 minutes
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Payment Completed!",
          description: "Your tokens have been successfully added to your account",
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

  const statusConfig = getStatusConfig();

  return (
    <CreatorLayout title="Payment Status">
      <div className="max-w-2xl mx-auto space-y-8">
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
              {transactionDetails && (
                <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                  <h3 className="font-semibold text-gray-900">Transaction Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Transaction ID:</span>
                      <p className="font-mono text-xs">{transactionDetails.transaction.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-semibold">
                        {transactionDetails.transaction.amount} tokens
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount Paid:</span>
                      <p className="font-semibold">
                        {transactionDetails.transaction.amount_paid} {transactionDetails.pawapay_response?.data?.currency || 'ZMW'}
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
                        {transactionDetails.payment_status}
                      </Badge>
                    </div>
                  </div>

                  {paymentStatus === 'completed' && transactionDetails.tokens_updated && (
                    <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <Coins className="h-5 w-5" />
                      <span className="font-semibold">
                        +{transactionDetails.transaction.amount} tokens added to your balance!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {paymentStatus === 'completed' && (
            <>
              <Button
                onClick={() => navigate('/creator/courses/create-with-ai')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Creating Courses
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/creator/tokens')}
              >
                <Coins className="h-4 w-4 mr-2" />
                Buy More Tokens
              </Button>
            </>
          )}

          {paymentStatus === 'pending' && (
            <Button
              onClick={checkPaymentStatus}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Checking...' : 'Check Status Again'}
            </Button>
          )}

          {paymentStatus === 'failed' && (
            <>
              <Button
                onClick={() => navigate('/creator/tokens')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/creator/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate('/creator/dashboard')}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Help Text */}
        {paymentStatus === 'pending' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center text-blue-800">
                <p className="font-semibold">Payment Processing</p>
                <p className="text-sm mt-1">
                  Mobile money payments can take 1-5 minutes to process. 
                  This page will automatically update when your payment is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CreatorLayout>
  );
};

export default TokenTopUpSuccess;
