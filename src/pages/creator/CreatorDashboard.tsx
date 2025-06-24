import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, BookOpen, Calendar, TrendingUp, Eye, Download, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCreatorRevenue } from '@/services/creatorRevenueService';
import { fetchCreatorEarnings } from '@/services/creatorPaymentService';
import CreatorLayout from '@/components/creator/CreatorLayout';
import EnhancedWithdrawDialog from '@/components/creator/EnhancedWithdrawDialog';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';

interface DashboardStats {
  totalCourses: number;
  totalEvents: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const { convertPrice, currentCurrency } = useCurrency();
  const [revenue, setRevenue] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalEvents: 0,
    totalStudents: 0,
    totalReviews: 0,
    averageRating: 0
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
      
      // Load enhanced revenue data from orders
      const revenueData = await fetchCreatorRevenue(user.id);
      setRevenue(revenueData);
      
      // Load earnings data for withdraw dialog
      const earningsData = await fetchCreatorEarnings(user.id);
      setEarnings(earningsData);
      
      // Load basic stats
      await loadBasicStats();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBasicStats = async () => {
    if (!user) return;
    
    try {
      // Fetch courses count
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('creator_id', user.id)
        .eq('is_published', true);
      
      if (coursesError) throw coursesError;

      // Fetch events count
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('creator_id', user.id);
      
      if (eventsError) throw eventsError;

      setStats({
        totalCourses: courses?.length || 0,
        totalEvents: events?.length || 0,
        totalStudents: revenue?.totalStudents || 0,
        totalReviews: revenue?.totalReviews || 0,
        averageRating: revenue?.averageRating || 0
      });
    } catch (error) {
      console.error('Error loading basic stats:', error);
    }
  };

  // Chart data using real revenue data
  const revenueBySource = revenue ? [
    { name: 'Courses', value: revenue.courseRevenue, color: '#8b5cf6' },
    { name: 'Events', value: revenue.eventRevenue, color: '#ff7b42' }
  ] : [];

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
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
              disabled={!revenue?.availableBalance || revenue.availableBalance < 5}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={revenue?.totalRevenue || 0} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  From orders and bookings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenue?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCourses} courses, {stats.totalEvents} events
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenue?.averageRating?.toFixed(1) || '0.0'}</div>
                <p className="text-xs text-muted-foreground">
                  From {revenue?.totalReviews || 0} reviews
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
                  <PriceDisplay amount={revenue?.availableBalance || 0} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for withdrawal
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
                <CardDescription>Monthly revenue from orders and bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenue?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
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

            {/* Engagement Graph */}
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
                <CardDescription>New students per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue?.monthlyStudents || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [value, 'Students']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="students" fill="#ff7b42" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course vs Event Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Compare course and event revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueBySource}
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

            {/* Revenue Details */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Details</CardTitle>
                <CardDescription>Breakdown of your earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Course Revenue:</span>
                    <span className="font-bold">
                      <PriceDisplay amount={revenue?.courseRevenue || 0} originalCurrency="USD" />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Event Revenue:</span>
                    <span className="font-bold">
                      <PriceDisplay amount={revenue?.eventRevenue || 0} originalCurrency="USD" />
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Revenue:</span>
                      <span className="font-bold text-lg">
                        <PriceDisplay amount={revenue?.totalRevenue || 0} originalCurrency="USD" />
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Available Balance:</span>
                    <span className="font-bold text-green-600">
                      <PriceDisplay amount={revenue?.availableBalance || 0} originalCurrency="USD" />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending (7-day hold):</span>
                    <span className="font-bold text-amber-600">
                      <PriceDisplay amount={revenue?.pendingBalance || 0} originalCurrency="USD" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Withdraw Dialog */}
          <EnhancedWithdrawDialog
            open={isWithdrawDialogOpen}
            onOpenChange={setIsWithdrawDialogOpen}
            availableBalance={revenue?.availableBalance || 0}
            currency={currentCurrency}
            onSuccess={loadDashboardData}
          />
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorDashboard;
