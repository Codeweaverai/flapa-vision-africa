
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { BookOpen, Clock, Play, Award, Users, Star, TrendingUp } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  certificate_enabled: boolean;
  creator_id: string;
}

interface CourseProgress {
  id: string;
  course_id: string;
  user_id: string;
  last_lesson_completed: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

interface CourseStats {
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  actualDurationHours: number;
}

const LearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      setLoading(true);
      try {
        // Fetch course enrollments for the user
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', user.id);

        if (enrollmentsError) throw enrollmentsError;

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(enrollment => enrollment.course_id);

          // Fetch the enrolled courses
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);

          if (coursesError) throw coursesError;

          setEnrolledCourses(courses || []);

          // Fetch course progress for the user - fixed RLS issue by not filtering user_id in query
          const { data: progressData, error: progressError } = await supabase
            .from('course_progress')
            .select('*')
            .in('course_id', courseIds);

          if (progressError) {
            console.error('Error fetching progress:', progressError);
            // Don't throw error, just log it and continue
          } else {
            // Filter progress data to only current user's data on client side
            const userProgress = progressData?.filter(p => p.user_id === user.id) || [];
            setCourseProgress(userProgress);
          }

          // Fetch real-time course statistics
          await fetchCourseStats(courseIds);
        } else {
          setEnrolledCourses([]);
          setCourseProgress([]);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        toast.error('Failed to load enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();

    // Set up real-time subscription for progress updates
    const channel = supabase
      .channel('course-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_progress',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          // Refresh data when progress changes
          fetchEnrolledCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchCourseStats = async (courseIds: string[]) => {
    const stats: Record<string, CourseStats> = {};
    
    for (const courseId of courseIds) {
      try {
        // Fetch reviews and ratings
        const { data: reviews } = await supabase
          .from('course_reviews')
          .select('rating')
          .eq('course_id', courseId);

        // Fetch total enrollments (students)
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId);

        // Calculate actual duration from lessons - fixed query structure
        let totalDuration = 0;
        try {
          const { data: modules } = await supabase
            .from('course_modules')
            .select('id')
            .eq('course_id', courseId);

          if (modules && modules.length > 0) {
            const moduleIds = modules.map(m => m.id);
            
            // Separate query for lessons to avoid relationship issues
            const { data: lessons } = await supabase
              .from('lessons')
              .select('duration_minutes')
              .in('module_id', moduleIds);

            if (lessons) {
              totalDuration = lessons.reduce((sum, lesson) => {
                return sum + (lesson.duration_minutes || 0);
              }, 0);
            }
          }
        } catch (lessonError) {
          console.error(`Error fetching lessons for course ${courseId}:`, lessonError);
          // Use course duration as fallback
          const course = enrolledCourses.find(c => c.id === courseId);
          totalDuration = course?.duration_minutes || 0;
        }

        const averageRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        stats[courseId] = {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews?.length || 0,
          totalStudents: enrollments?.length || 0,
          actualDurationHours: Math.round((totalDuration / 60) * 10) / 10
        };
      } catch (error) {
        console.error(`Error fetching stats for course ${courseId}:`, error);
        stats[courseId] = {
          averageRating: 0,
          totalReviews: 0,
          totalStudents: 0,
          actualDurationHours: 0
        };
      }
    }
    
    setCourseStats(stats);
  };

  const getCourseProgress = (courseId: string) => {
    const progress = courseProgress.find(p => p.course_id === courseId);
    return progress ? progress.progress_percentage : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">My Learning Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Continue your learning journey and track your progress across all enrolled courses.
            </p>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledCourses.map(course => {
                const progress = getCourseProgress(course.id);
                const stats = courseStats[course.id] || {
                  averageRating: 0,
                  totalReviews: 0,
                  totalStudents: 0,
                  actualDurationHours: 0
                };
                
                return (
                  <Card key={course.id} className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group">
                    <div className="relative">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-300">
                          <BookOpen className="h-16 w-16 text-white/80" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                          {progress}% Complete
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                          {course.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-4">
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-gray-600">
                        {course.summary}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="relative">
                          <Progress value={progress} className="h-2 bg-gray-200" />
                          <div 
                            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Real-time Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-gray-600">
                            {stats.actualDurationHours > 0 
                              ? `${stats.actualDurationHours}h` 
                              : `${Math.ceil(course.duration_minutes / 60)}h`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600">{stats.totalStudents} students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-gray-600">
                            {stats.averageRating > 0 ? `${stats.averageRating}` : 'No reviews'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">{stats.totalReviews} reviews</span>
                        </div>
                      </div>
                      
                      <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <Link to={`/learning/course/${course.id}`} className="flex items-center justify-center">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md mx-auto">
                <BookOpen className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                <h2 className="text-2xl font-bold mb-4">No courses enrolled yet</h2>
                <p className="text-gray-600 mb-6">Explore our wide range of courses and start your learning journey today.</p>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link to="/explore/courses">Explore Courses</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LearningPage;
