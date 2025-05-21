
import React, { useEffect, useState } from 'react';
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
import { BarChart, Calendar, DollarSign, CreditCard, Download } from 'lucide-react';
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
  fetchCreatorPayments, 
  fetchCreatorPayouts, 
  calculateCreatorBalance,
  requestPayout,
  connectStripeAccount
} from '@/services/paymentService';

const CreatorPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutTransaction[]>([]);
  const [balance, setBalance] = useState<CreatorBalance>({
    available: 0,
    pending: 0,
    currency: 'USD'
  });
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState('stripe');
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      loadPaymentData();
    }
  }, [user]);
  
  const loadPaymentData = async () => {
    if (!user) return;
    
    try {
      setLoadingPayments(true);
      setLoadingPayouts(true);
      setLoadingBalance(true);
      
      const [paymentsData, payoutsData, balanceData] = await Promise.all([
        fetchCreatorPayments(user.id),
        fetchCreatorPayouts(user.id),
        calculateCreatorBalance(user.id)
      ]);
      
      setPayments(paymentsData);
      setPayouts(payoutsData);
      setBalance(balanceData);
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
  
  const handleMethodChange = (value: string) => {
    setPayoutMethod(value);
  };
  
  const handleRequestPayout = async () => {
    if (!user) return;
    
    if (balance.available <= 0) {
      toast({
        title: "Withdrawal Error",
        description: "You don't have any available balance to withdraw",
        variant: "destructive"
      });
      return;
    }
    
    const destination = payoutMethod === 'stripe' 
      ? 'Stripe Connect Account' 
      : payoutMethod === 'mobile_money' 
        ? 'Mobile Money Account' 
        : 'Bank Account';
    
    const success = await requestPayout(
      user.id, 
      balance.available, 
      balance.currency, 
      payoutMethod,
      destination
    );
    
    if (success) {
      await loadPaymentData();
      setIsWithdrawDialogOpen(false);
    }
  };
  
  const handleConnectStripe = async () => {
    if (!user) return;
    
    const url = await connectStripeAccount(user.id);
    if (url) {
      window.open(url, '_blank');
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
        {/* Balance Cards */}
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
                  {balance.currency} {balance.available.toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Available for withdrawal
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setIsWithdrawDialogOpen(true)}
                disabled={loadingBalance || balance.available <= 0}
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
                  {balance.currency} {balance.pending.toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Pending clearance
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {balance.currency} {payments
                    .filter(payment => payment.status === 'completed')
                    .reduce((sum, payment) => sum + payment.amount, 0)
                    .toFixed(2)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Total earnings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Payout Method</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Select value={payoutMethod} onValueChange={handleMethodChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payout method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe Connect</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter>
              {payoutMethod === 'stripe' && (
                <Button variant="outline" onClick={handleConnectStripe} className="w-full">
                  Connect Stripe Account
                </Button>
              )}
              {payoutMethod === 'mobile_money' && (
                <Button variant="outline" onClick={() => {}} className="w-full">
                  Setup Mobile Money
                </Button>
              )}
              {payoutMethod === 'bank_transfer' && (
                <Button variant="outline" onClick={() => {}} className="w-full">
                  Setup Bank Account
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
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
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No payout transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          payouts.map((payout) => (
                            <TableRow key={payout.id}>
                              <TableCell>
                                {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>{payout.method}</TableCell>
                              <TableCell>{payout.destination}</TableCell>
                              <TableCell>
                                {payout.currency.toUpperCase()} {payout.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>{getStatusBadge(payout.status)}</TableCell>
                              <TableCell>
                                {payout.status === 'completed' && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4 mr-1" />
                                    Receipt
                                  </Button>
                                )}
                              </TableCell>
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
        </Tabs>
      </div>
      
      {/* Withdraw Funds Dialog */}
      <AlertDialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Funds</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to withdraw {balance.currency} {balance.available.toFixed(2)} to your {
                payoutMethod === 'stripe' ? 'Stripe Connect account' : 
                payoutMethod === 'mobile_money' ? 'Mobile Money account' : 'Bank account'
              }.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Available balance:</span>
              <span className="font-medium">{balance.currency} {balance.available.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Withdrawal amount:</span>
              <span className="font-medium">{balance.currency} {balance.available.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Payout method:</span>
              <span className="font-medium">
                {payoutMethod === 'stripe' ? 'Stripe Connect' : 
                 payoutMethod === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Processing time:</span>
              <span className="font-medium">1-3 business days</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestPayout}>
              Confirm Withdrawal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
};

export default CreatorPayments;
