import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Calendar, DollarSign, CreditCard, Download, AlertCircle, ExternalLink, TrendingUp, Minus, Settings, Smartphone } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';

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

  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertPrice, currentCurrency } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    if (user) {
      loadPaymentData();
      loadPayoutMethod();
      
      // Check URL parameters for Stripe callback
      const success = searchParams.get('success');
      const refresh = searchParams.get('refresh');
      const accountId = searchParams.get('account_id');
      
      if (success === 'true' && accountId) {
        // Update the profile with the Stripe account ID and set as default payout method
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
        // Reload payout method to reflect changes
        loadPayoutMethod();
      }
    } catch (error) {
      console.error('Error handling Stripe onboarding success:', error);
    }
  };

  const loadPaymentData = async () => {
    if (!user) return;
    
    try {
      setLoadingTransactions(true);
      setLoadingPayouts(true);
      setLoadingEarnings(true);
      
      const [transactionsData, payoutsData, earningsData] = await Promise.all([
        fetchCreatorPaymentTransactions(user.id),
        fetchCreatorPayouts(user.id),
        fetchCreatorEarnings(user.id)
      ]);
      
      setTransactions(transactionsData);
      setPayouts(payoutsData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoadingTransactions(false);
      setLoadingPayouts(false);
      setLoadingEarnings(false);
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

  const renderPayoutMethodInfo = () => {
    if (!payoutMethod?.has_payout_method) {
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

    // Show Stripe method if it's the default payout method
    if (payoutMethod.default_payout_method === 'stripe' && payoutMethod.stripe_account_id) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">Stripe Connect - Connected</div>
              <div className="text-sm text-blue-700">Bank transfers (2-7 business days)</div>
              {payoutMethod.stripe_account_id && (
                <div className="text-xs text-blue-600 mt-1">
                  Account ID: {payoutMethod.stripe_account_id.substring(0, 16)}...
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

    // Show Mobile Money method if it's the default payout method
    if (payoutMethod.default_payout_method === 'mobile_money' && payoutMethod.mobile_money_operator) {
      return (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-900">Mobile Money - Connected</div>
              <div className="text-sm text-green-700">
                {payoutMethod.mobile_money_operator} • {payoutMethod.mobile_money_number}
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
      <div className="space-y-6">
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
                <div className="text-2xl font-bold">
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
                disabled={loadingEarnings || earnings.available_balance < 5 || !payoutMethod?.has_payout_method}
                className="w-full"
              >
                {!payoutMethod?.has_payout_method ? 'Set Up Payout Method' : 'Withdraw Funds'}
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
                <div className="text-2xl font-bold">
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
                <div className="text-2xl font-bold">
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
                <div className="text-2xl font-bold">
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
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
                            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Transaction ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No payouts requested yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          payouts.map((payout) => (
                            <TableRow key={payout.id}>
                              <TableCell>
                                {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="font-medium">
                                <PriceDisplay amount={payout.amount} originalCurrency="USD" />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payout.method === 'stripe' ? 'Stripe Connect' : 'Mobile Money'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {payout.destination}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(payout.status)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {payout.stripe_payout_id || payout.pawapay_deposit_id || 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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
        onSuccess={loadPaymentData}
      />

      {/* Payout Method Setup Dialog */}
      <PayoutMethodSetupDialog
        open={isSetupDialogOpen}
        onOpenChange={setIsSetupDialogOpen}
        onSuccess={loadPayoutMethod}
      />
    </CreatorLayout>
  );
};

export default CreatorPayments;
