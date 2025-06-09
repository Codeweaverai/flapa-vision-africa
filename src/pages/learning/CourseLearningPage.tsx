import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  FileText, 
  MessageSquare,
  Award,
  ArrowRight,
  ArrowLeft,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import VideoPlayer from '@/components/course/VideoPlayer';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import LessonDiscussion from '@/components/course/LessonDiscussion';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import QuizModal from '@/components/course/QuizModal';
import FinalExamModal from '@/components/course/FinalExamModal';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  certificate_enabled: boolean;
  course_modules: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  video_url?: string;
  text_content?: string;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question_text: string;
  options: QuizOption[];
}

interface QuizOption {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface LessonProgress {
  id: string;
  lesson_id: string;
  is_completed: boolean;
  last_position?: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  completion_date?: string;
  progress_percentage: number;
}

const CourseLearningPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [finalExam, setFinalExam] = useState<any>(null);
  const [allLessonsCompleted, setAllLessonsCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to access this course');
      navigate('/auth');
      return;
    }

    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    const checkAllLessonsCompleted = () => {
      if (!course || !progress) return;
      
      const totalLessons = course.course_modules?.reduce((total, module) => 
        total + (module.lessons?.length || 0), 0) || 0;
      
      const completedLessonsCount = progress.filter(p => p.is_completed).length;
      setAllLessonsCompleted(totalLessons > 0 && completedLessonsCount === totalLessons);
    };

    checkAllLessonsCompleted();
  }, [course, progress]);

  useEffect(() => {
    const loadFinalExam = async () => {
      if (!courseId || !allLessonsCompleted) return;
      
      try {
        const { data, error } = await supabase
          .from('final_exams')
          .select('*')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .single();

        if (!error && data) {
          setFinalExam(data);
        }
      } catch (error) {
        console.error('Error loading final exam:', error);
      }
    };

    loadFinalExam();
  }, [courseId, allLessonsCompleted]);

  const loadCourseData = async () => {
    if (!user || !courseId) return;
    
    setLoading(true);
    try {
      // Check enrollment first
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .single();
      
      if (enrollmentError || !enrollmentData) {
        toast.error('You are not enrolled in this course');
        navigate('/courses');
        return;
      }
      
      setEnrollment(enrollmentData);
      
      // Load course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            *,
            lessons (*),
            quizzes (
              *,
              quiz_questions (
                *,
                quiz_options (*)
              )
            )
          )
        `)
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        toast.error('Failed to load course data');
        return;
      }
      
      // Sort modules and lessons by order_index
      const sortedCourse = {
        ...courseData,
        course_modules: courseData.course_modules
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((module: any) => ({
            ...module,
            lessons: module.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
          }))
      };
      
      setCourse(sortedCourse);
      
      // Load lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id);
      
      if (progressData) {
        setProgress(progressData);
      }
      
      // Set current lesson (either last viewed or first lesson)
      if (!currentLesson && sortedCourse.course_modules.length > 0) {
        const firstModule = sortedCourse.course_modules[0];
        if (firstModule.lessons.length > 0) {
          // Find the last lesson that was in progress
          const lastViewedProgress = progressData?.find((p: any) => p.last_position && p.last_position > 0);
          
          if (lastViewedProgress) {
            // Find the lesson that was last viewed
            for (const module of sortedCourse.course_modules) {
              const lesson = module.lessons.find((l: any) => l.id === lastViewedProgress.lesson_id);
              if (lesson) {
                setCurrentLesson(lesson);
                break;
              }
            }
          } else {
            // Default to first lesson
            setCurrentLesson(firstModule.lessons[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async () => {
    if (!user || !currentLesson || !enrollment) return;
    
    try {
      // Check if progress record exists
      const existingProgress = progress.find(p => p.lesson_id === currentLesson.id);
      
      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('lesson_progress')
          .update({ is_completed: true })
          .eq('id', existingProgress.id);
        
        if (error) throw error;
        
        // Update local state
        setProgress(progress.map(p => 
          p.id === existingProgress.id ? { ...p, is_completed: true } : p
        ));
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('lesson_progress')
          .insert({
            enrollment_id: enrollment.id,
            lesson_id: currentLesson.id,
            is_completed: true
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local state
        setProgress([...progress, data]);
      }
      
      toast.success('Lesson marked as completed');
      
      // Update enrollment progress percentage
      updateEnrollmentProgress();
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Failed to update progress');
    }
  };

  const updateEnrollmentProgress = async () => {
    if (!course || !enrollment) return;
    
    try {
      // Calculate total lessons
      const totalLessons = course.course_modules.reduce(
        (total, module) => total + module.lessons.length, 0
      );
      
      // Calculate completed lessons
      const completedLessons = progress.filter(p => p.is_completed).length + 1; // +1 for current lesson
      
      // Calculate percentage
      const percentage = Math.round((completedLessons / totalLessons) * 100);
      
      // Update enrollment
      await supabase
        .from('course_enrollments')
        .update({ progress_percentage: percentage })
        .eq('id', enrollment.id);
      
      // Update local state
      setEnrollment({
        ...enrollment,
        progress_percentage: percentage
      });
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
    }
  };

  const handleNextLesson = () => {
    if (!course) return;
    
    const currentModuleIndex = course.course_modules?.findIndex(m => 
      m.lessons?.some(l => l.id === currentLesson?.id)) || 0;
    const currentModule = course.course_modules?.[currentModuleIndex];
    const currentLessonIndex = currentModule?.lessons?.findIndex(l => l.id === currentLesson?.id) || 0;
    
    // Check if this is the last lesson in the current module
    const isLastLessonInModule = currentLessonIndex === (currentModule?.lessons?.length || 0) - 1;
    // Check if this is the last module
    const isLastModule = currentModuleIndex === (course.course_modules?.length || 0) - 1;
    
    if (isLastLessonInModule && isLastModule && allLessonsCompleted && finalExam) {
      // Show final exam
      setShowFinalExam(true);
      return;
    }
    
    // Regular next lesson logic
    if (isLastLessonInModule && !isLastModule) {
      // Go to first lesson of next module
      const nextModule = course.course_modules?.[currentModuleIndex + 1];
      const nextLesson = nextModule?.lessons?.[0];
      if (nextLesson) {
        setCurrentLesson(nextLesson);
      }
    } else if (!isLastLessonInModule) {
      // Go to next lesson in current module
      const nextLesson = currentModule?.lessons?.[currentLessonIndex + 1];
      if (nextLesson) {
        setCurrentLesson(nextLesson);
      }
    }
  };

  const handlePreviousLesson = () => {
    if (!course || !currentLesson) return;
    
    const currentModuleIndex = course.course_modules.findIndex(m => 
      m.lessons.some(l => l.id === currentLesson.id));
    const currentModule = course.course_modules[currentModuleIndex];
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentLessonIndex > 0) {
      // Go to previous lesson in current module
      setCurrentLesson(currentModule.lessons[currentLessonIndex - 1]);
    } else if (currentModuleIndex > 0) {
      // Go to last lesson of previous module
      const previousModule = course.course_modules[currentModuleIndex - 1];
      setCurrentLesson(previousModule.lessons[previousModule.lessons.length - 1]);
    }
  };

  const canGoNext = () => {
    if (!course || !currentLesson) return false;
    
    const currentModuleIndex = course.course_modules.findIndex(m => 
      m.lessons.some(l => l.id === currentLesson.id));
    const currentModule = course.course_modules[currentModuleIndex];
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
    
    const isLastLessonInModule = currentLessonIndex === currentModule.lessons.length - 1;
    const isLastModule = currentModuleIndex === course.course_modules.length - 1;
    
    return !isLastLessonInModule || !isLastModule;
  };

  const canGoPrevious = () => {
    if (!course || !currentLesson) return false;
    
    const currentModuleIndex = course.course_modules.findIndex(m => 
      m.lessons.some(l => l.id === currentLesson.id));
    const currentModule = course.course_modules[currentModuleIndex];
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
    
    return currentLessonIndex > 0 || currentModuleIndex > 0;
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.is_completed);
  };

  const calculateModuleProgress = (moduleId: string) => {
    if (!course) return 0;
    
    const module = course.course_modules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const totalLessons = module.lessons.length;
    if (totalLessons === 0) return 0;
    
    const completedLessons = module.lessons.filter(l => 
      progress.some(p => p.lesson_id === l.id && p.is_completed)
    ).length;
    
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const handleQuizStart = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setShowQuiz(true);
  };

  const isLastLesson = () => {
    if (!course || !currentLesson) return false;
    
    const allLessons = course.course_modules?.flatMap(m => m.lessons || []) || [];
    const lastLesson = allLessons[allLessons.length - 1];
    
    return currentLesson.id === lastLesson?.id;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Course Content</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4">
                      <Progress value={enrollment?.progress_percentage || 0} className="h-2" />
                      <div className="text-sm text-gray-600 mt-1">
                        {enrollment?.progress_percentage || 0}% complete
                      </div>
                    </div>
                    
                    <Accordion type="multiple" className="w-full">
                      {course?.course_modules.map((module, moduleIndex) => (
                        <AccordionItem key={module.id} value={module.id}>
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center justify-between w-full pr-2">
                              <span>Module {moduleIndex + 1}: {module.title}</span>
                              <Badge variant="outline" className="ml-2">
                                {calculateModuleProgress(module.id)}%
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1 pl-2">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div 
                                  key={lesson.id}
                                  className={`flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer ${
                                    currentLesson?.id === lesson.id 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => setCurrentLesson(lesson)}
                                >
                                  {isLessonCompleted(lesson.id) ? (
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <Play className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                  </span>
                                </div>
                              ))}
                              
                              {module.quizzes.map((quiz, quizIndex) => (
                                <div 
                                  key={quiz.id}
                                  className="flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer hover:bg-muted"
                                  onClick={() => handleQuizStart(quiz)}
                                >
                                  <Award className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                  <span className="truncate">Quiz: {quiz.title}</span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    
                    {allLessonsCompleted && finalExam && (
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                          onClick={() => setShowFinalExam(true)}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Final Exam
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Course Home
                </Button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              {currentLesson ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>{currentLesson.title}</CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={markLessonComplete}
                          disabled={isLessonCompleted(currentLesson.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isLessonCompleted(currentLesson.id) ? 'Completed' : 'Mark Complete'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {currentLesson.content_type === 'video' && currentLesson.video_url && (
                        <div className="aspect-video mb-4">
                          <VideoPlayer 
                            url={currentLesson.video_url} 
                            lessonId={currentLesson.id}
                            enrollmentId={enrollment?.id || ''}
                          />
                        </div>
                      )}
                      
                      {currentLesson.description && (
                        <div className="prose max-w-none">
                          <p>{currentLesson.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousLesson}
                      disabled={!canGoPrevious()}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button 
                      onClick={handleNextLesson}
                      disabled={!canGoNext() && !allLessonsCompleted}
                      className={allLessonsCompleted && finalExam ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      {allLessonsCompleted && finalExam && isLastLesson() ? (
                        <>
                          Next: Final Exam
                          <Award className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Lesson Content Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="discussion">Discussion</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="space-y-4">
                      {currentLesson.text_content && (
                        <Card>
                          <CardContent className="prose max-w-none p-6">
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.text_content }} />
                          </CardContent>
                        </Card>
                      )}
                      
                      {currentLesson.content_type === 'video' && (
                        <VideoTranscripts lessonId={currentLesson.id} />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="notes">
                      <LessonNotesTab 
                        lessonId={currentLesson.id} 
                        enrollmentId={enrollment?.id || ''} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="discussion">
                      <LessonDiscussion 
                        lessonId={currentLesson.id}
                        courseId={courseId || ''}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Select a lesson to begin</h3>
                    <p className="text-gray-600">Choose a lesson from the course outline to start learning.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Final Exam Modal */}
      {showFinalExam && finalExam && (
        <FinalExamModal
          exam={finalExam}
          open={showFinalExam}
          onClose={() => setShowFinalExam(false)}
          courseId={courseId!}
          enrollmentId={enrollment?.id}
        />
      )}
      
      {/* Quiz Modal */}
      {showQuiz && currentQuiz && (
        <QuizModal
          quiz={currentQuiz}
          open={showQuiz}
          onClose={() => setShowQuiz(false)}
          courseId={courseId!}
          enrollmentId={enrollment?.id}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
