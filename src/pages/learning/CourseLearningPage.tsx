
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle, Download, Info, Loader2, Lock, PlayCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import VideoPlayer from '@/components/course/VideoPlayer';
import LessonDiscussion from '@/components/course/LessonDiscussion';
import QuizModal from '@/components/course/QuizModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import FinalExamModal from '@/components/course/FinalExamModal';

interface CourseLearningPageProps {}

const CourseLearningPage: React.FC<CourseLearningPageProps> = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [lastPosition, setLastPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [hasFinalExam, setHasFinalExam] = useState(false);
  const [showFinalExamModal, setShowFinalExamModal] = useState(false);
  const [finalExamId, setFinalExamId] = useState<string | null>(null);
  const [allLessonsCompleted, setAllLessonsCompleted] = useState(false);

  useEffect(() => {
    if (!courseId || !user) {
      navigate('/my-courses');
      return;
    }

    loadCourseData();
  }, [courseId, user]);

  const loadCourseData = async () => {
    try {
      setLoading(true);

      // Check enrollment first
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .single();

      if (enrollmentError || !enrollmentData) {
        navigate(`/courses/${courseId}`);
        toast.error('You are not enrolled in this course');
        return;
      }

      setEnrollment(enrollmentData);

      // Fetch course data with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules(
            *,
            lessons(*),
            quizzes(*)
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      setCourse(courseData);

      // Sort modules and lessons by order_index
      const sortedModules = courseData.course_modules
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((module: any) => ({
          ...module,
          lessons: module.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
        }));

      setModules(sortedModules);

      // Check if there is a final exam
      const { data: finalExamData } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      setHasFinalExam(!!finalExamData);
      if (finalExamData) {
        setFinalExamId(finalExamData.id);
      }

      // Load last viewed lesson or default to first lesson
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progressData && progressData.lesson_id) {
        // Find the module and lesson indices for the last viewed lesson
        for (let i = 0; i < sortedModules.length; i++) {
          const lessonIndex = sortedModules[i].lessons.findIndex(
            (l: any) => l.id === progressData.lesson_id
          );
          if (lessonIndex !== -1) {
            setCurrentModuleIndex(i);
            setCurrentLessonIndex(lessonIndex);
            setLastPosition(progressData.last_position_seconds || 0);
            setIsCompleted(progressData.is_completed || false);
            break;
          }
        }
      }

      // Check if all lessons are completed
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id)
        .eq('is_completed', true);

      let totalLessons = 0;
      sortedModules.forEach((module: any) => {
        totalLessons += module.lessons.length;
      });

      setAllLessonsCompleted(completedLessons && completedLessons.length === totalLessons);

    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modules.length > 0 && currentModuleIndex < modules.length) {
      const moduleToLoad = modules[currentModuleIndex];
      
      if (moduleToLoad.lessons && moduleToLoad.lessons.length > 0 && currentLessonIndex < moduleToLoad.lessons.length) {
        const lessonToLoad = moduleToLoad.lessons[currentLessonIndex];
        setCurrentLesson(lessonToLoad);
        
        // Check if there is a quiz for this lesson
        const quiz = moduleToLoad.quizzes?.find((q: any) => q.lesson_id === lessonToLoad.id);
        setHasQuiz(!!quiz);
        if (quiz) {
          setQuizId(quiz.id);
        } else {
          setQuizId(null);
        }
      }
    }
  }, [modules, currentModuleIndex, currentLessonIndex]);

  const markLessonComplete = async () => {
    if (!currentLesson || !enrollment) return;

    try {
      // Check if there's an existing record
      const { data: existingProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .eq('enrollment_id', enrollment.id)
        .maybeSingle();

      const progressData = {
        is_completed: true,
        completion_date: new Date().toISOString(),
        last_position_seconds: Math.floor(lastPosition)
      };

      if (existingProgress) {
        // Update existing record
        await supabase
          .from('lesson_progress')
          .update(progressData)
          .eq('id', existingProgress.id);
      } else {
        // Create new record
        await supabase.from('lesson_progress').insert([
          {
            lesson_id: currentLesson.id,
            enrollment_id: enrollment.id,
            ...progressData
          }
        ]);
      }

      // Update course progress
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      let totalLessons = 0;
      modules.forEach((module: any) => {
        totalLessons += module.lessons.length;
      });

      const progressPercentage = Math.round((completedLessons?.length || 0) * 100 / totalLessons);
      
      // Check if course progress record exists
      const { data: existingCourseProgress } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingCourseProgress) {
        await supabase
          .from('course_progress')
          .update({
            progress_percentage: progressPercentage,
            last_lesson_completed: currentLesson.id
          })
          .eq('id', existingCourseProgress.id);
      } else {
        await supabase.from('course_progress').insert([
          {
            course_id: courseId,
            user_id: user?.id,
            progress_percentage: progressPercentage,
            last_lesson_completed: currentLesson.id
          }
        ]);
      }

      setIsCompleted(true);
      toast.success('Lesson marked as completed');

      // Check if all lessons are now completed
      setAllLessonsCompleted(completedLessons && completedLessons.length === totalLessons);

    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleVideoProgress = (seconds: number) => {
    // Save position periodically
    setLastPosition(seconds);
    
    // Only save to database every 10 seconds to avoid too many requests
    if (Math.floor(seconds) % 10 === 0 && enrollment && currentLesson) {
      supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: currentLesson.id,
          enrollment_id: enrollment.id,
          last_position_seconds: Math.floor(seconds),
        }, { onConflict: 'lesson_id,enrollment_id' })
        .then(() => {
          // No need to show a notification for periodic updates
        })
        .catch((error) => {
          console.error('Error saving progress:', error);
        });
    }
  };

  const navigateToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      // Previous lesson in same module
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      // Last lesson of previous module
      const prevModule = modules[currentModuleIndex - 1];
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentLessonIndex(prevModule.lessons.length - 1);
    }
  };

  const navigateToNextLesson = () => {
    const currentModule = modules[currentModuleIndex];
    
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      // Next lesson in same module
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      // First lesson of next module
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    } else if (hasFinalExam && allLessonsCompleted) {
      // All lessons completed, show final exam
      setShowFinalExamModal(true);
    }
  };

  const handleStartQuiz = () => {
    setShowQuizModal(true);
  };

  const handleStartFinalExam = () => {
    setShowFinalExamModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!course || !modules.length) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
            <p className="mb-6">The course you're looking for doesn't exist or you don't have access.</p>
            <Button onClick={() => navigate('/my-courses')}>Back to My Courses</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentModule = modules[currentModuleIndex];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Course Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/my-courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Courses
          </Button>
          <h1 className="text-2xl font-bold hidden md:block">{course.title}</h1>
          <div></div>
        </div>

        {/* Main content area with sidebar and lesson content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Course modules and lessons */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4">Course Content</h2>
              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="border-b pb-3 last:border-b-0">
                    <h3 className="font-medium mb-2">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <ul className="space-y-2 pl-4">
                      {module.lessons.map((lesson: any, lessonIndex: number) => {
                        // Determine if this lesson is completed
                        const isActive =
                          moduleIndex === currentModuleIndex &&
                          lessonIndex === currentLessonIndex;
                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() => {
                                setCurrentModuleIndex(moduleIndex);
                                setCurrentLessonIndex(lessonIndex);
                              }}
                              className={`flex items-center text-sm w-full text-left py-1 px-2 rounded ${
                                isActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {lesson.is_completed ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              ) : (
                                <PlayCircle className="h-4 w-4 mr-2" />
                              )}
                              <span className="truncate">
                                {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                {/* Final Exam entry */}
                {hasFinalExam && (
                  <div className="border-t pt-3">
                    <button
                      onClick={handleStartFinalExam}
                      disabled={!allLessonsCompleted}
                      className="flex items-center w-full text-left py-2 px-3 rounded bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors"
                    >
                      {allLessonsCompleted ? (
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      ) : (
                        <Lock className="h-5 w-5 mr-2 text-gray-400" />
                      )}
                      <span className="font-medium text-orange-800">Final Exam</span>
                    </button>
                    {!allLessonsCompleted && (
                      <p className="text-xs text-gray-500 mt-1 px-3">
                        Complete all lessons to unlock the final exam
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-3 space-y-6">
            {currentLesson ? (
              <>
                <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">
                      {currentModule.title} - {currentLesson.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{currentLesson.content_type}</Badge>
                      {isCompleted && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Video content */}
                  {currentLesson.video_url && (
                    <div className="aspect-video relative">
                      <VideoPlayer
                        src={currentLesson.video_url}
                        startTime={lastPosition}
                        onProgress={handleVideoProgress}
                      />
                    </div>
                  )}

                  {/* Lesson content */}
                  <div className="p-6">
                    {currentLesson.description && (
                      <div className="mb-6">
                        <p className="text-muted-foreground">{currentLesson.description}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={navigateToPreviousLesson}
                        disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous Lesson
                      </Button>

                      <div className="flex gap-2">
                        {!isCompleted && (
                          <Button variant="outline" onClick={markLessonComplete}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}

                        {hasQuiz && quizId && (
                          <Button onClick={handleStartQuiz} variant="default">
                            Start Quiz
                          </Button>
                        )}

                        {/* Show "Next: Final Exam" if this is the last lesson and all lessons are completed */}
                        {currentModuleIndex === modules.length - 1 &&
                        currentLessonIndex === modules[currentModuleIndex].lessons.length - 1 &&
                        hasFinalExam &&
                        allLessonsCompleted ? (
                          <Button onClick={handleStartFinalExam} variant="default">
                            Next: Final Exam
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : !(currentModuleIndex === modules.length - 1 &&
                          currentLessonIndex === modules[currentModuleIndex].lessons.length - 1) && (
                          <Button
                            onClick={navigateToNextLesson}
                            variant="default"
                          >
                            Next Lesson
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs for additional content */}
                <Card>
                  <Tabs defaultValue="discussion">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="discussion">Discussion</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    </TabsList>
                    <TabsContent value="discussion">
                      <LessonDiscussion lessonId={currentLesson.id} />
                    </TabsContent>
                    <TabsContent value="notes">
                      <LessonNotesTab lessonId={currentLesson.id} />
                    </TabsContent>
                    <TabsContent value="transcript">
                      <VideoTranscripts lessonId={currentLesson.id} />
                    </TabsContent>
                  </Tabs>
                </Card>
              </>
            ) : (
              <div className="bg-card rounded-lg shadow-sm border p-6 text-center">
                <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No lesson selected</h3>
                <p className="text-muted-foreground mb-4">
                  Please select a lesson from the sidebar to begin learning.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Modal */}
        {showQuizModal && quizId && (
          <QuizModal
            quizId={quizId}
            enrollmentId={enrollment?.id}
            onComplete={() => {
              setShowQuizModal(false);
              if (!isCompleted) {
                markLessonComplete();
              }
            }}
            onClose={() => setShowQuizModal(false)}
          />
        )}

        {/* Final Exam Modal */}
        {showFinalExamModal && finalExamId && (
          <FinalExamModal
            examId={finalExamId}
            courseId={courseId!}
            enrollmentId={enrollment?.id}
            onClose={() => setShowFinalExamModal(false)}
            onComplete={() => setShowFinalExamModal(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
