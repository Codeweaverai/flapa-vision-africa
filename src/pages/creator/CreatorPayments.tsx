
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

const ITEMS_PER_PAGE = 10;

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
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPayoutMethodInfo = () => {
    const hasStripeSetup = profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed;
    const hasMobileMoneySetup = profileData?.mobile_money_operator && profileData?.mobile_money_number;

    if (!hasStripeSetup && !hasMobileMoneySetup) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Payout Method Set Up</AlertTitle>
          <AlertDescription>
            Set up a payout method to withdraw your earnings. Choose between Stripe (for USA) or Mobile Money (for African countries).
          </AlertDescription>
        </Alert>
      );
    }

    // Show active payout method based on default_payout_method
    if (profileData?.default_payout_method === 'stripe' && hasStripeSetup) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
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
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    if (profileData?.default_payout_method === 'mobile_money' && hasMobileMoneySetup) {
      return (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
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
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="space-y-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Payments & Payouts</h1>
            <Button
              variant="outline"
              onClick={() => setIsSetupDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Payout Settings
            </Button>
          </div>

          {/* Payout Method Status */}
          {renderPayoutMethodInfo()}
          
          {/* Enhanced Balance Cards with Currency Conversion */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-base md:text-lg font-semibold">
                    <PriceDisplay amount={earnings.available_balance} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Available for withdrawal (minimum $5.00)
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setIsWithdrawDialogOpen(true)}
                  disabled={loadingEarnings || earnings.available_balance < 5 || (!profileData?.stripe_connect_account_id && !profileData?.mobile_money_operator)}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw Funds
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-base md:text-lg font-semibold">
                    <PriceDisplay amount={earnings.pending_balance} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Funds in 7-day hold period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-base md:text-lg font-semibold">
                    <PriceDisplay amount={earnings.total_earnings} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Your share (92% of sales)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                <Minus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-base md:text-lg font-semibold">
                    <PriceDisplay amount={earnings.total_platform_fees} originalCurrency="USD" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Platform fee (8% of sales)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Revenue</CardTitle>
                <CardDescription>Earnings from course sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <PriceDisplay amount={earnings.course_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Revenue</CardTitle>
                <CardDescription>Earnings from event registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <PriceDisplay amount={earnings.event_revenue} originalCurrency="USD" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Payments & Payouts Tabs */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList>
              <TabsTrigger value="transactions">Customer Transactions</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Payment Transactions</CardTitle>
                  <CardDescription>
                    View all completed payment transactions from customers for your courses and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTransactions ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Your Earning</TableHead>
                              <TableHead>Platform Fee</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Payout Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                                  No payment transactions found
                                </TableCell>
                              </TableRow>
                            ) : (
                              transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell>
                                    {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-sm">{transaction.order_id?.substring(0, 8) || 'N/A'}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div>{transaction.customer_name || 'Unknown'}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{transaction.item_name}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {getPaymentTypeLabel(transaction.item_type)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <PriceDisplay amount={transaction.total_amount} originalCurrency="USD" />
                                  </TableCell>
                                  <TableCell className="font-medium text-green-600">
                                    <PriceDisplay amount={transaction.creator_earning} originalCurrency="USD" />
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    <PriceDisplay amount={transaction.platform_fee} originalCurrency="USD" />
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(transaction.payment_status)}
                                  </TableCell>
                                  <TableCell>
                                    {transaction.payout_eligible_date ? 
                                      format(new Date(transaction.payout_eligible_date), 'MMM dd, yyyy') :
                                      'N/A'
                                    }
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {renderPagination(transactionsPage, transactionsTotal, setTransactionsPage)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payouts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>
                    Track your withdrawal requests and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPayouts ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Destination</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payouts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                  No payout requests found
                                </TableCell>
                              </TableRow>
                            ) : (
                              payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                  <TableCell>
                                    {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {payout.currency?.toUpperCase() || 'USD'} {Number(payout.amount).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    {payout.currency?.toUpperCase() || 'USD'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {payout.payout_method === 'stripe' ? 'Stripe Connect' : 'Mobile Money'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{payout.destination}</TableCell>
                                  <TableCell>
                                    {getStatusBadge(payout.status)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {renderPagination(payoutsPage, payoutsTotal, setPayoutsPage)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Withdraw Dialog */}
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

        {/* Payout Method Setup Dialog */}
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
