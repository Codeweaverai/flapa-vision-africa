
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Award,
  Play,
  UserCheck
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import AdminLayout from '@/components/layout/AdminLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEvents: number;
  totalRevenue: number;
  activeEnrollments: number;
  completedCourses: number;
  recentRegistrations: number;
  certificatesIssued: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEvents: 0,
    totalRevenue: 0,
    activeEnrollments: 0,
    completedCourses: 0,
    recentRegistrations: 0,
    certificatesIssued: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });

      // Fetch events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact' });

      // Fetch active enrollments
      const { count: enrollmentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact' })
        .eq('payment_status', 'completed');

      // Fetch completed courses
      const { count: completedCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact' })
        .eq('is_completed', true);

      // Fetch certificates issued
      const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact' });

      // Fetch recent registrations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentRegs } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calculate total revenue (mock data for now)
      const totalRevenue = (enrollmentsCount || 0) * 50; // Placeholder calculation

      setStats({
        totalUsers: usersCount || 0,
        totalCourses: coursesCount || 0,
        totalEvents: eventsCount || 0,
        totalRevenue,
        activeEnrollments: enrollmentsCount || 0,
        completedCourses: completedCount || 0,
        recentRegistrations: recentRegs || 0,
        certificatesIssued: certificatesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const enrollmentData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Course Enrollments',
        data: [65, 78, 90, 81, 95, 120],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const courseCompletionData = {
    labels: ['Technology', 'Business', 'Design', 'Marketing', 'Photography'],
    datasets: [
      {
        label: 'Completions',
        data: [85, 72, 68, 91, 45],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(249, 115, 22, 0.4)',
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const userEngagementData = {
    labels: ['Active Users', 'Inactive Users', 'New Users'],
    datasets: [
      {
        data: [stats.activeEnrollments, stats.totalUsers - stats.activeEnrollments, stats.recentRegistrations],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.6)',
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-8 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Monitor and manage your learning platform</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Users</CardTitle>
                <Users className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs opacity-80 mt-1">
                  +{stats.recentRegistrations} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Active Courses</CardTitle>
                <BookOpen className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs opacity-80 mt-1">
                  {stats.activeEnrollments} active enrollments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-400 to-purple-500 text-white border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Events</CardTitle>
                <Calendar className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs opacity-80 mt-1">
                  Learning opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-400 to-orange-500 text-white border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Revenue</CardTitle>
                <DollarSign className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${stats.totalRevenue}</div>
                <p className="text-xs opacity-80 mt-1">
                  Total platform revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Course Completions</CardTitle>
                <Award className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.completedCourses}</div>
                <Progress value={(stats.completedCourses / stats.activeEnrollments) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Certificates Issued</CardTitle>
                <UserCheck className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.certificatesIssued}</div>
                <Progress value={(stats.certificatesIssued / stats.completedCourses) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {((stats.activeEnrollments / stats.totalUsers) * 100).toFixed(1)}%
                </div>
                <Progress value={(stats.activeEnrollments / stats.totalUsers) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                <Play className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {((stats.completedCourses / stats.activeEnrollments) * 100).toFixed(1)}%
                </div>
                <Progress value={(stats.completedCourses / stats.activeEnrollments) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Enrollment Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Line data={enrollmentData} options={chartOptions} />
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Course Completions by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={courseCompletionData} options={chartOptions} />
              </CardContent>
            </Card>
          </div>

          {/* User Engagement Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Doughnut data={userEngagementData} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Badge variant="outline" className="p-4 cursor-pointer hover:bg-orange-50 border-orange-200">
                    <Users className="h-4 w-4 mr-2 text-orange-600" />
                    Manage Users
                  </Badge>
                  <Badge variant="outline" className="p-4 cursor-pointer hover:bg-purple-50 border-purple-200">
                    <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
                    Review Courses
                  </Badge>
                  <Badge variant="outline" className="p-4 cursor-pointer hover:bg-orange-50 border-orange-200">
                    <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                    Event Management
                  </Badge>
                  <Badge variant="outline" className="p-4 cursor-pointer hover:bg-purple-50 border-purple-200">
                    <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                    Revenue Reports
                  </Badge>
                  <Badge variant="outline" className="p-4 cursor-pointer hover:bg-orange-50 border-orange-200">
                    <Award className="h-4 w-4 mr-2 text-orange-600" />
                    Certificates
                  </Badge>
                  <Badge variant="outline" className="p-4 cursor-pointer hover:bg-purple-50 border-purple-200">
                    <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                    Analytics
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
