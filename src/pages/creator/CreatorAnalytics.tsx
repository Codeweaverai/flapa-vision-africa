
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, DollarSign, Users, BookOpen, Calendar, TrendingUp, Eye, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  fetchCreatorEarnings, 
  fetchCreatorPaymentTransactions 
} from '@/services/creatorPaymentService';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface AnalyticsData {
  totalRevenue: number;
  totalStudents: number;
  totalCourses: number;
  totalEvents: number;
  courseRevenue: number;
  eventRevenue: number;
  recentEnrollments: any[];
  recentBookings: any[];
  monthlyRevenue: any[];
  topCourses: any[];
  topEvents: any[];
  totalReviews: number;
  averageRating: number;
  courseReviews: number;
  eventReviews: number;
  courseRating: number;
  eventRating: number;
  totalEnrollments: number;
  totalBookings: number;
  availableBalance: number;
  pendingBalance: number;
  totalPlatformFees: number;
}

const CreatorAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalEvents: 0,
    courseRevenue: 0,
    eventRevenue: 0,
    recentEnrollments: [],
    recentBookings: [],
    monthlyRevenue: [],
    topCourses: [],
    topEvents: [],
    totalReviews: 0,
    averageRating: 0,
    courseReviews: 0,
    eventReviews: 0,
    courseRating: 0,
    eventRating: 0,
    totalEnrollments: 0,
    totalBookings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalPlatformFees: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get creator earnings and transactions from creator payments service
      const [earnings, transactions] = await Promise.all([
        fetchCreatorEarnings(user.id),
        fetchCreatorPaymentTransactions(user.id)
      ]);

      // Get courses with detailed analytics
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id, 
          title,
          course_enrollments(id, user_id, enrollment_date, profiles(username, full_name)),
          course_reviews(id, rating, created_at)
        `)
        .eq('creator_id', user.id);

      // Get events with detailed analytics
      const { data: events } = await supabase
        .from('events')
        .select(`
          id, 
          title,
          event_bookings(id, user_id, booking_date, profiles(username, full_name)),
          event_reviews(id, rating, created_at)
        `)
        .eq('creator_id', user.id);

      // Process comprehensive analytics
      const processedData = await processAnalyticsData(
        earnings, 
        transactions, 
        courses || [], 
        events || []
      );

      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = async (earnings: any, transactions: any[], courses: any[], events: any[]) => {
    // Calculate enrollments and bookings
    const allEnrollments = courses.flatMap(c => c.course_enrollments || []);
    const allBookings = events.flatMap(e => e.event_bookings || []);
    
    // Calculate unique students
    const uniqueStudentIds = new Set([
      ...allEnrollments.map(e => e.user_id),
      ...allBookings.map(b => b.user_id)
    ]);

    // Calculate reviews and ratings
    const courseReviews = courses.flatMap(c => c.course_reviews || []);
    const eventReviews = events.flatMap(e => e.event_reviews || []);
    
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

    // Process monthly revenue from transactions
    const monthlyRevenue = transactions.reduce((acc, transaction) => {
      if (transaction.status === 'completed') {
        const month = format(new Date(transaction.created_at), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + (transaction.creator_earning || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));

    // Top performing content
    const topCourses = courses
      .map(course => ({
        name: course.title,
        enrollments: course.course_enrollments?.length || 0,
        reviews: course.course_reviews?.length || 0,
        rating: course.course_reviews?.length > 0 
          ? course.course_reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.course_reviews.length 
          : 0
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    const topEvents = events
      .map(event => ({
        name: event.title,
        bookings: event.event_bookings?.length || 0,
        reviews: event.event_reviews?.length || 0,
        rating: event.event_reviews?.length > 0 
          ? event.event_reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / event.event_reviews.length 
          : 0
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Recent activity
    const recentEnrollments = allEnrollments
      .sort((a, b) => new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime())
      .slice(0, 10);

    const recentBookings = allBookings
      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
      .slice(0, 10);

    return {
      totalRevenue: earnings.total_earnings,
      totalStudents: uniqueStudentIds.size,
      totalCourses: courses.length,
      totalEvents: events.length,
      courseRevenue: earnings.course_revenue,
      eventRevenue: earnings.event_revenue,
      recentEnrollments,
      recentBookings,
      monthlyRevenue: monthlyRevenueData,
      topCourses,
      topEvents,
      totalReviews,
      averageRating: overallRating,
      courseReviews: courseReviews.length,
      eventReviews: eventReviews.length,
      courseRating,
      eventRating,
      totalEnrollments: allEnrollments.length,
      totalBookings: allBookings.length,
      availableBalance: earnings.available_balance,
      pendingBalance: earnings.pending_balance,
      totalPlatformFees: earnings.total_platform_fees
    };
  };

  const revenueBreakdown = [
    { name: 'Courses', value: analyticsData.courseRevenue, color: '#3b82f6' },
    { name: 'Events', value: analyticsData.eventRevenue, color: '#10b981' }
  ];

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-bold">Advanced Analytics Dashboard</h1>
          
          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={analyticsData.totalRevenue} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your lifetime earnings (after platform fees)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={analyticsData.availableBalance} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for withdrawal
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.totalEnrollments} enrollments, {analyticsData.totalBookings} bookings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  From {analyticsData.totalReviews} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.courseReviews} reviews • {analyticsData.courseRating.toFixed(1)} ⭐
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.eventReviews} reviews • {analyticsData.eventRating.toFixed(1)} ⭐
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Course Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={analyticsData.courseRevenue} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  From course sales
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PriceDisplay amount={analyticsData.eventRevenue} originalCurrency="USD" />
                </div>
                <p className="text-xs text-muted-foreground">
                  From event tickets
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Income distribution by content type</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueBreakdown.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueBreakdown.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                      >
                        {revenueBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly earnings over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No revenue trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Comprehensive financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Earnings</div>
                  <div className="text-2xl font-bold">
                    <PriceDisplay amount={analyticsData.totalRevenue} originalCurrency="USD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Available Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    <PriceDisplay amount={analyticsData.availableBalance} originalCurrency="USD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Pending Balance</div>
                  <div className="text-2xl font-bold text-amber-600">
                    <PriceDisplay amount={analyticsData.pendingBalance} originalCurrency="USD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Platform Fees</div>
                  <div className="text-2xl font-bold text-red-600">
                    <PriceDisplay amount={analyticsData.totalPlatformFees} originalCurrency="USD" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Course Enrollments</CardTitle>
                <CardDescription>Latest students enrolled in your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentEnrollments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent enrollments</p>
                  ) : (
                    analyticsData.recentEnrollments.slice(0, 5).map((enrollment, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{enrollment.profiles?.username || enrollment.profiles?.full_name || 'Unknown Student'}</p>
                          <p className="text-sm text-muted-foreground">Course Enrollment</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Enrolled</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(enrollment.enrollment_date), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Event Bookings</CardTitle>
                <CardDescription>Latest bookings for your events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentBookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent bookings</p>
                  ) : (
                    analyticsData.recentBookings.slice(0, 5).map((booking, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.profiles?.username || booking.profiles?.full_name || 'Unknown Attendee'}</p>
                          <p className="text-sm text-muted-foreground">Event Booking</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Booked</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(booking.booking_date), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Courses</CardTitle>
                <CardDescription>Your most popular courses by enrollment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topCourses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No courses available</p>
                  ) : (
                    analyticsData.topCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.reviews} reviews • {course.rating.toFixed(1)} ⭐
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{course.enrollments}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>Your most popular events by bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topEvents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No events available</p>
                  ) : (
                    analyticsData.topEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.reviews} reviews • {event.rating.toFixed(1)} ⭐
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.bookings}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAnalytics;
