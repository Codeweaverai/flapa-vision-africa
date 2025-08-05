
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Clock, CreditCard, ArrowUpRight, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCreatorEarnings, fetchCreatorPayouts, type CreatorEarnings } from '@/services/creatorPaymentService';
import { fetchCreatorOrderTransactions, type CreatorOrderTransaction } from '@/services/creatorOrdersService';
import CreatorWithdrawDialog from '@/components/creator/CreatorWithdrawDialog';

const CreatorPayments = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [transactions, setTransactions] = useState<CreatorOrderTransaction[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadEarningsAndPayouts();
      loadTransactions();
    }
  }, [user, currentPage]);

  const loadEarningsAndPayouts = async () => {
    if (!user) return;
    
    try {
      const [earningsData, payoutsData] = await Promise.all([
        fetchCreatorEarnings(user.id),
        fetchCreatorPayouts(user.id, 5, 0)
      ]);
      
      setEarnings(earningsData);
      setPayouts(payoutsData.payouts);
    } catch (error) {
      console.error('Error loading earnings and payouts:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    setTransactionsLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const transactionsData = await fetchCreatorOrderTransactions(user.id, itemsPerPage, offset);
      setTransactions(transactionsData.transactions);
      setTotalTransactions(transactionsData.total);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <CreatorLayout title="Payments & Earnings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Payments & Earnings">
      <div className="space-y-6">
        {/* Earnings Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earnings?.available_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earnings?.pending_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Processing (7-day hold)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earnings?.total_earnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earnings?.total_platform_fees || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total fees paid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">
              Manage your earnings and withdrawals
            </p>
          </div>
          <Button
            onClick={() => setShowWithdrawDialog(true)}
            disabled={!earnings?.available_balance || earnings.available_balance <= 0}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>

        {/* Customer Payment Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Payment Transactions</CardTitle>
            <CardDescription>
              View all completed payment transactions from customers for your courses and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Customer transactions will appear here once students enroll in your courses or register for your events.
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
                      <TableHead>Total Price</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Your Earning</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          {transaction.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{transaction.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.item_title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.item_type === 'course' ? 'Course' : 'Event Ticket'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.total_price, transaction.currency)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          -{formatCurrency(transaction.platform_fee, transaction.currency)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(transaction.creator_earning, transaction.currency)}
                        </TableCell>
                        <TableCell>{formatDate(transaction.order_date)}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.payment_status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.payment_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payouts</CardTitle>
            <CardDescription>
              Your latest withdrawal requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
                <p className="text-muted-foreground">
                  Your withdrawal requests will appear here once you make your first payout.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        {formatCurrency(payout.amount, payout.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payout.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          payout.status === 'completed' ? 'default' :
                          payout.status === 'processing' ? 'secondary' : 'destructive'
                        }>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payout.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreatorWithdrawDialog
        isOpen={showWithdrawDialog}
        onClose={() => setShowWithdrawDialog(false)}
        availableBalance={earnings?.available_balance || 0}
        onSuccess={() => {
          setShowWithdrawDialog(false);
          loadEarningsAndPayouts();
        }}
      />
    </CreatorLayout>
  );
};

export default CreatorPayments;
