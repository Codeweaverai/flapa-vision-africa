import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Heart, Users, DollarSign, Calendar, Eye, Edit, MoreVertical, CreditCard, Smartphone, Building, TrendingUp, Target, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Currency conversion rates (static - same as in details page)
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

interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  currency: string;
  category: string;
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  use_of_funds: string | null;
  created_at: string;
}

interface CampaignContribution {
  id: string;
  amount: number;
  currency: string;
  net_amount: number;
  transaction_fee: number;
  payment_method: string;
  payment_provider: string;
  status: string;
}

interface CampaignStats {
  total_raised: number;
  total_net_amount: number;
  total_transaction_fees: number;
  contributions_count: number;
  payment_methods: { [key: string]: number };
  currencies: { [key: string]: number };
}

const CreatorFundraising: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<(FundraisingCampaign & CampaignStats)[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalRaised: 0,
    totalNetAmount: 0,
    totalFees: 0,
    totalContributions: 0
  });

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const calculateCampaignStats = async (contributions: CampaignContribution[], campaign: FundraisingCampaign): Promise<CampaignStats> => {
    const completedContributions = contributions.filter(c => c.status === 'completed');
    const campaignBaseCurrency = campaign.currency || 'USD';
    
    let totalRaised = 0;
    let totalNetAmount = 0;
    let totalTransactionFees = 0;
    
    const paymentMethods: { [key: string]: number } = {};
    const currencies: { [key: string]: number } = {};

    for (const contribution of completedContributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalAmount = Number(contribution.amount || 0);
      const originalNetAmount = Number(contribution.net_amount || contribution.amount || 0);
      const originalTransactionFee = Number(contribution.transaction_fee || 0);

      let amountInBaseCurrency = originalAmount;
      let netAmountInBaseCurrency = originalNetAmount;
      let feeInBaseCurrency = originalTransactionFee;

      if (contributionCurrency !== campaignBaseCurrency) {
        try {
          amountInBaseCurrency = await convertCurrency(originalAmount, contributionCurrency, campaignBaseCurrency);
          netAmountInBaseCurrency = await convertCurrency(originalNetAmount, contributionCurrency, campaignBaseCurrency);
          feeInBaseCurrency = await convertCurrency(originalTransactionFee, contributionCurrency, campaignBaseCurrency);
        } catch (error) {
          console.warn(`Currency conversion failed for contribution:`, error);
          // Fallback to original amounts
          amountInBaseCurrency = originalAmount;
          netAmountInBaseCurrency = originalNetAmount;
          feeInBaseCurrency = originalTransactionFee;
        }
      }

      totalRaised += amountInBaseCurrency;
      totalNetAmount += netAmountInBaseCurrency;
      totalTransactionFees += feeInBaseCurrency;

      const method = contribution.payment_method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + amountInBaseCurrency;
      currencies[contributionCurrency] = (currencies[contributionCurrency] || 0) + originalAmount;
    }

    return {
      total_raised: totalRaised,
      total_net_amount: totalNetAmount,
      total_transaction_fees: totalTransactionFees,
      contributions_count: completedContributions.length,
      payment_methods: paymentMethods,
      currencies: currencies
    };
  };

  const loadCampaigns = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: campaignsData, error } = await supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          campaign_contributions (
            id,
            amount,
            currency,
            net_amount,
            transaction_fee,
            payment_method,
            payment_provider,
            status
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const campaignsWithStats = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const contributions = campaign.campaign_contributions as CampaignContribution[] || [];
          const stats = await calculateCampaignStats(contributions, campaign);
          
          return {
            ...campaign,
            ...stats
          };
        })
      );

      setCampaigns(campaignsWithStats);

      // Calculate total stats across all campaigns
      const totals = campaignsWithStats.reduce((acc, campaign) => ({
        totalRaised: acc.totalRaised + campaign.total_raised,
        totalNetAmount: acc.totalNetAmount + campaign.total_net_amount,
        totalFees: acc.totalFees + campaign.total_transaction_fees,
        totalContributions: acc.totalContributions + campaign.contributions_count
      }), {
        totalRaised: 0,
        totalNetAmount: 0,
        totalFees: 0,
        totalContributions: 0
      });

      setTotalStats(totals);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
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

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Fundraising Campaigns
              </h1>
              <p className="text-slate-600 mt-1">
                Create and manage fundraising campaigns to support your creative work
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Link to="/creator/fundraising/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-400 border-0 shadow-xl text-white">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-white/90">Total Campaigns</p>
                    <p className="text-xl lg:text-2xl font-bold font-mono">{campaigns.length}</p>
                  </div>
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Target className="h-4 lg:h-6 w-4 lg:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-400 border-0 shadow-xl text-white">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-white/90">Active Campaigns</p>
                    <p className="text-xl lg:text-2xl font-bold font-mono">
                      {campaigns.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Zap className="h-4 lg:h-6 w-4 lg:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-400 border-0 shadow-xl text-white">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-white/90">Total Raised</p>
                    <p className="text-xl lg:text-2xl font-bold font-mono">
                      <PriceDisplay 
                        amount={totalStats.totalRaised} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                      Net: <PriceDisplay 
                        amount={totalStats.totalNetAmount} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <TrendingUp className="h-4 lg:h-6 w-4 lg:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-400 border-0 shadow-xl text-white">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-white/90">Supporters</p>
                    <p className="text-xl lg:text-2xl font-bold font-mono">
                      {totalStats.totalContributions}
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                      Across all campaigns
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Users className="h-4 lg:h-6 w-4 lg:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Grid - 2 cards per row */}
          {campaigns.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800">No Campaigns Yet</h3>
                <p className="text-slate-600 mb-6">Start your first fundraising campaign to get support from your community.</p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Link to="/creator/fundraising/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {campaigns.map((campaign) => {
                const currentAmount = campaign.total_raised;
                const netAmount = campaign.total_net_amount;
                const goalAmount = campaign.goal_amount || 1;
                const progress = calculateProgress(currentAmount, goalAmount);
                const transactionFees = campaign.total_transaction_fees;
                const campaignBaseCurrency = campaign.currency || 'USD';
                
                return (
                  <Card key={campaign.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden w-full">
                    <div className="relative h-48 bg-gradient-to-br from-orange-400 to-purple-400 overflow-hidden">
                      {campaign.cover_image_url ? (
                        <img 
                          src={campaign.cover_image_url} 
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <Heart className="w-12 h-12 mx-auto mb-2 opacity-80" />
                            <p className="text-sm font-medium">{campaign.title}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getStatusColor(campaign.status)} text-xs font-medium shadow-lg`}>
                          {getStatusText(campaign.status)}
                        </Badge>
                      </div>

                      {/* Progress Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="text-white">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold">
                              <PriceDisplay 
                                amount={currentAmount} 
                                originalCurrency={campaignBaseCurrency}
                                showOriginal={false}
                              />
                            </span>
                            <span className="text-white/90">
                              <PriceDisplay 
                                amount={goalAmount} 
                                originalCurrency={campaignBaseCurrency}
                                showOriginal={false}
                              />
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className="h-2 bg-white/30"
                          />
                          <div className="flex justify-between text-xs text-white/90 mt-2">
                            <span>{Math.round(progress)}% funded</span>
                            <span>{campaign.contributions_count} supporters</span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Sparkles Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute top-4 right-4">
                          <Sparkles className="h-4 w-4 text-white animate-pulse" />
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 flex-1 mr-3 text-base leading-tight">
                          {campaign.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-sm">
                            <DropdownMenuItem asChild>
                              <Link to={`/creator/fundraising/${campaign.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/creator/fundraising/${campaign.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                        {campaign.description}
                      </p>
                      
                      {/* Financial Breakdown */}
                      <div className="space-y-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">Gross Amount:</span>
                          <span className="font-semibold text-slate-900">
                            <PriceDisplay 
                              amount={currentAmount} 
                              originalCurrency={campaignBaseCurrency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">Transaction Fees:</span>
                          <span className="text-rose-600 font-medium">
                            -<PriceDisplay 
                              amount={transactionFees} 
                              originalCurrency={campaignBaseCurrency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                          <span className="text-slate-800 font-bold">Net Amount:</span>
                          <span className="font-bold text-emerald-600">
                            <PriceDisplay 
                              amount={netAmount} 
                              originalCurrency={campaignBaseCurrency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                      </div>
                      
                      {/* Payment Methods */}
                      {campaign.payment_methods && Object.keys(campaign.payment_methods).length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-slate-600 mb-2 font-medium">Payment Methods:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(campaign.payment_methods).slice(0, 3).map(([method]) => (
                              <Badge key={method} variant="secondary" className={`${getPaymentMethodColor(method)} text-xs px-2 py-1 shadow-sm`}>
                                <span className="flex items-center gap-1">
                                  {getPaymentMethodIcon(method)}
                                  {method.replace('_', ' ')}
                                </span>
                              </Badge>
                            ))}
                            {Object.keys(campaign.payment_methods).length > 3 && (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs px-2 py-1 shadow-sm">
                                +{Object.keys(campaign.payment_methods).length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Campaign Meta */}
                      <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>Started {formatDate(campaign.start_date)}</span>
                        </div>
                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {campaignBaseCurrency}
                        </span>
                      </div>
                      
                      <Button 
                        asChild
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 text-sm h-10 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Link to={`/creator/fundraising/${campaign.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Campaign Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorFundraising;
