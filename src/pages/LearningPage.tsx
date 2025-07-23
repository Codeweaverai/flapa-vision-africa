
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  PlayCircle,
  Award,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface CourseEnrollment {
  id: string;
  course_id: string;
  enrollment_date: string;
  payment_status: string;
  courses: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    category: string;
    difficulty_level: string;
    creator_id: string;
    certificate_enabled: boolean;
  };
}

interface CourseProgress {
  course_id: string;
  progress_percentage: number;
  last_accessed_lesson_id: string;
  updated_at: string;
}

interface WeeklyStats {
  lessonsCompleted: number;
  totalLearningHours: number;
  coursesInProgress: number;
  certificatesEarned: number;
}

const LearningPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    lessonsCompleted: 0,
    totalLearningHours: 0,
    coursesInProgress: 0,
    certificatesEarned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserLearningData();
    }
  }, [user]);

  const fetchUserLearningData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          enrollment_date,
          payment_status,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            category,
            difficulty_level,
            creator_id,
            certificate_enabled
          )
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .order('enrollment_date', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      setEnrollments(enrollmentsData || []);

      // Fetch course progress for all enrolled courses
      const courseIds = enrollmentsData?.map(e => e.course_id) || [];
      
      if (courseIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('course_progress')
          .select('course_id, progress_percentage, last_accessed_lesson_id, updated_at')
          .eq('user_id', user.id)
          .in('course_id', courseIds);

        if (progressError) throw progressError;

        const progressMap: Record<string, CourseProgress> = {};
        progressData?.forEach(progress => {
          progressMap[progress.course_id] = progress;
        });

        setCourseProgress(progressMap);
      }

      // Fetch weekly learning statistics
      await fetchWeeklyStats();

    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast.error('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    if (!user) return;

    try {
      // Get start and end of current week
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Get user's enrollments for lesson progress queries
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id, course_id')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed');

      const enrollmentIds = enrollments?.map(e => e.id) || [];

      if (enrollmentIds.length > 0) {
        // Fetch lessons completed this week
        const { data: weeklyLessons, error: lessonsError } = await supabase
          .from('lesson_progress')
          .select('id, completion_date, lessons(id)')
          .in('enrollment_id', enrollmentIds)
          .eq('is_completed', true)
          .gte('completion_date', startOfWeek.toISOString())
          .lte('completion_date', endOfWeek.toISOString());

        if (lessonsError) throw lessonsError;

        const lessonsCompleted = weeklyLessons?.length || 0;
        
        // Estimate learning hours (assuming average 10 minutes per lesson)
        const totalLearningHours = Math.round((lessonsCompleted * 10) / 60 * 10) / 10;

        // Count courses in progress
        const coursesInProgress = Object.values(courseProgress).filter(
          progress => progress.progress_percentage > 0 && progress.progress_percentage < 100
        ).length;

        // Count certificates earned this week
        const { data: certificates, error: certificatesError } = await supabase
          .from('certificates')
          .select('id')
          .eq('user_id', user.id)
          .gte('issue_date', startOfWeek.toISOString())
          .lte('issue_date', endOfWeek.toISOString());

        if (certificatesError) throw certificatesError;

        const certificatesEarned = certificates?.length || 0;

        setWeeklyStats({
          lessonsCompleted,
          totalLearningHours,
          coursesInProgress,
          certificatesEarned
        });
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getStatusBadge = (progress: number) => {
    if (progress === 0) return <Badge variant="outline">Not Started</Badge>;
    if (progress === 100) return <Badge className="bg-green-500">Completed</Badge>;
    return <Badge variant="secondary">In Progress</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your learning dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Learning Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and continue your learning journey</p>
        </div>

        {/* Weekly Learning Goals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Learning Goals
            </CardTitle>
            <CardDescription>Your progress for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3 mx-auto">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">{weeklyStats.lessonsCompleted}</h3>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3 mx-auto">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">{weeklyStats.totalLearningHours}h</h3>
                <p className="text-sm text-muted-foreground">Hours of Learning</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3 mx-auto">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">{weeklyStats.coursesInProgress}</h3>
                <p className="text-sm text-muted-foreground">Courses in Progress</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3 mx-auto">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-lg">{weeklyStats.certificatesEarned}</h3>
                <p className="text-sm text-muted-foreground">Certificates Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Courses */}
        <Tabs defaultValue="enrolled" className="space-y-6">
          <TabsList>
            <TabsTrigger value="enrolled">Enrolled Courses</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enrolled" className="space-y-4">
            {enrollments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No courses enrolled yet</h3>
                  <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course</p>
                  <Button asChild>
                    <Link to="/explore-courses">Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const progress = courseProgress[enrollment.course_id];
                  const progressPercentage = progress?.progress_percentage || 0;
                  
                  return (
                    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                              {enrollment.courses.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {enrollment.courses.category} • {enrollment.courses.difficulty_level}
                            </p>
                            {getStatusBadge(progressPercentage)}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button asChild className="flex-1">
                              <Link to={`/course/${enrollment.course_id}/learning`}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                {progressPercentage === 0 ? 'Start Learning' : 'Continue'}
                              </Link>
                            </Button>
                            
                            {progressPercentage === 100 && (
                              <Button variant="outline" asChild>
                                <Link to={`/course/${enrollment.course_id}/results`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments
                .filter(enrollment => {
                  const progress = courseProgress[enrollment.course_id];
                  return progress?.progress_percentage === 100;
                })
                .map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {enrollment.courses.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {enrollment.courses.category} • {enrollment.courses.difficulty_level}
                          </p>
                          <Badge className="bg-green-500">
                            <Trophy className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Progress value={100} className="h-2" />
                        <div className="flex gap-2">
                          <Button variant="outline" asChild className="flex-1">
                            <Link to={`/course/${enrollment.course_id}/learning`}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Review
                            </Link>
                          </Button>
                          <Button asChild>
                            <Link to={`/course/${enrollment.course_id}/results`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Results
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="certificates">
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Certificates</h3>
                <p className="text-muted-foreground">Your earned certificates will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LearningPage;
