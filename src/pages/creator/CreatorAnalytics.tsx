import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnalyticsData {
  totalRevenue: number;
  totalCourses: number;
  totalStudents: number;
  recentEnrollments: any[];
  recentBookings: any[];
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalCourses: 0,
    totalStudents: 0,
    recentEnrollments: [],
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch total revenue
      const { data: revenueData } = await supabase
        .from('course_enrollments')
        .select('courses(price)')
        .eq('courses.creator_id', user.id);

      const totalRevenue = revenueData?.reduce((sum, enrollment) => {
        return sum + (enrollment.courses?.price || 0);
      }, 0) || 0;

      // Fetch total courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id);

      const totalCourses = coursesData?.length || 0;

      // Fetch total students (unique users enrolled in courses)
      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .in(
          'course_id',
          coursesData?.map((course) => course.id) || []
        );

      const totalStudents = new Set(enrollmentsData?.map((enrollment) => enrollment.user_id)).size;

      // Fetch recent enrollments with proper join
      const { data: recentEnrollmentsData } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          course_id,
          user_id,
          courses!inner(title)
        `)
        .eq('courses.creator_id', user.id)
        .order('enrollment_date', { ascending: false })
        .limit(5);

      // Fetch recent bookings with proper join  
      const { data: recentBookingsData } = await supabase
        .from('event_bookings')
        .select(`
          id,
          booking_date,
          event_id,
          user_id,
          events!inner(title)
        `)
        .eq('events.creator_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(5);

      // Get user profiles separately for enrollments
      const enrollmentUserIds = recentEnrollmentsData?.map(e => e.user_id) || [];
      const { data: enrollmentProfiles } = enrollmentUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', enrollmentUserIds) : { data: [] };

      // Get user profiles separately for bookings
      const bookingUserIds = recentBookingsData?.map(b => b.user_id) || [];
      const { data: bookingProfiles } = bookingUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', bookingUserIds) : { data: [] };

      // Merge the data
      const enrichedEnrollments = recentEnrollmentsData?.map(enrollment => ({
        ...enrollment,
        profiles: enrollmentProfiles?.find(p => p.id === enrollment.user_id)
      })) || [];

      const enrichedBookings = recentBookingsData?.map(booking => ({
        ...booking,
        profiles: bookingProfiles?.find(p => p.id === booking.user_id)
      })) || [];

      setAnalyticsData({
        totalRevenue: totalRevenue,
        totalCourses: totalCourses,
        totalStudents: totalStudents,
        recentEnrollments: enrichedEnrollments,
        recentBookings: enrichedBookings
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Creator Analytics</h1>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard title="Total Revenue" value={`$${analyticsData.totalRevenue.toFixed(2)}`} />
            <MetricCard title="Total Courses" value={analyticsData.totalCourses.toString()} />
            <MetricCard title="Total Students" value={analyticsData.totalStudents.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
                <CardDescription>Latest course enrollments</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[300px] w-full">
                  {analyticsData.recentEnrollments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {analyticsData.recentEnrollments.map((enrollment) => (
                        <div key={enrollment.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={`https://avatar.vercel.sh/${enrollment.profiles?.username}.png`} />
                              <AvatarFallback>{enrollment.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{enrollment.profiles?.full_name || 'Unknown Student'}</p>
                              <p className="text-xs text-gray-500">{enrollment.courses?.title}</p>
                            </div>
                          </div>
                          <div className="text-right text-gray-600 text-sm">
                            {format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No recent enrollments</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest event bookings</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[300px] w-full">
                  {analyticsData.recentBookings.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {analyticsData.recentBookings.map((booking) => (
                        <div key={booking.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={`https://avatar.vercel.sh/${booking.profiles?.username}.png`} />
                              <AvatarFallback>{booking.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{booking.profiles?.full_name || 'Unknown Booker'}</p>
                              <p className="text-xs text-gray-500">{booking.events?.title}</p>
                            </div>
                          </div>
                          <div className="text-right text-gray-600 text-sm">
                            {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No recent bookings</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CreatorAnalytics;
