import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Eye, Edit, Users, DollarSign, Calendar, Share2, CreditCard, Smartphone, Building, TrendingUp, Target, Zap } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

// Currency conversion rates (static - you can replace with API calls)
const exchangeRates: { [key: string]: number } = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  ZMW: 0.044, // 1 ZMW = 0.044 USD
  NGN: 0.0012,
  GHS: 0.082,
  KES: 0.0078,
  UGX: 0.00027,
  TZS: 0.00043,
  RWF: 0.0010,
  XOF: 0.0016,
  XAF: 0.0016,
  CDF: 0.00049,
  MZN: 0.015,
  MWK: 0.0009,
  LSL: 0.054,
  SLL: 0.000048
};

// Currency conversion function
const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  // Convert through USD as base
  const usdAmount = amount * fromRate;
  const targetAmount = usdAmount / toRate;
  
  return Number(targetAmount.toFixed(2));
};

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
  original_currency_totals: { [key: string]: number };
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
      const { data: campaignData, error: campaignError } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('creator_id', user.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

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

      if (contributionsData) {
        const stats = await calculateCampaignStats(contributionsData, campaignData);
        setCampaignStats(stats);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const calculateCampaignStats = async (contributions: Contribution[], campaign: Campaign): Promise<CampaignStats> => {
    const completedContributions = contributions.filter(c => c.status === 'completed');
    const campaignBaseCurrency = campaign.currency || 'USD';
    
    let totalRaisedUSD = 0;
    let totalNetAmountUSD = 0;
    let totalTransactionFeesUSD = 0;
    
    const paymentMethods: { [key: string]: number } = {};
    const currencies: { [key: string]: number } = {};
    const originalCurrencyTotals: { [key: string]: number } = {};

    for (const contribution of completedContributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalAmount = Number(contribution.amount || 0);
      const originalNetAmount = Number(contribution.net_amount || contribution.amount || 0);
      const originalTransactionFee = Number(contribution.transaction_fee || 0);

      let amountInUSD = originalAmount;
      let netAmountInUSD = originalNetAmount;
      let feeInUSD = originalTransactionFee;

      if (contributionCurrency !== campaignBaseCurrency) {
        try {
          amountInUSD = await convertCurrency(originalAmount, contributionCurrency, campaignBaseCurrency);
          netAmountInUSD = await convertCurrency(originalNetAmount, contributionCurrency, campaignBaseCurrency);
          feeInUSD = await convertCurrency(originalTransactionFee, contributionCurrency, campaignBaseCurrency);
        } catch (error) {
          console.warn(`Currency conversion failed for contribution ${contribution.id}:`, error);
        }
      }

      totalRaisedUSD += amountInUSD;
      totalNetAmountUSD += netAmountInUSD;
      totalTransactionFeesUSD += feeInUSD;

      const method = contribution.payment_method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + amountInUSD;
      currencies[contributionCurrency] = (currencies[contributionCurrency] || 0) + originalAmount;
      originalCurrencyTotals[contributionCurrency] = (originalCurrencyTotals[contributionCurrency] || 0) + originalAmount;
    }

    return {
      total_raised: totalRaisedUSD,
      total_net_amount: totalNetAmountUSD,
      total_transaction_fees: totalTransactionFeesUSD,
      contributions_count: completedContributions.length,
      payment_methods: paymentMethods,
      currencies: currencies,
      original_currency_totals: originalCurrencyTotals
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
      case 'bank_transfer': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'paypal': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      navigator.clipboard.writeText(shareUrl);
      toast.success('Campaign link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (!campaign) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="p-6 text-center">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl max-w-md mx-auto">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Eye className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800">Campaign Not Found</h3>
                <p className="text-slate-600 mb-6">The campaign you're looking for doesn't exist or you don't have access to it.</p>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
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
  const campaignBaseCurrency = campaign.currency || 'USD';

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/80 transition-all duration-300">
                <Link to="/creator/fundraising">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  {campaign.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={`${getStatusColor(campaign.status)} font-medium`}>
                    {getStatusText(campaign.status)}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    Created {formatDate(campaign.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleShareCampaign}
                className="border-slate-300 hover:bg-white/80 transition-all duration-300"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                asChild
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 transition-all duration-300"
              >
                <Link to={`/creator/fundraising/${campaign.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Link>
              </Button>
            </div>
          </div>

          {/* Horizontal Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Content - 3 columns */}
            <div className="xl:col-span-3 space-y-6">
              {/* Hero Section with Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Cover */}
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-64 bg-gradient-to-br from-orange-400 to-purple-500">
                    {campaign.cover_image_url ? (
                      <img 
                        src={campaign.cover_image_url} 
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <Target className="w-16 h-16 mx-auto mb-2 opacity-90" />
                          <p className="text-lg font-semibold">Campaign Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Progress Stats */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        <PriceDisplay 
                          amount={currentAmount} 
                          originalCurrency={campaignBaseCurrency}
                          showOriginal={false}
                        />
                      </div>
                      <Progress value={progress} className="h-2 bg-slate-200" />
                      <div className="flex justify-between text-sm text-slate-600 mt-2">
                        <span>{Math.round(progress)}% funded</span>
                        <span>
                          <PriceDisplay 
                            amount={goalAmount} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-slate-900">{campaignStats?.contributions_count || 0}</div>
                        <div className="text-xs text-slate-600">Supporters</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <Zap className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-slate-900">
                          <PriceDisplay 
                            amount={netAmount} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </div>
                        <div className="text-xs text-slate-600">Net Amount</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Financial Overview Cards - Horizontal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Gross Raised</p>
                        <p className="text-2xl font-bold text-blue-900">
                          <PriceDisplay 
                            amount={currentAmount} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Net Amount</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          <PriceDisplay 
                            amount={netAmount} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-rose-800">Fees</p>
                        <p className="text-2xl font-bold text-rose-900">
                          <PriceDisplay 
                            amount={transactionFees} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-rose-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Content Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      Campaign Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {campaign.description}
                    </p>
                  </CardContent>
                </Card>

                {campaign.use_of_funds && (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Target className="h-5 w-5 text-purple-600" />
                        Use of Funds
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed">
                        {campaign.use_of_funds}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Status</span>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusText(campaign.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Category</span>
                    <span className="text-sm font-medium text-slate-900 capitalize">{campaign.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Currency</span>
                    <span className="text-sm font-medium text-slate-900">{campaignBaseCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Started</span>
                    <span className="text-sm font-medium text-slate-900">{formatDate(campaign.start_date)}</span>
                  </div>
                  {campaign.end_date && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600">Ends</span>
                      <span className="text-sm font-medium text-slate-900">{formatDate(campaign.end_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Recent Supporters</CardTitle>
                </CardHeader>
                <CardContent>
                  {contributions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                      <p className="text-sm">No supporters yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contributions.slice(0, 5).map((contribution) => (
                        <div key={contribution.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {contribution.is_anonymous ? 'A' : contribution.profiles.full_name?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {contribution.is_anonymous ? 'Anonymous' : contribution.profiles.full_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDate(contribution.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">
                              <PriceDisplay 
                                amount={contribution.amount} 
                                originalCurrency={contribution.currency || 'USD'}
                                showOriginal={false}
                              />
                            </div>
                            <div className="text-xs text-slate-500 capitalize">
                              {contribution.payment_method}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 transition-all duration-300"
                  >
                    <Link to={`/fundraising/${campaign.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </Button>
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
