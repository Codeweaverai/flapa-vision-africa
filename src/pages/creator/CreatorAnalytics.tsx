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
import { calculateCreatorEarningsFromOrders } from '@/services/creatorEarningsService';
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
    topEvents: []
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

      // Get creator earnings from orders
      const earnings = await calculateCreatorEarningsFromOrders(user.id);

      // Get total courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('creator_id', user.id);

      // Get total events
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .eq('creator_id', user.id);

      // Get recent enrollments
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!inner(title, creator_id),
          profiles(username, full_name)
        `)
        .eq('courses.creator_id', user.id)
        .eq('payment_status', 'completed')
        .order('enrollment_date', { ascending: false })
        .limit(10);

      // Get recent event bookings
      const { data: bookings } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events!inner(title, creator_id),
          profiles(username, full_name)
        `)
        .eq('events.creator_id', user.id)
        .eq('payment_status', 'completed')
        .order('booking_date', { ascending: false })
        .limit(10);

      // Get order items for monthly revenue calculation
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            email,
            total_amount,
            currency,
            payment_status,
            payment_method,
            created_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .gte('orders.created_at', subDays(new Date(), 180).toISOString())
        .order('orders.created_at', { ascending: true });

      // Process monthly revenue data from creator's order items
      const monthlyRevenue = await processMonthlyRevenue(orderItems || [], user.id);

      // Get top courses by enrollment
      const { data: topCoursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          course_enrollments(id)
        `)
        .eq('creator_id', user.id)
        .limit(5);

      // Get top events by bookings
      const { data: topEventsData } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_bookings(id)
        `)
        .eq('creator_id', user.id)
        .limit(5);

      // Calculate unique students
      const uniqueStudentIds = new Set([
        ...(enrollments || []).map(e => e.user_id),
        ...(bookings || []).map(b => b.user_id)
      ]);

      setAnalyticsData({
        totalRevenue: earnings.total_earnings,
        totalStudents: uniqueStudentIds.size,
        totalCourses: courses?.length || 0,
        totalEvents: events?.length || 0,
        courseRevenue: earnings.course_revenue,
        eventRevenue: earnings.event_revenue,
        recentEnrollments: enrollments || [],
        recentBookings: bookings || [],
        monthlyRevenue,
        topCourses: topCoursesData?.map(course => ({
          name: course.title,
          enrollments: course.course_enrollments?.length || 0
        })) || [],
        topEvents: topEventsData?.map(event => ({
          name: event.title,
          bookings: event.event_bookings?.length || 0
        })) || []
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyRevenue = async (orderItems: any[], creatorId: string) => {
    const monthlyData: { [key: string]: number } = {};
    const PLATFORM_FEE_RATE = 0.08;
    
    for (const item of orderItems) {
      let isCreatorItem = false;
      
      if (item.item_type === 'course') {
        const { data: course } = await supabase
          .from('courses')
          .select('creator_id')
          .eq('id', item.item_id)
          .single();
        
        if (course && course.creator_id === creatorId) {
          isCreatorItem = true;
        }
      } else if (item.item_type === 'event_ticket') {
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('event_id')
          .eq('id', item.item_id)
          .single();
        
        if (ticket) {
          const { data: event } = await supabase
            .from('events')
            .select('creator_id')
            .eq('id', ticket.event_id)
            .single();
          
          if (event && event.creator_id === creatorId) {
            isCreatorItem = true;
          }
        }
      }
      
      if (isCreatorItem) {
        const month = format(new Date(item.orders.created_at), 'MMM yyyy');
        const itemTotal = Number(item.total_price);
        const platformFee = itemTotal * PLATFORM_FEE_RATE;
        const creatorEarning = itemTotal - platformFee;
        
        monthlyData[month] = (monthlyData[month] || 0) + creatorEarning;
      }
    }

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  const revenueBreakdown = [
    { name: 'Courses', value: analyticsData.courseRevenue, color: '#3b82f6' },
    { name: 'Events', value: analyticsData.eventRevenue, color: '#10b981' }
  ];

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-orange-50">
          <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-orange-50">
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          
          {/* Key Metrics */}
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
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Unique students enrolled
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Published courses
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
                  Created events
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
                    analyticsData.recentEnrollments.slice(0, 5).map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{enrollment.profiles?.username || enrollment.profiles?.full_name || 'Unknown Student'}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.courses?.title}</p>
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
                    analyticsData.recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.profiles?.username || booking.profiles?.full_name || 'Unknown Attendee'}</p>
                          <p className="text-sm text-muted-foreground">{booking.events?.title}</p>
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
