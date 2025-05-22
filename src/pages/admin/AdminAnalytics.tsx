
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Download,
  Calendar, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon 
} from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('thisMonth');
  
  // Summary state
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    consultationRevenue: 0,
    eventRevenue: 0,
    coursesRevenue: 0,
    totalUsers: 0,
    newUsers: 0,
    totalEvents: 0,
    totalCourses: 0,
    platform_fee: 0,
    serviceFeesCollected: 0,
  });

  // Chart data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userSignups, setUserSignups] = useState<any[]>([]);
  const [revenueSources, setRevenueSources] = useState<any[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<any[]>([]);
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);
  
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Define date range based on selected timeframe
      const { startDate, endDate } = getDateRange(timeframe);
      const startTimestamp = startDate.toISOString();
      const endTimestamp = endDate.toISOString();

      // Fetch system settings for platform fee
      const { data: settingsData } = await supabase
        .from('general_settings')
        .select('platform_fee')
        .single();

      const platformFee = settingsData?.platform_fee || 10; // Default to 10% if not set
      
      // Fetch payment transactions in the date range
      const { data: paymentData } = await supabase
        .from('payment_transactions')
        .select('*')
        .gte('created_at', startTimestamp)
        .lte('created_at', endTimestamp)
        .in('status', ['COMPLETED', 'SUCCESS', 'SUCCEEDED']);
      
      // Fetch course enrollments in the date range
      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('*, course:courses(*)')
        .gte('enrollment_date', startTimestamp)
        .lte('enrollment_date', endTimestamp);
      
      // Fetch consultation bookings in the date range
      const { data: consultationsData } = await supabase
        .from('consultation_bookings')
        .select('*')
        .gte('created_at', startTimestamp)
        .lte('created_at', endTimestamp)
        .in('status', ['confirmed', 'completed']);
      
      // Fetch event registrations in the date range
      const { data: registrationsData } = await supabase
        .from('registrations')
        .select('*, event:events(*)')
        .gte('created_at', startTimestamp)
        .lte('created_at', endTimestamp)
        .eq('status', 'confirmed');

      // Fetch user count and new sign-ups in date range
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startTimestamp)
        .lte('created_at', endTimestamp);
      
      // Fetch total courses and events
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
        
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      
      // Calculate revenue from various sources
      const consultationRevenue = (consultationsData || [])
        .reduce((sum, item) => sum + Number(item.payment_amount || 0), 0);
      
      const eventRevenue = (registrationsData || [])
        .reduce((sum, item) => sum + Number(item.payment_amount || 0), 0);
      
      const coursesRevenue = (enrollmentsData || [])
        .reduce((sum, item) => {
          if (item.course && !item.course.is_free) {
            return sum + Number(item.course.price || 0);
          }
          return sum;
        }, 0);
      
      const totalRevenue = consultationRevenue + eventRevenue + coursesRevenue;
      
      // Calculate service fees collected (platform fee percentage of total revenue)
      const serviceFeesCollected = (totalRevenue * platformFee) / 100;
      
      // Update summary data
      setSummaryData({
        totalRevenue,
        consultationRevenue,
        eventRevenue,
        coursesRevenue,
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        totalEvents: totalEvents || 0,
        totalCourses: totalCourses || 0,
        platform_fee: platformFee,
        serviceFeesCollected,
      });
      
      // Process data for charts
      prepareRevenueChartData(startDate, endDate, consultationsData, registrationsData, enrollmentsData);
      prepareUserSignupsData(startDate, endDate);
      prepareRevenueSourcesData(consultationRevenue, eventRevenue, coursesRevenue);
      prepareCourseEnrollmentsData(enrollmentsData || []);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const prepareRevenueChartData = (
    startDate: Date, 
    endDate: Date, 
    consultationsData: any[] = [], 
    registrationsData: any[] = [], 
    enrollmentsData: any[] = []
  ) => {
    const dailyData: {[key: string]: any} = {};
    const currentDate = new Date(startDate);
    
    // Initialize each date in the range
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dailyData[dateKey] = {
        date: dateKey,
        consultations: 0,
        events: 0,
        courses: 0,
        total: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add consultation revenue
    consultationsData.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        const amount = Number(item.payment_amount || 0);
        dailyData[dateKey].consultations += amount;
        dailyData[dateKey].total += amount;
      }
    });
    
    // Add event registration revenue
    registrationsData.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        const amount = Number(item.payment_amount || 0);
        dailyData[dateKey].events += amount;
        dailyData[dateKey].total += amount;
      }
    });
    
    // Add course enrollment revenue
    enrollmentsData.forEach((item: any) => {
      if (item.course && !item.course.is_free) {
        const dateKey = format(new Date(item.enrollment_date), 'yyyy-MM-dd');
        if (dailyData[dateKey]) {
          const amount = Number(item.course.price || 0);
          dailyData[dateKey].courses += amount;
          dailyData[dateKey].total += amount;
        }
      }
    });
    
    // Convert to array and sort by date
    const chartData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    setRevenueData(chartData);
  };
  
  const prepareUserSignupsData = async (startDate: Date, endDate: Date) => {
    try {
      // Fetch user signups by date
      const result = await supabase.rpc('get_user_signups_by_date', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
      if (result.error) throw result.error;
      
      // If RPC function doesn't exist, fetch directly
      if (!result.data) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        // Process the data manually
        const dailyData: {[key: string]: any} = {};
        const currentDate = new Date(startDate);
        
        // Initialize each date in the range
        while (currentDate <= endDate) {
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          dailyData[dateKey] = {
            date: dateKey,
            count: 0
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Count signups for each date
        if (profilesData) {
          profilesData.forEach(profile => {
            const dateKey = format(new Date(profile.created_at), 'yyyy-MM-dd');
            if (dailyData[dateKey]) {
              dailyData[dateKey].count += 1;
            }
          });
        }
        
        // Convert to array and sort by date
        const signupData = Object.values(dailyData).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        setUserSignups(signupData);
      } else {
        // Format the result data
        const formattedData = result.data.map((item: any) => ({
          date: item.date,
          count: parseInt(item.count)
        }));
        
        setUserSignups(formattedData);
      }
    } catch (error) {
      console.error('Error fetching user signup data:', error);
      // Provide empty data in case of error
      setUserSignups([]);
    }
  };
  
  const prepareRevenueSourcesData = (consultationRevenue: number, eventRevenue: number, coursesRevenue: number) => {
    const data = [
      { name: 'Consultations', value: consultationRevenue },
      { name: 'Events', value: eventRevenue },
      { name: 'Courses', value: coursesRevenue },
    ];
    
    setRevenueSources(data);
  };
  
  const prepareCourseEnrollmentsData = (enrollmentsData: any[]) => {
    // Group enrollments by course
    const courseMap: {[key: string]: any} = {};
    
    enrollmentsData.forEach(enrollment => {
      if (!enrollment.course) return;
      
      const courseId = enrollment.course.id;
      const courseTitle = enrollment.course.title;
      
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          name: courseTitle || `Course ${courseId.slice(0, 4)}`,
          enrollments: 0,
          revenue: 0
        };
      }
      
      courseMap[courseId].enrollments += 1;
      
      if (!enrollment.course.is_free) {
        courseMap[courseId].revenue += Number(enrollment.course.price || 0);
      }
    });
    
    // Convert to array and sort by enrollments
    const sortedData = Object.values(courseMap)
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10); // Top 10 courses
    
    setCourseEnrollments(sortedData);
  };
  
  const getDateRange = (timeframe: string) => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'last7Days':
        startDate = subDays(endDate, 7);
        break;
      case 'last30Days':
        startDate = subDays(endDate, 30);
        break;
      case 'thisMonth':
        startDate = startOfMonth(endDate);
        break;
      case 'last3Months':
        startDate = subDays(endDate, 90);
        break;
      case 'last6Months':
        startDate = subDays(endDate, 180);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    return { startDate, endDate };
  };
  
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <AdminLayout title="Analytics">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform performance and insights</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
      
      {/* Timeframe selector */}
      <div className="mb-6">
        <div className="inline-flex rounded-md border p-1">
          <Button 
            variant={timeframe === 'last7Days' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('last7Days')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeframe === 'last30Days' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('last30Days')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeframe === 'thisMonth' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('thisMonth')}
          >
            This Month
          </Button>
          <Button 
            variant={timeframe === 'last3Months' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('last3Months')}
          >
            3 Months
          </Button>
          <Button 
            variant={timeframe === 'last6Months' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('last6Months')}
          >
            6 Months
          </Button>
          <Button 
            variant={timeframe === 'thisYear' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('thisYear')}
          >
            This Year
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">Total Revenue</p>
              <Badge variant="outline">USD</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">
                {loading ? '...' : formatCurrency(summaryData.totalRevenue)}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">Service Fees</p>
              <Badge variant="outline">{summaryData.platform_fee}%</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">
                {loading ? '...' : formatCurrency(summaryData.serviceFeesCollected)}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">New Users</p>
              <Badge variant="outline">Total: {summaryData.totalUsers}</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">
                {loading ? '...' : summaryData.newUsers}
              </h3>
              <span className="text-xs text-muted-foreground">users</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">Content</p>
              <Badge variant="outline">Total</Badge>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm">Courses:</span>
                <span className="font-bold">{loading ? '...' : summaryData.totalCourses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Events:</span>
                <span className="font-bold">{loading ? '...' : summaryData.totalEvents}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <BarChartIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <CardTitle>Revenue Breakdown</CardTitle>
            </div>
            <CardDescription>Daily revenue from all sources</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 h-80">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'MM/dd');
                    }} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                  />
                  <Legend />
                  <Area 
                    type="monotone"
                    name="Consultations"
                    dataKey="consultations"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorConsultations)"
                  />
                  <Area 
                    type="monotone"
                    name="Events"
                    dataKey="events"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                  />
                  <Area 
                    type="monotone"
                    name="Courses"
                    dataKey="courses"
                    stroke="#ffc658"
                    fillOpacity={1}
                    fill="url(#colorCourses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <BarChartIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <CardTitle>User Signups</CardTitle>
            </div>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 h-80">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userSignups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'MM/dd');
                    }} 
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="New Users" 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="revenueSources">
        <TabsList className="mb-4">
          <TabsTrigger value="revenueSources">Revenue Sources</TabsTrigger>
          <TabsTrigger value="courseEnrollments">Course Enrollments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenueSources">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue By Source</CardTitle>
                <CardDescription>Revenue distribution across business segments</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : revenueSources.length === 0 || revenueSources.every(item => item.value === 0) ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available for the selected period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Detailed revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Consultations</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">
                        {loading ? '...' : formatCurrency(summaryData.consultationRevenue)}
                      </span>
                      <Badge variant="outline">
                        {summaryData.totalRevenue > 0 
                          ? `${((summaryData.consultationRevenue / summaryData.totalRevenue) * 100).toFixed(1)}%` 
                          : '0%'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Events</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">
                        {loading ? '...' : formatCurrency(summaryData.eventRevenue)}
                      </span>
                      <Badge variant="outline">
                        {summaryData.totalRevenue > 0 
                          ? `${((summaryData.eventRevenue / summaryData.totalRevenue) * 100).toFixed(1)}%` 
                          : '0%'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Courses</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">
                        {loading ? '...' : formatCurrency(summaryData.coursesRevenue)}
                      </span>
                      <Badge variant="outline">
                        {summaryData.totalRevenue > 0 
                          ? `${((summaryData.coursesRevenue / summaryData.totalRevenue) * 100).toFixed(1)}%` 
                          : '0%'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Platform Fees Collected</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">
                        {loading ? '...' : formatCurrency(summaryData.serviceFeesCollected)}
                      </span>
                      <Badge>{summaryData.platform_fee}% rate</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courseEnrollments">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Enrollment and revenue by course</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : courseEnrollments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No course enrollment data available for the selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courseEnrollments}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="enrollments" 
                      name="Enrollments" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminAnalytics;
