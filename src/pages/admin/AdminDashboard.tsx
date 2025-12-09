import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Award,
  Play,
  UserCheck,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';

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

interface EmbeddingsStatus {
  courses: {
    total: number;
    with_embeddings: number;
    remaining: number;
  };
  events: {
    total: number;
    with_embeddings: number;
    remaining: number;
  };
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
  
  const [embeddingsStatus, setEmbeddingsStatus] = useState<EmbeddingsStatus>({
    courses: { total: 0, with_embeddings: 0, remaining: 0 },
    events: { total: 0, with_embeddings: 0, remaining: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [generatingCourseEmbeddings, setGeneratingCourseEmbeddings] = useState(false);
  const [generatingEventEmbeddings, setGeneratingEventEmbeddings] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    checkEmbeddingsStatus();
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
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const checkEmbeddingsStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // Call your edge function to check embeddings status
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check_status' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEmbeddingsStatus(result.data);
        toast.success('Embeddings status updated');
      } else {
        toast.error(result.error || 'Failed to check embeddings status');
      }
    } catch (error) {
      console.error('Error checking embeddings status:', error);
      toast.error('Failed to check embeddings status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const generateCourseEmbeddings = async () => {
    try {
      setGeneratingCourseEmbeddings(true);
      
      toast.info('Starting course embeddings generation...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'generate_course_embeddings',
          batchSize: 20 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.processed} course embeddings`);
        // Refresh status after generation
        await checkEmbeddingsStatus();
      } else {
        toast.error(result.error || 'Failed to generate course embeddings');
      }
    } catch (error) {
      console.error('Error generating course embeddings:', error);
      toast.error('Failed to generate course embeddings');
    } finally {
      setGeneratingCourseEmbeddings(false);
    }
  };

  const generateEventEmbeddings = async () => {
    try {
      setGeneratingEventEmbeddings(true);
      
      toast.info('Starting event embeddings generation...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'generate_event_embeddings',
          batchSize: 20 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.processed} event embeddings`);
        // Refresh status after generation
        await checkEmbeddingsStatus();
      } else {
        toast.error(result.error || 'Failed to generate event embeddings');
      }
    } catch (error) {
      console.error('Error generating event embeddings:', error);
      toast.error('Failed to generate event embeddings');
    } finally {
      setGeneratingEventEmbeddings(false);
    }
  };

  const enrollmentData = [
    { name: 'Jan', enrollments: 65 },
    { name: 'Feb', enrollments: 78 },
    { name: 'Mar', enrollments: 90 },
    { name: 'Apr', enrollments: 81 },
    { name: 'May', enrollments: 95 },
    { name: 'Jun', enrollments: 120 },
  ];

  const courseCompletionData = [
    { category: 'Technology', completions: 85 },
    { category: 'Business', completions: 72 },
    { category: 'Design', completions: 68 },
    { category: 'Marketing', completions: 91 },
    { category: 'Photography', completions: 45 },
  ];

  const userEngagementData = [
    { name: 'Active Users', value: stats.activeEnrollments, color: '#f97316' },
    { name: 'Inactive Users', value: stats.totalUsers - stats.activeEnrollments, color: '#a855f7' },
    { name: 'New Users', value: stats.recentRegistrations, color: '#fb923c' },
  ];

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

          {/* AI Embeddings Section */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                <Sparkles className="h-5 w-5" />
                AI Embeddings Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Generate AI embeddings for semantic search and recommendations
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Course Embeddings Status */}
                <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">Course Embeddings</h3>
                    </div>
                    {embeddingsStatus.courses.remaining === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Courses:</span>
                      <span className="font-medium">{embeddingsStatus.courses.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">With Embeddings:</span>
                      <span className="font-medium text-green-600">{embeddingsStatus.courses.with_embeddings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className={`font-medium ${embeddingsStatus.courses.remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {embeddingsStatus.courses.remaining}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(embeddingsStatus.courses.with_embeddings / embeddingsStatus.courses.total) * 100} 
                    className="h-2"
                  />
                  <Button
                    onClick={generateCourseEmbeddings}
                    disabled={generatingCourseEmbeddings || embeddingsStatus.courses.remaining === 0}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {generatingCourseEmbeddings ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Course Embeddings
                      </>
                    )}
                  </Button>
                </div>

                {/* Event Embeddings Status */}
                <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Event Embeddings</h3>
                    </div>
                    {embeddingsStatus.events.remaining === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Events:</span>
                      <span className="font-medium">{embeddingsStatus.events.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">With Embeddings:</span>
                      <span className="font-medium text-green-600">{embeddingsStatus.events.with_embeddings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className={`font-medium ${embeddingsStatus.events.remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {embeddingsStatus.events.remaining}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(embeddingsStatus.events.with_embeddings / embeddingsStatus.events.total) * 100} 
                    className="h-2"
                  />
                  <Button
                    onClick={generateEventEmbeddings}
                    disabled={generatingEventEmbeddings || embeddingsStatus.events.remaining === 0}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  >
                    {generatingEventEmbeddings ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Event Embeddings
                      </>
                    )}
                  </Button>
                </div>

                {/* Status Summary Card */}
                <div className="lg:col-span-2 space-y-4 p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">Embeddings Summary</h3>
                      <p className="text-indigo-100 text-sm mt-1">
                        AI-powered semantic search readiness
                      </p>
                    </div>
                    <Button
                      onClick={checkEmbeddingsStatus}
                      disabled={checkingStatus}
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      {checkingStatus ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {((embeddingsStatus.courses.with_embeddings / embeddingsStatus.courses.total) * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-indigo-200">Course Coverage</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {((embeddingsStatus.events.with_embeddings / embeddingsStatus.events.total) * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-indigo-200">Event Coverage</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm text-indigo-200">
                      Total Items to Process: <span className="font-semibold text-white">
                        {embeddingsStatus.courses.remaining + embeddingsStatus.events.remaining}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Course Completions by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={courseCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completions" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userEngagementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userEngagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
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
