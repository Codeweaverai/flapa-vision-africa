import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, BookOpen, Calendar, DollarSign, TrendingUp, Download } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  totalEvents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentEnrollments: Array<{
    id: string;
    enrollment_date: string;
    course_id: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
      username: string | null;
    };
    courses?: {
      title: string;
    };
  }>;
  recentBookings: Array<{
    id: string;
    booking_date: string;
    event_id: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
      username: string | null;
    };
    events?: {
      title: string;
    };
  }>;
  enrollmentTrend: Array<{
    date: string;
    enrollments: number;
  }>;
  coursesData: Array<{
    title: string;
    enrollments: number;
    revenue: number;
  }>;
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStudents: 0,
    totalCourses: 0,
    totalEvents: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentEnrollments: [],
    recentBookings: [],
    enrollmentTrend: [],
    coursesData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const daysAgo = parseInt(timeRange);
      const startDate = subDays(new Date(), daysAgo);
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, creator_id')
        .eq('creator_id', user.id);

      if (coursesError) throw coursesError;

      const courseIds = coursesData?.map(course => course.id) || [];

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, creator_id')
        .eq('creator_id', user.id);

      if (eventsError) throw eventsError;

      const eventIds = eventsData?.map(event => event.id) || [];

      // Fetch enrollments with user profiles
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          course_id,
          user_id,
          profiles!inner (
            full_name,
            username
          ),
          courses!inner (
            title,
            creator_id
          )
        `)
        .in('course_id', courseIds.length > 0 ? courseIds : [''])
        .gte('enrollment_date', startDate.toISOString())
        .eq('courses.creator_id', user.id)
        .order('enrollment_date', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Fetch recent enrollments for activity feed (last 10, regardless of time range)
      const { data: recentEnrollmentsData, error: recentEnrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          course_id,
          user_id,
          profiles!inner (
            full_name,
            username
          ),
          courses!inner (
            title,
            creator_id
          )
        `)
        .in('course_id', courseIds.length > 0 ? courseIds : [''])
        .eq('courses.creator_id', user.id)
        .order('enrollment_date', { ascending: false })
        .limit(10);

      if (recentEnrollmentsError) throw recentEnrollmentsError;

      // Fetch event bookings with user profiles
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          booking_date,
          event_id,
          user_id,
          profiles!inner (
            full_name,
            username
          ),
          events!inner (
            title,
            creator_id
          )
        `)
        .in('event_id', eventIds.length > 0 ? eventIds : [''])
        .gte('booking_date', startDate.toISOString())
        .eq('events.creator_id', user.id)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch recent bookings for activity feed (last 10, regardless of time range)
      const { data: recentBookingsData, error: recentBookingsError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          booking_date,
          event_id,
          user_id,
          profiles!inner (
            full_name,
            username
          ),
          events!inner (
            title,
            creator_id
          )
        `)
        .in('event_id', eventIds.length > 0 ? eventIds : [''])
        .eq('events.creator_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(10);

      if (recentBookingsError) throw recentBookingsError;

      // Calculate metrics
      const totalStudents = new Set([
        ...(enrollmentsData?.map(e => e.user_id) || []),
        ...(bookingsData?.map(b => b.user_id) || [])
      ]).size;

      // Generate enrollment trend data
      const enrollmentTrend = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayEnrollments = enrollmentsData?.filter(e => 
          format(new Date(e.enrollment_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ).length || 0;
        
        enrollmentTrend.push({
          date: format(date, 'MMM dd'),
          enrollments: dayEnrollments
        });
      }

      // Generate courses data
      const coursesAnalytics = coursesData?.map(course => {
        const courseEnrollments = enrollmentsData?.filter(e => e.course_id === course.id) || [];
        return {
          title: course.title,
          enrollments: courseEnrollments.length,
          revenue: 0 // You can add revenue calculation here if needed
        };
      }) || [];

      setAnalyticsData({
        totalStudents,
        totalCourses: coursesData?.length || 0,
        totalEvents: eventsData?.length || 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        recentEnrollments: recentEnrollmentsData || [],
        recentBookings: recentBookingsData || [],
        enrollmentTrend,
        coursesData: coursesAnalytics
      });

    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CreatorLayout title="Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your course and event performance</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{analyticsData.totalStudents}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{analyticsData.totalCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Published and drafts</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{analyticsData.totalEvents}</p>
                  <p className="text-xs text-muted-foreground mt-1">All events created</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold">+12%</p>
                  <p className="text-xs text-muted-foreground mt-1">vs last period</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trend</CardTitle>
              <CardDescription>Daily enrollments over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.enrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={{ fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Enrollments by course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.coursesData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="title" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="enrollments" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

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
                        <p className="font-medium">{enrollment.profiles?.full_name || enrollment.profiles?.username || 'Unknown Student'}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.courses?.title || 'Unknown Course'}</p>
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
                        <p className="font-medium">{booking.profiles?.full_name || booking.profiles?.username || 'Unknown Attendee'}</p>
                        <p className="text-sm text-muted-foreground">{booking.events?.title || 'Unknown Event'}</p>
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
      </div>
    </CreatorLayout>
  );
};

export default CreatorAnalytics;
