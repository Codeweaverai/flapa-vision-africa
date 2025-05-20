import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BookOpen, Users, DollarSign, Plus } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface EnrollmentData {
  id: string;
  enrollment_date: string;
  user_id: string;
  course_id: string;
  course?: {
    title: string;
    creator_id: string;
  } | null;
}

interface RegistrationData {
  id: string;
  created_at: string;
  user_id: string;
  event_id: string;
  event?: {
    title: string;
    creator_id: string;
    price: number;
    is_free: boolean;
  } | null;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [courseCount, setCourseCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchCreatorStats();
      fetchRecentActivity();
      fetchAnalyticsData();
    }
  }, [user]);
  
  const fetchCreatorStats = async () => {
    setLoading(true);
    try {
      // Get course count
      const { count: courseCountData, error: courseError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user?.id);
        
      if (courseError) throw courseError;
      
      // Get event count
      const { count: eventCountData, error: eventError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user?.id);
        
      if (eventError) throw eventError;

      // Get unique student count (combining course enrollments and event registrations)
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('user_id, course:courses!inner(creator_id)')
        .eq('course.creator_id', user?.id);
        
      if (enrollmentError) throw enrollmentError;
      
      const { data: registrationData, error: registrationError } = await supabase
        .from('registrations')
        .select('user_id, event:events!inner(creator_id)')
        .eq('event.creator_id', user?.id);
        
      if (registrationError) throw registrationError;
      
      // Combine unique student IDs from both sources
      const enrollmentUserIds = enrollmentData?.map(item => item.user_id) || [];
      const registrationUserIds = registrationData?.map(item => item.user_id) || [];
      const uniqueStudentIds = new Set([...enrollmentUserIds, ...registrationUserIds]);
      
      // Calculate total revenue (simplified for demo)
      const { data: courseRevenue, error: courseRevenueError } = await supabase
        .from('course_enrollments')
        .select('course:courses!inner(price, is_free, creator_id)')
        .eq('course.creator_id', user?.id)
        .eq('course.is_free', false);
        
      if (courseRevenueError) throw courseRevenueError;
      
      const { data: eventRevenue, error: eventRevenueError } = await supabase
        .from('registrations')
        .select('event:events!inner(price, is_free, creator_id)')
        .eq('event.creator_id', user?.id)
        .eq('event.is_free', false);
        
      if (eventRevenueError) throw eventRevenueError;
      
      // Calculate total revenue safely
      const courseRevenueTotal = (courseRevenue || []).reduce((sum, item) => 
        Number(sum) + (typeof item.course?.price === 'number' ? Number(item.course?.price) : 0), 0);
      
      const eventRevenueTotal = (eventRevenue || []).reduce((sum, item) => 
        Number(sum) + (typeof item.event?.price === 'number' ? Number(item.event?.price) : 0), 0);
      
      // Make sure we're adding two numbers
      const totalRevenue = Number(courseRevenueTotal) + Number(eventRevenueTotal);
      
      setCourseCount(courseCountData || 0);
      setEventCount(eventCountData || 0);
      setStudentCount(uniqueStudentIds.size);
      setRevenue(totalRevenue);
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecentActivity = async () => {
    try {
      // Get recent enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          user_id,
          course_id,
          course:courses(title, creator_id)
        `)
        .eq('course.creator_id', user?.id)
        .order('enrollment_date', { ascending: false })
        .limit(5);
        
      if (enrollmentsError) {
        console.error('Enrollment error:', enrollmentsError);
        throw enrollmentsError;
      }

      // Get recent registrations
      const { data: registrations, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          id,
          created_at,
          user_id,
          event_id,
          event:events(title, creator_id)
        `)
        .eq('event.creator_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (registrationsError) {
        console.error('Registration error:', registrationsError);
        throw registrationsError;
      }
      
      // Get profiles for all user IDs
      const enrollmentUserIds = (enrollments || []).map(enrollment => enrollment.user_id);
      const registrationUserIds = (registrations || []).map(reg => reg.user_id);
      const allUserIds = [...new Set([...enrollmentUserIds, ...registrationUserIds])];
      
      let profilesData: ProfileData[] = [];
      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', allUserIds);
          
        if (profilesError) {
          console.error('Profiles error:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }
      
      // Map profiles to a lookup object
      const profilesMap: Record<string, ProfileData> = {};
      profilesData.forEach(profile => {
        if (profile && profile.id) {
          profilesMap[profile.id] = profile;
        }
      });

      // Combine and sort by creation date
      const combinedActivity = [
        ...(enrollments?.map(item => {
          const profile = profilesMap[item.user_id] || { full_name: 'Anonymous User' };
          return {
            id: item.id,
            type: 'enrollment',
            created_at: item.enrollment_date,
            user_id: item.user_id,
            user_name: profile?.full_name || 'Anonymous User',
            content_id: item.course_id,
            content_title: item.course?.title || 'Unnamed Course'
          };
        }) || []),
        
        ...(registrations?.map(item => {
          const profile = profilesMap[item.user_id] || { full_name: 'Anonymous User' };
          return {
            id: item.id,
            type: 'registration',
            created_at: item.created_at,
            user_id: item.user_id,
            user_name: profile?.full_name || 'Anonymous User',
            content_id: item.event_id,
            content_title: item.event?.title || 'Unnamed Event'
          };
        }) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
      
      setRecentActivity(combinedActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };
  
  const fetchAnalyticsData = async () => {
    try {
      // Get enrollment data for chart
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          enrollment_date,
          course:courses!inner(creator_id)
        `)
        .eq('course.creator_id', user?.id);
        
      if (enrollmentsError) throw enrollmentsError;
      
      // Get registration data for chart
      const { data: registrations, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          created_at,
          event:events!inner(creator_id, price, is_free)
        `)
        .eq('event.creator_id', user?.id);
        
      if (registrationsError) throw registrationsError;
      
      // Process enrollment data by month
      const enrollmentsByMonth = processDataByMonth(enrollments || [], 'enrollments');
      setEnrollmentData(enrollmentsByMonth);
      
      // Process revenue data by month
      const revenueByMonth = processRevenueByMonth(registrations || []);
      setRevenueData(revenueByMonth);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };
  
  // Setup realtime listeners for data updates
  useEffect(() => {
    if (!user) return;
    
    // For courses
    const coursesChannel = supabase
      .channel('creator-courses')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'courses', filter: `creator_id=eq.${user.id}` },
        () => {
          fetchCreatorStats();
        }
      )
      .subscribe();
      
    // For events
    const eventsChannel = supabase
      .channel('creator-events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `creator_id=eq.${user.id}` },
        () => {
          fetchCreatorStats();
        }
      )
      .subscribe();
      
    // For enrollments
    const enrollmentsChannel = supabase
      .channel('creator-enrollments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'course_enrollments' },
        () => {
          fetchCreatorStats();
          fetchRecentActivity();
          fetchAnalyticsData();
        }
      )
      .subscribe();
      
    // For registrations
    const registrationsChannel = supabase
      .channel('creator-registrations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          fetchCreatorStats();
          fetchRecentActivity();
          fetchAnalyticsData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(registrationsChannel);
    };
  }, [user]);
  
  // Helper function to process data by month
  const processDataByMonth = (data: any[], type: string) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentYear = new Date().getFullYear();
    
    // Initialize counts for all months
    const monthlyCounts = months.map(month => ({
      name: month,
      [type]: 0
    }));
    
    // Count items by month (only for current year)
    data.forEach(item => {
      const date = new Date(item.enrollment_date || item.created_at);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        monthlyCounts[monthIndex][type]++;
      }
    });
    
    return monthlyCounts;
  };
  
  // Helper function to process revenue data by month
  const processRevenueByMonth = (registrations: any[]) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentYear = new Date().getFullYear();
    
    // Initialize revenue for all months
    const monthlyRevenue = months.map(month => ({
      name: month,
      revenue: 0
    }));
    
    // Summarize revenue by month (only for current year)
    registrations.forEach(item => {
      if (!item.event || !item.created_at) return;
      
      const date = new Date(item.created_at);
      if (date.getFullYear() === currentYear && !item.event.is_free) {
        const monthIndex = date.getMonth();
        // Convert price to number to ensure we're dealing with numeric values
        const price = typeof item.event.price === 'number' ? Number(item.event.price) : 0;
        
        // Fix: Ensure we're performing arithmetic on number types
        // Use explicit type conversion for both operands
        const currentRevenue = Number(monthlyRevenue[monthIndex].revenue);
        monthlyRevenue[monthIndex].revenue = currentRevenue + price;
      }
    });
    
    return monthlyRevenue;
  };
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  return (
    <CreatorLayout title="Creator Dashboard">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and events</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/creator/courses/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
          <Button asChild>
            <Link to="/creator/events/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{loading ? '-' : courseCount}</CardTitle>
            <p className="text-muted-foreground">Courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{loading ? '-' : eventCount}</CardTitle>
            <p className="text-muted-foreground">Events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{loading ? '-' : studentCount}</CardTitle>
            <p className="text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-2">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">${loading ? '-' : revenue.toFixed(2)}</CardTitle>
            <p className="text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>An overview of your recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                courseCount === 0 && eventCount === 0 ? (
                  <div className="bg-muted/20 rounded-md p-6 text-center">
                    <h3 className="font-medium text-lg mb-2">Get Started as a Creator</h3>
                    <p className="text-muted-foreground mb-4">You haven't created any courses or events yet. Get started by creating your first course or event.</p>
                    <div className="flex gap-2 justify-center">
                      <Button asChild>
                        <Link to="/creator/courses/create">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Course
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/creator/events/create">
                          <Calendar className="h-4 w-4 mr-2" />
                          Create Event
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6">
                    <p>No recent activity to display</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-start p-3 border-b last:border-0">
                        <div className="rounded-full bg-muted w-10 h-10 flex items-center justify-center mr-3">
                          {activity.type === 'enrollment' ? (
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            <span className="text-primary">{activity.user_name}</span> 
                            {activity.type === 'enrollment' ? ' enrolled in ' : ' registered for '}
                            <span className="font-medium">{activity.content_title}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        <Link 
                          to={activity.type === 'enrollment' ? `/creator/students` : `/creator/students`}
                          className="text-sm text-primary hover:underline"
                        >
                          View details
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Monthly enrollment data for the current year</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentData}>
                    <defs>
                      <linearGradient id="enrollmentFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.substring(0, 3)} 
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area 
                      type="monotone"
                      dataKey="enrollments"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#enrollmentFill)"
                      name="Enrollments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Monthly revenue data for the current year</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.substring(0, 3)} 
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#4c1d95" 
                      name="Revenue" 
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* View all students button */}
      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline">
          <Link to="/creator/students">
            <Users className="h-4 w-4 mr-2" />
            View All Students
          </Link>
        </Button>
      </div>
    </CreatorLayout>
  );
};

export default CreatorDashboard;
