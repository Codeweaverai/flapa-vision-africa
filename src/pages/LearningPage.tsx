
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  Target,
  Calendar,
  CheckCircle,
  Play,
  Users,
  Star,
  BarChart3
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  difficulty_level: string;
  is_free: boolean;
  price: number;
  creator_id: string;
}

interface Enrollment {
  id: string;
  enrollment_date: string;
  is_completed: boolean;
  completion_date: string | null;
  course: Course;
}

const LearningPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    lessonsCompleted: 0,
    hoursLearned: 0,
    targetLessons: 10,
    targetHours: 5
  });

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  useEffect(() => {
    if (user && enrollments.length > 0) {
      fetchWeeklyStats();
      
      // Set up real-time subscription for lesson progress
      const channel = supabase
        .channel('lesson-progress-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lesson_progress',
            filter: `enrollment_id=in.(${enrollments.map(e => e.id).join(',')})`
          },
          () => {
            fetchWeeklyStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, enrollments]);

  const fetchEnrollments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          is_completed,
          completion_date,
          courses!inner (
            id,
            title,
            description,
            thumbnail_url,
            category,
            difficulty_level,
            is_free,
            price,
            creator_id,
            profiles!courses_creator_id_fkey (
              first_name,
              last_name,
              profile_picture_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    if (!user || enrollments.length === 0) return;

    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const enrollmentIds = enrollments.map(e => e.id);

      if (enrollmentIds.length === 0) return;

      // Fetch lessons completed this week
      const { data: completedLessons, error: lessonsError } = await supabase
        .from('lesson_progress')
        .select(`
          id,
          lesson_id,
          is_completed,
          completion_date,
          lessons!inner (
            id,
            title,
            module_id,
            course_modules!inner (
              course_id
            )
          )
        `)
        .in('enrollment_id', enrollmentIds)
        .eq('is_completed', true)
        .gte('completion_date', startOfWeek.toISOString())
        .lte('completion_date', endOfWeek.toISOString());

      if (lessonsError) {
        console.error('Error fetching weekly lessons:', lessonsError);
        return;
      }

      // Calculate total hours learned this week
      // Since duration_minutes doesn't exist, we'll estimate based on number of lessons
      // Assume each lesson is approximately 30 minutes on average
      const totalMinutes = (completedLessons?.length || 0) * 30;
      const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

      setWeeklyStats({
        lessonsCompleted: completedLessons?.length || 0,
        hoursLearned,
        targetLessons: 10,
        targetHours: 5
      });

    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const getCourseProgress = (enrollment: any) => {
    // This would need to be calculated based on lesson progress
    // For now, returning a placeholder
    return enrollment.is_completed ? 100 : 0;
  };

  const getNextLesson = (enrollment: any) => {
    // This would need to be calculated based on lesson progress
    // For now, returning a placeholder
    return enrollment.is_completed ? null : 'Continue Learning';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your learning journey...</p>
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
          <p className="text-muted-foreground">Continue your educational journey</p>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="goals">Weekly Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  {enrollment.courses?.thumbnail_url && (
                    <img
                      src={enrollment.courses.thumbnail_url}
                      alt={enrollment.courses.title}
                      className="w-full h-40 object-cover rounded-md mb-4"
                    />
                  )}
                  <CardHeader>
                    <CardTitle>{enrollment.courses?.title}</CardTitle>
                    <CardDescription>
                      {enrollment.courses?.profiles?.first_name}{' '}
                      {enrollment.courses?.profiles?.last_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span>{enrollment.courses?.category}</span>
                      </div>
                      <Badge variant="secondary">
                        {enrollment.courses?.difficulty_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.courses?.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {enrollment.is_completed ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>In Progress</span>
                          </>
                        )}
                      </div>
                      {enrollment.courses?.is_free ? (
                        <Badge>Free</Badge>
                      ) : (
                        <span>${enrollment.courses?.price}</span>
                      )}
                    </div>
                    <Button
                      asChild
                      className="w-full"
                      variant={enrollment.is_completed ? 'secondary' : 'default'}
                    >
                      <Link to={`/course/${enrollment.courses?.id}`}>
                        {enrollment.is_completed ? 'View Certificate' : 'Continue Learning'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <CardTitle>{enrollment.courses?.title}</CardTitle>
                    <CardDescription>
                      {enrollment.is_completed
                        ? 'Course Completed'
                        : 'Course In Progress'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Progress</span>
                        <span>{getCourseProgress(enrollment)}%</span>
                      </div>
                      <Progress value={getCourseProgress(enrollment)} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Activity</span>
                      <span>{enrollment.enrollment_date}</span>
                    </div>
                    <Button asChild className="w-full" variant="outline">
                      <Link to={`/course/${enrollment.courses?.id}`}>
                        {getNextLesson(enrollment) || 'Review Course'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Learning Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Weekly Learning Goals
                  </CardTitle>
                  <CardDescription>
                    Track your progress towards this week's learning objectives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Lessons Completed */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Lessons Completed</span>
                      </div>
                      <Badge variant="outline">
                        {weeklyStats.lessonsCompleted}/{weeklyStats.targetLessons}
                      </Badge>
                    </div>
                    <Progress 
                      value={(weeklyStats.lessonsCompleted / weeklyStats.targetLessons) * 100} 
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {weeklyStats.lessonsCompleted} lessons completed this week
                    </p>
                  </div>

                  {/* Hours Learned */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Hours Learned</span>
                      </div>
                      <Badge variant="outline">
                        {weeklyStats.hoursLearned}h/{weeklyStats.targetHours}h
                      </Badge>
                    </div>
                    <Progress 
                      value={(weeklyStats.hoursLearned / weeklyStats.targetHours) * 100} 
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {weeklyStats.hoursLearned} hours of learning this week
                    </p>
                  </div>

                  {/* Achievement Status */}
                  <div className="pt-4 border-t">
                    {weeklyStats.lessonsCompleted >= weeklyStats.targetLessons && 
                     weeklyStats.hoursLearned >= weeklyStats.targetHours ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Award className="h-4 w-4" />
                        <span className="font-medium">Weekly goals achieved! 🎉</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Keep going! You're making progress</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Stats Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    This Week's Activity
                  </CardTitle>
                  <CardDescription>
                    Your learning activity for the current week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {weeklyStats.lessonsCompleted}
                      </div>
                      <p className="text-sm text-muted-foreground">Lessons</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {weeklyStats.hoursLearned}h
                      </div>
                      <p className="text-sm text-muted-foreground">Hours</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Week Progress</span>
                      <span className="font-medium">
                        {Math.round(((weeklyStats.lessonsCompleted / weeklyStats.targetLessons) + 
                                   (weeklyStats.hoursLearned / weeklyStats.targetHours)) / 2 * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={((weeklyStats.lessonsCompleted / weeklyStats.targetLessons) + 
                             (weeklyStats.hoursLearned / weeklyStats.targetHours)) / 2 * 100} 
                      className="h-2 mt-2"
                    />
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
