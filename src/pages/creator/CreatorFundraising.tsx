import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Heart, Users, DollarSign, Calendar, Eye, Edit, MoreVertical, CreditCard, Smartphone, Building } from 'lucide-react';
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

interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  currency: string;
  category: string;
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  use_of_funds: string | null;
  contributions_count?: number;
  created_at: string;
  total_raised?: number;
  total_raised_currency?: string;
  total_net_amount?: number;
  total_transaction_fees?: number;
  payment_methods?: { [key: string]: number };
  currencies?: { [key: string]: number };
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

const CreatorFundraising: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch campaigns with detailed contribution data
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

      const campaignsWithStats = campaignsData?.map(campaign => {
        const contributions = campaign.campaign_contributions as CampaignContribution[] || [];
        const completedContributions = contributions.filter(c => c.status === 'completed');
        
        // Calculate totals across all currencies and payment methods
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
          ...campaign,
          contributions_count: completedContributions.length,
          total_raised: totalRaised,
          total_net_amount: totalNetAmount,
          total_transaction_fees: totalTransactionFees,
          total_raised_currency: campaign.currency,
          payment_methods: paymentMethods,
          currencies: currencies
        };
      }) || [];

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
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
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  // Calculate totals across all campaigns
  const calculateTotalRaised = () => {
    return campaigns.reduce((total, campaign) => {
      return total + (campaign.total_raised || campaign.current_amount || 0);
    }, 0);
  };

  const calculateTotalNetAmount = () => {
    return campaigns.reduce((total, campaign) => {
      return total + (campaign.total_net_amount || campaign.total_raised || campaign.current_amount || 0);
    }, 0);
  };

  const calculateTotalFees = () => {
    return campaigns.reduce((total, campaign) => {
      return total + (campaign.total_transaction_fees || 0);
    }, 0);
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

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Fundraising Campaigns</h1>
              <p className="text-muted-foreground">
                Create and manage fundraising campaigns to support your creative work
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              <Link to="/creator/fundraising/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Heart className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {campaigns.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Raised</p>
                    <p className="text-2xl font-bold text-gray-900">
                      <PriceDisplay 
                        amount={calculateTotalRaised()} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Net: <PriceDisplay 
                        amount={calculateTotalNetAmount()} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transaction Fees</p>
                    <p className="text-2xl font-bold text-gray-900">
                      <PriceDisplay 
                        amount={calculateTotalFees()} 
                        originalCurrency="USD" 
                        showOriginal={false}
                      />
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaigns.reduce((sum, campaign) => sum + (campaign.contributions_count || 0), 0)} contributions
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Grid */}
          {campaigns.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">No Campaigns Yet</h3>
                <p className="text-gray-600 mb-6">Start your first fundraising campaign to get support from your community.</p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                >
                  <Link to="/creator/fundraising/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => {
                const currentAmount = campaign.total_raised || campaign.current_amount || 0;
                const netAmount = campaign.total_net_amount || currentAmount;
                const goalAmount = campaign.goal_amount || 1;
                const progress = calculateProgress(currentAmount, goalAmount);
                const transactionFees = campaign.total_transaction_fees || 0;
                
                return (
                  <Card key={campaign.id} className="group bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-orange-400 to-purple-400 overflow-hidden">
                      {campaign.cover_image_url ? (
                        <img 
                          src={campaign.cover_image_url} 
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-12 h-12 text-white/80" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className={getStatusColor(campaign.status)}>
                          {getStatusText(campaign.status)}
                        </Badge>
                      </div>

                      {/* Progress Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <div className="text-white">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold">
                              <PriceDisplay 
                                amount={currentAmount} 
                                originalCurrency={campaign.currency || 'USD'}
                                showOriginal={false}
                              />
                            </span>
                            <span>
                              of <PriceDisplay 
                                amount={goalAmount} 
                                originalCurrency={campaign.currency || 'USD'}
                                showOriginal={false}
                              />
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className="h-2 bg-white/20"
                          />
                          <div className="text-xs text-white/80 mt-1">
                            {progress.toFixed(1)}% funded • {campaign.contributions_count || 0} supporters
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 flex-1 mr-2">
                          {campaign.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {campaign.description}
                      </p>
                      
                      {/* Financial Breakdown */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Gross Amount:</span>
                          <span className="font-semibold">
                            <PriceDisplay 
                              amount={currentAmount} 
                              originalCurrency={campaign.currency || 'USD'}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Transaction Fees:</span>
                          <span className="text-red-600">
                            -<PriceDisplay 
                              amount={transactionFees} 
                              originalCurrency={campaign.currency || 'USD'}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="text-gray-600 font-medium">Net Amount:</span>
                          <span className="font-bold text-green-600">
                            <PriceDisplay 
                              amount={netAmount} 
                              originalCurrency={campaign.currency || 'USD'}
                              showOriginal={false}
                            />
                          </span>
                        </div>
                      </div>
                      
                      {/* Payment Methods */}
                      {campaign.payment_methods && Object.keys(campaign.payment_methods).length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(campaign.payment_methods).map(([method, amount]) => (
                              <Badge key={method} variant="secondary" className={getPaymentMethodColor(method)}>
                                <span className="flex items-center gap-1">
                                  {getPaymentMethodIcon(method)}
                                  {method.replace('_', ' ')}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Campaign Details */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {campaign.use_of_funds && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{campaign.use_of_funds}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>Started {formatDate(campaign.start_date)}</span>
                        </div>

                        {/* Currency Info */}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span>Base currency: {campaign.currency || 'USD'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          asChild
                          className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0"
                        >
                          <Link to={`/creator/fundraising/${campaign.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      </div>
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
