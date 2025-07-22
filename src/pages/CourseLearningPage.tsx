import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Play, 
  Lock, 
  CheckCircle, 
  BookOpen, 
  Award,
  HelpCircle,
  FileText,
  Video
} from 'lucide-react';
import FinalExamModal from '@/components/course/FinalExamModal';
import FinalExamResultsModal from '@/components/course/FinalExamResultsModal';
import QuizInstructionsModal from '@/components/course/QuizInstructionsModal';
import QuizModal from '@/components/course/QuizModal';
import QuizResultsModal from '@/components/course/QuizResultsModal';
import { Course, CourseModule, Lesson, Quiz } from '@/services/courseService';

interface EnhancedLesson extends Lesson {
  isCompleted: boolean;
  isLocked: boolean;
  quizzes?: Quiz[];
}

interface EnhancedModule extends CourseModule {
  lessons: EnhancedLesson[];
}

interface EnhancedCourse extends Course {
  modules: EnhancedModule[];
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<EnhancedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<EnhancedLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [finalExam, setFinalExam] = useState<any>(null);
  const [finalExamResult, setFinalExamResult] = useState<any>(null);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [showFinalExamResults, setShowFinalExamResults] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  
  // Quiz states
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showQuizInstructions, setShowQuizInstructions] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
    }
  }, [courseId, user]);

  const loadCourseData = async () => {
    if (!courseId || !user) return;
    
    try {
      setLoading(true);
      
      // Check enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw enrollmentError;
      }

      if (!enrollmentData) {
        toast.error('You are not enrolled in this course');
        navigate('/courses');
        return;
      }

      setEnrollment(enrollmentData);

      // Load course with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            *,
            lessons (
              *,
              quizzes (*)
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Load completed lessons
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollmentData.id);

      if (progressError) throw progressError;

      const completedLessonIds = progressData?.map(p => p.lesson_id) || [];
      setCompletedLessons(completedLessonIds);

      // Load final exam
      const { data: examData } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (examData) {
        setFinalExam(examData);
        
        // Check for existing exam results
        const { data: resultData } = await supabase
          .from('final_exam_results')
          .select('*')
          .eq('exam_id', examData.id)
          .eq('user_id', user.id)
          .single();

        if (resultData) {
          setFinalExamResult(resultData);
        }
      }

      // Process course data with completion status
      const enhancedModules = courseData.course_modules?.map((module: any, moduleIndex: number) => {
        const enhancedLessons = module.lessons?.map((lesson: any, lessonIndex: number) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isFirstLesson = moduleIndex === 0 && lessonIndex === 0;
          const previousLessonCompleted = lessonIndex === 0 || 
            (module.lessons[lessonIndex - 1] && completedLessonIds.includes(module.lessons[lessonIndex - 1].id));
          const isLocked = !isFirstLesson && !previousLessonCompleted;

          // Ensure quizzes have the correct structure
          const quizzes = lesson.quizzes?.map((quiz: any) => ({
            ...quiz,
            time_limit_minutes: quiz.time_limit_minutes || null
          })) || [];

          return {
            ...lesson,
            isCompleted,
            isLocked,
            quizzes
          };
        }) || [];

        return {
          ...module,
          lessons: enhancedLessons
        };
      }) || [];

      const enhancedCourse = {
        ...courseData,
        modules: enhancedModules
      };

      setCourse(enhancedCourse);
      
      // Calculate progress
      const totalLessons = enhancedModules.reduce((acc, module) => acc + module.lessons.length, 0);
      const completedCount = completedLessonIds.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      setProgress(progressPercentage);

      // Set current lesson (first incomplete lesson)
      for (const module of enhancedModules) {
        for (const lesson of module.lessons) {
          if (!lesson.isCompleted && !lesson.isLocked) {
            setCurrentLesson(lesson);
            return;
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

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !enrollment) return;

    try {
      // Check if already completed
      if (completedLessons.includes(lessonId)) return;

      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          enrollment_id: enrollment.id,
          is_completed: true,
          completion_date: new Date().toISOString()
        }, {
          onConflict: 'lesson_id,enrollment_id'
        });

      if (error) throw error;

      // Update local state
      const newCompletedLessons = [...completedLessons, lessonId];
      setCompletedLessons(newCompletedLessons);

      // Update course progress
      const totalLessons = course?.modules.reduce((acc, module) => acc + module.lessons.length, 0) || 0;
      const newProgress = Math.round((newCompletedLessons.length / totalLessons) * 100);
      setProgress(newProgress);

      // Update enrollment completion
      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .update({
          is_completed: newProgress === 100,
          completion_date: newProgress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id);

      if (enrollmentError) throw enrollmentError;

      toast.success('Lesson completed!');
      
      // Reload course data to update lesson states
      loadCourseData();

    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };

  const startLesson = (lesson: EnhancedLesson) => {
    if (lesson.isLocked) {
      toast.error('Complete previous lessons to unlock this one');
      return;
    }
    
    setCurrentLesson(lesson);
  };

  const handleQuizStart = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizInstructions(true);
  };

  const handleQuizInstructionsClose = () => {
    setShowQuizInstructions(false);
    setSelectedQuiz(null);
  };

  const handleQuizInstructionsStart = () => {
    setShowQuizInstructions(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = (result: any) => {
    setShowQuiz(false);
    setQuizResult(result);
    setShowQuizResults(true);
  };

  const handleQuizResultsClose = () => {
    setShowQuizResults(false);
    setQuizResult(null);
    setSelectedQuiz(null);
  };

  const handleFinalExamStart = async () => {
    if (!finalExam || !user) return;

    console.log('Starting final exam...', finalExam);
    
    try {
      // Check if user has completed all lessons
      const totalLessons = course?.modules.reduce((acc, module) => acc + module.lessons.length, 0) || 0;
      const completedCount = completedLessons.length;
      
      if (completedCount < totalLessons) {
        toast.error('You must complete all lessons before taking the final exam');
        return;
      }

      // Check if user has already passed
      if (finalExamResult && finalExamResult.passed) {
        const retakeAllowed = finalExamResult.attempt_number < 3; // Allow up to 3 attempts
        if (!retakeAllowed) {
          toast.error('You have reached the maximum number of attempts');
          return;
        }
      }

      console.log('Opening final exam modal...');
      setShowFinalExam(true);
    } catch (error) {
      console.error('Error starting final exam:', error);
      toast.error('Failed to start final exam');
    }
  };

  const handleFinalExamComplete = (examResult: any) => {
    console.log('Final exam completed:', examResult);
    setShowFinalExam(false);
    setFinalExamResult(examResult);
    setShowFinalExamResults(true);
    
    if (examResult.passed) {
      toast.success('Congratulations! You passed the final exam!');
    } else {
      toast.error('You did not pass the final exam. You can retake it.');
    }
  };

  const handleFinalExamResultsClose = () => {
    setShowFinalExamResults(false);
    loadCourseData(); // Reload to get updated results
  };

  const canTakeFinalExam = () => {
    if (!finalExam) return false;
    
    const totalLessons = course?.modules.reduce((acc, module) => acc + module.lessons.length, 0) || 0;
    const allLessonsCompleted = completedLessons.length >= totalLessons && totalLessons > 0;
    
    // Allow retake if not passed or if allowed retakes remain
    const canRetake = !finalExamResult || !finalExamResult.passed || (finalExamResult.attempt_number < 3);
    
    return allLessonsCompleted && canRetake;
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="section-container">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course not found</h1>
            <Button onClick={() => navigate('/courses')}>
              Back to Courses
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Curriculum */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.modules?.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-semibold text-sm">{module.title}</h3>
                    <div className="space-y-1">
                      {module.lessons?.map((lesson) => (
                        <div key={lesson.id} className="space-y-1">
                          <div
                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                              currentLesson?.id === lesson.id
                                ? 'bg-primary/10 border border-primary/20'
                                : lesson.isLocked
                                ? 'bg-muted/50 cursor-not-allowed'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => startLesson(lesson)}
                          >
                            <div className="flex items-center space-x-2">
                              {lesson.isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : lesson.isLocked ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <div className="flex items-center space-x-1">
                                  {lesson.content_type === 'video' ? (
                                    <Video className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-green-500" />
                                  )}
                                  <Play className="h-3 w-3" />
                                </div>
                              )}
                              <span className={`text-sm ${lesson.isLocked ? 'text-muted-foreground' : ''}`}>
                                {lesson.title}
                              </span>
                            </div>
                            {lesson.quizzes && lesson.quizzes.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {lesson.quizzes.length} Quiz{lesson.quizzes.length > 1 ? 'es' : ''}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Quiz buttons for this lesson */}
                          {lesson.quizzes && lesson.quizzes.length > 0 && !lesson.isLocked && (
                            <div className="ml-6 space-y-1">
                              {lesson.quizzes.map((quiz) => (
                                <Button
                                  key={quiz.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuizStart(quiz);
                                  }}
                                >
                                  <HelpCircle className="h-3 w-3 mr-2" />
                                  {quiz.title}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Final Exam Section */}
                {finalExam && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-semibold">Final Exam</h3>
                      </div>
                      {finalExamResult?.passed ? (
                        <div className="text-sm text-green-600">
                          ✓ Passed with {finalExamResult.percentage_score}%
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={handleFinalExamStart}
                          disabled={!canTakeFinalExam()}
                        >
                          {finalExamResult ? 'Retake Final Exam' : 'Take Final Exam'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-2">
            {currentLesson ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {currentLesson.title}
                    {!currentLesson.isCompleted && (
                      <Button onClick={() => markLessonComplete(currentLesson.id)}>
                        Mark Complete
                      </Button>
                    )}
                  </CardTitle>
                  {currentLesson.description && (
                    <p className="text-muted-foreground">{currentLesson.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {currentLesson.content_type === 'video' && currentLesson.video_url && (
                    <div className="aspect-video bg-black rounded-lg mb-4">
                      <video
                        controls
                        className="w-full h-full rounded-lg"
                        src={currentLesson.video_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {currentLesson.content && (
                    <div className="prose max-w-none">
                      {typeof currentLesson.content === 'string' 
                        ? currentLesson.content 
                        : JSON.stringify(currentLesson.content)
                      }
                    </div>
                  )}

                  {currentLesson.materials_urls && currentLesson.materials_urls.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Course Materials</h3>
                      <div className="space-y-2">
                        {currentLesson.materials_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Material {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Welcome to the Course</h2>
                  <p className="text-muted-foreground mb-4">
                    Select a lesson from the curriculum to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Final Exam Modal */}
      {finalExam && (
        <FinalExamModal
          isOpen={showFinalExam}
          onClose={() => setShowFinalExam(false)}
          exam={finalExam}
          onComplete={handleFinalExamComplete}
          enrollmentId={enrollment?.id}
        />
      )}

      {/* Final Exam Results Modal */}
      {finalExamResult && (
        <FinalExamResultsModal
          isOpen={showFinalExamResults}
          onClose={handleFinalExamResultsClose}
          examResult={finalExamResult}
          onRetake={() => {
            setShowFinalExamResults(false);
            handleFinalExamStart();
          }}
        />
      )}

      {/* Quiz Modals */}
      {selectedQuiz && (
        <>
          <QuizInstructionsModal
            isOpen={showQuizInstructions}
            onClose={handleQuizInstructionsClose}
            quiz={selectedQuiz}
            onStartQuiz={handleQuizInstructionsStart}
          />
          
          <QuizModal
            isOpen={showQuiz}
            onClose={() => setShowQuiz(false)}
            quizId={selectedQuiz.id}
            onComplete={handleQuizComplete}
          />
          
          <QuizResultsModal
            isOpen={showQuizResults}
            onClose={handleQuizResultsClose}
            quiz={selectedQuiz}
            score={quizResult?.score || 0}
            passed={quizResult?.passed || false}
            onRetake={() => {
              setShowQuizResults(false);
              setShowQuiz(true);
            }}
            onProceed={handleQuizResultsClose}
            hasNextContent={true}
          />
        </>
      )}
    </Layout>
  );
};

export default CourseLearningPage;
