import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Heart, Users, Calendar, Home, Loader2, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Contribution {
  id: string;
  amount: number;
  currency: string; // ✅ ADDED CURRENCY FIELD
  transaction_fee: number; // ✅ ADDED TRANSACTION FEE
  net_amount: number; // ✅ ADDED NET AMOUNT
  status: string;
  is_anonymous: boolean;
  message_to_creator: string;
  created_at: string;
  transaction_id: string;
  fundraising_campaigns: {
    id: string;
    title: string;
    goal_amount: number;
    current_amount: number;
    currency: string;
  };
  campaign_rewards?: {
    id: string;
    title: string;
    amount: number;
    description: string;
  };
  profiles: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

// Helper function to format currency display
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const FundraisingPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'completed' | 'pending' | 'failed'>('checking');
  const [loading, setLoading] = useState(true);
  const [contribution, setContribution] = useState<Contribution | null>(null);

  // Get parameters from URL
  const depositId = searchParams.get('deposit_id');
  const contributionId = searchParams.get('contribution_id');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // First try to get deposit_id from URL parameters
      let targetDepositId = depositId;

      // If no deposit_id in URL, try localStorage as fallback
      if (!targetDepositId) {
        const lastPayment = localStorage.getItem('lastFundraisingPayment');
        if (lastPayment) {
          const paymentData = JSON.parse(lastPayment);
          targetDepositId = paymentData.depositId;
          console.log('Using deposit_id from localStorage:', targetDepositId);
        }
      }

      if (!targetDepositId) {
        toast.error('Invalid payment return URL - missing deposit ID');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase.functions.invoke('check-fundraising-payment-status', {
          body: {
            deposit_id: targetDepositId
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to check payment status');
        }

        if (data.success) {
          setContribution(data.contribution);
          
          switch (data.payment_status) {
            case 'completed':
              setPaymentStatus('completed');
              toast.success('Payment completed! Thank you for your contribution.');
              // Clear localStorage on successful payment
              localStorage.removeItem('lastFundraisingPayment');
              break;
            case 'pending':
              setPaymentStatus('pending');
              startPolling(targetDepositId);
              break;
            case 'failed':
              setPaymentStatus('failed');
              toast.error('Payment failed. Please try again.');
              // Clear localStorage on failed payment
              localStorage.removeItem('lastFundraisingPayment');
              break;
            default:
              setPaymentStatus('pending');
              startPolling(targetDepositId);
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

    if (depositId || localStorage.getItem('lastFundraisingPayment')) {
      checkPaymentStatus();
    } else {
      toast.error('Invalid payment return URL');
      navigate('/');
    }
  }, [depositId, navigate]);

  const startPolling = (depositId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-fundraising-payment-status', {
          body: { deposit_id: depositId }
        });

        if (data.success && data.payment_status === 'completed') {
          clearInterval(pollInterval);
          setPaymentStatus('completed');
          setContribution(data.contribution);
          toast.success('Payment completed! Thank you for your contribution.');
          localStorage.removeItem('lastFundraisingPayment');
        } else if (data.success && data.payment_status === 'failed') {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          toast.error('Payment failed. Please try again.');
          localStorage.removeItem('lastFundraisingPayment');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'pending') {
        toast.info('Payment is taking longer than expected. Your contribution will be processed automatically when payment completes.');
      }
    }, 300000); // 5 minutes
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'completed':
        return {
          icon: <Check className="h-12 w-12 text-green-500" />,
          title: "Contribution Successful!",
          description: "Thank you for supporting this campaign",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-orange-500" />,
          title: "Payment Processing",
          description: "Your contribution is being processed. This may take a few moments...",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200"
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: "Payment Failed",
          description: "Your contribution could not be processed. Please try again.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      default:
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: "Checking Payment Status",
          description: "Please wait while we verify your contribution...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
    }
  };

  const handleViewCampaign = () => {
    if (contribution?.fundraising_campaigns?.id) {
      navigate(`/campaign/${contribution.fundraising_campaigns.id}`);
    } else {
      navigate('/campaigns');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const statusConfig = getStatusConfig();

  if (paymentStatus !== 'completed') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 w-full">
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

                  {/* Contribution Details */}
                  {(contribution || depositId) && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                      <h3 className="font-semibold text-gray-900">Contribution Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {contribution?.id && (
                          <div>
                            <span className="text-gray-600">Contribution ID:</span>
                            <p className="font-mono text-xs">{contribution.id}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-semibold">
                            {/* ✅ REMOVED PriceDisplay - use direct formatting */}
                            {contribution ? formatCurrency(contribution.amount, contribution.currency) : 'Loading...'}
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
                            {paymentStatus}
                          </Badge>
                        </div>
                        {depositId && (
                          <div>
                            <span className="text-gray-600">Reference:</span>
                            <p className="font-mono text-xs">{depositId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              {paymentStatus === 'pending' && (
                <Button
                  onClick={() => depositId && startPolling(depositId)}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Checking...' : 'Check Status Again'}
                </Button>
              )}

              {paymentStatus === 'failed' && (
                <Button
                  onClick={() => navigate('/campaigns')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Try Again
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* Help Text */}
            {paymentStatus === 'pending' && (
              <Card className="bg-blue-50 border-blue-200 mt-6">
                <CardContent className="pt-6">
                  <div className="text-center text-blue-800">
                    <p className="font-semibold">Payment Processing</p>
                    <p className="text-sm mt-1">
                      Mobile money payments can take 30 seconds to process. 
                      This page will automatically update when your payment is complete.
                      {depositId && (
                        <span className="block mt-1 font-mono text-xs">
                          Deposit ID: {depositId}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Show success page only when payment is completed
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Thank You for Your Support!
                </CardTitle>
                <div className="flex justify-center">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {contribution && (
                  <>
                    {/* Campaign Info */}
                    <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-6 rounded-xl border border-orange-200">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        You're supporting
                      </h3>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {contribution.fundraising_campaigns.title}
                      </h2>
                      
                      {/* Progress Update */}
                      <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                          <span>Campaign Progress</span>
                          <span>
                            {calculateProgress(
                              contribution.fundraising_campaigns.current_amount,
                              contribution.fundraising_campaigns.goal_amount
                            ).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 h-2 rounded-full" 
                            style={{
                              width: `${calculateProgress(
                                contribution.fundraising_campaigns.current_amount,
                                contribution.fundraising_campaigns.goal_amount
                              )}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>
                            {/* ✅ REMOVED PriceDisplay - use direct formatting */}
                            {formatCurrency(contribution.fundraising_campaigns.current_amount, contribution.fundraising_campaigns.currency)} raised
                          </span>
                          <span>
                            Goal: {formatCurrency(contribution.fundraising_campaigns.goal_amount, contribution.fundraising_campaigns.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contribution Details */}
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center justify-center space-x-3 text-green-800">
                        <Check className="w-6 h-6 text-green-600" />
                        <span className="font-semibold text-lg">
                          Your contribution of {' '}
                          {/* ✅ REMOVED PriceDisplay - use direct formatting */}
                          {formatCurrency(contribution.amount, contribution.currency)}{' '}
                          has been confirmed!
                        </span>
                      </div>
                      <div className="text-sm text-green-700 mt-2 space-y-1">
                        <p>Contribution ID: {contribution.id}</p>
                        <p>Date: {formatDate(contribution.created_at)}</p>
                        {/* ✅ ADDED Transaction Fee Display */}
                        {contribution.transaction_fee > 0 && (
                          <p>Transaction Fee: {formatCurrency(contribution.transaction_fee, contribution.currency)}</p>
                        )}
                        {/* ✅ ADDED Net Amount Display */}
                        {contribution.net_amount > 0 && (
                          <p>Net to Campaign: {formatCurrency(contribution.net_amount, contribution.currency)}</p>
                        )}
                        {contribution.is_anonymous && (
                          <p className="font-semibold">✓ Anonymous Contribution</p>
                        )}
                      </div>
                    </div>

                    {/* Reward Information */}
                    {contribution.campaign_rewards && (
                      <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                        <h3 className="font-semibold text-orange-800 mb-3">
                          🎁 You've Unlocked a Reward!
                        </h3>
                        <div className="text-left bg-white p-4 rounded-lg border border-orange-200">
                          <h4 className="font-bold text-orange-600 text-lg">
                            {contribution.campaign_rewards.title}
                          </h4>
                          <p className="text-gray-700 mt-2">
                            {contribution.campaign_rewards.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-sm text-orange-600">
                            <Calendar className="w-4 h-4" />
                            <span>You'll receive updates about your reward via email</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message to Creator */}
                    {contribution.message_to_creator && (
                      <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                        <h3 className="font-semibold text-purple-800 mb-2">
                          💌 Your Message to the Creator
                        </h3>
                        <p className="text-gray-700 italic text-center">
                          "{contribution.message_to_creator}"
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Benefits List */}
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-center justify-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>You're now part of this campaign's supporter community</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>You'll receive campaign updates and progress reports</span>
                  </div>
                  {contribution?.campaign_rewards && (
                    <div className="flex items-center justify-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Your reward will be delivered as described by the creator</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <Button 
                    onClick={handleViewCampaign}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    View Campaign
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold py-3"
                  >
                    <Link to="/campaigns">
                      <Users className="w-5 h-5 mr-2" />
                      Explore More Campaigns
                    </Link>
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    A confirmation email has been sent to {user?.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FundraisingPaymentSuccess;
