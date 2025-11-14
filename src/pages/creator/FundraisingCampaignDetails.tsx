import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Eye, Edit, Users, DollarSign, Calendar, Share2, CreditCard, Smartphone, Building, TrendingUp, Target, Zap, Download, Filter } from 'lucide-react';
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
  ZMW: 0.044,
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
  
  const usdAmount = amount * fromRate;
  const targetAmount = usdAmount / toRate;
  
  return Number(targetAmount.toFixed(2));
};

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  currency: string; // Removed current_amount
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
    username: string;
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
  const [transactionFilter, setTransactionFilter] = useState('all');

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
          profiles (full_name, avatar_url, username)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);

      if (contributionsData && campaignData) {
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
      case 'mobile_money': return <Smartphone className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'failed': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'refunded': return 'bg-slate-100 text-slate-800 border-slate-200';
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

  const formatDateTime = (dateString: string) => {
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

  const filteredContributions = contributions.filter(contribution => {
    if (transactionFilter === 'all') return true;
    return contribution.status === transactionFilter;
  });

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

  // Now currentAmount is always calculated from contributions (no stored current_amount)
  const currentAmount = campaignStats?.total_raised || 0;
  const netAmount = campaignStats?.total_net_amount || 0;
  const goalAmount = campaign.goal_amount || 1;
  const progress = calculateProgress(currentAmount, goalAmount);
  const transactionFees = campaignStats?.total_transaction_fees || 0;
  const campaignBaseCurrency = campaign.currency || 'USD';

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/80 transition-all duration-300">
                <Link to="/creator/fundraising">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  {campaign.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${getStatusColor(campaign.status)} font-medium`}>
                    {getStatusText(campaign.status)}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    Created {formatDate(campaign.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShareCampaign}
                className="border-slate-300 hover:bg-white/80 transition-all duration-300"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                asChild
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 transition-all duration-300"
              >
                <Link to={`/creator/fundraising/${campaign.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Horizontal Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Gross Raised</p>
                    <p className="text-lg lg:text-2xl font-bold text-slate-900">
                      <PriceDisplay 
                        amount={currentAmount} 
                        originalCurrency={campaignBaseCurrency}
                        showOriginal={false}
                      />
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      From {campaignStats?.contributions_count || 0} contributions
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Net Amount</p>
                    <p className="text-lg lg:text-2xl font-bold text-slate-900">
                      <PriceDisplay 
                        amount={netAmount} 
                        originalCurrency={campaignBaseCurrency}
                        showOriginal={false}
                      />
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Transaction Fees</p>
                    <p className="text-lg lg:text-2xl font-bold text-slate-900">
                      <PriceDisplay 
                        amount={transactionFees} 
                        originalCurrency={campaignBaseCurrency}
                        showOriginal={false}
                      />
                    </p>
                  </div>
                  <CreditCard className="h-6 w-6 lg:h-8 lg:w-8 text-rose-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Supporters</p>
                    <p className="text-lg lg:text-2xl font-bold text-slate-900">
                      {campaignStats?.contributions_count || 0}
                    </p>
                  </div>
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Campaign Progress</span>
                    <span>{Math.round(progress)}% funded</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-slate-200" />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>
                      <PriceDisplay 
                        amount={currentAmount} 
                        originalCurrency={campaignBaseCurrency}
                        showOriginal={false}
                      /> raised
                    </span>
                    <span>
                      Goal: <PriceDisplay 
                        amount={goalAmount} 
                        originalCurrency={campaignBaseCurrency}
                        showOriginal={false}
                      />
                    </span>
                  </div>
                  {campaignStats?.contributions_count && (
                    <div className="text-xs text-slate-500 mt-1">
                      Calculated from {campaignStats.contributions_count} completed contributions
                    </div>
                  )}
                </div>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  <Link to={`/fundraising/${campaign.id}`} target="_blank">
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Page
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Campaign Story */}
            <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Target className="h-5 w-5 text-orange-600" />
                  Campaign Story
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {campaign.description}
                </p>
                {campaign.use_of_funds && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Use of Funds</h4>
                    <p className="text-slate-700 leading-relaxed">
                      {campaign.use_of_funds}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Details */}
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
          </div>

          {/* Transaction History */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-slate-900">Transaction History</CardTitle>
                  <CardDescription>
                    All contributions and payments for this campaign
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {['all', 'completed', 'pending', 'failed'].map((filter) => (
                      <Button
                        key={filter}
                        variant={transactionFilter === filter ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTransactionFilter(filter)}
                        className={`text-xs capitalize ${
                          transactionFilter === filter 
                            ? 'bg-white shadow-sm' 
                            : 'hover:bg-white/50'
                        }`}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-300">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredContributions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-sm">No transactions found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {transactionFilter !== 'all' ? `No ${transactionFilter} transactions` : 'No contributions yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContributions.map((contribution) => (
                    <Card key={contribution.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          {/* Supporter Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {contribution.is_anonymous ? 'A' : contribution.profiles.full_name?.[0] || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900">
                                  {contribution.is_anonymous ? 'Anonymous Supporter' : contribution.profiles.full_name || 'Unknown User'}
                                </span>
                                <Badge className={getStatusBadgeColor(contribution.status)}>
                                  {contribution.status}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{formatDateTime(contribution.created_at)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  {getPaymentMethodIcon(contribution.payment_method)}
                                  {contribution.payment_method?.replace('_', ' ') || 'Unknown'}
                                </span>
                                <span>•</span>
                                <span>{contribution.payment_provider}</span>
                              </div>
                              {contribution.message_to_creator && (
                                <p className="text-sm text-slate-600 mt-2 italic">
                                  "{contribution.message_to_creator}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Amount Info */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-900">
                                <PriceDisplay 
                                  amount={contribution.amount} 
                                  originalCurrency={contribution.currency || 'USD'}
                                  showOriginal={false}
                                />
                              </div>
                              <div className="text-xs text-slate-500">
                                Gross Amount
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-emerald-700">
                                <PriceDisplay 
                                  amount={contribution.net_amount} 
                                  originalCurrency={contribution.currency || 'USD'}
                                  showOriginal={false}
                                />
                              </div>
                              <div className="text-xs text-slate-500">
                                Net Amount
                              </div>
                            </div>
                            {contribution.transaction_fee > 0 && (
                              <div className="text-right">
                                <div className="text-sm text-rose-700">
                                  -<PriceDisplay 
                                    amount={contribution.transaction_fee} 
                                    originalCurrency={contribution.currency || 'USD'}
                                    showOriginal={false}
                                  />
                                </div>
                                <div className="text-xs text-slate-500">
                                  Fees
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default FundraisingCampaignDetails;
