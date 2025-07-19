
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  FileText, 
  Play,
  Award,
  Lock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import VideoPlayer from '@/components/course/VideoPlayer';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import FinalExamModal from '@/components/course/FinalExamModal';
import FinalExamResultsModal from '@/components/course/FinalExamResultsModal';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  content?: string;
  duration_minutes?: number;
  is_completed: boolean;
  last_position_seconds?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  modules: Module[];
  final_exam?: any;
}

const CourseLearningPage = () => {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [showExamResults, setShowExamResults] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { courseId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId || !user?.id) return;

      setLoading(true);
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description
          `)
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('id, title, description')
          .eq('course_id', courseId)
          .order('order_index');

        if (modulesError) throw modulesError;

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, description, video_url, content, module_id')
          .in('module_id', modulesData.map(m => m.id))
          .order('order_index');

        if (lessonsError) throw lessonsError;

        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();

        if (enrollmentError) throw enrollmentError;

        setEnrollmentId(enrollmentData.id);

        const { data: progressData, error: progressError } = await supabase
          .from('lesson_progress')
          .select('lesson_id, is_completed, last_position_seconds')
          .eq('enrollment_id', enrollmentData.id);

        if (progressError) {
          console.error('Error fetching lesson progress:', progressError);
        }

        const modules = modulesData.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          lessons: lessonsData
            .filter(lesson => lesson.module_id === module.id)
            .map(lesson => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              video_url: lesson.video_url,
              content: lesson.content,
              duration_minutes: 10, // Default duration
              is_completed: progressData?.find(p => p.lesson_id === lesson.id)?.is_completed || false,
              last_position_seconds: progressData?.find(p => p.lesson_id === lesson.id)?.last_position_seconds || 0
            }))
        }));

        // Check for final exam
        const { data: finalExamData } = await supabase
          .from('final_exams')
          .select('*')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .single();

        setCourse({
          id: courseData.id,
          title: courseData.title,
          description: courseData.description,
          modules: modules,
          final_exam: finalExamData
        });

        // Set initial lesson - first incomplete or first lesson
        const allLessons = modules.flatMap(m => m.lessons);
        const firstIncompleteLesson = allLessons.find(lesson => !lesson.is_completed);
        const lessonToShow = firstIncompleteLesson || allLessons[0];
        
        if (lessonToShow) {
          setCurrentLesson(lessonToShow);
        }
      } catch (error: any) {
        console.error("Error loading course:", error);
        toast.error(error.message || "Failed to load course data");
        navigate('/learning');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, user?.id, navigate]);

  const handleVideoTimeUpdate = (currentTime: number, duration: number) => {
    if (!currentLesson || !enrollmentId) return;

    // Save progress every 10 seconds
    if (progressSaveInterval.current) {
      clearTimeout(progressSaveInterval.current);
    }

    progressSaveInterval.current = setTimeout(() => {
      saveVideoProgress(currentLesson.id, enrollmentId, currentTime, duration);
    }, 10000);

    // Check if lesson should be marked as completed (95% watched)
    const completionThreshold = duration * 0.95;
    if (currentTime >= completionThreshold && !currentLesson.is_completed) {
      markLessonAsCompleted(currentLesson.id);
    }
  };

  const saveVideoProgress = async (lessonId: string, enrollmentId: string, position: number, duration: number) => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          last_position_seconds: Math.floor(position),
          is_completed: position >= duration * 0.95,
          completion_date: position >= duration * 0.95 ? new Date().toISOString() : null
        }, {
          onConflict: 'lesson_id,enrollment_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };

  const markLessonAsCompleted = async (lessonId: string) => {
    if (!enrollmentId) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          is_completed: true,
          completion_date: new Date().toISOString()
        }, {
          onConflict: 'lesson_id,enrollment_id'
        });

      if (error) throw error;

      // Update local state
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;
        return {
          ...prevCourse,
          modules: prevCourse.modules.map(module => ({
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId ? { ...lesson, is_completed: true } : lesson
            )
          }))
        };
      });

      toast.success("Lesson completed!");
      
      // Auto-transition to next lesson after a short delay
      setTimeout(() => {
        goToNextLesson();
      }, 1500);
      
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const goToNextLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      setCurrentLesson(nextLesson);
      setActiveTab('content');
    }
  };

  const goToPreviousLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex > 0) {
      const previousLesson = allLessons[currentIndex - 1];
      setCurrentLesson(previousLesson);
      setActiveTab('content');
    }
  };

  const calculateProgress = () => {
    if (!course) return 0;
    
    const allLessons = course.modules.flatMap(m => m.lessons);
    const completedLessons = allLessons.filter(l => l.is_completed);
    
    return allLessons.length > 0 ? (completedLessons.length / allLessons.length) * 100 : 0;
  };

  const areAllLessonsCompleted = () => {
    if (!course) return false;
    const allLessons = course.modules.flatMap(m => m.lessons);
    return allLessons.length > 0 && allLessons.every(l => l.is_completed);
  };

  const handleTakeFinalExam = () => {
    if (!areAllLessonsCompleted()) {
      toast.error("Please complete all lessons before taking the final exam");
      return;
    }
    setShowFinalExam(true);
  };

  const handleExamComplete = (result: any) => {
    setShowFinalExam(false);
    setExamResult(result);
    setShowExamResults(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading course content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="mb-6 text-muted-foreground">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/courses')}>
            Browse Courses
          </Button>
        </div>
      </Layout>
    );
  }

  const progress = calculateProgress();
  const allLessonsCompleted = areAllLessonsCompleted();

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/learning')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground mt-1">{course.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Progress</div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-24" />
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course Curriculum Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Curriculum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Module {moduleIndex + 1}: {module.title}
                      </h4>
                      <div className="space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setCurrentLesson(lesson);
                              setActiveTab('content');
                            }}
                            className={`w-full text-left p-3 rounded-md border transition-colors ${
                              currentLesson?.id === lesson.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:bg-muted border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium opacity-60">
                                  {moduleIndex + 1}.{lessonIndex + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-sm">{lesson.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="h-3 w-3 opacity-60" />
                                    <span className="text-xs opacity-60">
                                      {lesson.duration_minutes || 10} min
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {lesson.is_completed && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Final Exam Section */}
                  {course.final_exam && (
                    <div className="pt-4 border-t">
                      <button
                        onClick={handleTakeFinalExam}
                        disabled={!allLessonsCompleted}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          allLessonsCompleted
                            ? 'hover:bg-muted border-border'
                            : 'opacity-50 cursor-not-allowed border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {allLessonsCompleted ? (
                              <Award className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium text-sm">Final Exam</p>
                              <p className="text-xs text-muted-foreground">
                                {allLessonsCompleted ? 'Ready to take' : 'Complete all lessons first'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Show Take Final Exam button when all lessons completed */}
                  {allLessonsCompleted && course.final_exam && (
                    <div className="pt-4">
                      <Button 
                        onClick={handleTakeFinalExam}
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Take Final Exam
                      </Button>
                    </div>
                  )}

                  {/* Lesson Navigation */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousLesson}
                      disabled={!currentLesson || !course.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson.id)}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (currentLesson && !currentLesson.is_completed) {
                          markLessonAsCompleted(currentLesson.id);
                        } else {
                          goToNextLesson();
                        }
                      }}
                      disabled={!currentLesson || course.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson.id) >= course.modules.flatMap(m => m.lessons).length - 1}
                      className="flex-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Video Player */}
                {currentLesson.video_url && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <VideoPlayer
                          src={currentLesson.video_url}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onEnded={() => markLessonAsCompleted(currentLesson.id)}
                          startTime={currentLesson.last_position_seconds || 0}
                          controls={true}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lesson Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{currentLesson.title}</CardTitle>
                        {currentLesson.description && (
                          <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                        )}
                      </div>
                      {currentLesson.is_completed && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Lesson Content Tabs */}
                <Card>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                      {currentLesson.video_url && (
                        <TabsTrigger value="transcripts" className="flex-1">Transcripts</TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="content" className="p-6">
                      {currentLesson.content ? (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                          <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/40" />
                          <h3 className="font-medium text-lg mb-2">No additional content</h3>
                          <p className="text-muted-foreground text-center">
                            This lesson doesn't have any additional text content.
                            <br />Watch the video above to learn about this topic.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    {currentLesson.video_url && (
                      <TabsContent value="transcripts" className="p-6">
                        <VideoTranscripts 
                          lessonId={currentLesson.id}
                        />
                      </TabsContent>
                    )}
                  </Tabs>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to {course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{course.description}</p>
                  <p className="text-muted-foreground">Select a lesson from the curriculum to begin learning.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Final Exam Modal */}
        {showFinalExam && course.final_exam && enrollmentId && (
          <FinalExamModal
            isOpen={showFinalExam}
            onClose={() => setShowFinalExam(false)}
            exam={course.final_exam}
            enrollmentId={enrollmentId}
            onComplete={handleExamComplete}
          />
        )}

        {/* Exam Results Modal */}
        {showExamResults && examResult && (
          <FinalExamResultsModal
            isOpen={showExamResults}
            onClose={() => setShowExamResults(false)}
            result={examResult}
            courseTitle={course.title}
          />
        )}
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
