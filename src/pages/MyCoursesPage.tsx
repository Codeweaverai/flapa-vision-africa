import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Award, Play, Calendar, Star, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrollment_date: string;
  is_completed: boolean;
  courses: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    category: string;
    difficulty_level: string;
    duration_minutes: number;
    creator_id: string;
  };
  progress_percentage?: number;
}

interface CourseStats {
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  actualDurationHours: number;
}

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Your Courses
              </h3>
              <p className="text-muted-foreground text-lg">
                Preparing your learning dashboard...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

// Alternative Minimal Pulse Loading (if you prefer a simpler version)
const MinimalPulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Pulse Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-700">Loading your courses...</h3>
      </div>
    </div>
  );
};

const MyCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchEnrolledCourses();

    // Set up real-time subscription for enrollment and progress updates
    const channel = supabase
      .channel('my-courses-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEnrolledCourses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEnrolledCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchEnrolledCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Concurrent data fetching using Promise.all for faster loading
      const [enrollmentsResult, progressResult] = await Promise.allSettled([
        // Fetch enrolled courses
        supabase
          .from('course_enrollments')
          .select(`
            id,
            course_id,
            enrollment_date,
            is_completed,
            courses:course_id (
              id,
              title,
              description,
              thumbnail_url,
              category,
              difficulty_level,
              duration_minutes,
              creator_id
            )
          `)
          .eq('user_id', user.id)
          .order('enrollment_date', { ascending: false }),

        // Fetch progress for all courses at once
        supabase
          .from('course_progress')
          .select('course_id, progress_percentage')
          .eq('user_id', user.id)
      ]);

      if (enrollmentsResult.status === 'rejected') {
        console.error('Error fetching enrolled courses:', enrollmentsResult.reason);
        toast.error('Failed to load your courses');
        return;
      }

      if (progressResult.status === 'rejected') {
        console.error('Error fetching course progress:', progressResult.reason);
      }

      const enrollmentsData = enrollmentsResult.value.data || [];
      const progressData = progressResult.status === 'fulfilled' ? progressResult.value.data || [] : [];

      // Create a map of progress for faster lookups
      const progressMap = new Map<string, number>();
      progressData.forEach(progress => {
        progressMap.set(progress.course_id, progress.progress_percentage);
      });

      // Combine enrollment data with progress
      const coursesWithProgress = enrollmentsData.map(enrollment => ({
        ...enrollment,
        progress_percentage: progressMap.get(enrollment.course_id) || 0
      }));

      setEnrolledCourses(coursesWithProgress);

      // Fetch real-time stats for all courses concurrently
      const courseIds = coursesWithProgress.map(course => course.course_id);
      await fetchCourseStats(courseIds);

    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStats = React.useCallback(async (courseIds: string[]) => {
    if (courseIds.length === 0) {
      setCourseStats({});
      return;
    }

    // Fetch all stats concurrently for better performance
    const statsPromises = courseIds.map(async (courseId) => {
      try {
        // Fetch all required data concurrently
        const [reviewsResult, enrollmentsResult, modulesResult] = await Promise.allSettled([
          // Fetch reviews and ratings
          supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', courseId),

          // Fetch total enrollments
          supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', courseId),

          // Calculate actual duration from lessons
          supabase
            .from('course_modules')
            .select(`
              lessons (duration_minutes)
            `)
            .eq('course_id', courseId)
        ]);

        let totalDuration = 0;
        if (modulesResult.status === 'fulfilled' && modulesResult.value.data) {
          const modules = modulesResult.value.data;
          modules.forEach(module => {
            if (module.lessons) {
              module.lessons.forEach((lesson: any) => {
                totalDuration += lesson.duration_minutes || 0;
              });
            }
          });
        }

        const averageRating = reviewsResult.status === 'fulfilled' && reviewsResult.value.data && reviewsResult.value.data.length > 0
          ? reviewsResult.value.data.reduce((sum, review) => sum + review.rating, 0) / reviewsResult.value.data.length
          : 0;

        return [
          courseId,
          {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviewsResult.status === 'fulfilled' ? reviewsResult.value.data?.length || 0 : 0,
            totalStudents: enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value.data?.length || 0 : 0,
            actualDurationHours: Math.round((totalDuration / 60) * 10) / 10
          }
        ];
      } catch (error) {
        console.error(`Error fetching stats for course ${courseId}:`, error);
        return [
          courseId,
          {
            averageRating: 0,
            totalReviews: 0,
            totalStudents: 0,
            actualDurationHours: 0
          }
        ];
      }
    });

    const statsResults = await Promise.all(statsPromises);

    // Convert results to record format
    const stats: Record<string, CourseStats> = {};
    statsResults.forEach(([courseId, courseStats]) => {
      stats[courseId as string] = courseStats;
    });

    setCourseStats(stats);
  }, []);

  const continueCourse = React.useCallback((courseId: string) => {
    navigate(`/learning/course/${courseId}`);
  }, [navigate]);

  // Memoize filtered courses
  const { completedCourses, inProgressCourses } = React.useMemo(() => {
    const completed = enrolledCourses.filter(enrollment =>
      enrollment.is_completed || (enrollment.progress_percentage || 0) >= 100
    );

    const inProgress = enrolledCourses.filter(enrollment =>
      !enrollment.is_completed && (enrollment.progress_percentage || 0) < 100
    );

    return { completedCourses: completed, inProgressCourses: inProgress };
  }, [enrolledCourses]);

  // Calculate total hours across all courses
  const totalHours = React.useMemo(() => {
    return enrolledCourses.reduce((sum, enrollment) => {
      const stats = courseStats[enrollment.course_id];
      const hours = stats?.actualDurationHours || Math.ceil((enrollment.courses.duration_minutes || 0) / 60);
      return sum + hours;
    }, 0);
  }, [enrolledCourses, courseStats]);

  // Use the PulseLoading component instead of the simple spinner
  if (loading) {
    return <PulseLoading />;
    // Alternatively, you can use the minimal version:
    // return <MinimalPulseLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              My Learning
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your learning progress and continue your educational journey.
            </p>
          </div>

          {/* Enhanced Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                      {enrolledCourses.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Play className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{inProgressCourses.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{completedCourses.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{totalHours}h</p>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="all">All Courses ({enrolledCourses.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressCourses.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCourses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <CourseGrid courses={enrolledCourses} courseStats={courseStats} onContinue={continueCourse} />
            </TabsContent>

            <TabsContent value="in-progress" className="mt-6">
              <CourseGrid courses={inProgressCourses} courseStats={courseStats} onContinue={continueCourse} />
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <CourseGrid courses={completedCourses} courseStats={courseStats} onContinue={continueCourse} />
            </TabsContent>
          </Tabs>

          {enrolledCourses.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md mx-auto">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your learning journey by enrolling in some courses.
                </p>
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0">
                  <Link to="/explore-courses">Browse Courses</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

interface CourseGridProps {
  courses: EnrolledCourse[];
  courseStats: Record<string, CourseStats>;
  onContinue: (courseId: string) => void;
}

const CourseGrid = React.memo(({ courses, courseStats, onContinue }: CourseGridProps) => {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No courses in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {courses.map((enrollment) => {
        const stats = courseStats[enrollment.course_id] || {
          averageRating: 0,
          totalReviews: 0,
          totalStudents: 0,
          actualDurationHours: 0
        };

        const progress = enrollment.progress_percentage || 0;
        const isCompleted = enrollment.is_completed || progress >= 100;

        return (
          <Card key={enrollment.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="relative">
              {enrollment.courses.thumbnail_url ? (
                <img
                  src={enrollment.courses.thumbnail_url}
                  alt={enrollment.courses.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.src = `https://placehold.co/400x225/ff7b00/ffffff?text=${encodeURIComponent(enrollment.courses.title.substring(0, 20))}`;
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-300">
                  <BookOpen className="h-16 w-16 text-white/80" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {isCompleted ? (
                  <Badge className="bg-green-500 text-white border-0">
                    <Award className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                    <Play className="h-3 w-3 mr-1" />
                    {progress}% Complete
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-2 left-2 flex gap-2">
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-0">
                  {enrollment.courses.category}
                </Badge>
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-0">
                  {enrollment.courses.difficulty_level}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-4">
              <CardTitle className="line-clamp-2 group-hover:text-orange-600 transition-colors">
                {enrollment.courses.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {enrollment.courses.description}
              </p>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar for non-completed courses */}
                {!isCompleted && (
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
                )}

                {/* Real-time Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-600">
                      {stats.actualDurationHours > 0
                        ? `${stats.actualDurationHours}h`
                        : `${Math.ceil((enrollment.courses.duration_minutes || 0) / 60)}h`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600">
                      {enrollment.enrollment_date ?
                        new Date(enrollment.enrollment_date).toLocaleDateString() :
                        'Recently enrolled'
                      }
                    </span>
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

                <Button
                  onClick={() => onContinue(enrollment.courses.id)}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  variant={isCompleted ? "outline" : "default"}
                >
                  {isCompleted ? (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Review Course
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

export default MyCoursesPage;
