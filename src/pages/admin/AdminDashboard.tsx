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
  AlertCircle,
  Cpu,
  Database,
  Zap,
  Server
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

const EMBEDDINGS_ENDPOINT = 'https://rxqoczksnddbxcdwobnw.supabase.co/functions/v1/generate-embeddings-';

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
  const [operationLogs, setOperationLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    checkEmbeddingsStatus();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOperationLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

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
      addLog('Checking embeddings status...');
      
      // Add authentication headers
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(EMBEDDINGS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action: 'check_status' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEmbeddingsStatus(result.data);
        toast.success('Embeddings status updated');
        addLog(`Status updated: ${result.data.courses.with_embeddings} course embeddings, ${result.data.events.with_embeddings} event embeddings`);
      } else {
        toast.error(result.error || 'Failed to check embeddings status');
        addLog(`Error: ${result.error || 'Failed to check status'}`);
      }
    } catch (error: any) {
      console.error('Error checking embeddings status:', error);
      toast.error('Failed to check embeddings status');
      addLog(`Error: ${error.message}`);
    } finally {
      setCheckingStatus(false);
    }
  };

  const generateCourseEmbeddings = async () => {
    try {
      setGeneratingCourseEmbeddings(true);
      addLog('Starting course embeddings generation...');
      
      toast.info('Starting course embeddings generation...');
      
      // Add authentication headers
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(EMBEDDINGS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ 
          action: 'generate_course_embeddings',
          batchSize: 10 // Reduced for safety
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.processed} course embeddings`);
        addLog(`Generated ${result.processed} course embeddings, ${result.errors} errors`);
        // Refresh status after generation
        await checkEmbeddingsStatus();
      } else {
        toast.error(result.error || 'Failed to generate course embeddings');
        addLog(`Error: ${result.error || 'Failed to generate'}`);
      }
    } catch (error: any) {
      console.error('Error generating course embeddings:', error);
      toast.error('Failed to generate course embeddings');
      addLog(`Error: ${error.message}`);
    } finally {
      setGeneratingCourseEmbeddings(false);
    }
  };

  const generateEventEmbeddings = async () => {
    try {
      setGeneratingEventEmbeddings(true);
      addLog('Starting event embeddings generation...');
      
      toast.info('Starting event embeddings generation...');
      
      // Add authentication headers
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(EMBEDDINGS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ 
          action: 'generate_event_embeddings',
          batchSize: 10 // Reduced for safety
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.processed} event embeddings`);
        addLog(`Generated ${result.processed} event embeddings, ${result.errors} errors`);
        // Refresh status after generation
        await checkEmbeddingsStatus();
      } else {
        toast.error(result.error || 'Failed to generate event embeddings');
        addLog(`Error: ${result.error || 'Failed to generate'}`);
      }
    } catch (error: any) {
      console.error('Error generating event embeddings:', error);
      toast.error('Failed to generate event embeddings');
      addLog(`Error: ${error.message}`);
    } finally {
      setGeneratingEventEmbeddings(false);
    }
  };

  const generateAllEmbeddings = async () => {
    try {
      addLog('Starting all embeddings generation...');
      toast.info('Starting all embeddings generation...');
      
      // Generate course embeddings first
      await generateCourseEmbeddings();
      
      // Then generate event embeddings
      await generateEventEmbeddings();
      
      toast.success('All embeddings generation completed');
      addLog('All embeddings generation completed');
    } catch (error: any) {
      console.error('Error generating all embeddings:', error);
      toast.error('Failed to generate all embeddings');
      addLog(`Error: ${error.message}`);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="space-y-8 p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">Monitor and manage your learning platform</p>
              </div>
              <Button
                onClick={checkEmbeddingsStatus}
                disabled={checkingStatus}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                {checkingStatus ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh All
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500', trend: `+${stats.recentRegistrations} this week` },
              { icon: BookOpen, label: 'Active Courses', value: stats.totalCourses, color: 'bg-emerald-500', trend: `${stats.activeEnrollments} enrollments` },
              { icon: Calendar, label: 'Total Events', value: stats.totalEvents, color: 'bg-violet-500', trend: 'Learning opportunities' },
              { icon: DollarSign, label: 'Revenue', value: `$${stats.totalRevenue}`, color: 'bg-amber-500', trend: 'Total revenue' },
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-xl text-white`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Embeddings Management - Modern Redesign */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Cpu className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">AI Embeddings Management</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Generate embeddings for semantic search and recommendations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    OpenAI API
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    text-embedding-3-small
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Courses</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      embeddingsStatus.courses.remaining === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {embeddingsStatus.courses.remaining === 0 ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Coverage</span>
                      <span className="font-bold text-gray-900">
                        {embeddingsStatus.courses.total > 0 
                          ? ((embeddingsStatus.courses.with_embeddings / embeddingsStatus.courses.total) * 100).toFixed(0)
                          : '0'}%
                      </span>
                    </div>
                    <Progress 
                      value={(embeddingsStatus.courses.with_embeddings / Math.max(embeddingsStatus.courses.total, 1)) * 100} 
                      className="h-2"
                    />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <div className="font-bold text-blue-600">{embeddingsStatus.courses.with_embeddings}</div>
                        <div className="text-xs text-gray-500">Processed</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <div className={`font-bold ${
                          embeddingsStatus.courses.remaining > 0 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {embeddingsStatus.courses.remaining}
                        </div>
                        <div className="text-xs text-gray-500">Remaining</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Events</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      embeddingsStatus.events.remaining === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {embeddingsStatus.events.remaining === 0 ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Coverage</span>
                      <span className="font-bold text-gray-900">
                        {embeddingsStatus.events.total > 0 
                          ? ((embeddingsStatus.events.with_embeddings / embeddingsStatus.events.total) * 100).toFixed(0)
                          : '0'}%
                      </span>
                    </div>
                    <Progress 
                      value={(embeddingsStatus.events.with_embeddings / Math.max(embeddingsStatus.events.total, 1)) * 100} 
                      className="h-2"
                    />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <div className="font-bold text-purple-600">{embeddingsStatus.events.with_embeddings}</div>
                        <div className="text-xs text-gray-500">Processed</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <div className={`font-bold ${
                          embeddingsStatus.events.remaining > 0 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {embeddingsStatus.events.remaining}
                        </div>
                        <div className="text-xs text-gray-500">Remaining</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 md:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Operations</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={checkEmbeddingsStatus}
                        disabled={checkingStatus}
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                      >
                        {checkingStatus ? (
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-2" />
                        )}
                        Status
                      </Button>
                      <Button
                        onClick={generateAllEmbeddings}
                        disabled={generatingCourseEmbeddings || generatingEventEmbeddings}
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        <Zap className="h-3 w-3 mr-2" />
                        Generate All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={generateCourseEmbeddings}
                        disabled={generatingCourseEmbeddings || embeddingsStatus.courses.remaining === 0}
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        {generatingCourseEmbeddings ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-3 w-3 mr-2" />
                            Generate Courses
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={generateEventEmbeddings}
                        disabled={generatingEventEmbeddings || embeddingsStatus.events.remaining === 0}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        {generatingEventEmbeddings ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 mr-2" />
                            Generate Events
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Operation Logs */}
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-700 mb-2">Recent Operations</p>
                      <div className="space-y-1">
                        {operationLogs.length > 0 ? (
                          operationLogs.map((log, idx) => (
                            <div key={idx} className="text-xs text-gray-600 font-mono">
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 italic">No operations yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Items</p>
                      <p className="text-xl font-bold text-gray-900">
                        {embeddingsStatus.courses.total + embeddingsStatus.events.total}
                      </p>
                    </div>
                    <Database className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">With Embeddings</p>
                      <p className="text-xl font-bold text-green-600">
                        {embeddingsStatus.courses.with_embeddings + embeddingsStatus.events.with_embeddings}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">To Process</p>
                      <p className={`text-xl font-bold ${
                        (embeddingsStatus.courses.remaining + embeddingsStatus.events.remaining) > 0 
                          ? 'text-amber-600' 
                          : 'text-green-600'
                      }`}>
                        {embeddingsStatus.courses.remaining + embeddingsStatus.events.remaining}
                      </p>
                    </div>
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Enrollment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Course Completions by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={courseCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="completions" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                      activeBar={{ fill: '#7c3aed', stroke: '#7c3aed', strokeWidth: 1 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { icon: Users, label: 'Manage Users', color: 'bg-blue-500' },
                  { icon: BookOpen, label: 'Courses', color: 'bg-emerald-500' },
                  { icon: Calendar, label: 'Events', color: 'bg-violet-500' },
                  { icon: DollarSign, label: 'Revenue', color: 'bg-amber-500' },
                  { icon: Award, label: 'Certificates', color: 'bg-rose-500' },
                  { icon: TrendingUp, label: 'Analytics', color: 'bg-indigo-500' },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-200`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
