import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Calendar, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  totalEvents: number;
  totalRevenue: number;
  recentEnrollments: Array<{
    id: string;
    student_name: string;
    course_title: string;
    enrollment_date: string;
  }>;
  recentBookings: Array<{
    id: string;
    attendee_name: string;
    event_title: string;
    booking_date: string;
  }>;
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get total students from enrollments
      const { data: enrollmentsCount } = await supabase
        .from('course_enrollments')
        .select('id', { count: 'exact' })
        .eq('payment_status', 'completed')
        .in('course_id', (
          await supabase
            .from('courses')
            .select('id')
            .eq('creator_id', user.id)
        ).data?.map(c => c.id) || []);

      // Get total attendees from bookings
      const { data: bookingsCount } = await supabase
        .from('event_bookings')
        .select('id', { count: 'exact' })
        .eq('payment_status', 'completed')
        .in('event_id', (
          await supabase
            .from('events')
            .select('id')
            .eq('creator_id', user.id)
        ).data?.map(e => e.id) || []);

      // Get total courses
      const { data: coursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact' })
        .eq('creator_id', user.id);

      // Get total events
      const { data: eventsCount } = await supabase
        .from('events')
        .select('id', { count: 'exact' })
        .eq('creator_id', user.id);

      // Get recent enrollments with student names
      const { data: recentEnrollmentsData } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          user_id,
          courses!inner(
            title,
            creator_id
          )
        `)
        .eq('courses.creator_id', user.id)
        .eq('payment_status', 'completed')
        .order('enrollment_date', { ascending: false })
        .limit(5);

      // Get recent bookings with attendee names
      const { data: recentBookingsData } = await supabase
        .from('event_bookings')
        .select(`
          id,
          booking_date,
          user_id,
          events!inner(
            title,
            creator_id
          )
        `)
        .eq('events.creator_id', user.id)
        .eq('payment_status', 'completed')
        .order('booking_date', { ascending: false })
        .limit(5);

      // Get user profiles for names
      const enrollmentUserIds = recentEnrollmentsData?.map(e => e.user_id) || [];
      const bookingUserIds = recentBookingsData?.map(b => b.user_id) || [];
      const allUserIds = [...new Set([...enrollmentUserIds, ...bookingUserIds])];

      let userProfiles = new Map();
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', allUserIds);

        profiles?.forEach(profile => {
          userProfiles.set(profile.id, profile.full_name || profile.username || 'Unknown User');
        });
      }

      // Calculate revenue from completed orders
      let totalRevenue = 0;
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select(`
            total_amount,
            order_items!inner(
              item_id,
              item_type
            )
          `)
          .eq('payment_status', 'completed');

        if (orders) {
          for (const order of orders) {
            for (const item of order.order_items) {
              let isCreatorContent = false;
              
              if (item.item_type === 'course') {
                const { data: course } = await supabase
                  .from('courses')
                  .select('creator_id')
                  .eq('id', item.item_id)
                  .single();
                
                if (course?.creator_id === user.id) {
                  isCreatorContent = true;
                }
              } else if (item.item_type === 'event_ticket') {
                const { data: eventTicket } = await supabase
                  .from('event_tickets')
                  .select(`
                    events!inner(creator_id)
                  `)
                  .eq('id', item.item_id)
                  .single();
                
                if (eventTicket?.events?.creator_id === user.id) {
                  isCreatorContent = true;
                }
              }
              
              if (isCreatorContent) {
                // Subtract platform fee (assuming 5%)
                totalRevenue += order.total_amount * 0.95;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error calculating revenue:', error);
      }

      setAnalytics({
        totalStudents: (enrollmentsCount?.length || 0) + (bookingsCount?.length || 0),
        totalCourses: coursesCount?.length || 0,
        totalEvents: eventsCount?.length || 0,
        totalRevenue,
        recentEnrollments: recentEnrollmentsData?.map(enrollment => ({
          id: enrollment.id,
          student_name: userProfiles.get(enrollment.user_id) || 'Unknown Student',
          course_title: enrollment.courses.title,
          enrollment_date: enrollment.enrollment_date
        })) || [],
        recentBookings: recentBookingsData?.map(booking => ({
          id: booking.id,
          attendee_name: userProfiles.get(booking.user_id) || 'Unknown Attendee',
          event_title: booking.events.title,
          booking_date: booking.booking_date
        })) || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <CreatorLayout title="Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Analytics">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your performance and student engagement
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Students & attendees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                Published courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Created events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                After platform fees
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Course Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Course Enrollments</CardTitle>
              <CardDescription>
                Latest students enrolled in your courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentEnrollments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent enrollments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{enrollment.student_name}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.course_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(enrollment.enrollment_date)}</p>
                        <Badge variant="secondary">Course</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Event Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Event Bookings</CardTitle>
              <CardDescription>
                Latest attendees who booked your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent bookings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{booking.attendee_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.event_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(booking.booking_date)}</p>
                        <Badge variant="outline">Event</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAnalytics;
