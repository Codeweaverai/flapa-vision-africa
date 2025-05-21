
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [eventCount, setEventCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('week');

  // Chart data
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, [periodFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Get total events
      const { count: totalEventCount, error: totalEventError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      
      if (totalEventError) throw totalEventError;
      
      // Get upcoming events
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gt('start_time', new Date().toISOString());
        
      if (upcomingError) throw upcomingError;
      
      // Get total courses
      const { count: totalCourseCount, error: totalCourseError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
        
      if (totalCourseError) throw totalCourseError;
      
      // Get total enrollments
      const { count: totalEnrollmentCount, error: totalEnrollmentError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true });
        
      if (totalEnrollmentError) throw totalEnrollmentError;
      
      // Get total registrations
      const { count: totalRegistrationCount, error: totalRegistrationError } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });
        
      if (totalRegistrationError) throw totalRegistrationError;
      
      setEventCount(totalEventCount || 0);
      setUpcomingEvents(upcomingCount || 0);
      setCourseCount(totalCourseCount || 0);
      setEnrollmentCount(totalEnrollmentCount || 0);
      setRegistrationCount(totalRegistrationCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // In a real application, this would fetch actual data from the database
    // For demonstration purposes, we'll use mock data
    
    // Enrollment data over time
    const mockEnrollmentData = [
      { name: 'Mon', enrollments: 4 },
      { name: 'Tue', enrollments: 3 },
      { name: 'Wed', enrollments: 5 },
      { name: 'Thu', enrollments: 7 },
      { name: 'Fri', enrollments: 6 },
      { name: 'Sat', enrollments: 8 },
      { name: 'Sun', enrollments: 12 },
    ];
    
    // Revenue data by day
    const mockRevenueData = [
      { name: 'Mon', revenue: 240 },
      { name: 'Tue', revenue: 180 },
      { name: 'Wed', revenue: 390 },
      { name: 'Thu', revenue: 520 },
      { name: 'Fri', revenue: 430 },
      { name: 'Sat', revenue: 650 },
      { name: 'Sun', revenue: 780 },
    ];
    
    // Course enrollments by category
    const mockCategoryData = [
      { name: 'Technology', value: 35 },
      { name: 'Business', value: 25 },
      { name: 'Marketing', value: 20 },
      { name: 'Design', value: 15 },
      { name: 'Other', value: 5 },
    ];
    
    setEnrollmentData(mockEnrollmentData);
    setRevenueData(mockRevenueData);
    setCategoryData(mockCategoryData);
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <AdminLayout title="Dashboard">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {loading ? <div className="h-8 w-16 bg-blue-200 animate-pulse rounded"></div> : eventCount}
            </div>
            <p className="text-xs text-blue-700 pt-1">
              Events created in total
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {loading ? <div className="h-8 w-16 bg-green-200 animate-pulse rounded"></div> : upcomingEvents}
            </div>
            <p className="text-xs text-green-700 pt-1">
              Events scheduled in the future
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {loading ? <div className="h-8 w-16 bg-purple-200 animate-pulse rounded"></div> : courseCount}
            </div>
            <p className="text-xs text-purple-700 pt-1">
              Courses available on the platform
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {loading ? <div className="h-8 w-16 bg-amber-200 animate-pulse rounded"></div> : enrollmentCount}
            </div>
            <p className="text-xs text-amber-700 pt-1">
              Course enrollments
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-900">
              {loading ? <div className="h-8 w-16 bg-rose-200 animate-pulse rounded"></div> : registrationCount}
            </div>
            <p className="text-xs text-rose-700 pt-1">
              Event registrations
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Time Period Filter */}
      <div className="mt-8 mb-4">
        <Tabs value={periodFilter} onValueChange={setPeriodFilter}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">This Quarter</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Enrollment Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={enrollmentData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="enrollments" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue ($)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Course Categories Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Course Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Registrations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Event Registrations</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={enrollmentData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enrollments" stroke="#ff7300" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center p-6">
              <div>
                <h3 className="font-medium">Create New Event</h3>
                <p className="text-sm text-muted-foreground">Add a new event to your calendar</p>
                <Button asChild variant="link" className="p-0 mt-2">
                  <Link to="/admin/events/create">Go to Events</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center p-6">
              <div>
                <h3 className="font-medium">Manage Courses</h3>
                <p className="text-sm text-muted-foreground">View and edit your courses</p>
                <Button asChild variant="link" className="p-0 mt-2">
                  <Link to="/admin/courses-list">Go to Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center p-6">
              <div>
                <h3 className="font-medium">Registrations</h3>
                <p className="text-sm text-muted-foreground">View event and course registrations</p>
                <Button asChild variant="link" className="p-0 mt-2">
                  <Link to="/admin/registrations">Go to Registrations</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
