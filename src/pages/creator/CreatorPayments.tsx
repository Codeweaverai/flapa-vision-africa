import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Calendar, DollarSign, CreditCard, Download, AlertCircle, ExternalLink, TrendingUp, Minus, Settings, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  fetchCreatorPayouts,
  fetchCreatorEarnings,
  fetchCreatorPaymentTransactions
} from '@/services/creatorPaymentService';
import { 
  getCreatorPayoutMethod
} from '@/services/creatorEarningsService';
import EnhancedWithdrawDialog from '@/components/creator/EnhancedWithdrawDialog';
import PayoutMethodSetupDialog from '@/components/creator/PayoutMethodSetupDialog';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 5;

const CreatorPayments: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    available_balance: 0,
    pending_balance: 0,
    total_earnings: 0,
    total_platform_fees: 0,
    course_revenue: 0,
    event_revenue: 0
  });

  // Pagination states
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [payoutsTotal, setPayoutsTotal] = useState(0);

  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertPrice, currentCurrency } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    if (user) {
      loadPaymentData();
      loadPayoutMethod();
      loadProfileData();
      
      // Check URL parameters for Stripe callback
      const success = searchParams.get('success');
      const refresh = searchParams.get('refresh');
      const accountId = searchParams.get('account_id');
      
      if (success === 'true' && accountId) {
        handleStripeOnboardingSuccess(accountId);
        setSearchParams({});
      } else if (refresh === 'true') {
        toast({
          title: "Account Setup Incomplete",
          description: "Please complete your Stripe Connect account setup to receive payments.",
        });
        setSearchParams({});
      }
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, transactionsPage]);

  useEffect(() => {
    if (user) {
      loadPayouts();
    }
  }, [user, payoutsPage]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id, stripe_onboarding_completed, mobile_money_operator, mobile_money_number, default_payout_method')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };
  
  const handleStripeOnboardingSuccess = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          stripe_connect_account_id: accountId,
          stripe_onboarding_completed: true,
          default_payout_method: 'stripe'
        })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating Stripe account:', error);
        toast({
          title: "Error",
          description: "Failed to save Stripe account details",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Stripe Account Connected",
          description: "Your Stripe Connect account has been set up successfully!",
        });
        loadPayoutMethod();
        loadProfileData();
      }
    } catch (error) {
      console.error('Error handling Stripe onboarding success:', error);
    }
  };

  const loadPaymentData = async () => {
    if (!user) return;
    
    try {
      setLoadingEarnings(true);
      
      const earningsData = await fetchCreatorEarnings(user.id);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoadingEarnings(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setLoadingTransactions(true);
      
      const offset = (transactionsPage - 1) * ITEMS_PER_PAGE;
      const { transactions: transactionsData, total } = await fetchCreatorPaymentTransactions(user.id, ITEMS_PER_PAGE, offset);
      
      setTransactions(transactionsData);
      setTransactionsTotal(total);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadPayouts = async () => {
    if (!user) return;
    
    try {
      setLoadingPayouts(true);
      
      const offset = (payoutsPage - 1) * ITEMS_PER_PAGE;
      const { payouts: payoutsData, total } = await fetchCreatorPayouts(user.id, ITEMS_PER_PAGE, offset);
      
      setPayouts(payoutsData);
      setPayoutsTotal(total);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast({
        title: "Error",
        description: "Failed to load payouts",
        variant: "destructive"
      });
    } finally {
      setLoadingPayouts(false);
    }
  };

  const loadPayoutMethod = async () => {
    if (!user) return;
    
    try {
      const method = await getCreatorPayoutMethod(user.id);
      setPayoutMethod(method);
    } catch (error) {
      console.error('Error loading payout method:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 shadow-sm">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 shadow-sm">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="shadow-sm">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="shadow-sm">{status}</Badge>;
    }
  };
  
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Course Purchase';
      case 'event_ticket':
        return 'Event Registration';
      case 'consultation':
        return 'Consultation Booking';
      default:
        return type;
    }
  };

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="bg-white/80 hover:bg-white shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <div className="text-sm px-2 sm:px-4 text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="bg-white/80 hover:bg-white shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderPayoutMethodInfo = () => {
    const hasStripeSetup = profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed;
    const hasMobileMoneySetup = profileData?.mobile_money_operator && profileData?.mobile_money_number;

    if (!hasStripeSetup && !hasMobileMoneySetup) {
      return (
        <Alert className="bg-gradient-to-r from-orange-100 to-purple-100 border-orange-200 shadow-sm">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">No Payout Method Set Up</AlertTitle>
          <AlertDescription className="text-orange-700">
            Set up a payout method to withdraw your earnings. Choose between Stripe (for USA) or Mobile Money (for African countries).
          </AlertDescription>
        </Alert>
      );
    }

    if (profileData?.default_payout_method === 'stripe' && hasStripeSetup) {
      return (
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">Stripe Connect - Connected</div>
              <div className="text-sm text-blue-700">Bank transfers (2-7 business days)</div>
              {profileData.stripe_connect_account_id && (
                <div className="text-xs text-blue-600 mt-1">
                  Account ID: {profileData.stripe_connect_account_id.substring(0, 16)}...
                </div>
              )}
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm mt-2 sm:mt-0">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    if (profileData?.default_payout_method === 'mobile_money' && hasMobileMoneySetup) {
      return (
        <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Smartphone className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-900">Mobile Money - Connected</div>
              <div className="text-sm text-green-700">
                {profileData.mobile_money_operator} • {profileData.mobile_money_number}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Within 24 hours processing
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 shadow-sm mt-2 sm:mt-0">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTransactionCard = (transaction: any) => {
    const gradientClass = transaction.item_type === 'course' 
      ? 'bg-gradient-to-br from-orange-500 to-purple-600'
      : 'bg-gradient-to-br from-purple-500 to-orange-600';
    
    return (
      <Card key={transaction.id} className={`mb-3 ${gradientClass} text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 w-full`}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg line-clamp-1">{transaction.item_name}</CardTitle>
              <CardDescription className="text-white/80">
                {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
              {getPaymentTypeLabel(transaction.item_type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Customer</p>
              <p className="font-medium line-clamp-1">{transaction.customer_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Order ID</p>
              <p className="font-mono text-sm font-medium line-clamp-1">{transaction.order_id?.substring(0, 8) || 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Amount</p>
              <PriceDisplay 
                amount={transaction.total_amount} 
                originalCurrency="USD" 
                className="font-medium text-white"
              />
            </div>
            <div>
              <p className="text-sm text-white/80">Your Earning</p>
              <PriceDisplay 
                amount={transaction.creator_earning} 
                originalCurrency="USD" 
                className="font-bold text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Platform Fee</p>
              <PriceDisplay 
                amount={transaction.platform_fee} 
                originalCurrency="USD" 
                className="text-white/90"
              />
            </div>
            <div>
              <p className="text-sm text-white/80">Status</p>
              <div className="mt-1">
                {getStatusBadge(transaction.payment_status)}
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-white/80">Payout Date</p>
            <p className="font-medium">
              {transaction.payout_eligible_date ? 
                format(new Date(transaction.payout_eligible_date), 'MMM dd, yyyy') :
                'N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPayoutCard = (payout: any) => {
    const statusColor = payout.status === 'completed' 
      ? 'bg-gradient-to-br from-green-500 to-teal-600'
      : payout.status === 'failed'
      ? 'bg-gradient-to-br from-red-500 to-rose-600'
      : 'bg-gradient-to-br from-amber-500 to-orange-600';
    
    return (
      <Card key={payout.id} className={`mb-3 ${statusColor} text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 w-full`}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg">
                {payout.currency?.toUpperCase() || 'USD'} {Number(payout.amount).toFixed(2)}
              </CardTitle>
              <CardDescription className="text-white/80">
                {format(new Date(payout.created_at), 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
              {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-white/80">Method</p>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {payout.payout_method === 'stripe' ? 'Stripe Connect' : 'Mobile Money'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-white/80">Currency</p>
              <p className="font-medium">{payout.currency?.toUpperCase() || 'USD'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-white/80">Destination</p>
            <p className="font-medium line-clamp-1">{payout.destination}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Payments & Payouts
            </h1>
            <Button
              variant="outline"
              onClick={() => setIsSetupDialogOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 border-transparent hover:border-transparent shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Settings className="h-4 w-4" />
              <span className="whitespace-nowrap">Payout Settings</span>
            </Button>
          </div>

          {/* Payout Method Status */}
          <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-4 rounded-lg border border-orange-200/50 shadow-sm w-full">
            {renderPayoutMethodInfo()}
          </div>
          
          {/* Enhanced Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <Card className="bg-gradient-to-br from-orange-100 to-orange-50 shadow-sm hover:shadow-md transition-shadow border-orange-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-orange-800">Available Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-orange-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold text-orange-800">
                    <PriceDisplay amount={earnings.available_balance} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-orange-600/80 mt-1">
                  Available for withdrawal (minimum $5.00)
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setIsWithdrawDialogOpen(true)}
                  disabled={loadingEarnings || earnings.available_balance < 5 || (!profileData?.stripe_connect_account_id && !profileData?.mobile_money_operator)}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Withdraw Funds
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-100 to-purple-50 shadow-sm hover:shadow-md transition-shadow border-purple-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-purple-800">Pending Balance</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-purple-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold text-purple-800">
                    <PriceDisplay amount={earnings.pending_balance} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-purple-600/80 mt-1">
                  Funds in 7-day hold period
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-100 to-purple-100 shadow-sm hover:shadow-md transition-shadow border-orange-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-purple-800">Total Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-gradient-to-r from-orange-200 to-purple-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold bg-gradient-to-r from-orange-700 to-purple-700 bg-clip-text text-transparent">
                    <PriceDisplay amount={earnings.total_earnings} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-orange-600/80 mt-1">
                  Your share (92% of sales)
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-100 to-orange-100 shadow-sm hover:shadow-md transition-shadow border-purple-200/50 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-purple-800">Platform Fees</CardTitle>
                <Minus className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24 bg-gradient-to-r from-purple-200 to-orange-200" />
                ) : (
                  <div className="text-base md:text-lg font-semibold bg-gradient-to-r from-purple-700 to-orange-700 bg-clip-text text-transparent">
                    <PriceDisplay amount={earnings.total_platform_fees} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-purple-600/80 mt-1">
                  Platform fee (8% of sales)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 w-full">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-400 shadow-lg border-0 w-full">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">Course Revenue</CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  Earnings from course sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <PriceDisplay amount={earnings.course_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-400 shadow-lg border-0 w-full">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">Event Revenue</CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  Earnings from event registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <PriceDisplay amount={earnings.event_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Payments & Payouts Tabs */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-orange-100 to-purple-100 p-1 h-auto rounded-lg border border-orange-200/50">
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-xs sm:text-sm"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="payouts"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-xs sm:text-sm"
              >
                Payouts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-3">
              <Card className="bg-gradient-to-br from-orange-50 to-purple-50 shadow-sm border-orange-200/50 w-full">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl">
                    Customer Transactions
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View all completed payment transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  {loadingTransactions ? (
                    <div className="space-y-3 w-full">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 sm:h-32 w-full rounded-lg bg-gradient-to-r from-orange-100 to-purple-100" />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm sm:text-base w-full">
                      No payment transactions found
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {transactions.map(renderTransactionCard)}
                      {renderPagination(transactionsPage, transactionsTotal, setTransactionsPage)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payouts" className="space-y-3">
              <Card className="bg-gradient-to-br from-purple-50 to-orange-50 shadow-sm border-purple-200/50 w-full">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent text-lg sm:text-xl">
                    Payout History
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Track your withdrawal requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  {loadingPayouts ? (
                    <div className="space-y-3 w-full">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 sm:h-32 w-full rounded-lg bg-gradient-to-r from-purple-100 to-orange-100" />
                      ))}
                    </div>
                  ) : payouts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm sm:text-base w-full">
                      No payout requests found
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {payouts.map(renderPayoutCard)}
                      {renderPagination(payoutsPage, payoutsTotal, setPayoutsPage)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <EnhancedWithdrawDialog
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          availableBalance={earnings.available_balance}
          currency={currentCurrency}
          onSuccess={() => {
            loadPaymentData();
            loadPayouts();
          }}
        />

        <PayoutMethodSetupDialog
          open={isSetupDialogOpen}
          onOpenChange={setIsSetupDialogOpen}
          onSuccess={() => {
            loadPayoutMethod();
            loadProfileData();
          }}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorPayments;
