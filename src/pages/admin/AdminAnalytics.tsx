
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, TrendingUp, BookOpen, Calendar, DollarSign, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  totalUsers: number;
  totalRevenue: number;
  platformRevenue: number;
  creatorRevenue: number;
  totalCourses: number;
  totalEvents: number;
  mostBookedCourses: Array<{ title: string; count: number; revenue: number }>;
  mostBookedEvents: Array<{ title: string; count: number; revenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; platformFee: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  courseCategories: Array<{ category: string; count: number }>;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      console.log('Loading analytics data...');

      // Get total users count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (profilesError) throw profilesError;

      // Get orders data for revenue calculation
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            courses(title, category),
            event_tickets(
              *,
              events(title)
            )
          )
        `)
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Get course enrollments for course analytics
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(title, category)
        `)
        .eq('payment_status', 'completed');

      if (enrollmentsError) throw enrollmentsError;

      // Get event bookings for event analytics
      const { data: bookings, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events(title)
        `)
        .eq('payment_status', 'completed');

      if (bookingsError) throw bookingsError;

      // Get all courses and events
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*');

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*');

      if (coursesError) throw coursesError;
      if (eventsError) throw eventsError;

      // Calculate analytics
      const totalUsers = profiles?.length || 0;
      
      // Calculate revenue from orders
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const platformRevenue = totalRevenue * 0.08; // 8% platform fee
      const creatorRevenue = totalRevenue - platformRevenue;

      // Course analytics
      const courseBookingCounts = new Map<string, { count: number; revenue: number; title: string }>();
      enrollments?.forEach(enrollment => {
        const courseTitle = enrollment.courses?.title || 'Unknown Course';
        const current = courseBookingCounts.get(courseTitle) || { count: 0, revenue: 0, title: courseTitle };
        courseBookingCounts.set(courseTitle, {
          ...current,
          count: current.count + 1
        });
      });

      // Event analytics
      const eventBookingCounts = new Map<string, { count: number; revenue: number; title: string }>();
      bookings?.forEach(booking => {
        const eventTitle = booking.events?.title || 'Unknown Event';
        const current = eventBookingCounts.get(eventTitle) || { count: 0, revenue: 0, title: eventTitle };
        eventBookingCounts.set(eventTitle, {
          ...current,
          count: current.count + 1,
          revenue: current.revenue + (Number(booking.payment_amount) || 0)
        });
      });

      // Monthly revenue from orders
      const monthlyRevenueMap = new Map<string, { revenue: number; platformFee: number }>();
      orders?.forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7);
        const revenue = Number(order.total_amount);
        const platformFee = revenue * 0.08;
        const current = monthlyRevenueMap.get(month) || { revenue: 0, platformFee: 0 };
        monthlyRevenueMap.set(month, {
          revenue: current.revenue + revenue,
          platformFee: current.platformFee + platformFee
        });
      });

      // User growth
      const userGrowthMap = new Map<string, number>();
      profiles?.forEach(profile => {
        const month = new Date(profile.created_at).toISOString().slice(0, 7);
        userGrowthMap.set(month, (userGrowthMap.get(month) || 0) + 1);
      });

      // Course categories
      const categoryMap = new Map<string, number>();
      courses?.forEach(course => {
        const category = course.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const analyticsData: AnalyticsData = {
        totalUsers,
        totalRevenue,
        platformRevenue,
        creatorRevenue,
        totalCourses: courses?.length || 0,
        totalEvents: events?.length || 0,
        mostBookedCourses: Array.from(courseBookingCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        mostBookedEvents: Array.from(eventBookingCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        monthlyRevenue: Array.from(monthlyRevenueMap.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        userGrowth: Array.from(userGrowthMap.entries())
          .map(([month, users]) => ({ month, users }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        courseCategories: Array.from(categoryMap.entries())
          .map(([category, count]) => ({ category, count }))
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f97316', '#a855f7', '#ec4899', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <AdminLayout title="Analytics">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </AdminLayout>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <AdminLayout title="Analytics">
          <div className="text-center py-8">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        </AdminLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <AdminLayout title="Platform Analytics">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
              <p className="text-xs opacity-80">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.platformRevenue.toFixed(2)}</div>
              <p className="text-xs opacity-80">8% commission</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-400 to-purple-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
              <p className="text-xs opacity-80">All transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-400 to-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creator Revenue</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.creatorRevenue.toFixed(2)}</div>
              <p className="text-xs opacity-80">After platform fee</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                  <Line type="monotone" dataKey="platformFee" stroke="#a855f7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Growth Chart */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="url(#gradient)" />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Course Categories Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Course Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.courseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.courseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card className="bg-white/80 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Platform Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-purple-100 rounded-lg">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-gray-800">{analytics.totalCourses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-orange-100 rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-gray-800">{analytics.totalEvents}</div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Most Booked Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Booked Courses */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Most Booked Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.mostBookedCourses.map((course, index) => (
                  <div key={course.title} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-600">{course.count} enrollments</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Booked Events */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Most Booked Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.mostBookedEvents.map((event, index) => (
                  <div key={event.title} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-orange-600 text-white">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-600">
                          {event.count} bookings • ${event.revenue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
};

export default AdminAnalytics;
