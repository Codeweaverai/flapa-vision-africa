import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Receipt,
  Eye,
  Filter,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Users,
  BookOpen,
  Ticket
} from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  fetchCreatorEarnings, 
  fetchCreatorPaymentTransactions, 
  requestCreatorPayout,
  fetchCreatorPayouts,
  type CreatorEarnings,
  type CreatorPaymentTransaction,
  type PayoutRequest
} from '@/services/creatorPaymentService';
import { fetchCreatorOrderTransactions, type CreatorOrderTransaction } from '@/services/creatorOrdersService';
import EnhancedWithdrawDialog from '@/components/creator/EnhancedWithdrawDialog';
import PawaPayPayoutDialog from '@/components/creator/PawaPayPayoutDialog';
import StripeAccountManagement from '@/components/creator/StripeAccountManagement';

const CreatorPayments = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [paymentTransactions, setPaymentTransactions] = useState<CreatorOrderTransaction[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [pawaPayDialogOpen, setPawaPayDialogOpen] = useState(false);
  const [transactionPage, setTransactionPage] = useState(0);
  const [payoutPage, setPayoutPage] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (user) {
      loadEarningsData();
      loadTransactions();
      loadPayouts();
    }
  }, [user]);

  const loadEarningsData = async () => {
    if (!user) return;

    try {
      const earningsData = await fetchCreatorEarnings(user.id);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (page = 0) => {
    if (!user) return;

    setTransactionsLoading(true);
    try {
      const offset = page * ITEMS_PER_PAGE;
      const { transactions, total } = await fetchCreatorOrderTransactions(user.id, ITEMS_PER_PAGE, offset);
      setPaymentTransactions(transactions);
      setTotalTransactions(total);
      setTransactionPage(page);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load payment transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadPayouts = async (page = 0) => {
    if (!user) return;

    setPayoutsLoading(true);
    try {
      const offset = page * ITEMS_PER_PAGE;
      const { payouts: payoutData, total } = await fetchCreatorPayouts(user.id, ITEMS_PER_PAGE, offset);
      setPayouts(payoutData);
      setTotalPayouts(total);
      setPayoutPage(page);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setPayoutsLoading(false);
    }
  };

  const handleWithdrawSuccess = useCallback(() => {
    loadEarningsData();
    loadPayouts();
    setWithdrawDialogOpen(false);
    setPawaPayDialogOpen(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading || !earnings) {
    return (
      <CreatorLayout title="Payments">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  const availablePercentage = earnings.total_earnings > 0 
    ? (earnings.available_balance / earnings.total_earnings) * 100 
    : 0;

  const pendingPercentage = earnings.total_earnings > 0 
    ? (earnings.pending_balance / earnings.total_earnings) * 100 
    : 0;

  const totalTransactionPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);
  const totalPayoutPages = Math.ceil(totalPayouts / ITEMS_PER_PAGE);

  return (
    <CreatorLayout title="Payments">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Payment Dashboard</h2>
            <p className="text-muted-foreground">
              Manage your earnings and track payment transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setWithdrawDialogOpen(true)} 
              disabled={earnings.available_balance <= 0}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </div>
        </div>

        {/* Earnings Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(earnings.available_balance)}
              </div>
              <p className="text-xs text-green-600">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(earnings.pending_balance)}
              </div>
              <p className="text-xs text-orange-600">
                7-day processing period
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(earnings.total_earnings)}
              </div>
              <p className="text-xs text-blue-600">
                All-time earnings
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <Receipt className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(earnings.total_platform_fees)}
              </div>
              <p className="text-xs text-purple-600">
                8% platform fee
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(earnings.course_revenue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                From course enrollments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Event Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(earnings.event_revenue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                From event bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Breakdown</CardTitle>
            <CardDescription>
              Visual representation of your earnings status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Available ({availablePercentage.toFixed(1)}%)</span>
                <span>{formatCurrency(earnings.available_balance)}</span>
              </div>
              <Progress value={availablePercentage} className="h-2 bg-green-100" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Pending ({pendingPercentage.toFixed(1)}%)</span>
                <span>{formatCurrency(earnings.pending_balance)}</span>
              </div>
              <Progress value={pendingPercentage} className="h-2 bg-orange-100" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Transactions and Payouts */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Payment Transactions</TabsTrigger>
            <TabsTrigger value="payouts">Withdrawal History</TabsTrigger>
            <TabsTrigger value="settings">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Customer Payment Transactions
                </CardTitle>
                <CardDescription>
                  View all completed payment transactions from customers for your courses and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : paymentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">
                      Payment transactions will appear here once customers purchase your content
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Your Earning</TableHead>
                          <TableHead>Platform Fee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium font-mono text-sm">
                              {transaction.order_id.slice(-8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.customer_name}</div>
                                <div className="text-sm text-muted-foreground">{transaction.customer_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <div className="font-medium truncate">{transaction.item_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Qty: {transaction.quantity}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                {transaction.item_type === 'course' ? (
                                  <>
                                    <BookOpen className="h-3 w-3" />
                                    Course
                                  </>
                                ) : (
                                  <>
                                    <Ticket className="h-3 w-3" />
                                    Event
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.total_amount)}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(transaction.creator_earning)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatCurrency(transaction.platform_fee)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <CalendarIcon className="h-3 w-3" />
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {transaction.payment_method}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination for Transactions */}
                    {totalTransactionPages > 1 && (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {transactionPage * ITEMS_PER_PAGE + 1} to {Math.min((transactionPage + 1) * ITEMS_PER_PAGE, totalTransactions)} of {totalTransactions} transactions
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTransactions(transactionPage - 1)}
                            disabled={transactionPage === 0}
                          >
                            Previous
                          </Button>
                          <div className="text-sm">
                            {transactionPage + 1} of {totalTransactionPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTransactions(transactionPage + 1)}
                            disabled={transactionPage === totalTransactionPages - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5" />
                  Withdrawal History
                </CardTitle>
                <CardDescription>
                  Track all your withdrawal requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payoutsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No withdrawals yet</h3>
                    <p className="text-muted-foreground">
                      Your withdrawal history will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Destination</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell>
                              {new Date(payout.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payout.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {payout.method === 'stripe' ? 'Stripe Connect' : 'Mobile Money'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(payout.status)}
                                <Badge variant={getStatusBadgeVariant(payout.status)}>
                                  {payout.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payout.destination}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination for Payouts */}
                    {totalPayoutPages > 1 && (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {payoutPage * ITEMS_PER_PAGE + 1} to {Math.min((payoutPage + 1) * ITEMS_PER_PAGE, totalPayouts)} of {totalPayouts} payouts
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPayouts(payoutPage - 1)}
                            disabled={payoutPage === 0}
                          >
                            Previous
                          </Button>
                          <div className="text-sm">
                            {payoutPage + 1} of {totalPayoutPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPayouts(payoutPage + 1)}
                            disabled={payoutPage === totalPayoutPages - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <StripeAccountManagement />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <EnhancedWithdrawDialog
          open={withdrawDialogOpen}
          onOpenChange={setWithdrawDialogOpen}
          availableBalance={earnings.available_balance}
          onSuccess={handleWithdrawSuccess}
        />

        <PawaPayPayoutDialog
          open={pawaPayDialogOpen}
          onOpenChange={setPawaPayDialogOpen}
          availableBalance={earnings.available_balance}
          onSuccess={handleWithdrawSuccess}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorPayments;
