
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { BarChart, Calendar, DollarSign, CreditCard, Download, AlertCircle, ExternalLink, TrendingUp, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import CreatorLayout from '@/components/creator/CreatorLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PaymentTransaction, 
  PayoutTransaction, 
  CreatorBalance 
} from '@/types/paymentTypes';
import { 
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import { 
  fetchCreatorPayments, 
  fetchCreatorPayouts, 
  connectStripeAccount,
  getStripeAccountStatus
} from '@/services/paymentService';
import { 
  fetchEnhancedCreatorBalance,
  fetchPaymentBreakdown,
  PaymentBreakdown
} from '@/services/enhancedPaymentService';
import WithdrawDialog from '@/components/creator/WithdrawDialog';

const CreatorPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutTransaction[]>([]);
  const [balance, setBalance] = useState<CreatorBalance>({
    available: 0,
    pending: 0,
    currency: 'USD'
  });
  const [enhancedBalance, setEnhancedBalance] = useState({
    available_balance: 0,
    pending_balance: 0,
    total_earnings: 0,
    total_platform_fees: 0
  });
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({
    course_revenue: 0,
    event_revenue: 0,
    platform_fees: 0,
    net_earnings: 0
  });
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState('stripe');
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | undefined>();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    if (user) {
      loadPaymentData();
      checkStripeStatus();
      
      // Check URL parameters for Stripe callback
      const success = searchParams.get('success');
      const refresh = searchParams.get('refresh');
      
      if (success === 'true') {
        toast({
          title: "Stripe Account Connected",
          description: "Your Stripe Connect account has been set up successfully!",
        });
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
  
  const loadPaymentData = async () => {
    if (!user) return;
    
    try {
      setLoadingPayments(true);
      setLoadingPayouts(true);
      setLoadingBalance(true);
      
      const [paymentsData, payoutsData, enhancedBalanceData, breakdownData] = await Promise.all([
        fetchCreatorPayments(user.id),
        fetchCreatorPayouts(user.id),
        fetchEnhancedCreatorBalance(user.id),
        fetchPaymentBreakdown(user.id)
      ]);
      
      setPayments(paymentsData);
      setPayouts(payoutsData);
      setEnhancedBalance(enhancedBalanceData);
      setPaymentBreakdown(breakdownData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoadingPayments(false);
      setLoadingPayouts(false);
      setLoadingBalance(false);
    }
  };
  
  const checkStripeStatus = async () => {
    if (!user) return;
    
    try {
      const { isConnected, accountId } = await getStripeAccountStatus(user.id);
      setIsStripeConnected(isConnected);
      setStripeAccountId(accountId);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };
  
  const handleMethodChange = (value: string) => {
    setPayoutMethod(value);
  };
  
  const handleConnectStripe = async () => {
    if (!user) return;
    
    try {
      setIsConnectingStripe(true);
      const url = await connectStripeAccount(user.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to get Stripe Connect URL');
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to initialize Stripe Connect account setup. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
      case 'event':
        return 'Event Registration';
      case 'consultation':
        return 'Consultation Booking';
      default:
        return type;
    }
  };

  return (
    <CreatorLayout title="Payments & Payouts">
      <div className="space-y-6">
        {/* Stripe Connection Alert */}
        {!isStripeConnected && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stripe Connect Account Required</AlertTitle>
            <AlertDescription>
              To receive payments and manage your earnings, you need to connect your Stripe account.
              This allows secure transfers of your earnings directly to your bank account.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white border-amber-300 text-amber-800 hover:bg-amber-50"
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                >
                  {isConnectingStripe ? 'Connecting...' : 'Connect Stripe Account'}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Enhanced Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingBalance ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  USD {enhancedBalance.available_balance.toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Available for withdrawal (minimum $5.00)
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setIsWithdrawDialogOpen(true)}
                disabled={loadingBalance || enhancedBalance.available_balance < 5 || !isStripeConnected}
                className="w-full"
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
              {loadingBalance ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  USD {enhancedBalance.pending_balance.toFixed(2)}
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
              {loadingPayments ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  USD {enhancedBalance.total_earnings.toFixed(2)}
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
              {loadingPayments ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  USD {enhancedBalance.total_platform_fees.toFixed(2)}
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
                USD {paymentBreakdown.course_revenue.toFixed(2)}
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
                USD {paymentBreakdown.event_revenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Stripe Account Info */}
        {isStripeConnected && stripeAccountId && (
          <Card className="bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-slate-600" />
                Connected Stripe Account
              </CardTitle>
              <CardDescription>
                Your Stripe Connect account is active
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-white">
                  ID: {stripeAccountId.substring(0, 8)}...
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-slate-600" 
                onClick={handleConnectStripe}
              >
                Manage Stripe Account
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Payments & Payouts Tabs */}
        <Tabs defaultValue="payments" className="w-full">
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>
                  View all payments from your courses and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
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
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Your Earning</TableHead>
                          <TableHead>Platform Fee</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                              No payment transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>{payment.user_email || 'Unknown'}</TableCell>
                              <TableCell>{getPaymentTypeLabel(payment.reference_type)}</TableCell>
                              <TableCell>
                                {payment.currency.toUpperCase()} {payment.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-green-600 font-medium">
                                USD {(payment.amount * 0.92).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                USD {(payment.amount * 0.08).toFixed(2)}
                              </TableCell>
                              <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Export CSV</Button>
                <Button variant="outline" onClick={loadPaymentData}>Refresh</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>
                  View all your withdrawal requests and payouts
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
                          <TableHead>Method</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              No payout transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          payouts.map((payout) => (
                            <TableRow key={payout.id}>
                              <TableCell>
                                {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="capitalize">{payout.method}</TableCell>
                              <TableCell>{payout.destination}</TableCell>
                              <TableCell>
                                {payout.currency.toUpperCase()} {payout.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>{getStatusBadge(payout.status)}</TableCell>
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

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        availableBalance={enhancedBalance.available_balance}
        currency="USD"
        onSuccess={loadPaymentData}
      />
    </CreatorLayout>
  );
};

export default CreatorPayments;
