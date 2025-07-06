
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Play, 
  CheckCircle, 
  Lock, 
  Book, 
  Clock, 
  Users,
  Award,
  ArrowLeft,
  ChevronRight,
  Download,
  AlertCircle
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration_minutes: number;
  creator_id: string;
  certificate_enabled: boolean;
  course_modules: Array<{
    id: string;
    title: string;
    description: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      order_index: number;
      video_url: string;
      content_type: string;
    }>;
  }>;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  payment_status: string;
}

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Centralized error handler
  const handleError = (error: any, context: string) => {
    console.error(`[CourseLearningPage] Error in ${context}:`, error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    setError(`${context}: ${errorMessage}`);
    toast.error(`Failed to ${context.toLowerCase()}`);
  };

  // Load course data with comprehensive error handling
  const loadCourse = async () => {
    if (!courseId) {
      console.error('[CourseLearningPage] No courseId provided');
      setError('No course ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('[CourseLearningPage] Loading course:', courseId);
      
      // Use maybeSingle() instead of single() to avoid errors when no data found
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules!inner (
            id,
            title,
            description,
            order_index,
            lessons!inner (
              id,
              title,
              description,
              order_index,
              video_url,
              content_type
            )
          )
        `)
        .eq('id', courseId)
        .maybeSingle();

      console.log('[CourseLearningPage] Course query result:', { courseData, courseError });

      if (courseError) {
        throw new Error(`Course query failed: ${courseError.message}`);
      }

      if (!courseData) {
        console.warn('[CourseLearningPage] No course found for ID:', courseId);
        setError('Course not found');
        setLoading(false);
        return;
      }

      // Sort modules and lessons safely
      const sortedCourse = {
        ...courseData,
        course_modules: (courseData.course_modules || [])
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(module => ({
            ...module,
            lessons: (module.lessons || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          }))
      };

      console.log('[CourseLearningPage] Sorted course data:', sortedCourse);
      setCourse(sortedCourse);

      // Set first lesson as current if available
      const firstModule = sortedCourse.course_modules?.[0];
      const firstLesson = firstModule?.lessons?.[0];
      if (firstLesson) {
        console.log('[CourseLearningPage] Setting current lesson:', firstLesson);
        setCurrentLesson(firstLesson);
      } else {
        console.warn('[CourseLearningPage] No lessons found in course');
      }

    } catch (error) {
      handleError(error, 'Load course');
    }
  };

  // Check enrollment with better error handling
  const checkEnrollment = async () => {
    if (!user?.id || !courseId) {
      console.log('[CourseLearningPage] Missing user or courseId for enrollment check');
      return;
    }

    try {
      console.log('[CourseLearningPage] Checking enrollment for user:', user.id, 'course:', courseId);
      
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('payment_status', 'completed')
        .maybeSingle();

      console.log('[CourseLearningPage] Enrollment query result:', { enrollmentData, enrollmentError });

      if (enrollmentError) {
        throw new Error(`Enrollment query failed: ${enrollmentError.message}`);
      }

      if (enrollmentData) {
        console.log('[CourseLearningPage] User is enrolled');
        setIsEnrolled(true);
        setEnrollment(enrollmentData);
      } else {
        console.log('[CourseLearningPage] User is not enrolled');
        setIsEnrolled(false);
      }

    } catch (error) {
      handleError(error, 'Check enrollment');
    }
  };

  // Load progress with error handling
  const loadProgress = async () => {
    if (!user?.id || !courseId || !enrollment) {
      console.log('[CourseLearningPage] Missing data for progress load');
      return;
    }

    try {
      console.log('[CourseLearningPage] Loading progress for enrollment:', enrollment.id);
      
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', enrollment.id);

      console.log('[CourseLearningPage] Progress query result:', { progressData, progressError });

      if (progressError) {
        throw new Error(`Progress query failed: ${progressError.message}`);
      }

      if (progressData) {
        const completed = progressData
          .filter(p => p.is_completed)
          .map(p => p.lesson_id);
        
        console.log('[CourseLearningPage] Completed lessons:', completed);
        setCompletedLessons(completed);

        // Calculate overall progress safely
        const totalLessons = course?.course_modules?.reduce((acc, module) => 
          acc + (module.lessons?.length || 0), 0) || 0;
        const progressPercentage = totalLessons > 0 ? (completed.length / totalLessons) * 100 : 0;
        
        console.log('[CourseLearningPage] Progress calculation:', { totalLessons, completed: completed.length, progressPercentage });
        setProgress(progressPercentage);
      }

    } catch (error) {
      handleError(error, 'Load progress');
    }
  };

  // Mark lesson complete with error handling
  const markLessonComplete = async (lessonId: string) => {
    if (!enrollment) {
      toast.error('Not enrolled in course');
      return;
    }

    try {
      console.log('[CourseLearningPage] Marking lesson complete:', lessonId);
      
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
          completion_date: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to mark lesson complete: ${error.message}`);
      }

      console.log('[CourseLearningPage] Lesson marked complete successfully');
      setCompletedLessons(prev => [...prev, lessonId]);
      toast.success('Lesson completed!');
      
      // Refresh progress
      await loadProgress();

    } catch (error) {
      handleError(error, 'Mark lesson complete');
    }
  };

  const getLessonStatus = (lessonId: string) => {
    return completedLessons.includes(lessonId) ? 'completed' : 'available';
  };

  // Main useEffect with proper sequencing
  useEffect(() => {
    const initializePage = async () => {
      console.log('[CourseLearningPage] Initializing page with courseId:', courseId, 'user:', user?.id);
      
      if (!courseId) {
        setError('No course ID provided');
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('[CourseLearningPage] No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Load course first
        await loadCourse();
        
        // Then check enrollment
        await checkEnrollment();
        
      } catch (error) {
        handleError(error, 'Initialize page');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [courseId, user]);

  // Load progress after enrollment is confirmed
  useEffect(() => {
    if (enrollment && course) {
      console.log('[CourseLearningPage] Loading progress after enrollment confirmed');
      loadProgress();
    }
  }, [enrollment, course]);

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/learning')}>
                  Back to Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Not enrolled state
  if (!isEnrolled) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-4">Course Access Required</h2>
              <p className="text-gray-600 mb-6">You need to enroll in this course to access the lessons.</p>
              <Button onClick={() => navigate(`/courses/${courseId}`)}>
                View Course Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // No course data state
  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <Book className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-4">Course Not Found</h2>
              <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/learning')}>
                Back to Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button 
                variant="outline" 
                onClick={() => navigate('/learning')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Learning
              </Button>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration_minutes} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Book className="h-4 w-4" />
                      {course.course_modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0)} lessons
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Course Progress</div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="w-32" />
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Course Content */}
              <div className="lg:col-span-3">
                {currentLesson ? (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{currentLesson.title}</span>
                        {getLessonStatus(currentLesson.id) === 'completed' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentLesson.video_url && (
                        <div className="aspect-video bg-black rounded-lg mb-4">
                          <video 
                            controls 
                            className="w-full h-full rounded-lg"
                            src={currentLesson.video_url}
                          />
                        </div>
                      )}
                      
                      <p className="text-gray-600 mb-4">{currentLesson.description}</p>
                      
                      {getLessonStatus(currentLesson.id) !== 'completed' && (
                        <Button 
                          onClick={() => markLessonComplete(currentLesson.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="mb-6">
                    <CardContent className="text-center py-8">
                      <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No lessons available in this course</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Course Modules Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {course.course_modules?.map((module, moduleIndex) => (
                        <div key={module.id} className="border-b last:border-b-0">
                          <div className="p-4 bg-gray-50">
                            <h4 className="font-medium text-sm">
                              Module {moduleIndex + 1}: {module.title}
                            </h4>
                          </div>
                          <div className="divide-y">
                            {module.lessons?.map((lesson, lessonIndex) => (
                              <button
                                key={lesson.id}
                                onClick={() => setCurrentLesson(lesson)}
                                className={`w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between ${
                                  currentLesson?.id === lesson.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {getLessonStatus(lesson.id) === 'completed' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Play className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )) || (
                        <div className="p-4 text-center text-gray-500">
                          No modules available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Certificate Section */}
                {course.certificate_enabled && progress === 100 && (
                  <Card className="mt-4">
                    <CardContent className="p-4 text-center">
                      <Award className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <h4 className="font-medium mb-2">Certificate Available</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Congratulations! You've completed the course.
                      </p>
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
