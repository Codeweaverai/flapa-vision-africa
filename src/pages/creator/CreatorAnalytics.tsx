
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, BookOpen, Calendar, Star, Eye, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCreatorRevenue, type CreatorRevenue } from '@/services/creatorRevenueService';

interface RecentEnrollment {
  id: string;
  student_name: string;
  course_title: string;
  enrollment_date: string;
  payment_status: string;
}

interface RecentBooking {
  id: string;
  attendee_name: string;
  event_title: string;
  booking_date: string;
  payment_status: string;
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState<CreatorRevenue | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load revenue data
      const revenueData = await fetchCreatorRevenue(user.id);
      setRevenue(revenueData);

      // Load recent course enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          enrollment_date,
          payment_status,
          courses!inner(
            title,
            creator_id
          )
        `)
        .eq('courses.creator_id', user.id)
        .eq('payment_status', 'completed')
        .order('enrollment_date', { ascending: false })
        .limit(5);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else {
        // Get user names for enrollments
        const enrollmentUserIds = enrollments?.map(e => e.user_id) || [];
        if (enrollmentUserIds.length > 0) {
          const { data: enrollmentProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', enrollmentUserIds);

          const enrollmentsWithNames = enrollments?.map(enrollment => {
            const profile = enrollmentProfiles?.find(p => p.id === enrollment.user_id);
            return {
              id: enrollment.id,
              student_name: profile?.full_name || profile?.username || 'Unknown Student',
              course_title: enrollment.courses.title,
              enrollment_date: enrollment.enrollment_date,
              payment_status: enrollment.payment_status
            };
          }) || [];
          
          setRecentEnrollments(enrollmentsWithNames);
        }
      }

      // Load recent event bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          user_id,
          booking_date,
          payment_status,
          events!inner(
            title,
            creator_id
          )
        `)
        .eq('events.creator_id', user.id)
        .eq('payment_status', 'completed')
        .order('booking_date', { ascending: false })
        .limit(5);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        // Get user names for bookings
        const bookingUserIds = bookings?.map(b => b.user_id) || [];
        if (bookingUserIds.length > 0) {
          const { data: bookingProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', bookingUserIds);

          const bookingsWithNames = bookings?.map(booking => {
            const profile = bookingProfiles?.find(p => p.id === booking.user_id);
            return {
              id: booking.id,
              attendee_name: profile?.full_name || profile?.username || 'Unknown Attendee',
              event_title: booking.events.title,
              booking_date: booking.booking_date,
              payment_status: booking.payment_status
            };
          }) || [];
          
          setRecentBookings(bookingsWithNames);
        }
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !revenue) {
    return (
      <CreatorLayout title="Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  const COLORS = ['#f97316', '#a855f7', '#06b6d4', '#10b981'];

  // Prepare chart data
  const revenueBreakdown = [
    { name: 'Courses', value: revenue.courseRevenue, color: COLORS[0] },
    { name: 'Events', value: revenue.eventRevenue, color: COLORS[1] }
  ];

  return (
    <CreatorLayout title="Analytics">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Track your performance and growth metrics
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenue.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +${revenue.monthlyRevenue[revenue.monthlyRevenue.length - 1]?.revenue || 0} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenue.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                +{revenue.monthlyStudents[revenue.monthlyStudents.length - 1]?.students || 0} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenue.availableBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${revenue.pendingBalance.toFixed(2)} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenue.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                From {revenue.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenue.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Course Enrollments
              </CardTitle>
              <CardDescription>
                Latest students enrolled in your courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEnrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent enrollments</p>
                ) : (
                  recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {enrollment.student_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.course_title}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {new Date(enrollment.enrollment_date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Event Bookings
              </CardTitle>
              <CardDescription>
                Latest attendees who booked your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent bookings</p>
                ) : (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {booking.attendee_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.event_title}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Student Growth</CardTitle>
            <CardDescription>
              Monthly student enrollment trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenue.monthlyStudents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAnalytics;
