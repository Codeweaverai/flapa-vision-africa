
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Search, Eye, Calendar, User, CreditCard, Smartphone, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
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
  };
}

interface CreatorBalance {
  creator_id: string;
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_payouts: number;
  creator_profile?: {
    full_name: string;
    username: string;
  };
}

interface OrderItem {
  total_price: number;
  quantity: number;
  item_type: string;
  item_id: string;
  orders: {
    created_at: string;
    payment_status: string;
    user_id: string;
  };
}

const PAGE_SIZE = 10;
const PLATFORM_FEE_RATE = 0.08;

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<CreatorPayout[]>([]);
  const [creatorBalances, setCreatorBalances] = useState<CreatorBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState<CreatorPayout | null>(null);
  const [showBalances, setShowBalances] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayoutCount, setTotalPayoutCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterPayouts();
  }, [searchTerm, statusFilter, methodFilter, payouts]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadPayouts(), loadCreatorBalances()]);
    } finally {
      setLoading(false);
    }
  };

  const loadPayouts = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('creator_payouts')
        .select('*', { count: 'exact', head: true });
      setTotalPayoutCount(count || 0);

      // Get paginated data
      const { data: payoutsData, error } = await supabase
        .from('creator_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      // Get profiles in bulk
      const creatorIds = payoutsData?.map(p => p.creator_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', creatorIds);

      // Combine data
      const enrichedPayouts = payoutsData?.map(payout => ({
        ...payout,
        creator_profile: profilesData?.find(p => p.id === payout.creator_id) || {
          full_name: 'N/A',
          username: 'N/A'
        }
      })) || [];

      setPayouts(enrichedPayouts);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('Failed to load payouts');
    }
  };

  const loadMorePayouts = async (page: number) => {
    try {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: payoutsData, error } = await supabase
        .from('creator_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Merge new payouts
      setPayouts(prev => {
        const newPayouts = [...prev];
        payoutsData?.forEach(newPayout => {
          if (!newPayouts.some(p => p.id === newPayout.id)) {
            newPayouts.push({
              ...newPayout,
              creator_profile: { full_name: 'N/A', username: 'N/A' }
            });
          }
        });
        return newPayouts;
      });

      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading more payouts:', error);
      toast.error('Failed to load more payouts');
    } finally {
      setLoading(false);
    }
  };

  const loadCreatorBalances = async () => {
    try {
      // Get all creators who have courses or events
      const { data: creators, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .not('id', 'is', null);

      if (creatorsError) throw creatorsError;

      const balances: CreatorBalance[] = [];

      for (const creator of creators || []) {
        const balance = await calculateCreatorBalance(creator.id);
        if (balance.total_earnings > 0 || balance.available_balance > 0 || balance.pending_balance > 0) {
          balances.push({
            ...balance,
            creator_profile: {
              full_name: creator.full_name || 'N/A',
              username: creator.username || 'N/A'
            }
          });
        }
      }

      setCreatorBalances(balances);
    } catch (error) {
      console.error('Error loading creator balances:', error);
      toast.error('Failed to load creator balances');
    }
  };

  const calculateCreatorBalance = async (creatorId: string): Promise<CreatorBalance> => {
    try {
      // Get creator's course IDs
      const { data: creatorCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('creator_id', creatorId);

      const courseIds = creatorCourses?.map(c => c.id) || [];

      // Get creator's event IDs
      const { data: creatorEvents } = await supabase
        .from('events')
        .select('id')
        .eq('creator_id', creatorId);

      const eventIds = creatorEvents?.map(e => e.id) || [];

      // Get event ticket IDs for creator's events
      let eventTicketIds: string[] = [];
      if (eventIds.length > 0) {
        const { data: eventTickets } = await supabase
          .from('event_tickets')
          .select('id')
          .in('event_id', eventIds);
        eventTicketIds = eventTickets?.map(t => t.id) || [];
      }

      // Fetch course order items
      let courseOrderItems: OrderItem[] = [];
      if (courseIds.length > 0) {
        const { data } = await supabase
          .from('order_items')
          .select(`
            total_price,
            quantity,
            item_type,
            item_id,
            orders!inner(
              created_at,
              payment_status,
              user_id
            )
          `)
          .eq('item_type', 'course')
          .eq('orders.payment_status', 'completed')
          .in('item_id', courseIds);
        courseOrderItems = data || [];
      }

      // Fetch event order items
      let eventOrderItems: OrderItem[] = [];
      if (eventTicketIds.length > 0) {
        const { data } = await supabase
          .from('order_items')
          .select(`
            total_price,
            quantity,
            item_type,
            item_id,
            orders!inner(
              created_at,
              payment_status,
              user_id
            )
          `)
          .eq('item_type', 'event_ticket')
          .eq('orders.payment_status', 'completed')
          .in('item_id', eventTicketIds);
        eventOrderItems = data || [];
      }

      // Calculate earnings
      const allOrderItems = [...courseOrderItems, ...eventOrderItems];
      let totalRevenue = 0;
      let availableBalance = 0;
      let pendingBalance = 0;

      const now = new Date();

      allOrderItems.forEach(item => {
        const itemTotal = Number(item.total_price);
        const platformFee = itemTotal * PLATFORM_FEE_RATE;
        const creatorEarning = itemTotal - platformFee;
        
        totalRevenue += creatorEarning;

        // Calculate 7-day hold period
        const orderDate = new Date(item.orders.created_at);
        const eligibleDate = new Date(orderDate);
        eligibleDate.setDate(orderDate.getDate() + 7);

        if (now >= eligibleDate) {
          availableBalance += creatorEarning;
        } else {
          pendingBalance += creatorEarning;
        }
      });

      // Get completed payouts
      const { data: completedPayouts } = await supabase
        .from('creator_payouts')
        .select('amount')
        .eq('creator_id', creatorId)
        .eq('status', 'completed');

      const totalPayouts = completedPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      availableBalance = Math.max(0, availableBalance - totalPayouts);

      return {
        creator_id: creatorId,
        available_balance: availableBalance,
        pending_balance: pendingBalance,
        total_earnings: totalRevenue,
        total_payouts: totalPayouts
      };
    } catch (error) {
      console.error(`Error calculating balance for creator ${creatorId}:`, error);
      return {
        creator_id: creatorId,
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_payouts: 0
      };
    }
  };

  const filterPayouts = () => {
    const filtered = payouts.filter(payout => {
      const matchesSearch = 
        payout.creator_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.creator_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || payout.payout_method === methodFilter;
      
      return matchesSearch && matchesStatus && matchesMethod;
    });
    
    setFilteredPayouts(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    return method === 'stripe' ? 
      <CreditCard className="h-4 w-4" /> : 
      <Smartphone className="h-4 w-4" />;
  };

  // Calculate displayed data
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredPayouts.length / PAGE_SIZE);
  const completedPayouts = payouts.filter(p => p.status === 'completed').length;
  const pendingPayouts = payouts.filter(p => p.status === 'pending').length;
  const totalPayoutAmount = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAvailableBalance = creatorBalances.reduce((sum, b) => sum + b.available_balance, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <AdminLayout title="Payout Management">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </AdminLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <AdminLayout title="Payout Management">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-orange-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPayoutCount}</div>
                <p className="text-xs opacity-80">${totalPayoutAmount.toFixed(2)} total</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedPayouts}</div>
                <p className="text-xs opacity-80">Successfully paid</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-400 to-purple-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPayouts}</div>
                <p className="text-xs opacity-80">Awaiting processing</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-400 to-orange-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalAvailableBalance.toFixed(2)}</div>
                <p className="text-xs opacity-80">Ready for payout</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => setShowBalances(!showBalances)}
              variant={showBalances ? "default" : "outline"}
              className={showBalances ? 
                "bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white" :
                "border-orange-500 text-orange-600 hover:bg-orange-50"
              }
            >
              <User className="h-4 w-4 mr-2" />
              {showBalances ? 'Show Payouts' : 'Show Creator Balances'}
            </Button>
          </div>

          {showBalances ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Creator Balances ({creatorBalances.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creator</TableHead>
                        <TableHead>Available Balance</TableHead>
                        <TableHead>Pending Balance</TableHead>
                        <TableHead>Total Earnings</TableHead>
                        <TableHead>Total Payouts</TableHead>
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
                          <TableCell>
                            <div className="font-medium text-gray-600">
                              <PriceDisplay amount={balance.total_payouts} originalCurrency="USD" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by creator name, username, or payout ID..."
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
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Payout Transactions ({filteredPayouts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
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
                        {paginatedPayouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {payout.creator_profile?.full_name || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  @{payout.creator_profile?.username || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                <PriceDisplay amount={payout.amount} originalCurrency={payout.currency.toUpperCase() as any} />
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
                                          <label className="text-sm font-medium">Username</label>
                                          <p className="text-sm text-muted-foreground">
                                            @{selectedPayout.creator_profile?.username}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Amount</label>
                                          <p className="text-sm font-medium">
                                            <PriceDisplay amount={selectedPayout.amount} originalCurrency={selectedPayout.currency.toUpperCase() as any} />
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
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                      {Math.min(currentPage * PAGE_SIZE, filteredPayouts.length)} of {filteredPayouts.length} payouts
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMorePayouts(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMorePayouts(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AdminLayout>
    </div>
  );
};

export default AdminPayouts;
