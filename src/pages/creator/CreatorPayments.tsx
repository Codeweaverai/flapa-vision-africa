
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/layout/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  Download, 
  Search, 
  Filter,
  TrendingUp,
  Calendar,
  CreditCard,
  Users,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  type: 'course' | 'event';
  title: string;
  student_name?: string;
  payment_method?: string;
}

interface PaymentStats {
  totalEarnings: number;
  pendingPayments: number;
  completedPayments: number;
  monthlyEarnings: number;
}

const CreatorPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    monthlyEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, typeFilter]);

  const fetchPayments = async () => {
    try {
      // Fetch course enrollments
      const { data: courseEnrollments, error: courseError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!inner(title, price, is_free, creator_id),
          users!inner(first_name, last_name)
        `)
        .eq('courses.creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (courseError) throw courseError;

      // Fetch event registrations
      const { data: eventRegistrations, error: eventError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events!inner(title, price, is_free, creator_id),
          users!inner(first_name, last_name)
        `)
        .eq('events.creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (eventError) throw eventError;

      // Transform data to payment format
      const coursePayments: Payment[] = (courseEnrollments || []).map(enrollment => ({
        id: enrollment.id,
        amount: enrollment.courses?.is_free ? 0 : (enrollment.courses?.price || 0),
        currency: 'USD',
        status: enrollment.payment_status,
        created_at: enrollment.created_at,
        type: 'course' as const,
        title: enrollment.courses?.title || 'Unknown Course',
        student_name: `${enrollment.users?.first_name || ''} ${enrollment.users?.last_name || ''}`.trim(),
        payment_method: 'Stripe'
      }));

      const eventPayments: Payment[] = (eventRegistrations || []).map(registration => ({
        id: registration.id,
        amount: registration.events?.is_free ? 0 : (registration.events?.price || 0),
        currency: 'USD',
        status: registration.payment_status,
        created_at: registration.created_at,
        type: 'event' as const,
        title: registration.events?.title || 'Unknown Event',
        student_name: `${registration.users?.first_name || ''} ${registration.users?.last_name || ''}`.trim(),
        payment_method: 'Stripe'
      }));

      const allPayments = [...coursePayments, ...eventPayments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPayments(allPayments);

      // Calculate stats
      const totalEarnings = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayments = allPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const completedPayments = allPayments
        .filter(p => p.status === 'completed').length;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyEarnings = allPayments
        .filter(p => {
          const paymentDate = new Date(p.created_at);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear &&
                 p.status === 'completed';
        })
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalEarnings,
        pendingPayments,
        completedPayments,
        monthlyEarnings
      });

    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.type === typeFilter);
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
            <p className="text-gray-600">Track your earnings and payment history</p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Download className="h-4 w-4 mr-2" />
            Export Payments
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <PriceDisplay amount={stats.totalEarnings} originalCurrency="USD" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <PriceDisplay amount={stats.monthlyEarnings} originalCurrency="USD" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <PriceDisplay amount={stats.pendingPayments} originalCurrency="USD" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completedPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payments Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {payment.type === 'course' ? (
                              <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                            ) : (
                              <Calendar className="h-4 w-4 mr-2 text-green-600" />
                            )}
                            {payment.type === 'course' ? 'Course' : 'Event'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{payment.title}</TableCell>
                        <TableCell>{payment.student_name || 'Unknown'}</TableCell>
                        <TableCell>
                          {payment.amount > 0 ? (
                            <PriceDisplay amount={payment.amount} originalCurrency="USD" />
                          ) : (
                            'Free'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                            {payment.payment_method || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredPayments.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing {filteredPayments.length} of {payments.length} payments
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default CreatorPayments;
