import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, BookOpen, Calendar, TrendingUp, Eye, Download, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchCreatorEarnings, 
  fetchCreatorPaymentTransactions 
} from '@/services/creatorPaymentService';
import { 
  calculateCreatorEarningsFromOrders 
} from '@/services/creatorEarningsService';
import CreatorLayout from '@/components/creator/CreatorLayout';
import EnhancedWithdrawDialog from '@/components/creator/EnhancedWithdrawDialog';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorFloatingAI from '@/components/creator/CreatorFloatingAI';

interface DashboardStats {
  totalCourses: number;
  totalEvents: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  totalEnrollments: number;
  totalBookings: number;
  courseReviews: number;
  eventReviews: number;
  courseRating: number;
  eventRating: number;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const { convertPrice, currentCurrency } = useCurrency();
  const [earnings, setEarnings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalEvents: 0,
    totalStudents: 0,
    totalReviews: 0,
    averageRating: 0,
    totalViews: 0,
    totalEnrollments: 0,
    totalBookings: 0,
    courseReviews: 0,
    eventReviews: 0,
    courseRating: 0,
    eventRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load earnings from creator payments service
      const earningsData = await fetchCreatorEarnings(user.id);
      setEarnings(earningsData);
      
      // Load payment transactions
      const transactionsResult = await fetchCreatorPaymentTransactions(user.id);
      setTransactions(transactionsResult.transactions);
      
      // Load comprehensive stats
      await loadComprehensiveStats();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComprehensiveStats = async () => {
    if (!user) return;
    
    try {
      // Fetch courses with reviews and enrollments
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          course_enrollments(id, user_id),
          course_reviews(id, rating)
        `)
        .eq('creator_id', user.id)
        .eq('is_published', true);
      
      if (coursesError) throw coursesError;

      // Fetch events with reviews and bookings
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_bookings(id, user_id),
          event_reviews(id, rating)
        `)
        .eq('creator_id', user.id);
      
      if (eventsError) throw eventsError;

      // Calculate comprehensive statistics
      const totalCourses = courses?.length || 0;
      const totalEvents = events?.length || 0;
      
      // Calculate enrollments and unique students
      const allEnrollments = courses?.flatMap(c => c.course_enrollments || []) || [];
      const allBookings = events?.flatMap(e => e.event_bookings || []) || [];
      const uniqueStudentIds = new Set([
        ...allEnrollments.map(e => e.user_id),
        ...allBookings.map(b => b.user_id)
      ]);
      
      // Calculate reviews and ratings
      const courseReviews = courses?.flatMap(c => c.course_reviews || []) || [];
      const eventReviews = events?.flatMap(e => e.event_reviews || []) || [];
      
      const courseRating = courseReviews.length > 0 
        ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length 
        : 0;
      
      const eventRating = eventReviews.length > 0 
        ? eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length 
        : 0;
      
      const totalReviews = courseReviews.length + eventReviews.length;
      const overallRating = totalReviews > 0 
        ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) + eventReviews.reduce((sum, r) => sum + r.rating, 0)) / totalReviews
        : 0;

      setStats({
        totalCourses,
        totalEvents,
        totalStudents: uniqueStudentIds.size,
        totalReviews,
        averageRating: overallRating,
        totalViews: 0, // This would require tracking views
        totalEnrollments: allEnrollments.length,
        totalBookings: allBookings.length,
        courseReviews: courseReviews.length,
        eventReviews: eventReviews.length,
        courseRating,
        eventRating
      });
    } catch (error) {
      console.error('Error loading comprehensive stats:', error);
    }
  };

  // Process monthly revenue data from transactions
  const monthlyRevenue = transactions.reduce((acc, transaction) => {
    if (transaction.payment_status === 'completed') {
      const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + (transaction.creator_earning || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue
  }));

  // Revenue breakdown by source
  const revenueBySource = [
    { 
      name: 'Courses', 
      value: earnings?.course_revenue || 0, 
      color: '#8b5cf6' 
    },
    { 
      name: 'Events', 
      value: earnings?.event_revenue || 0, 
      color: '#ff7b42' 
    }
  ];

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <CreatorFloatingAI />
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here's your performance overview.</p>
            </div>
            <Button
              onClick={() => setIsWithdrawDialogOpen(true)}
              disabled={!earnings?.available_balance || earnings.available_balance < 5}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </div>

          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={earnings?.total_earnings || 0} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your lifetime earnings (after platform fees)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={earnings?.available_balance || 0} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for withdrawal
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalEnrollments} enrollments, {stats.totalBookings} bookings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  From {stats.totalReviews} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.courseReviews} reviews • {stats.courseRating.toFixed(1)} ⭐
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.eventReviews} reviews • {stats.eventRating.toFixed(1)} ⭐
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={earnings?.course_revenue || 0} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  From course sales
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={earnings?.event_revenue || 0} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  From event tickets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly earnings from completed payments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Earnings']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Course vs Event earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBySource.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {revenueBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Events</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Detailed breakdown of your earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Earnings</div>
                  <div className="text-2xl font-bold">
                    <PriceDisplay amount={earnings?.total_earnings || 0} originalCurrency="USD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Available Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    <PriceDisplay amount={earnings?.available_balance || 0} originalCurrency="USD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Pending Balance</div>
                  <div className="text-2xl font-bold text-amber-600">
                    <PriceDisplay amount={earnings?.pending_balance || 0} originalCurrency="USD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Platform Fees</div>
                  <div className="text-2xl font-bold text-red-600">
                    <PriceDisplay amount={earnings?.total_platform_fees || 0} originalCurrency="USD" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Withdraw Dialog */}
          <EnhancedWithdrawDialog
            open={isWithdrawDialogOpen}
            onOpenChange={setIsWithdrawDialogOpen}
            availableBalance={earnings?.available_balance || 0}
            currency={currentCurrency}
            onSuccess={loadDashboardData}
          />
        </div>
      </div>
      
      {/* Add Creator AI Assistant */}
      <CreatorFloatingAI />
    </CreatorLayout>
  );
};

export default CreatorDashboard;
