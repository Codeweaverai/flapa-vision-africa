
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Calendar, DollarSign, CreditCard, Download, AlertCircle, ExternalLink, TrendingUp, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  fetchCreatorEarnings,
  fetchCreatorPaymentTransactions,
  fetchCreatorPayouts,
  CreatorEarnings,
  CreatorPaymentTransaction
} from '@/services/creatorPaymentService';
import { getStripeAccountStatus } from '@/services/paymentService';
import CreatorWithdrawDialog from '@/components/creator/CreatorWithdrawDialog';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';

const CreatorPayments: React.FC = () => {
  const [transactions, setTransactions] = useState<CreatorPaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<CreatorEarnings>({
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
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | undefined>();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertPrice, currentCurrency } = useCurrency();
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
      case 'event':
        return 'Event Registration';
      case 'consultation':
        return 'Consultation Booking';
      default:
        return type;
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payments & Payouts</h1>
        
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
                disabled={loadingEarnings || earnings.available_balance < 5}
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
                  View all payments from customers for your courses and events
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
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Your Earning</TableHead>
                          <TableHead>Platform Fee</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                              No customer transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>{transaction.customer_name || 'Unknown'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {transaction.item_name || 'Unknown Item'}
                              </TableCell>
                              <TableCell>{getPaymentTypeLabel(transaction.reference_type)}</TableCell>
                              <TableCell>
                                <PriceDisplay amount={transaction.amount} originalCurrency={transaction.currency as any} />
                              </TableCell>
                              <TableCell className="text-green-600 font-medium">
                                <PriceDisplay amount={transaction.creator_earning} originalCurrency="USD" />
                              </TableCell>
                              <TableCell className="text-gray-500">
                                <PriceDisplay amount={transaction.platform_fee_amount} originalCurrency="USD" />
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
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
                              <TableCell className="capitalize">
                                {payout.payout_method === 'mobile_money' ? 'Mobile Money' : 'Stripe'}
                              </TableCell>
                              <TableCell>{payout.destination}</TableCell>
                              <TableCell>
                                <PriceDisplay amount={payout.amount} originalCurrency={payout.currency as any} />
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

      {/* Creator Withdraw Dialog with Multiple Payment Methods */}
      <CreatorWithdrawDialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        availableBalance={earnings.available_balance}
        currency="USD"
        onSuccess={loadPaymentData}
      />
    </CreatorLayout>
  );
};

export default CreatorPayments;
