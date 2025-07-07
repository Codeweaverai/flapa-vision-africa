
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  StickyNote,
  MessageCircle,
  Star
} from 'lucide-react';

// Import the new components
import LessonNotesTab from '@/components/course/LessonNotesTab';
import LessonDiscussionTab from '@/components/course/LessonDiscussionTab';
import CourseReviewsTab from '@/components/course/CourseReviewsTab';
import EnhancedCourseModuleList from '@/components/course/EnhancedCourseModuleList';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import QuizModal from '@/components/course/QuizModal';
import FinalExamModal from '@/components/course/FinalExamModal';

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

const CourseLearningPage = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  
  // Quiz and Exam state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState('');
  const [finalExamId, setFinalExamId] = useState('');

  useEffect(() => {
    console.log('CourseLearningPage mounted with courseId:', courseId);
    console.log('User:', user);
    
    if (courseId && user) {
      loadCourse();
      checkEnrollment();
      loadProgress();
    } else if (courseId && !user) {
      console.log('User not authenticated, redirecting to auth');
      navigate('/auth');
    } else {
      console.log('Missing courseId:', courseId);
      setLoading(false);
    }
  }, [courseId, user, navigate]);

  const loadCourse = async () => {
    if (!courseId) {
      console.error('No courseId provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading course with ID:', courseId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            id,
            title,
            description,
            order_index,
            lessons (
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

      if (error) {
        console.error('Error loading course:', error);
        throw error;
      }

      if (!data) {
        console.log('Course not found for ID:', courseId);
        toast.error('Course not found');
        return;
      }

      console.log('Course loaded successfully:', data);

      // Sort modules and lessons by order_index
      const sortedCourse = {
        ...data,
        course_modules: (data.course_modules || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map(module => ({
            ...module,
            lessons: (module.lessons || []).sort((a, b) => a.order_index - b.order_index)
          }))
      };

      setCourse(sortedCourse);

      // Set first lesson as current if none selected
      if (sortedCourse.course_modules.length > 0 && sortedCourse.course_modules[0].lessons.length > 0) {
        setCurrentLesson(sortedCourse.course_modules[0].lessons[0]);
        setCurrentLessonId(sortedCourse.course_modules[0].lessons[0].id);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!courseId || !user?.id) {
      console.log('Missing courseId or user for enrollment check');
      return;
    }

    try {
      console.log('Checking enrollment for user:', user.id, 'course:', courseId);
      
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking enrollment:', error);
        return;
      }

      const enrolled = !!data;
      console.log('Enrollment status:', enrolled);
      setIsEnrolled(enrolled);
      setEnrollment(data);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const loadProgress = async () => {
    if (!courseId || !user?.id) {
      console.log('Missing courseId or user for progress check');
      return;
    }

    try {
      console.log('Loading progress for user:', user.id, 'course:', courseId);
      
      // Load course progress
      const { data: progressData } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (progressData) {
        setProgress(progressData.progress_percentage || 0);
      }

      // Load completed lessons
      if (enrollment) {
        const { data: lessonProgressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, is_completed')
          .eq('enrollment_id', enrollment.id);

        if (lessonProgressData) {
          const completed = lessonProgressData
            .filter(p => p.is_completed)
            .map(p => p.lesson_id);
          setCompletedLessons(completed);
          
          console.log('Progress loaded:', { completed: completed.length, percentage: progressData?.progress_percentage || 0 });
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const updateProgress = async () => {
    if (!user || !courseId || !course) return;

    try {
      const totalLessons = course.course_modules.reduce((acc, module) => 
        acc + (module.lessons?.length || 0), 0);
      
      if (totalLessons === 0) return;
      
      const progressPercentage = Math.round((completedLessons.length / totalLessons) * 100);
      
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      setProgress(progressPercentage);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !courseId || !lessonId || !enrollment) {
      toast.error('Unable to mark lesson complete');
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
          completion_date: new Date().toISOString()
        });

      if (!error) {
        setCompletedLessons(prev => [...prev, lessonId]);
        toast.success('Lesson completed!');
        updateProgress();
      } else {
        console.error('Error marking lesson complete:', error);
        toast.error('Failed to mark lesson complete');
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson complete');
    }
  };

  const handleLessonSelect = (lesson: any) => {
    setCurrentLesson(lesson);
    setCurrentLessonId(lesson.id);
  };

  const handleQuizStart = (quizId: string, lessonId: string) => {
    setCurrentQuizId(quizId);
    setCurrentLessonId(lessonId);
    setShowQuizModal(true);
  };

  const handleFinalExamStart = (examId: string) => {
    setFinalExamId(examId);
    setShowExamModal(true);
  };

  const handleExamComplete = async (results: any) => {
    if (!user || !courseId || !enrollment) return;

    try {
      // Save exam results to database
      const { error } = await supabase
        .from('final_exam_results')
        .insert({
          user_id: user.id,
          course_id: courseId,
          exam_id: finalExamId,
          enrollment_id: enrollment.id,
          score: results.score,
          percentage_score: results.percentage,
          passed: results.passed,
          final_grade: results.percentage,
          quiz_scores: results.quizScores || [],
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving exam results:', error);
        toast.error('Failed to save exam results');
      } else {
        toast.success('Exam results saved successfully!');
      }
    } catch (error) {
      console.error('Error saving exam results:', error);
      toast.error('Failed to save exam results');
    }
  };

  const getLessonStatus = (lessonId: string) => {
    return completedLessons.includes(lessonId) ? 'completed' : 'available';
  };

  // Show loading state
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

  // Show error state if no course
  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
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

  // Show enrollment required state
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
                      {course.course_modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0)} lessons
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
                <Tabs defaultValue="lesson-notes" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="lesson-notes" className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Lesson Notes
                    </TabsTrigger>
                    <TabsTrigger value="discussion" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Discussion
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger value="transcripts" className="flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      Transcripts
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="lesson-notes" className="space-y-6">
                    {currentLesson && (
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
                                onTimeUpdate={(e) => setCurrentVideoTime(e.currentTarget.currentTime)}
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

                          {/* Video Transcripts */}
                          <div className="mt-6">
                            <VideoTranscripts 
                              lessonId={currentLesson.id}
                              onSeekTo={(time) => {
                                // TODO: Implement video seeking functionality
                                console.log('Seeking to:', time);
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <LessonNotesTab 
                      lessonId={currentLesson?.id || ''} 
                      currentVideoTime={currentVideoTime}
                    />
                  </TabsContent>
                  
                  <TabsContent value="discussion">
                    {currentLesson ? (
                      <LessonDiscussionTab lessonId={currentLesson.id} />
                    ) : (
                      <Card>
                        <CardContent className="text-center py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">Select a lesson to view discussions</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reviews">
                    <CourseReviewsTab courseId={courseId!} />
                  </TabsContent>
                  
                  <TabsContent value="transcripts">
                    {currentLesson ? (
                      <VideoTranscripts 
                        lessonId={currentLesson.id}
                        onSeekTo={(time) => {
                          // TODO: Implement video seeking functionality
                          console.log('Seeking to:', time);
                        }}
                      />
                    ) : (
                      <Card>
                        <CardContent className="text-center py-8">
                          <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">Select a lesson to view transcripts</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Enhanced Course Modules Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="h-5 w-5" />
                      Course Curriculum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EnhancedCourseModuleList 
                      modules={course.course_modules}
                      courseId={courseId!}
                      onLessonSelect={handleLessonSelect}
                      currentLessonId={currentLesson?.id}
                      completedLessons={completedLessons}
                      onQuizStart={handleQuizStart}
                      onFinalExamStart={handleFinalExamStart}
                      creatorId={course.creator_id}
                    />
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

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={() => {
          setShowQuizModal(false);
          setCurrentQuizId('');
          loadProgress(); // Refresh progress after quiz
        }}
        quizId={currentQuizId}
        lessonId={currentLessonId}
      />

      {/* Final Exam Modal */}
      {finalExamId && enrollment && (
        <FinalExamModal
          isOpen={showExamModal}
          onClose={() => {
            setShowExamModal(false);
            setFinalExamId('');
            loadProgress(); // Refresh progress after exam
          }}
          exam={{ 
            id: finalExamId,
            course_id: courseId!,
            title: 'Final Exam',
            description: 'Complete this exam to finish the course',
            passing_score: 70,
            time_limit_minutes: 90,
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          enrollmentId={enrollment.id}
          onComplete={handleExamComplete}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
