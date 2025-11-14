import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Heart, Users, Calendar, Home, Loader2, AlertCircle, Clock, Sparkles, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Contribution {
  id: string;
  amount: number;
  currency: string;
  transaction_fee: number;
  net_amount: number;
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
      let targetDepositId = depositId;

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
              localStorage.removeItem('lastFundraisingPayment');
              break;
            case 'pending':
              setPaymentStatus('pending');
              startPolling(targetDepositId);
              break;
            case 'failed':
              setPaymentStatus('failed');
              toast.error('Payment failed. Please try again.');
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
    }, 5000);

    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'pending') {
        toast.info('Payment is taking longer than expected. Your contribution will be processed automatically when payment completes.');
      }
    }, 300000);
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'completed':
        return {
          icon: <Check className="h-12 w-12 text-emerald-500" />,
          title: "Contribution Successful!",
          description: "Thank you for supporting this campaign",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200"
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
          icon: <AlertCircle className="h-12 w-12 text-rose-500" />,
          title: "Payment Failed",
          description: "Your contribution could not be processed. Please try again.",
          color: "text-rose-600",
          bgColor: "bg-rose-50",
          borderColor: "border-rose-200"
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
      navigate(`/fundraising/${contribution.fundraising_campaigns.id}`);
    } else {
      navigate('/fundraising');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 w-full">
            <Card className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} shadow-xl border-0`}>
              <CardContent className="pt-8">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    {statusConfig.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className={`text-2xl font-bold ${statusConfig.color}`}>
                      {statusConfig.title}
                    </h1>
                    <p className="text-slate-600 text-sm">
                      {statusConfig.description}
                    </p>
                  </div>

                  {loading && (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}

                  {(contribution || depositId) && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-slate-200 space-y-3">
                      <h3 className="font-semibold text-slate-900 text-sm">Contribution Details</h3>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {contribution?.id && (
                          <div>
                            <span className="text-slate-600">Contribution ID:</span>
                            <p className="font-mono text-xs">{contribution.id}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-600">Amount:</span>
                          <p className="font-semibold text-slate-900">
                            {contribution ? (
                              <PriceDisplay 
                                amount={contribution.amount} 
                                originalCurrency={contribution.currency}
                                showOriginal={false}
                              />
                            ) : 'Loading...'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600">Status:</span>
                          <Badge 
                            className={
                              paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              paymentStatus === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-rose-100 text-rose-800 border-rose-200'
                            }
                          >
                            {paymentStatus}
                          </Badge>
                        </div>
                        {depositId && (
                          <div>
                            <span className="text-slate-600">Reference:</span>
                            <p className="font-mono text-xs">{depositId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              {paymentStatus === 'pending' && (
                <Button
                  onClick={() => depositId && startPolling(depositId)}
                  disabled={loading}
                  variant="outline"
                  className="border-slate-300 hover:bg-white/80"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Status Again'
                  )}
                </Button>
              )}

              {paymentStatus === 'failed' && (
                <Button
                  onClick={() => navigate('/fundraising')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300"
                >
                  Try Again
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="hover:bg-white/80"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {paymentStatus === 'pending' && (
              <Card className="bg-blue-50 border-blue-200 mt-6 border-0">
                <CardContent className="pt-6">
                  <div className="text-center text-blue-800 text-sm">
                    <p className="font-semibold">Payment Processing</p>
                    <p className="mt-1">
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Thank You for Your Support!
                </CardTitle>
                <div className="flex justify-center gap-1">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {contribution && (
                  <>
                    <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-4 rounded-xl border border-orange-200">
                      <h3 className="text-base font-semibold mb-2 text-slate-800 flex items-center justify-center gap-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        You're supporting
                      </h3>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {contribution.fundraising_campaigns.title}
                      </h2>
                      
                      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between text-xs text-slate-700 mb-2">
                          <span>Campaign Progress</span>
                          <span>
                            {calculateProgress(
                              contribution.fundraising_campaigns.current_amount,
                              contribution.fundraising_campaigns.goal_amount
                            ).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 h-1.5 rounded-full" 
                            style={{
                              width: `${calculateProgress(
                                contribution.fundraising_campaigns.current_amount,
                                contribution.fundraising_campaigns.goal_amount
                              )}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mt-1">
                          <span>
                            <PriceDisplay 
                              amount={contribution.fundraising_campaigns.current_amount} 
                              originalCurrency={contribution.fundraising_campaigns.currency}
                              showOriginal={false}
                            /> raised
                          </span>
                          <span>
                            Goal: <PriceDisplay 
                              amount={contribution.fundraising_campaigns.goal_amount} 
                              originalCurrency={contribution.fundraising_campaigns.currency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-center gap-2 text-emerald-800 mb-2">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-base">
                          Contribution Confirmed!
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-700 mb-1">
                          <PriceDisplay 
                            amount={contribution.amount} 
                            originalCurrency={contribution.currency}
                            showOriginal={false}
                          />
                        </div>
                        <div className="text-xs text-emerald-700 space-y-0.5">
                          <p>Contribution ID: {contribution.id}</p>
                          <p>Date: {formatDate(contribution.created_at)}</p>
                          {contribution.transaction_fee > 0 && (
                            <p>Transaction Fee: <PriceDisplay 
                              amount={contribution.transaction_fee} 
                              originalCurrency={contribution.currency}
                              showOriginal={false}
                            /></p>
                          )}
                          {contribution.net_amount > 0 && (
                            <p>Net to Campaign: <PriceDisplay 
                              amount={contribution.net_amount} 
                              originalCurrency={contribution.currency}
                              showOriginal={false}
                            /></p>
                          )}
                          {contribution.is_anonymous && (
                            <p className="font-semibold">✓ Anonymous Contribution</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {contribution.campaign_rewards && (
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <h3 className="font-semibold text-orange-800 mb-2 text-sm flex items-center justify-center gap-1">
                          🎁 You've Unlocked a Reward!
                        </h3>
                        <div className="text-left bg-white p-3 rounded-lg border border-orange-200">
                          <h4 className="font-bold text-orange-600 text-sm">
                            {contribution.campaign_rewards.title}
                          </h4>
                          <p className="text-slate-700 mt-1 text-xs">
                            {contribution.campaign_rewards.description}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>You'll receive updates about your reward via email</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {contribution.message_to_creator && (
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <h3 className="font-semibold text-purple-800 mb-2 text-sm flex items-center justify-center gap-1">
                          💌 Your Message to the Creator
                        </h3>
                        <p className="text-slate-700 italic text-center text-sm">
                          "{contribution.message_to_creator}"
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>You're now part of this campaign's supporter community</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>You'll receive campaign updates and progress reports</span>
                  </div>
                  {contribution?.campaign_rewards && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-orange-50 rounded-lg">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Your reward will be delivered as described by the creator</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  <Button 
                    onClick={handleViewCampaign}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300 text-sm h-10"
                  >
                    <Heart className="w-4 h-4 mr-1.5" />
                    View Campaign
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>

                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-white/80 font-semibold text-sm h-10"
                  >
                    <Link to="/fundraising">
                      <Users className="w-4 h-4 mr-1.5" />
                      Explore More
                    </Link>
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
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
