import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { format, subDays } from 'date-fns';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Download, Calendar, BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueSummary, setRevenueSummary] = useState({
    total: 0,
    coursesRevenue: 0,
    eventsRevenue: 0,
    last30Days: 0,
  });
  const [enrollmentSummary, setEnrollmentSummary] = useState({
    total: 0,
    courses: 0,
    events: 0,
    last30Days: 0,
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
  const [eventPerformance, setEventPerformance] = useState<any[]>([]);
  const [completionRates, setCompletionRates] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('thisMonth');
  
  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeframe]);
  
  // Set up realtime listeners
  useEffect(() => {
    if (!user) return;
    
    // For enrollments
    const enrollmentsChannel = supabase
      .channel('creator-analytics-enrollments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'course_enrollments' },
        () => {
          fetchAnalyticsData();
        }
      )
      .subscribe();
      
    // For registrations
    const registrationsChannel = supabase
      .channel('creator-analytics-registrations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          fetchAnalyticsData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(registrationsChannel);
    };
  }, [user]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Get date range based on selected timeframe
      const { startDate, endDate } = getDateRange(timeframe);

      // Fetch course enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          course_id,
          course:courses!inner(id, title, price, is_free, creator_id)
        `)
        .eq('courses.creator_id', user?.id)
        .gte('enrollment_date', startDate.toISOString())
        .lte('enrollment_date', endDate.toISOString());

      if (enrollmentsError) throw enrollmentsError;

      // Fetch event registrations
      const { data: registrations, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          id,
          created_at,
          event:events!inner(id, title, price, is_free, creator_id)
        `)
        .eq('events.creator_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (registrationsError) throw registrationsError;

      // Calculate revenue and enrollment summaries
      const courseRevenue = enrollments
        ?.filter(item => !item.course.is_free)
        .reduce((sum, item) => sum + Number(item.course.price || 0), 0) || 0;
        
      const eventRevenue = registrations
        ?.filter(item => !item.event.is_free)
        .reduce((sum, item) => sum + Number(item.event.price || 0), 0) || 0;
        
      const totalRevenue = courseRevenue + eventRevenue;
      
      const last30DaysStart = subDays(new Date(), 30).toISOString();
      const last30DaysRevenue = [
        ...(enrollments || []).filter(item => new Date(item.enrollment_date) >= new Date(last30DaysStart) && !item.course.is_free),
        ...(registrations || []).filter(item => new Date(item.created_at) >= new Date(last30DaysStart) && !item.event.is_free)
      ].reduce((sum, item) => {
        const price = item.hasOwnProperty('course') 
          ? Number(item.course.price || 0) 
          : Number(item.event.price || 0);
        return sum + price;
      }, 0);
      
      const last30DaysEnrollments = [
        ...(enrollments || []).filter(item => new Date(item.enrollment_date) >= new Date(last30DaysStart)),
        ...(registrations || []).filter(item => new Date(item.created_at) >= new Date(last30DaysStart))
      ].length;
      
      setRevenueSummary({
        total: totalRevenue,
        coursesRevenue: courseRevenue,
        eventsRevenue: eventRevenue,
        last30Days: last30DaysRevenue
      });
      
      setEnrollmentSummary({
        total: (enrollments?.length || 0) + (registrations?.length || 0),
        courses: enrollments?.length || 0,
        events: registrations?.length || 0,
        last30Days: last30DaysEnrollments
      });

      // Process revenue data by day
      const revenueByDay = processDataByDay(
        [
          ...(enrollments?.filter(item => !item.course.is_free).map(item => ({
            date: item.enrollment_date,
            amount: Number(item.course.price || 0),
            type: 'course'
          })) || []),
          
          ...(registrations?.filter(item => !item.event.is_free).map(item => ({
            date: item.created_at,
            amount: Number(item.event.price || 0),
            type: 'event'
          })) || [])
        ],
        startDate,
        endDate
      );
      
      setRevenueData(revenueByDay);

      // Process enrollment data by day
      const enrollmentByDay = processDataByDay(
        [
          ...(enrollments?.map(item => ({
            date: item.enrollment_date,
            count: 1,
            type: 'course'
          })) || []),
          
          ...(registrations?.map(item => ({
            date: item.created_at,
            count: 1,
            type: 'event'
          })) || [])
        ],
        startDate,
        endDate
      );
      
      setEnrollmentData(enrollmentByDay);

      // Process course performance
      const coursesData = processCoursePerformance(enrollments || []);
      setCoursePerformance(coursesData);
      
      // Process event performance
      const eventsData = processEventPerformance(registrations || []);
      setEventPerformance(eventsData);
      
      // Fetch course completion rates
      fetchCompletionRates();
      
      // Mock device data (in a real app, this would come from analytics)
      setDeviceData([
        { name: 'Mobile', value: 55 },
        { name: 'Desktop', value: 35 },
        { name: 'Tablet', value: 10 }
      ]);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCompletionRates = async () => {
    try {
      // Get courses by this creator
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('creator_id', user?.id);
        
      if (coursesError) throw coursesError;
      
      const completionData = await Promise.all(courses?.map(async (course) => {
        // Get total enrollments for this course
        const { count: totalCount, error: totalError } = await supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', course.id);
          
        if (totalError) throw totalError;
        
        // Get completed enrollments for this course
        const { count: completedCount, error: completedError } = await supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', course.id)
          .eq('is_completed', true);
          
        if (completedError) throw completedError;
        
        const completionRate = totalCount ? Math.round((completedCount || 0) * 100 / totalCount) : 0;
        
        return {
          name: course.title,
          completionRate: completionRate,
          enrollments: totalCount || 0
        };
      }) || []);
      
      setCompletionRates(completionData);
    } catch (error) {
      console.error('Error fetching completion rates:', error);
    }
  };
  
  const getDateRange = (timeframe: string) => {
    const endDate = new Date();
    let startDate: Date;
    
    switch(timeframe) {
      case 'last7Days':
        startDate = subDays(endDate, 7);
        break;
      case 'last30Days':
        startDate = subDays(endDate, 30);
        break;
      case 'last90Days':
        startDate = subDays(endDate, 90);
        break;
      case 'thisMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        endDate.setDate(0); // Last day of previous month
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    return { startDate, endDate };
  };
  
  const processDataByDay = (data: any[], startDate: Date, endDate: Date) => {
    const result: {[key: string]: any} = {};
    const currentDate = new Date(startDate);
    
    // Initialize each date in the range
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      result[dateKey] = {
        date: dateKey,
        courses: 0,
        events: 0,
        total: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Aggregate data by day
    data.forEach(item => {
      const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
      if (result[dateKey]) {
        if (item.type === 'course') {
          result[dateKey].courses += (item.amount || item.count || 0);
        } else {
          result[dateKey].events += (item.amount || item.count || 0);
        }
        result[dateKey].total += (item.amount || item.count || 0);
      }
    });
    
    // Convert to array
    return Object.values(result);
  };
  
  const processCoursePerformance = (enrollments: any[]) => {
    const courseMap: {[key: string]: any} = {};
    
    enrollments.forEach(enrollment => {
      const courseId = enrollment.course.id;
      const courseTitle = enrollment.course.title;
      
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          name: courseTitle,
          enrollments: 0,
          revenue: 0
        };
      }
      
      courseMap[courseId].enrollments += 1;
      if (!enrollment.course.is_free) {
        courseMap[courseId].revenue += Number(enrollment.course.price || 0);
      }
    });
    
    return Object.values(courseMap).sort((a, b) => b.enrollments - a.enrollments);
  };
  
  const processEventPerformance = (registrations: any[]) => {
    const eventMap: {[key: string]: any} = {};
    
    registrations.forEach(registration => {
      const eventId = registration.event.id;
      const eventTitle = registration.event.title;
      
      if (!eventMap[eventId]) {
        eventMap[eventId] = {
          name: eventTitle,
          registrations: 0,
          revenue: 0
        };
      }
      
      eventMap[eventId].registrations += 1;
      if (!registration.event.is_free) {
        eventMap[eventId].revenue += Number(registration.event.price || 0);
      }
    });
    
    return Object.values(eventMap).sort((a, b) => b.registrations - a.registrations);
  };

  const formatRevenueValue = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  return (
    <CreatorLayout title="Analytics">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your business performance and growth</p>
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
            variant={timeframe === 'lastMonth' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setTimeframe('lastMonth')}
          >
            Last Month
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
              <Badge variant="outline">{timeframe === 'last30Days' ? '30 Days' : timeframe}</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">${loading ? '-' : revenueSummary.total.toFixed(2)}</h3>
              <span className="text-xs text-muted-foreground">USD</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">Total Enrollments</p>
              <Badge variant="outline">{timeframe === 'last30Days' ? '30 Days' : timeframe}</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">{loading ? '-' : enrollmentSummary.total}</h3>
              <span className="text-xs text-muted-foreground">enrollments</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">Course Revenue</p>
              <Badge variant="outline">{timeframe === 'last30Days' ? '30 Days' : timeframe}</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">${loading ? '-' : revenueSummary.coursesRevenue.toFixed(2)}</h3>
              <span className="text-xs text-muted-foreground">USD</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">Event Revenue</p>
              <Badge variant="outline">{timeframe === 'last30Days' ? '30 Days' : timeframe}</Badge>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">${loading ? '-' : revenueSummary.eventsRevenue.toFixed(2)}</h3>
              <span className="text-xs text-muted-foreground">USD</span>
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
              <CardTitle>Revenue Over Time</CardTitle>
            </div>
            <CardDescription>Daily revenue breakdown for courses and events</CardDescription>
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
                    <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
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
                    formatter={(value, name) => [formatRevenueValue(Number(value)), name === 'courses' ? 'Courses' : 'Events']}
                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                  />
                  <Legend />
                  <Area 
                    type="monotone"
                    name="Courses"
                    dataKey="courses"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorCourses)"
                  />
                  <Area 
                    type="monotone"
                    name="Events"
                    dataKey="events"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorEvents)"
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
              <CardTitle>Enrollment Activity</CardTitle>
            </div>
            <CardDescription>Daily enrollment and registration data</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 h-80">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
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
                    dataKey="courses" 
                    name="Course Enrollments" 
                    stackId="a" 
                    fill="#8884d8" 
                  />
                  <Bar 
                    dataKey="events" 
                    name="Event Registrations" 
                    stackId="a" 
                    fill="#82ca9d" 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="coursePerformance">
        <TabsList className="mb-4">
          <TabsTrigger value="coursePerformance">Course Performance</TabsTrigger>
          <TabsTrigger value="eventPerformance">Event Performance</TabsTrigger>
          <TabsTrigger value="completionRates">Completion Rates</TabsTrigger>
          <TabsTrigger value="demographics">User Demographics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="coursePerformance">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
              <CardDescription>Courses ranked by enrollments and revenue</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : coursePerformance.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No course enrollment data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coursePerformance.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="enrollments" 
                      name="Enrollments" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue ($)" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="eventPerformance">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Events</CardTitle>
              <CardDescription>Events ranked by registrations and revenue</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : eventPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No event registration data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={eventPerformance.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="registrations" 
                      name="Registrations" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue ($)" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completionRates">
          <Card>
            <CardHeader>
              <CardTitle>Course Completion Rates</CardTitle>
              <CardDescription>Percentage of students who completed each course</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : completionRates.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No completion data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={completionRates}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                    <Bar 
                      dataKey="completionRate" 
                      name="Completion Rate" 
                      fill="#8884d8"
                    >
                      {completionRates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <CardTitle>Device Usage</CardTitle>
                </div>
                <CardDescription>Breakdown of devices used to access content</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Demographics Data</CardTitle>
                <CardDescription>
                  User demographics will be displayed here when available.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-80 text-muted-foreground">
                <div className="text-center">
                  <BarChartIcon className="h-16 w-16 mx-auto mb-4 text-muted" />
                  <p>Demographics data will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </CreatorLayout>
  );
};

export default CreatorAnalytics;
