import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  CheckCircle,
  Circle,
  PlayCircle,
  BookOpen,
  Award,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VideoPlayer from '@/components/VideoPlayer';
import FinalExamModal from '@/components/course/FinalExamModal';
import FinalExamResultsModal from '@/components/course/FinalExamResultsModal';
import QuizInstructionsModal from '@/components/course/QuizInstructionsModal';
import QuizModal from '@/components/course/QuizModal';
import QuizResultsModal from '@/components/course/QuizResultsModal';

const CourseLearningPage = () => {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [finalExam, setFinalExam] = useState<any>(null);
  const [showFinalExamModal, setShowFinalExamModal] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [showExamResultsModal, setShowExamResultsModal] = useState(false);
  const [hasPassedExam, setHasPassedExam] = useState(false);
  const [canRetakeExam, setCanRetakeExam] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [showQuizInstructionsModal, setShowQuizInstructionsModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuizResultsModal, setShowQuizResultsModal] = useState(false);
  const [currentLessonQuiz, setCurrentLessonQuiz] = useState<any>(null);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchEnrollment();
      fetchCompletedLessons();
      fetchFinalExam();
      fetchExamResult();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (lessons.length > 0 && lessonId) {
      const lesson = lessons.find(lesson => lesson.id === lessonId);
      setCurrentLesson(lesson || lessons[0]);
    } else if (lessons.length > 0 && !lessonId) {
      setCurrentLesson(lessons[0]);
    }
  }, [lessons, lessonId]);

  useEffect(() => {
    if (lessons.length > 0 && completedLessons.size > 0) {
      const completedCount = lessons.filter(lesson => completedLessons.has(lesson.id)).length;
      const percentage = (completedCount / lessons.length) * 100;
      setProgressPercentage(percentage);
      setCourseCompleted(percentage >= 95); // Consider course complete at 95%
    } else {
      setProgressPercentage(0);
      setCourseCompleted(false);
    }
  }, [completedLessons, lessons]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (modulesError) throw modulesError;
      setModules(modulesData);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*, quizzes(count)')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;

      const lessonsWithQuizCount = lessonsData.map(lesson => ({
        ...lesson,
        quiz_count: lesson.quizzes ? lesson.quizzes.length : 0,
      }));
      setLessons(lessonsWithQuizCount);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollment = async () => {
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError) throw enrollmentError;
      setEnrollment(enrollmentData);
    } catch (error) {
      console.error('Error fetching enrollment:', error);
    }
  };

  const fetchCompletedLessons = async () => {
    try {
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      const completed = new Set(progressData.map(item => item.lesson_id));
      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    }
  };

  const fetchFinalExam = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (examError) {
        console.error('Error fetching final exam:', examError);
      }
      setFinalExam(examData);
    } catch (error) {
      console.error('Error fetching final exam:', error);
    }
  };

  const fetchExamResult = async () => {
    if (!finalExam) return;

    try {
      const { data: resultData, error: resultError } = await supabase
        .from('final_exam_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', finalExam.id)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .single();

      if (resultError && resultError.code !== 'PGRST116') {
        console.error('Error fetching exam result:', resultError);
      }

      if (resultData) {
        setExamResult(resultData);
        setHasPassedExam(resultData.passed);
        setCanRetakeExam(!resultData.passed);
      } else {
        setExamResult(null);
        setHasPassedExam(false);
        setCanRetakeExam(false);
      }
    } catch (error) {
      console.error('Error fetching exam result:', error);
    }
  };

  const handleLessonClick = async (lesson: any) => {
    setCurrentLesson(lesson);
    router.push(`/courses/${courseId}/learn/${lesson.id}`);

    // Update course progress with last accessed lesson
    try {
      await supabase
        .from('course_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            last_accessed_lesson_id: lesson.id,
          },
          { onConflict: 'user_id, course_id' }
        );
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            lesson_id: lessonId,
          },
          { onConflict: 'user_id, course_id, lesson_id' }
        );

      if (error) throw error;

      setCompletedLessons(prev => new Set(prev.add(lessonId)));
      toast.success('Lesson marked as complete!');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };

  const handleTakeFinalExam = () => {
    setShowFinalExamModal(true);
  };

  const handleExamComplete = (result: any) => {
    setShowFinalExamModal(false);
    setExamResult(result);
    setHasPassedExam(result.passed);
    setCanRetakeExam(!result.passed);
    setShowExamResultsModal(true);
  };

  const handleRetakeExam = () => {
    setShowExamResultsModal(false);
    setCanRetakeExam(false);
    handleTakeFinalExam();
  };

  const shouldShowFinalExamButton = () => {
    return courseCompleted || hasPassedExam;
  };

  const shouldShowRetakeButton = () => {
    return examResult && !examResult.passed;
  };

  const handleTakeQuiz = async (lessonId: string) => {
    try {
      // Fetch quiz for this lesson
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (
            *,
            quiz_answers (*)
          )
        `)
        .eq('lesson_id', lessonId)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
        return;
      }

      if (quizData) {
        setCurrentLessonQuiz(quizData);
        setShowQuizInstructionsModal(true);
      } else {
        toast.error('No quiz available for this lesson');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    }
  };

  const handleStartQuiz = () => {
    setShowQuizInstructionsModal(false);
    setShowQuizModal(true);
  };

  const handleQuizComplete = (quiz: any, score: number, passed: boolean) => {
    setShowQuizModal(false);
    setQuizResult({ quiz, score, passed });
    setShowQuizResultsModal(true);
  };

  const handleRetakeQuiz = () => {
    setShowQuizResultsModal(false);
    setShowQuizModal(true);
  };

  const handleQuizProceed = () => {
    setShowQuizResultsModal(false);
    // Continue to next lesson if quiz passed
    if (quizResult?.passed) {
      const currentLessonIndex = lessons.findIndex(l => l.id === currentLesson?.id);
      if (currentLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[currentLessonIndex + 1];
        handleLessonClick(nextLesson);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>
                    <Progress value={progressPercentage} className="mb-2" />
                    <p className="text-sm text-gray-600">{progressPercentage}% Complete</p>
                  </div>

                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.id} className="space-y-2">
                        <h3 className="font-semibold text-gray-800">{module.title}</h3>
                        <div className="space-y-1">
                          {lessons
                            .filter(lesson => lesson.module_id === module.id)
                            .map((lesson) => {
                              const isCompleted = completedLessons.has(lesson.id);
                              const isCurrent = currentLesson?.id === lesson.id;
                              const hasQuiz = lesson.quiz_count > 0; // Assuming quiz_count is available
                              
                              return (
                                <div key={lesson.id} className="space-y-1">
                                  <button
                                    onClick={() => handleLessonClick(lesson)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                                      isCurrent
                                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                        : isCompleted
                                        ? 'bg-green-50 text-green-800 hover:bg-green-100'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex-shrink-0">
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : isCurrent ? (
                                        <PlayCircle className="h-4 w-4 text-orange-600" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{lesson.title}</div>
                                      <div className="text-xs text-gray-500">{lesson.duration} mins</div>
                                    </div>
                                    {hasQuiz && (
                                      <Badge variant="secondary" className="text-xs">
                                        Quiz
                                      </Badge>
                                    )}
                                  </button>

                                  {/* Quiz button for completed lessons */}
                                  {hasQuiz && isCompleted && (
                                    <button
                                      onClick={() => handleTakeQuiz(lesson.id)}
                                      className="w-full ml-6 p-2 text-left text-sm text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded"
                                    >
                                      <Award className="h-4 w-4 inline mr-2" />
                                      Take Lesson Quiz
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}

                    {/* Final Exam Section */}
                    {shouldShowFinalExamButton() && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleTakeFinalExam}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          disabled={!courseCompleted && !canRetakeExam}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          {hasPassedExam ? 'Retake Final Exam' : 'Take Final Exam'}
                        </Button>
                      </div>
                    )}

                    {shouldShowRetakeButton() && (
                      <div className="pt-2">
                        <Button
                          onClick={handleRetakeExam}
                          variant="outline"
                          className="w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retake Exam
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                  <VideoPlayer videoUrl={currentLesson.video_url} />
                  <p className="text-gray-700">{currentLesson.description}</p>
                  <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => markLessonComplete(currentLesson.id)}>
                      Mark as Complete
                    </Button>
                    {lessons.length > 1 && (
                      <div className="flex gap-2">
                        {lessons[lessons.findIndex(l => l.id === currentLesson.id) - 1] && (
                          <Button onClick={() => handleLessonClick(lessons[lessons.findIndex(l => l.id === currentLesson.id) - 1])}>
                            Previous Lesson
                          </Button>
                        )}
                        {lessons[lessons.findIndex(l => l.id === currentLesson.id) + 1] && (
                          <Button onClick={() => handleLessonClick(lessons[lessons.findIndex(l => l.id === currentLesson.id) + 1])}>
                            Next Lesson
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Course</h3>
                  <p className="text-gray-600 mb-6">Select a lesson from the sidebar to begin your learning journey.</p>
                  {lessons.length > 0 && (
                    <Button onClick={() => handleLessonClick(lessons[0])}>
                      Start First Lesson
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFinalExamModal && finalExam && enrollment && (
        <FinalExamModal
          isOpen={showFinalExamModal}
          onClose={() => setShowFinalExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollment.id}
          onComplete={handleExamComplete}
        />
      )}

      {showExamResultsModal && examResult && (
        <FinalExamResultsModal
          isOpen={showExamResultsModal}
          onClose={() => setShowExamResultsModal(false)}
          result={examResult}
          onRetake={handleRetakeExam}
        />
      )}

      {/* Quiz Modals */}
      {showQuizInstructionsModal && currentLessonQuiz && (
        <QuizInstructionsModal
          isOpen={showQuizInstructionsModal}
          onClose={() => setShowQuizInstructionsModal(false)}
          quiz={currentLessonQuiz}
          onStartQuiz={handleStartQuiz}
        />
      )}

      {showQuizModal && currentLessonQuiz && (
        <QuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          quizId={currentLessonQuiz.id}
          lessonId={currentLessonQuiz.lesson_id}
          onComplete={handleQuizComplete}
        />
      )}

      {showQuizResultsModal && quizResult && (
        <QuizResultsModal
          isOpen={showQuizResultsModal}
          onClose={() => setShowQuizResultsModal(false)}
          quiz={quizResult.quiz}
          score={quizResult.score}
          passed={quizResult.passed}
          onRetake={handleRetakeQuiz}
          onProceed={handleQuizProceed}
          hasNextContent={true}
        />
      )}
    </div>
  );
};

export default CourseLearningPage;
