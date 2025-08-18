import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, DollarSign, Users, BookOpen, Calendar, TrendingUp, Eye, Star, Bookmark, Ticket, UserCheck, BookmarkCheck } from 'lucide-react';
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
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const fetchUserProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return [];
    
    const uniqueIds = [...new Set(userIds)];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', uniqueIds);

    if (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    }
    
    return data || [];
  };

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [earnings, transactionsResult] = await Promise.all([
        fetchCreatorEarnings(user.id),
        fetchCreatorPaymentTransactions(user.id, 100, 0)
      ]);

      const transactions = transactionsResult.transactions;

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('creator_id', user.id);

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .eq('creator_id', user.id);

      const courseIds = courses?.map(c => c.id) || [];
      const eventIds = events?.map(e => e.id) || [];

      let allEnrollments: any[] = [];
      let courseReviews: any[] = [];
      let allBookings: any[] = [];
      let eventReviews: any[] = [];
      
      if (courseIds.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`
            id, 
            user_id, 
            enrollment_date,
            payment_status,
            course_id
          `)
          .in('course_id', courseIds)
          .eq('payment_status', 'completed');

        const { data: reviews, error: reviewsError } = await supabase
          .from('course_reviews')
          .select('id, rating, created_at, course_id')
          .in('course_id', courseIds);

        allEnrollments = enrollments || [];
        courseReviews = reviews || [];
      }

      if (eventIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('event_bookings')
          .select(`
            id, 
            user_id, 
            booking_date,
            payment_status,
            ticket_quantity,
            event_id
          `)
          .in('event_id', eventIds)
          .eq('payment_status', 'completed');

        const { data: reviews, error: reviewsError } = await supabase
          .from('event_reviews')
          .select('id, rating, created_at, event_id')
          .in('event_id', eventIds);

        allBookings = bookings || [];
        eventReviews = reviews || [];
      }

      const enrollmentUserIds = allEnrollments.map(e => e.user_id);
      const bookingUserIds = allBookings.map(b => b.user_id);
      const uniqueStudentIds = new Set([...enrollmentUserIds, ...bookingUserIds]);
      const totalStudents = uniqueStudentIds.size;

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

      const monthlyRevenue = transactions
        .filter(t => t.payment_status === 'completed')
        .reduce((acc, transaction) => {
          const month = format(new Date(transaction.created_at), 'MMM yyyy');
          acc[month] = (acc[month] || 0) + (transaction.creator_earning || 0);
          return acc;
        }, {} as Record<string, number>);

      const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue
      }));

      const topCourses = courses?.map(course => {
        const courseEnrollments = allEnrollments.filter(e => e.course_id === course.id);
        const courseReviewsForCourse = courseReviews.filter(r => r.course_id === course.id);
        const avgRating = courseReviewsForCourse.length > 0
          ? courseReviewsForCourse.reduce((sum, r) => sum + r.rating, 0) / courseReviewsForCourse.length
          : 0;

        return {
          name: course.title,
          enrollments: courseEnrollments.length,
          reviews: courseReviewsForCourse.length,
          rating: avgRating
        };
      })
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5) || [];

      const topEvents = events?.map(event => {
        const eventBookings = allBookings.filter(b => b.event_id === event.id);
        const eventReviewsForEvent = eventReviews.filter(r => r.event_id === event.id);
        const avgRating = eventReviewsForEvent.length > 0
          ? eventReviewsForEvent.reduce((sum, r) => sum + r.rating, 0) / eventReviewsForEvent.length
          : 0;

        return {
          name: event.title,
          bookings: eventBookings.reduce((sum, b) => sum + (b.ticket_quantity || 1), 0),
          reviews: eventReviewsForEvent.length,
          rating: avgRating
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5) || [];

      const recentEnrollmentUserIds = allEnrollments
        .slice(0, 10)
        .map(e => e.user_id);
        
      const recentBookingUserIds = allBookings
        .slice(0, 10)
        .map(b => b.user_id);

      const [enrollmentProfiles, bookingProfiles] = await Promise.all([
        fetchUserProfiles(recentEnrollmentUserIds),
        fetchUserProfiles(recentBookingUserIds)
      ]);

      const profileMap = new Map(
        [...enrollmentProfiles, ...bookingProfiles].map(p => [p.id, p])
      );

      const recentEnrollments = allEnrollments
        .sort((a, b) => new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime())
        .slice(0, 10)
        .map(enrollment => ({
          ...enrollment,
          profiles: profileMap.get(enrollment.user_id) || { username: 'Student', full_name: 'Unknown Student' }
        }));

      const recentBookings = allBookings
        .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
        .slice(0, 10)
        .map(booking => ({
          ...booking,
          profiles: profileMap.get(booking.user_id) || { username: 'Attendee', full_name: 'Unknown Attendee' }
        }));

      const processedData = {
        totalRevenue: earnings.total_earnings || 0,
        totalStudents: totalStudents,
        totalCourses: courses?.length || 0,
        totalEvents: events?.length || 0,
        courseRevenue: earnings.course_revenue || 0,
        eventRevenue: earnings.event_revenue || 0,
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
        totalBookings: allBookings.reduce((sum, b) => sum + (b.ticket_quantity || 1), 0),
        availableBalance: earnings.available_balance || 0,
        pendingBalance: earnings.pending_balance || 0,
        totalPlatformFees: earnings.total_platform_fees || 0
      };

      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const revenueBreakdown = [
    { name: 'Courses', value: analyticsData.courseRevenue, color: '#8b5cf6' },
    { name: 'Events', value: analyticsData.eventRevenue, color: '#ec4899' }
  ];

  const getCardGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-purple-600 to-indigo-600',
      'bg-gradient-to-br from-pink-600 to-rose-600',
      'bg-gradient-to-br from-blue-600 to-cyan-600',
      'bg-gradient-to-br from-green-600 to-emerald-600',
      'bg-gradient-to-br from-yellow-600 to-amber-600',
      'bg-gradient-to-br from-orange-600 to-red-600',
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="space-y-6 p-4 sm:p-6">
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-sm">
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="space-y-6 p-4 sm:p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          
          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  <PriceDisplay amount={analyticsData.totalRevenue} originalCurrency="USD" />
                </div>
                <p className="text-xs text-white/80 mt-1">
                  Lifetime earnings (after fees)
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <TrendingUp className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  <PriceDisplay amount={analyticsData.availableBalance} originalCurrency="USD" />
                </div>
                <p className="text-xs text-white/80 mt-1">
                  Ready for withdrawal
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{analyticsData.totalStudents}</div>
                <p className="text-xs text-white/80 mt-1">
                  {analyticsData.totalEnrollments} enrollments
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-600 to-amber-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                <Star className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{analyticsData.averageRating.toFixed(1)} ⭐</div>
                <p className="text-xs text-white/80 mt-1">
                  From {analyticsData.totalReviews} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
                <BookOpen className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{analyticsData.totalCourses}</div>
                <p className="text-xs text-white/80 mt-1">
                  {analyticsData.courseRating.toFixed(1)} ⭐ avg
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Calendar className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{analyticsData.totalEvents}</div>
                <p className="text-xs text-white/80 mt-1">
                  {analyticsData.eventRating.toFixed(1)} ⭐ avg
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Course Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  <PriceDisplay amount={analyticsData.courseRevenue} originalCurrency="USD" />
                </div>
                <p className="text-xs text-white/80 mt-1">
                  From course sales
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  <PriceDisplay amount={analyticsData.eventRevenue} originalCurrency="USD" />
                </div>
                <p className="text-xs text-white/80 mt-1">
                  From event tickets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                <CardDescription className="text-sm">Income distribution by content type</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {revenueBreakdown.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
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
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                <CardDescription className="text-sm">Monthly earnings over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {analyticsData.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ fill: '#7c3aed', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity with Pagination */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Course Enrollments</CardTitle>
                    <CardDescription className="text-sm">Latest students enrolled in your courses</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {analyticsData.recentEnrollments.length} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentEnrollments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      No recent enrollments
                    </div>
                  ) : (
                    analyticsData.recentEnrollments
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((enrollment, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50">
                          <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full">
                            <UserCheck className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {enrollment.profiles?.full_name || enrollment.profiles?.username || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              Enrolled in course
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-white">
                              {format(new Date(enrollment.enrollment_date), 'MMM dd')}
                            </Badge>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                {analyticsData.recentEnrollments.length > ITEMS_PER_PAGE && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        {Array.from({ length: Math.ceil(analyticsData.recentEnrollments.length / ITEMS_PER_PAGE) }).map((_, i) => (
                          <PaginationItem key={i}>
                            <button
                              onClick={() => setCurrentPage(i + 1)}
                              className={`px-3 py-1 rounded-md ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
                            >
                              {i + 1}
                            </button>
                          </PaginationItem>
                        ))}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Event Bookings</CardTitle>
                    <CardDescription className="text-sm">Latest bookings for your events</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-pink-100 text-pink-800">
                    {analyticsData.recentBookings.length} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ticket className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      No recent bookings
                    </div>
                  ) : (
                    analyticsData.recentBookings
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((booking, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-rose-50">
                          <div className="flex-shrink-0 bg-pink-100 p-2 rounded-full">
                            <BookmarkCheck className="h-5 w-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {booking.profiles?.full_name || booking.profiles?.username || 'Unknown Attendee'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              Booked {booking.ticket_quantity || 1} ticket(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-white">
                              {format(new Date(booking.booking_date), 'MMM dd')}
                            </Badge>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                {analyticsData.recentBookings.length > ITEMS_PER_PAGE && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        {Array.from({ length: Math.ceil(analyticsData.recentBookings.length / ITEMS_PER_PAGE) }).map((_, i) => (
                          <PaginationItem key={i}>
                            <button
                              onClick={() => setCurrentPage(i + 1)}
                              className={`px-3 py-1 rounded-md ${currentPage === i + 1 ? 'bg-pink-600 text-white' : 'bg-white text-gray-700'}`}
                            >
                              {i + 1}
                            </button>
                            </PaginationItem>
                        ))}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top Courses</CardTitle>
                <CardDescription className="text-sm">Your most popular courses by enrollment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topCourses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      No courses available
                    </div>
                  ) : (
                    analyticsData.topCourses.map((course, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getCardGradient(index)} text-white`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{course.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              {course.rating.toFixed(1)} ({course.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{course.enrollments}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top Events</CardTitle>
                <CardDescription className="text-sm">Your most popular events by bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      No events available
                    </div>
                  ) : (
                    analyticsData.topEvents.map((event, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-pink-50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getCardGradient(index + 2)} text-white`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{event.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              {event.rating.toFixed(1)} ({event.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-pink-600" />
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
