
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/layout/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BookOpen, 
  Calendar,
  Download,
  Eye,
  Star,
  Clock
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface AnalyticsData {
  totalRevenue: number;
  totalEnrollments: number;
  totalStudents: number;
  coursePerformance: any[];
  eventPerformance: any[];
  revenueOverTime: any[];
  enrollmentsByMonth: any[];
  topPerformingCourses: any[];
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalEnrollments: 0,
    totalStudents: 0,
    coursePerformance: [],
    eventPerformance: [],
    revenueOverTime: [],
    enrollmentsByMonth: [],
    topPerformingCourses: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Calculate date range
      let startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate = subDays(new Date(), 7);
          break;
        case '30d':
          startDate = subDays(new Date(), 30);
          break;
        case '90d':
          startDate = subDays(new Date(), 90);
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          break;
        default:
          startDate = subDays(new Date(), 30);
      }

      // Fetch course enrollments with course details
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!inner(title, price, is_free, creator_id, category)
        `)
        .eq('courses.creator_id', user?.id)
        .eq('payment_status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (enrollmentsError) throw enrollmentsError;

      // Fetch event registrations with event details
      const { data: registrations, error: registrationsError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events!inner(title, price, is_free, creator_id, event_type)
        `)
        .eq('events.creator_id', user?.id)
        .eq('payment_status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (registrationsError) throw registrationsError;

      // Calculate analytics
      const courseRevenue = enrollments?.reduce((sum, e) => 
        sum + (e.courses?.is_free ? 0 : e.courses?.price || 0), 0) || 0;
      
      const eventRevenue = registrations?.reduce((sum, r) => 
        sum + (r.events?.is_free ? 0 : r.events?.price || 0), 0) || 0;

      const totalRevenue = courseRevenue + eventRevenue;
      const totalEnrollments = (enrollments?.length || 0) + (registrations?.length || 0);
      
      const uniqueStudents = new Set([
        ...(enrollments?.map(e => e.user_id) || []),
        ...(registrations?.map(r => r.user_id) || [])
      ]);

      // Group by course for performance data
      const coursePerformance = enrollments?.reduce((acc, enrollment) => {
        const courseTitle = enrollment.courses?.title || 'Unknown';
        if (!acc[courseTitle]) {
          acc[courseTitle] = {
            title: courseTitle,
            enrollments: 0,
            revenue: 0,
            category: enrollment.courses?.category || 'Other'
          };
        }
        acc[courseTitle].enrollments += 1;
        acc[courseTitle].revenue += enrollment.courses?.is_free ? 0 : (enrollment.courses?.price || 0);
        return acc;
      }, {} as any) || {};

      // Group by event for performance data
      const eventPerformance = registrations?.reduce((acc, registration) => {
        const eventTitle = registration.events?.title || 'Unknown';
        if (!acc[eventTitle]) {
          acc[eventTitle] = {
            title: eventTitle,
            registrations: 0,
            revenue: 0,
            type: registration.events?.event_type || 'Other'
          };
        }
        acc[eventTitle].registrations += 1;
        acc[eventTitle].revenue += registration.events?.is_free ? 0 : (registration.events?.price || 0);
        return acc;
      }, {} as any) || {};

      // Revenue over time (daily)
      const revenueByDay = [...(enrollments || []), ...(registrations || [])].reduce((acc, item) => {
        const date = format(new Date(item.created_at), 'MMM dd');
        const revenue = item.courses ? 
          (item.courses.is_free ? 0 : item.courses.price || 0) :
          (item.events.is_free ? 0 : item.events.price || 0);
        
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, enrollments: 0 };
        }
        acc[date].revenue += revenue;
        acc[date].enrollments += 1;
        return acc;
      }, {} as any);

      setAnalytics({
        totalRevenue,
        totalEnrollments,
        totalStudents: uniqueStudents.size,
        coursePerformance: Object.values(coursePerformance),
        eventPerformance: Object.values(eventPerformance),
        revenueOverTime: Object.values(revenueByDay),
        enrollmentsByMonth: Object.values(revenueByDay),
        topPerformingCourses: Object.values(coursePerformance)
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 5)
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (loading) {
    return (
      <CreatorLayout>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Track your performance and growth</p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <PriceDisplay amount={analytics.totalRevenue} originalCurrency="USD" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Total Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalEnrollments}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Avg. Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <PriceDisplay 
                  amount={analytics.totalEnrollments > 0 ? analytics.totalRevenue / analytics.totalEnrollments : 0} 
                  originalCurrency="USD" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [
                      <PriceDisplay amount={Number(value)} originalCurrency="USD" />, 
                      'Revenue'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Enrollments Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollments Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.enrollmentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrollments" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Performing Courses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topPerformingCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No course data available</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.topPerformingCourses.map((course: any, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-gray-500">{course.enrollments} enrollments</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            <PriceDisplay amount={course.revenue} originalCurrency="USD" />
                          </p>
                          <Badge variant="outline">{course.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Course Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.coursePerformance.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.coursePerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="enrollments"
                      label={({ title, enrollments }) => `${title}: ${enrollments}`}
                    >
                      {analytics.coursePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAnalytics;
