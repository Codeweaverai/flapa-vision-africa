
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Star,
  Eye,
  Download,
  Clock,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  totalEvents: number;
  courseEnrollments: any[];
  eventRegistrations: any[];
  recentActivity: any[];
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    totalEvents: 0,
    courseEnrollments: [],
    eventRegistrations: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses count
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user?.id);

      if (coursesError) throw coursesError;

      // Fetch events count
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user?.id);

      if (eventsError) throw eventsError;

      // Fetch course enrollments with course details
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!inner(title, price, is_free, creator_id)
        `)
        .eq('courses.creator_id', user?.id)
        .eq('payment_status', 'completed');

      if (enrollmentsError) throw enrollmentsError;

      // Fetch event registrations with event details
      const { data: registrations, error: registrationsError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events!inner(title, price, is_free, creator_id)
        `)
        .eq('events.creator_id', user?.id)
        .eq('payment_status', 'completed');

      if (registrationsError) throw registrationsError;

      // Calculate total revenue
      const courseRevenue = enrollments?.reduce((sum, enrollment) => {
        return sum + (enrollment.courses?.is_free ? 0 : enrollment.courses?.price || 0);
      }, 0) || 0;

      const eventRevenue = registrations?.reduce((sum, registration) => {
        return sum + (registration.events?.is_free ? 0 : registration.events?.price || 0);
      }, 0) || 0;

      const totalRevenue = courseRevenue + eventRevenue;

      // Get unique students
      const uniqueStudents = new Set([
        ...(enrollments?.map(e => e.user_id) || []),
        ...(registrations?.map(r => r.user_id) || [])
      ]);

      setStats({
        totalCourses: courses?.length || 0,
        totalStudents: uniqueStudents.size,
        totalRevenue,
        totalEvents: events?.length || 0,
        courseEnrollments: enrollments || [],
        eventRegistrations: registrations || [],
        recentActivity: [
          ...(enrollments?.slice(-5) || []).map(e => ({
            type: 'course_enrollment',
            title: e.courses?.title,
            date: e.created_at,
            amount: e.courses?.is_free ? 0 : e.courses?.price
          })),
          ...(registrations?.slice(-5) || []).map(r => ({
            type: 'event_registration',
            title: r.events?.title,
            date: r.created_at,
            amount: r.events?.is_free ? 0 : r.events?.price
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your content and earnings.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <PriceDisplay amount={stats.totalRevenue} originalCurrency="USD" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-3 ${
                            activity.type === 'course_enrollment' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {activity.type === 'course_enrollment' ? (
                              <BookOpen className="h-4 w-4" />
                            ) : (
                              <Calendar className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-500">
                              {activity.type === 'course_enrollment' ? 'Course enrollment' : 'Event registration'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {activity.amount > 0 ? (
                              <PriceDisplay amount={activity.amount} originalCurrency="USD" />
                            ) : (
                              'Free'
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(activity.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                  <Link to="/creator/courses/create">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create New Course
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/creator/events/create">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create New Event
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/creator/analytics">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/creator/payments">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Payments
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Course Performance */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.courseEnrollments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No enrollments yet</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Enrollments</span>
                      <span className="font-semibold">{stats.courseEnrollments.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Course Revenue</span>
                      <span className="font-semibold">
                        <PriceDisplay 
                          amount={stats.courseEnrollments.reduce((sum, e) => sum + (e.courses?.is_free ? 0 : e.courses?.price || 0), 0)} 
                          originalCurrency="USD" 
                        />
                      </span>
                    </div>
                    <Progress 
                      value={(stats.courseEnrollments.length / Math.max(stats.totalCourses * 10, 1)) * 100} 
                      className="h-2" 
                    />
                    <p className="text-xs text-gray-500">
                      Average {Math.round(stats.courseEnrollments.length / Math.max(stats.totalCourses, 1))} enrollments per course
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatorDashboard;
