import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Heart, Users, DollarSign, Calendar, Eye, Edit, MoreVertical, CreditCard, Smartphone, Building, TrendingUp, Target, Zap } from 'lucide-react';
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
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300"
            >
              <Link to="/creator/fundraising/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Total Campaigns</p>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 font-mono">{campaigns.length}</p>
                  </div>
                  <div className="p-2 lg:p-3 bg-orange-100 rounded-full">
                    <Target className="h-4 lg:h-6 w-4 lg:w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Active Campaigns</p>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 font-mono">
                      {campaigns.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 bg-emerald-100 rounded-full">
                    <Zap className="h-4 lg:h-6 w-4 lg:w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Total Raised</p>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 font-mono">
                      <PriceDisplay 
                        amount={totalStats.totalRaised} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Net: <PriceDisplay 
                        amount={totalStats.totalNetAmount} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="h-4 lg:h-6 w-4 lg:w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-slate-600">Supporters</p>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 font-mono">
                      {totalStats.totalContributions}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Across all campaigns
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 bg-blue-100 rounded-full">
                    <Users className="h-4 lg:h-6 w-4 lg:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Grid */}
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
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300"
                >
                  <Link to="/creator/fundraising/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {campaigns.map((campaign) => {
                const currentAmount = campaign.total_raised;
                const netAmount = campaign.total_net_amount;
                const goalAmount = campaign.goal_amount || 1;
                const progress = calculateProgress(currentAmount, goalAmount);
                const transactionFees = campaign.total_transaction_fees;
                const campaignBaseCurrency = campaign.currency || 'USD';
                
                return (
                  <Card key={campaign.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-0 overflow-hidden">
                    <div className="relative h-40 bg-gradient-to-br from-orange-400 to-purple-400 overflow-hidden">
                      {campaign.cover_image_url ? (
                        <img 
                          src={campaign.cover_image_url} 
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className={`${getStatusColor(campaign.status)} text-xs font-medium`}>
                          {getStatusText(campaign.status)}
                        </Badge>
                      </div>

                      {/* Progress Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="text-white">
                          <div className="flex justify-between text-xs mb-1">
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
                            className="h-1.5 bg-white/20"
                          />
                          <div className="text-xs text-white/80 mt-1 flex justify-between">
                            <span>{Math.round(progress)}% funded</span>
                            <span>{campaign.contributions_count} supporters</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 flex-1 mr-2 text-sm leading-tight">
                          {campaign.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem asChild>
                              <Link to={`/creator/fundraising/${campaign.id}/edit`} className="text-xs">
                                <Edit className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/creator/fundraising/${campaign.id}`} className="text-xs">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {campaign.description}
                      </p>
                      
                      {/* Financial Breakdown */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Gross:</span>
                          <span className="font-semibold text-slate-900">
                            <PriceDisplay 
                              amount={currentAmount} 
                              originalCurrency={campaignBaseCurrency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Fees:</span>
                          <span className="text-rose-600 font-medium">
                            -<PriceDisplay 
                              amount={transactionFees} 
                              originalCurrency={campaignBaseCurrency}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-xs border-t pt-2">
                          <span className="text-slate-700 font-semibold">Net:</span>
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
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(campaign.payment_methods).slice(0, 3).map(([method]) => (
                              <Badge key={method} variant="secondary" className={`${getPaymentMethodColor(method)} text-xs px-1.5 py-0`}>
                                <span className="flex items-center gap-1">
                                  {getPaymentMethodIcon(method)}
                                  {method.replace('_', ' ')}
                                </span>
                              </Badge>
                            ))}
                            {Object.keys(campaign.payment_methods).length > 3 && (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs px-1.5 py-0">
                                +{Object.keys(campaign.payment_methods).length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Campaign Meta */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(campaign.start_date)}</span>
                        </div>
                        <span className="font-mono text-xs">{campaignBaseCurrency}</span>
                      </div>
                      
                      <Button 
                        asChild
                        className="w-full mt-3 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 text-xs h-8 transition-all duration-300"
                      >
                        <Link to={`/creator/fundraising/${campaign.id}`}>
                          <Eye className="h-3 w-3 mr-1.5" />
                          View Details
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
