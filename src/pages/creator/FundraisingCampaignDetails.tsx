import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Eye, Edit, Users, DollarSign, Calendar, Share2, CreditCard, Smartphone, Building, TrendingUp } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  currency: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  use_of_funds: string | null;
  created_at: string;
}

interface Contribution {
  id: string;
  amount: number;
  currency: string;
  net_amount: number;
  transaction_fee: number;
  payment_method: string;
  payment_provider: string;
  supporter_id: string;
  is_anonymous: boolean;
  message_to_creator: string | null;
  created_at: string;
  status: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface CampaignStats {
  total_raised: number;
  total_net_amount: number;
  total_transaction_fees: number;
  contributions_count: number;
  payment_methods: { [key: string]: number };
  currencies: { [key: string]: number };
}

const FundraisingCampaignDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    if (!user || !campaignId) return;

    try {
      // Load campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('creator_id', user.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load contributions with all financial data
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .eq('campaign_id', campaignId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);

      // Calculate campaign statistics
      if (contributionsData) {
        const stats = calculateCampaignStats(contributionsData);
        setCampaignStats(stats);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const calculateCampaignStats = (contributions: Contribution[]): CampaignStats => {
    const completedContributions = contributions.filter(c => c.status === 'completed');
    
    const totalRaised = completedContributions.reduce((sum, contribution) => {
      return sum + Number(contribution.amount || 0);
    }, 0);

    const totalNetAmount = completedContributions.reduce((sum, contribution) => {
      return sum + Number(contribution.net_amount || contribution.amount || 0);
    }, 0);

    const totalTransactionFees = completedContributions.reduce((sum, contribution) => {
      return sum + Number(contribution.transaction_fee || 0);
    }, 0);

    // Group by payment method
    const paymentMethods = completedContributions.reduce((acc, contribution) => {
      const method = contribution.payment_method || 'unknown';
      const amount = Number(contribution.amount || 0);
      acc[method] = (acc[method] || 0) + amount;
      return acc;
    }, {} as { [key: string]: number });

    // Group by currency
    const currencies = completedContributions.reduce((acc, contribution) => {
      const currency = contribution.currency || 'USD';
      const amount = Number(contribution.amount || 0);
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {} as { [key: string]: number });

    return {
      total_raised: totalRaised,
      total_net_amount: totalNetAmount,
      total_transaction_fees: totalTransactionFees,
      contributions_count: completedContributions.length,
      payment_methods: paymentMethods,
      currencies: currencies
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_money': return <Smartphone className="h-3 w-3" />;
      case 'card': return <CreditCard className="h-3 w-3" />;
      case 'bank_transfer': return <Building className="h-3 w-3" />;
      default: return <DollarSign className="h-3 w-3" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'mobile_money': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'card': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bank_transfer': return 'bg-green-100 text-green-800 border-green-200';
      case 'paypal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const handleShareCampaign = async () => {
    if (!campaign) return;

    const shareUrl = `${window.location.origin}/fundraising/${campaign.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success('Campaign link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (!campaign) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="p-6 text-center">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl max-w-md mx-auto">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Eye className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Campaign Not Found</h3>
                <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or you don't have access to it.</p>
                <Button asChild>
                  <Link to="/creator/fundraising">
                    Back to Campaigns
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  const currentAmount = campaignStats?.total_raised || campaign.current_amount || 0;
  const netAmount = campaignStats?.total_net_amount || currentAmount;
  const goalAmount = campaign.goal_amount || 1;
  const progress = calculateProgress(currentAmount, goalAmount);
  const transactionFees = campaignStats?.total_transaction_fees || 0;

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/creator/fundraising">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{campaign.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusText(campaign.status)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Created {formatDate(campaign.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShareCampaign}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button asChild>
                <Link to={`/creator/fundraising/${campaign.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Cover & Progress */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
                <div className="relative h-64 bg-gradient-to-br from-orange-400 to-purple-400">
                  {campaign.cover_image_url ? (
                    <img 
                      src={campaign.cover_image_url} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <DollarSign className="w-16 h-16 mx-auto mb-2 opacity-80" />
                        <p className="text-lg font-semibold">No cover image</p>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        <PriceDisplay 
                          amount={currentAmount} 
                          originalCurrency={campaign.currency || 'USD'}
                          showOriginal={false}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Gross Raised</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        <PriceDisplay 
                          amount={netAmount} 
                          originalCurrency={campaign.currency || 'USD'}
                          showOriginal={false}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Net Amount</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        <PriceDisplay 
                          amount={transactionFees} 
                          originalCurrency={campaign.currency || 'USD'}
                          showOriginal={false}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Fees</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {campaignStats?.contributions_count || 0}
                      </div>
                      <p className="text-sm text-gray-600">Supporters</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{Math.round(progress)}% funded</span>
                    <span>
                      {campaign.end_date && `Ends ${formatDate(campaign.end_date)}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Breakdown */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Financial Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Gross Amount Raised:</span>
                      <span className="font-bold text-lg">
                        <PriceDisplay 
                          amount={currentAmount} 
                          originalCurrency={campaign.currency || 'USD'}
                          showOriginal={false}
                        />
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-700">Transaction Fees:</span>
                      <span className="font-bold text-lg text-red-700">
                        -<PriceDisplay 
                          amount={transactionFees} 
                          originalCurrency={campaign.currency || 'USD'}
                          showOriginal={false}
                        />
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <span className="font-medium text-green-800">Your Net Amount:</span>
                      <span className="font-bold text-lg text-green-800">
                        <PriceDisplay 
                          amount={netAmount} 
                          originalCurrency={campaign.currency || 'USD'}
                          showOriginal={false}
                        />
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  {campaignStats?.payment_methods && Object.keys(campaignStats.payment_methods).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Payment Methods</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(campaignStats.payment_methods).map(([method, amount]) => (
                          <Badge key={method} className={getPaymentMethodColor(method)}>
                            <span className="flex items-center gap-1">
                              {getPaymentMethodIcon(method)}
                              {method.replace('_', ' ')}: 
                              <PriceDisplay 
                                amount={amount} 
                                originalCurrency={campaign.currency || 'USD'}
                                showOriginal={false}
                                className="ml-1"
                              />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Currencies */}
                  {campaignStats?.currencies && Object.keys(campaignStats.currencies).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-3">Contributions by Currency</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(campaignStats.currencies).map(([currency, amount]) => (
                          <Badge key={currency} variant="outline" className="bg-white">
                            <span className="flex items-center gap-1">
                              {currency}: 
                              <PriceDisplay 
                                amount={amount} 
                                originalCurrency={currency}
                                showOriginal={false}
                                className="ml-1"
                              />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Description */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>About This Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {campaign.description}
                  </p>
                </CardContent>
              </Card>

              {/* Use of Funds */}
              {campaign.use_of_funds && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Use of Funds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {campaign.use_of_funds}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Campaign Stats */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusText(campaign.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{campaign.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium">{campaign.currency || 'USD'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">{formatDate(campaign.start_date)}</span>
                  </div>
                  {campaign.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ends:</span>
                      <span className="font-medium">{formatDate(campaign.end_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Supporters */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Supporters</CardTitle>
                  <CardDescription>
                    People who have supported this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contributions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No supporters yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contributions.slice(0, 5).map((contribution) => (
                        <div key={contribution.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                              {contribution.is_anonymous ? 'A' : contribution.profiles.full_name?.[0] || 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {contribution.is_anonymous ? 'Anonymous' : contribution.profiles.full_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                via {contribution.payment_method}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium block">
                              <PriceDisplay 
                                amount={contribution.amount} 
                                originalCurrency={contribution.currency || 'USD'}
                                showOriginal={false}
                              />
                            </span>
                            <span className="text-xs text-gray-500">
                              Net: <PriceDisplay 
                                amount={contribution.net_amount} 
                                originalCurrency={contribution.currency || 'USD'}
                                showOriginal={false}
                              />
                            </span>
                          </div>
                        </div>
                      ))}
                      {contributions.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          View all {contributions.length} supporters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Public View */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <Button asChild className="w-full">
                    <Link to={`/fundraising/${campaign.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </Button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    See how your campaign appears to supporters
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default FundraisingCampaignDetails;
