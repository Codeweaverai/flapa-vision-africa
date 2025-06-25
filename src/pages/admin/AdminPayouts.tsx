
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Search, Filter, Eye, Download, CreditCard, Smartphone, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminLayout from '@/components/admin/AdminLayout';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface CreatorPayout {
  id: string;
  creator_id: string;
  amount: number;
  currency: string;
  method: string;
  payout_method: string;
  destination: string;
  status: string;
  created_at: string;
  updated_at: string;
  stripe_payout_id?: string;
  pawapay_deposit_id?: string;
  mobile_money_details?: any;
  creator_profile?: {
    full_name: string;
    username: string;
    email: string;
  };
}

interface CreatorBalance {
  creator_id: string;
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  creator_profile?: {
    full_name: string;
    username: string;
    email: string;
  };
}

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [creatorBalances, setCreatorBalances] = useState<CreatorBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState<CreatorPayout | null>(null);
  const [showBalances, setShowBalances] = useState(false);

  useEffect(() => {
    loadPayouts();
    loadCreatorBalances();
  }, []);

  const loadPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_payouts')
        .select(`
          *,
          creator_profile:profiles!creator_payouts_creator_id_fkey (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get creator emails from auth
      const payoutsWithEmails = await Promise.all(
        (data || []).map(async (payout) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(payout.creator_id);
            return {
              ...payout,
              creator_profile: {
                full_name: payout.creator_profile?.full_name || 'N/A',
                username: payout.creator_profile?.username || 'N/A',
                email: userData.user?.email || 'N/A'
              }
            };
          } catch (error) {
            console.error('Error fetching user email:', error);
            return {
              ...payout,
              creator_profile: {
                full_name: payout.creator_profile?.full_name || 'N/A',
                username: payout.creator_profile?.username || 'N/A',
                email: 'N/A'
              }
            };
          }
        })
      );

      setPayouts(payoutsWithEmails);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const loadCreatorBalances = async () => {
    try {
      // Get all creators who have earnings
      const { data: creators, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username
        `)
        .eq('role', 'user'); // Changed from 'creator' to 'user' to match valid role types

      if (error) throw error;

      const balancesWithEmails = await Promise.all(
        (creators || []).map(async (creator) => {
          try {
            // Get creator balance using the database function
            const { data: balanceData, error: balanceError } = await supabase
              .rpc('calculate_creator_earnings', { creator_user_id: creator.id });

            if (balanceError) throw balanceError;

            // Get creator email
            const { data: userData } = await supabase.auth.admin.getUserById(creator.id);

            const balance = balanceData?.[0] || {
              available_balance: 0,
              pending_balance: 0,
              total_earnings: 0
            };

            return {
              creator_id: creator.id,
              available_balance: Number(balance.available_balance) || 0,
              pending_balance: Number(balance.pending_balance) || 0,
              total_earnings: Number(balance.total_earnings) || 0,
              creator_profile: {
                full_name: creator.full_name || 'N/A',
                username: creator.username || 'N/A',
                email: userData.user?.email || 'N/A'
              }
            };
          } catch (error) {
            console.error('Error calculating balance for creator:', creator.id, error);
            return {
              creator_id: creator.id,
              available_balance: 0,
              pending_balance: 0,
              total_earnings: 0,
              creator_profile: {
                full_name: creator.full_name || 'N/A',
                username: creator.username || 'N/A',
                email: 'N/A'
              }
            };
          }
        })
      );

      // Filter out creators with zero balances
      const creatorsWithBalances = balancesWithEmails.filter(
        balance => balance.total_earnings > 0
      );

      setCreatorBalances(creatorsWithBalances);
    } catch (error) {
      console.error('Error loading creator balances:', error);
      toast.error('Failed to load creator balances');
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.creator_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.creator_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.creator_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payout.payout_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    return method === 'stripe' ? 
      <CreditCard className="h-4 w-4" /> : 
      <Smartphone className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <AdminLayout title="Payout Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payout Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payouts.filter(p => p.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payouts.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payouts.filter(p => p.status === 'failed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => setShowBalances(!showBalances)}
            variant={showBalances ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            {showBalances ? 'Show Payouts' : 'Show Creator Balances'}
          </Button>
        </div>

        {showBalances ? (
          /* Creator Balances Table */
          <Card>
            <CardHeader>
              <CardTitle>Creator Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Available Balance</TableHead>
                    <TableHead>Pending Balance</TableHead>
                    <TableHead>Total Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creatorBalances.map((balance) => (
                    <TableRow key={balance.creator_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {balance.creator_profile?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{balance.creator_profile?.username || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{balance.creator_profile?.email}</TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          <PriceDisplay amount={balance.available_balance} originalCurrency="USD" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-amber-600">
                          <PriceDisplay amount={balance.pending_balance} originalCurrency="USD" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          <PriceDisplay amount={balance.total_earnings} originalCurrency="USD" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Payouts Table */
          <>
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by creator name, email, or payout ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payouts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payout.creator_profile?.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payout.creator_profile?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            <PriceDisplay 
                              amount={payout.amount} 
                              originalCurrency={payout.currency.toUpperCase() as "USD" | "GBP" | "EUR" | "ZMW" | "NGN" | "GHS" | "KES" | "UGX" | "TZS" | "RWF" | "XOF" | "XAF" | "CDF" | "MZN" | "MWK" | "LSL" | "SLL"} 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payout.payout_method)}
                            <span className="capitalize">{payout.payout_method.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs truncate">
                            {payout.destination}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPayout(payout)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Payout Details</DialogTitle>
                              </DialogHeader>
                              {selectedPayout && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Payout ID</label>
                                      <p className="text-sm text-muted-foreground">{selectedPayout.id}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <p className="text-sm">{getStatusBadge(selectedPayout.status)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Creator</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedPayout.creator_profile?.full_name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedPayout.creator_profile?.email}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Amount</label>
                                      <p className="text-sm font-medium">
                                        <PriceDisplay 
                                          amount={selectedPayout.amount} 
                                          originalCurrency={selectedPayout.currency.toUpperCase() as "USD" | "GBP" | "EUR" | "ZMW" | "NGN" | "GHS" | "KES" | "UGX" | "TZS" | "RWF" | "XOF" | "XAF" | "CDF" | "MZN" | "MWK" | "LSL" | "SLL"} 
                                        />
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Method</label>
                                      <p className="text-sm capitalize">
                                        {selectedPayout.payout_method.replace('_', ' ')}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium">Destination</label>
                                      <p className="text-sm text-muted-foreground">{selectedPayout.destination}</p>
                                    </div>
                                    {selectedPayout.stripe_payout_id && (
                                      <div className="col-span-2">
                                        <label className="text-sm font-medium">Stripe Payout ID</label>
                                        <p className="text-sm text-muted-foreground font-mono">
                                          {selectedPayout.stripe_payout_id}
                                        </p>
                                      </div>
                                    )}
                                    {selectedPayout.pawapay_deposit_id && (
                                      <div className="col-span-2">
                                        <label className="text-sm font-medium">PawaPay Deposit ID</label>
                                        <p className="text-sm text-muted-foreground font-mono">
                                          {selectedPayout.pawapay_deposit_id}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <label className="text-sm font-medium">Created</label>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedPayout.created_at), 'PPpp')}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Updated</label>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedPayout.updated_at), 'PPpp')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayouts;
