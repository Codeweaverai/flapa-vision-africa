
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Users, BookOpen, Calendar, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import CreatorLayout from '@/components/creator/CreatorLayout';

// Fix the specific function causing the error
const calculateMonthlyRevenue = (enrollments: any[]) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize the monthly revenue with zeros for all months
  const monthlyRevenue = monthNames.map(name => ({ name, revenue: 0 }));
  
  if (!enrollments || enrollments.length === 0) {
    return monthlyRevenue;
  }
  
  enrollments.forEach(enrollment => {
    if (enrollment?.payment_status === 'completed' && enrollment?.course) {
      const enrollmentDate = new Date(enrollment.enrollment_date);
      const monthIndex = enrollmentDate.getMonth();
      const price = enrollment?.course?.price ? Number(enrollment.course.price) : 0;
      
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyRevenue[monthIndex] = {
          name: monthlyRevenue[monthIndex].name,
          revenue: Number(monthlyRevenue[monthIndex].revenue) + price
        };
      }
    }
  });
  
  return monthlyRevenue;
};

// Define interfaces for our state types
interface RevenueMetrics {
  totalRevenue: number;
  courseRevenue: number;
  eventRevenue: number;
  monthlyRevenue: Array<{name: string, revenue: number}>;
  revenueBySource: Array<{name: string, value: number}>;
}

interface EngagementMetrics {
  totalStudents: number;
  activeCourses: number;
  completionRate: number;
  studentEngagement: Array<{month: string, engagement: number}>;
}

const CreatorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [showRevenueBySource, setShowRevenueBySource] = useState(false);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    courseRevenue: 0,
    eventRevenue: 0,
    monthlyRevenue: [],
    revenueBySource: []
  });
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics>({
    totalStudents: 0,
    activeCourses: 0,
    completionRate: 0,
    studentEngagement: []
  });

  useEffect(() => {
    const fetchCreatorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: creatorData, error: creatorError } = await supabase.auth.getUser();
        
        if (creatorError) throw creatorError;
        
        const creatorId = creatorData.user?.id;
        
        // Fetch courses created by this creator
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('creator_id', creatorId);
        
        if (coursesError) throw coursesError;
        
        // Fetch enrollments for the creator's courses
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            course:courses(*)
          `)
          .in('course_id', coursesData?.map(course => course.id) || []);
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Fetch events created by this creator
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', creatorId);
        
        if (eventsError) throw eventsError;
        
        // Fetch registrations for the creator's events
        const { data: registrationsData, error: registrationsError } = await supabase
          .from('registrations')
          .select(`
            *,
            event:events(*)
          `)
          .in('event_id', eventsData?.map(event => event.id) || []);
        
        if (registrationsError) throw registrationsError;
        
        setCourses(coursesData || []);
        setEnrollments(enrollmentsData || []);
        setEvents(eventsData || []);
        setRegistrations(registrationsData || []);
        
        // Calculate revenue metrics
        calculateRevenueMetrics(enrollmentsData || [], registrationsData || []);
        
        // Calculate engagement metrics
        calculateEngagementMetrics(enrollmentsData || [], coursesData || []);
        
      } catch (err: any) {
        console.error('Error fetching creator data:', err.message);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreatorData();
  }, []);

  const calculateRevenueMetrics = (enrollments: any[], registrations: any[]) => {
    // Calculate total course revenue
    const courseRevenue = enrollments.reduce((total, enrollment) => {
      if (enrollment.payment_status === 'completed' && enrollment.course) {
        return total + (Number(enrollment.course.price) || 0);
      }
      return total;
    }, 0);
    
    // Calculate total event revenue
    const eventRevenue = registrations.reduce((total, registration) => {
      if (registration.payment_status === 'completed' && registration.event) {
        return total + (Number(registration.event.price) || 0);
      }
      return total;
    }, 0);
    
    // Calculate total revenue
    const totalRevenue = courseRevenue + eventRevenue;
    
    // Calculate monthly revenue
    const monthlyRevenue = calculateMonthlyRevenue(enrollments);
    
    // Calculate revenue by source
    const revenueBySource = [
      { name: 'Courses', value: courseRevenue },
      { name: 'Events', value: eventRevenue }
    ];
    
    setRevenueMetrics({
      totalRevenue,
      courseRevenue,
      eventRevenue,
      monthlyRevenue,
      revenueBySource
    });
  };

  const calculateEngagementMetrics = (enrollments: any[], courses: any[]) => {
    // Calculate total students (unique users enrolled)
    const uniqueStudentIds = new Set(enrollments.map(enrollment => enrollment.user_id));
    const totalStudents = uniqueStudentIds.size;
    
    // Calculate active courses (courses with at least one enrollment)
    const activeCourseIds = new Set(enrollments.map(enrollment => enrollment.course_id));
    const activeCourses = activeCourseIds.size;
    
    // Calculate completion rate
    const completedEnrollments = enrollments.filter(enrollment => enrollment.status === 'completed').length;
    const completionRate = enrollments.length > 0 
      ? (completedEnrollments / enrollments.length) * 100 
      : 0;
    
    // Sample student engagement data over time
    // In a real application, this would be calculated from actual user activity data
    const studentEngagement = [
      { month: 'Jan', engagement: 65 },
      { month: 'Feb', engagement: 59 },
      { month: 'Mar', engagement: 80 },
      { month: 'Apr', engagement: 81 },
      { month: 'May', engagement: 56 },
      { month: 'Jun', engagement: 55 },
      { month: 'Jul', engagement: 40 }
    ];
    
    setEngagementMetrics({
      totalStudents,
      activeCourses,
      completionRate,
      studentEngagement
    });
  };

  if (loading) {
    return (
      <CreatorLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard data...</p>
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">${revenueMetrics.totalRevenue.toFixed(2)}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-10 w-10 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3 className="text-2xl font-bold">{engagementMetrics.totalStudents}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-10 w-10 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Courses</p>
                <h3 className="text-2xl font-bold">{engagementMetrics.activeCourses}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-10 w-10 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <h3 className="text-2xl font-bold">{events.length}</h3>
              </div>
            </div>
          </Card>
        </div>
        
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueMetrics.monthlyRevenue}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Course Revenue</h3>
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <p className="text-3xl font-bold">${revenueMetrics.courseRevenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {
                      revenueMetrics.totalRevenue > 0 
                        ? `${((revenueMetrics.courseRevenue / revenueMetrics.totalRevenue) * 100).toFixed(1)}% of total`
                        : '0% of total'
                    }
                  </p>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Event Revenue</h3>
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <p className="text-3xl font-bold">${revenueMetrics.eventRevenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {
                      revenueMetrics.totalRevenue > 0
                        ? `${((revenueMetrics.eventRevenue / revenueMetrics.totalRevenue) * 100).toFixed(1)}% of total`
                        : '0% of total'
                    }
                  </p>
                </div>
              </Card>
            </div>
            
            <Collapsible 
              open={showRevenueBySource}
              onOpenChange={setShowRevenueBySource}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                  <ChevronDown className={`h-4 w-4 transition-transform ${showRevenueBySource ? 'transform rotate-180' : ''}`} />
                  <span className="font-medium">Revenue by Source</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Revenue by Source</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueMetrics.revenueBySource}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Revenue']}
                        />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Student Engagement</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={engagementMetrics.studentEngagement}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Course Completion Rate</h3>
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <p className="text-3xl font-bold">{engagementMetrics.completionRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Average completion rate</p>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Course Popularity</h3>
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <p className="text-3xl font-bold">{courses.length > 0 ? (enrollments.length / courses.length).toFixed(1) : '0'}</p>
                  <p className="text-sm text-muted-foreground">Avg. enrollments per course</p>
                </div>
              </Card>
            </div>
            
            <Collapsible 
              open={showDetailedAnalytics}
              onOpenChange={setShowDetailedAnalytics}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDetailedAnalytics ? 'transform rotate-180' : ''}`} />
                  <span className="font-medium">Detailed Analytics</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Analytics Controls</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Time Range</h4>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="time-week"
                            checked={selectedTimeRange === 'week'}
                            onCheckedChange={() => setSelectedTimeRange('week')}
                          />
                          <label htmlFor="time-week">Week</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="time-month"
                            checked={selectedTimeRange === 'month'}
                            onCheckedChange={() => setSelectedTimeRange('month')}
                          />
                          <label htmlFor="time-month">Month</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="time-year"
                            checked={selectedTimeRange === 'year'}
                            onCheckedChange={() => setSelectedTimeRange('year')}
                          />
                          <label htmlFor="time-year">Year</label>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Data Filters</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="filter-courses" />
                          <label htmlFor="filter-courses">Courses Only</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="filter-events" />
                          <label htmlFor="filter-events">Events Only</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="filter-paid" />
                          <label htmlFor="filter-paid">Paid Content Only</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="filter-free" />
                          <label htmlFor="filter-free">Free Content Only</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
};

export default CreatorDashboard;
