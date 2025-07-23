
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  BarChart3,
  User,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  creator_name: string;
  creator_avatar?: string;
  progress_percentage: number;
  enrollment_date: string;
  total_lessons: number;
  completed_lessons: number;
  duration_minutes: number;
  last_accessed_lesson_id?: string;
}

interface WeeklyLearningGoal {
  lessonsCompleted: number;
  hoursLearned: number;
  targetLessons: number;
  targetHours: number;
  weekStart: string;
  weekEnd: string;
}

interface LearningStats {
  totalCourses: number;
  totalLessonsCompleted: number;
  totalHoursLearned: number;
  averageProgress: number;
  coursesCompleted: number;
  currentStreak: number;
}

const LearningPage: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyLearningGoal>({
    lessonsCompleted: 0,
    hoursLearned: 0,
    targetLessons: 5,
    targetHours: 10,
    weekStart: '',
    weekEnd: ''
  });
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalCourses: 0,
    totalLessonsCompleted: 0,
    totalHoursLearned: 0,
    averageProgress: 0,
    coursesCompleted: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
      fetchWeeklyGoals();
      fetchLearningStats();
      
      // Set up real-time subscription for lesson progress
      const subscription = supabase
        .channel('lesson-progress-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lesson_progress'
        }, () => {
          // Refresh data when lesson progress changes
          fetchEnrolledCourses();
          fetchWeeklyGoals();
          fetchLearningStats();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const getWeekBoundaries = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
      start: startOfWeek.toISOString(),
      end: endOfWeek.toISOString()
    };
  };

  const fetchEnrolledCourses = async () => {
    if (!user) return;
    
    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          course_id,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            duration_minutes,
            creator_id,
            profiles:creator_id (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .order('enrollment_date', { ascending: false });

      if (error) throw error;

      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          const course = enrollment.courses;
          
          // Get course progress
          const { data: progress } = await supabase
            .from('course_progress')
            .select('progress_percentage, last_accessed_lesson_id')
            .eq('user_id', user.id)
            .eq('course_id', course.id)
            .maybeSingle();

          // Get lesson counts
          const { data: lessons } = await supabase
            .from('lessons')
            .select(`
              id,
              course_modules!inner (
                course_id
              )
            `)
            .eq('course_modules.course_id', course.id);

          // Get completed lessons count
          const { data: completedLessons } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('enrollment_id', enrollment.id)
            .eq('is_completed', true);

          const totalLessons = lessons?.length || 0;
          const completed = completedLessons?.length || 0;

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            creator_name: course.profiles?.full_name || 'Unknown',
            creator_avatar: course.profiles?.avatar_url,
            progress_percentage: progress?.progress_percentage || 0,
            enrollment_date: enrollment.enrollment_date,
            total_lessons: totalLessons,
            completed_lessons: completed,
            duration_minutes: course.duration_minutes || 0,
            last_accessed_lesson_id: progress?.last_accessed_lesson_id
          };
        })
      );

      setEnrolledCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyGoals = async () => {
    if (!user) return;
    
    try {
      const { start, end } = getWeekBoundaries();
      
      // Get lessons completed this week
      const { data: weeklyLessons } = await supabase
        .from('lesson_progress')
        .select(`
          lesson_id,
          completion_date,
          course_enrollments!inner (
            user_id,
            course_id,
            courses (
              duration_minutes
            )
          ),
          lessons!inner (
            duration_minutes
          )
        `)
        .eq('course_enrollments.user_id', user.id)
        .eq('is_completed', true)
        .gte('completion_date', start)
        .lte('completion_date', end);

      const lessonsCompleted = weeklyLessons?.length || 0;
      
      // Calculate total hours learned this week
      const totalMinutes = weeklyLessons?.reduce((total, lesson) => {
        const lessonMinutes = lesson.lessons?.duration_minutes || 0;
        return total + lessonMinutes;
      }, 0) || 0;
      
      const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

      setWeeklyGoals({
        lessonsCompleted,
        hoursLearned,
        targetLessons: 5,
        targetHours: 10,
        weekStart: start,
        weekEnd: end
      });
    } catch (error) {
      console.error('Error fetching weekly goals:', error);
    }
  };

  const fetchLearningStats = async () => {
    if (!user) return;
    
    try {
      // Get total courses enrolled
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id, course_id')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed');

      const totalCourses = enrollments?.length || 0;

      // Get total lessons completed
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select(`
          lesson_id,
          course_enrollments!inner (
            user_id
          ),
          lessons!inner (
            duration_minutes
          )
        `)
        .eq('course_enrollments.user_id', user.id)
        .eq('is_completed', true);

      const totalLessonsCompleted = completedLessons?.length || 0;
      
      // Calculate total hours learned
      const totalMinutes = completedLessons?.reduce((total, lesson) => {
        const lessonMinutes = lesson.lessons?.duration_minutes || 0;
        return total + lessonMinutes;
      }, 0) || 0;
      
      const totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

      // Get average progress
      const { data: courseProgress } = await supabase
        .from('course_progress')
        .select('progress_percentage')
        .eq('user_id', user.id);

      const averageProgress = courseProgress?.length > 0 
        ? Math.round(courseProgress.reduce((sum, progress) => sum + progress.progress_percentage, 0) / courseProgress.length)
        : 0;

      // Count completed courses (100% progress)
      const coursesCompleted = courseProgress?.filter(p => p.progress_percentage === 100).length || 0;

      setLearningStats({
        totalCourses,
        totalLessonsCompleted,
        totalHoursLearned,
        averageProgress,
        coursesCompleted,
        currentStreak: 0 // Can be calculated based on consecutive learning days
      });
    } catch (error) {
      console.error('Error fetching learning stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex justify-center items-center py-16">
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
          <h1 className="text-3xl font-bold mb-2">My Learning</h1>
          <p className="text-muted-foreground">
            Track your progress and continue your learning journey
          </p>
        </div>

        {/* Weekly Learning Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Weekly Lessons Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 mb-2">
                {weeklyGoals.lessonsCompleted}/{weeklyGoals.targetLessons}
              </div>
              <Progress 
                value={(weeklyGoals.lessonsCompleted / weeklyGoals.targetLessons) * 100} 
                className="h-2 mb-2"
              />
              <p className="text-xs text-orange-700">
                {weeklyGoals.lessonsCompleted >= weeklyGoals.targetLessons 
                  ? '🎉 Goal achieved!' 
                  : `${weeklyGoals.targetLessons - weeklyGoals.lessonsCompleted} more to go`
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Weekly Hours Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 mb-2">
                {weeklyGoals.hoursLearned}h/{weeklyGoals.targetHours}h
              </div>
              <Progress 
                value={(weeklyGoals.hoursLearned / weeklyGoals.targetHours) * 100} 
                className="h-2 mb-2"
              />
              <p className="text-xs text-purple-700">
                {weeklyGoals.hoursLearned >= weeklyGoals.targetHours 
                  ? '🎉 Goal achieved!' 
                  : `${(weeklyGoals.targetHours - weeklyGoals.hoursLearned).toFixed(1)}h more to go`
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {learningStats.totalCourses}
              </div>
              <p className="text-xs text-blue-700">
                {learningStats.coursesCompleted} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 mb-2">
                {learningStats.averageProgress}%
              </div>
              <p className="text-xs text-green-700">
                {learningStats.totalLessonsCompleted} lessons completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Learning Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                This Week's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lessons Completed</span>
                  <span className="font-semibold text-green-600">{weeklyGoals.lessonsCompleted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hours Learned</span>
                  <span className="font-semibold text-blue-600">{weeklyGoals.hoursLearned}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Goal Achievement</span>
                  <span className="font-semibold text-orange-600">
                    {Math.round(((weeklyGoals.lessonsCompleted / weeklyGoals.targetLessons) + 
                    (weeklyGoals.hoursLearned / weeklyGoals.targetHours)) / 2 * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                All Time Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Lessons</span>
                  <span className="font-semibold">{learningStats.totalLessonsCompleted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Hours</span>
                  <span className="font-semibold">{learningStats.totalHoursLearned}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Courses Completed</span>
                  <span className="font-semibold">{learningStats.coursesCompleted}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Week Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Week Start</span>
                  <span className="font-semibold">{formatDate(weeklyGoals.weekStart)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Week End</span>
                  <span className="font-semibold">{formatDate(weeklyGoals.weekEnd)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Days Remaining</span>
                  <span className="font-semibold text-orange-600">
                    {Math.ceil((new Date(weeklyGoals.weekEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {enrolledCourses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your learning journey by enrolling in some courses
                  </p>
                  <Button asChild>
                    <Link to="/explore-courses">
                      Explore Courses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <Card key={course.id} className="group hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={course.creator_avatar} />
                          <AvatarFallback className="text-xs">
                            {course.creator_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{course.creator_name}</span>
                      </div>
                      
                      <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{course.completed_lessons}/{course.total_lessons}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.round(course.duration_minutes / 60)}h</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-medium">{course.progress_percentage}%</span>
                        </div>
                        <Progress 
                          value={course.progress_percentage} 
                          className={`h-2 ${getProgressColor(course.progress_percentage)}`}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button asChild className="flex-1" size="sm">
                          <Link to={`/course/${course.id}/learn`}>
                            <Play className="h-4 w-4 mr-2" />
                            Continue Learning
                          </Link>
                        </Button>
                        
                        {course.progress_percentage === 100 && (
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/course/${course.id}/results`}>
                              <Award className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Course Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{course.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={course.progress_percentage} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground min-w-[40px]">
                              {course.progress_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Learning Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">Lessons Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {learningStats.totalLessonsCompleted} lessons finished
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">Hours Learned</p>
                        <p className="text-xs text-muted-foreground">
                          {learningStats.totalHoursLearned} hours of content
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Star className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-sm">Courses Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {learningStats.coursesCompleted} courses finished
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LearningPage;
