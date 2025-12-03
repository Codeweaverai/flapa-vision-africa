// src/pages/creator/lenco-token/success.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, CheckCircle, Clock, AlertCircle, ArrowRight, Home, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useTokens } from '@/hooks/useTokens';

const LencoTokenSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchTokens } = useTokens();
  
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'completed' | 'pending' | 'failed'>('checking');
  const [loading, setLoading] = useState(true);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Get parameters from URL
  const depositId = searchParams.get('deposit_id');
  const transactionId = searchParams.get('transaction_id');
  const userId = searchParams.get('user_id');
  const tokenAmount = searchParams.get('token_amount');
  const currency = searchParams.get('currency');
  const amountPaid = searchParams.get('amount_paid');
  const reference = searchParams.get('reference');
  const status = searchParams.get('status');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // First try to get reference from URL parameters
      let targetReference = reference;

      // If no reference in URL, try localStorage as fallback
      if (!targetReference) {
        const lastPayment = localStorage.getItem('lastTokenPayment');
        if (lastPayment) {
          const paymentData = JSON.parse(lastPayment);
          targetReference = paymentData.reference;
          console.log('Using reference from localStorage:', targetReference);
        }
      }

      if (!targetReference && depositId) {
        // If we have depositId but no reference, we might need to find the transaction first
        targetReference = depositId;
      }

      if (!targetReference) {
        toast.error('Invalid payment return URL - missing reference');
        navigate('/creator/tokens');
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase.functions.invoke('lenco-token-status', {
          body: {
            reference: targetReference
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
              toast.success(`Payment completed! ${data.transaction?.amount} tokens added to your account.`);
              await refetchTokens();
              // Clear localStorage on successful payment
              localStorage.removeItem('lastTokenPayment');
              break;
            case 'pending':
              setPaymentStatus('pending');
              startPolling(targetReference);
              break;
            case 'failed':
              setPaymentStatus('failed');
              toast.error('Payment failed. Please try again.');
              // Clear localStorage on failed payment
              localStorage.removeItem('lastTokenPayment');
              break;
            default:
              setPaymentStatus('pending');
              startPolling(targetReference);
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

    if (reference || depositId || localStorage.getItem('lastTokenPayment')) {
      checkPaymentStatus();
    } else {
      toast.error('Invalid payment return URL');
      navigate('/creator/tokens');
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [reference, depositId, navigate, refetchTokens]);

  const startPolling = (reference: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('lenco-token-status', {
          body: { reference: reference }
        });

        if (data?.success) {
          if (data.payment_status === 'completed') {
            clearInterval(pollInterval);
            setPollingInterval(null);
            setPaymentStatus('completed');
            setTransactionDetails(data);
            toast.success(`Payment completed! ${data.transaction?.amount} tokens added to your account.`);
            await refetchTokens();
            localStorage.removeItem('lastTokenPayment');
          } else if (data.payment_status === 'failed') {
            clearInterval(pollInterval);
            setPollingInterval(null);
            setPaymentStatus('failed');
            toast.error('Payment failed. Please try again.');
            localStorage.removeItem('lastTokenPayment');
          }
          // If still pending, continue polling
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Check every 3 seconds

    setPollingInterval(pollInterval);

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollingInterval) {
        clearInterval(pollInterval);
        setPollingInterval(null);
        if (paymentStatus === 'pending') {
          toast.info('Payment is taking longer than expected. Tokens will be added automatically when payment completes.');
        }
      }
    }, 600000); // 10 minutes
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

  const getMobileMoneyDetails = () => {
    if (!transactionDetails?.transaction?.metadata) return null;
    
    const metadata = transactionDetails.transaction.metadata;
    const lencoDetails = metadata.lenco_payment_details;
    const providerInfo = metadata.payment_provider_info;
    
    return {
      operator: lencoDetails?.operator,
      phone: lencoDetails?.phone,
      country: lencoDetails?.country,
      provider: providerInfo?.provider || 'lenco',
      lencoReference: providerInfo?.provider_reference
    };
  };

  const statusConfig = getStatusConfig();
  const mobileMoneyDetails = getMobileMoneyDetails();

  return (
    <CreatorLayout title="Payment Status - Lenco Mobile Money">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-lg">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mobile Money Payment Status
          </h1>
          <p className="text-gray-600">
            Powered by Lenco - Secure Mobile Money Payments
          </p>
        </div>

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
              <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-6">
                <h3 className="font-semibold text-gray-900 text-center">Transaction Details</h3>
                
                {/* Token Information */}
                <div className="flex items-center justify-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Coins className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-500">Tokens Added</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {transactionDetails?.transaction?.amount || tokenAmount || 0} tokens
                    </div>
                  </div>
                </div>

                {/* Payment Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Amount Paid */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Amount Paid</div>
                    <div className="font-semibold">
                      {transactionDetails?.transaction?.amount_paid || amountPaid || 0} {transactionDetails?.transaction?.currency || currency || 'ZMW'}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Status</div>
                    <div>
                      <Badge 
                        variant={
                          paymentStatus === 'completed' ? 'default' :
                          paymentStatus === 'pending' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {transactionDetails?.payment_status || paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  {transactionDetails?.transaction?.id && (
                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-600">Transaction ID</div>
                      <p className="font-mono text-xs truncate">{transactionDetails.transaction.id}</p>
                    </div>
                  )}

                  {/* Mobile Money Details */}
                  {mobileMoneyDetails && (
                    <>
                      <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center space-x-2 text-blue-800 mb-2">
                          <Smartphone className="h-4 w-4" />
                          <span className="font-semibold">Mobile Money Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Provider:</span>
                            <div className="font-medium capitalize">{mobileMoneyDetails.operator}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Country:</span>
                            <div className="font-medium uppercase">{mobileMoneyDetails.country}</div>
                          </div>
                          {mobileMoneyDetails.lencoReference && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Lenco Reference:</span>
                              <div className="font-mono text-xs">{mobileMoneyDetails.lencoReference}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Success Message */}
                {paymentStatus === 'completed' && (
                  <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      Success! {transactionDetails?.transaction?.amount || tokenAmount} tokens have been added to your account.
                    </span>
                  </div>
                )}

                {/* Pending Message */}
                {paymentStatus === 'pending' && (
                  <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">
                      Please check your phone to authorize the payment. Tokens will be added automatically once confirmed.
                    </span>
                  </div>
                )}
              </div>
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
              onClick={() => reference && startPolling(reference)}
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
            className="mt-4"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Help Text */}
        {paymentStatus === 'pending' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="font-semibold text-blue-800 text-center">Payment Processing Information</p>
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>Mobile money payments can take 1-5 minutes to process</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>Please check your phone for a payment authorization prompt</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>This page will automatically update when your payment is complete</span>
                  </div>
                </div>
                {reference && (
                  <div className="text-center mt-4">
                    <p className="text-xs text-blue-600 font-mono">
                      Reference: {reference}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Note */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Secure Payment Confirmed</p>
                <p className="text-sm text-green-600 mt-1">
                  Your payment was processed securely through Lenco's mobile money infrastructure. 
                  All transactions are encrypted and verified for your safety.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default LencoTopUpSuccess;
