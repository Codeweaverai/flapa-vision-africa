import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  FileText, 
  Play,
  Award,
  Lock,
  RotateCcw
} from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import FinalExamModal from '@/components/course/FinalExamModal';
import FinalExamResultsModal from '@/components/course/FinalExamResultsModal';

interface Course {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  modules: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  content: string | null;
  module_id: string;
  order_index: number;
  duration_minutes?: number;
  is_completed?: boolean;
}

interface FinalExam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  is_published: boolean;
}

interface ExamResult {
  id: string;
  passed: boolean;
  score: number;
  final_grade: number;
  quiz_scores: number[];
  attempt_number: number;
}

const CourseLearningPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [showFinalExamModal, setShowFinalExamModal] = useState(false);
  const [showExamResultsModal, setShowExamResultsModal] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [hasPassedExam, setHasPassedExam] = useState(false);
  const [canRetakeExam, setCanRetakeExam] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [lastAccessedLessonId, setLastAccessedLessonId] = useState<string | null>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    // Check if all lessons are completed
    if (course && completedLessons.length > 0) {
      const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
      const allCompleted = totalLessons > 0 && completedLessons.length >= totalLessons;
      setCourseCompleted(allCompleted);
    }
  }, [completedLessons, course]);

  // Load the appropriate lesson when course data is available
  useEffect(() => {
    if (course && course.modules.length > 0) {
      loadAppropriateLesson();
    }
  }, [course, lastAccessedLessonId, completedLessons]);

  const loadAppropriateLesson = () => {
    if (!course || !course.modules.length) return;

    const allLessons = course.modules.flatMap(m => m.lessons).sort((a, b) => {
      // Sort by module order first, then lesson order
      const moduleA = course.modules.find(m => m.id === a.module_id);
      const moduleB = course.modules.find(m => m.id === b.module_id);
      if (moduleA && moduleB && moduleA.order_index !== moduleB.order_index) {
        return moduleA.order_index - moduleB.order_index;
      }
      return a.order_index - b.order_index;
    });

    let lessonToSelect: Lesson | null = null;

    // If we have a last accessed lesson, try to load it
    if (lastAccessedLessonId) {
      lessonToSelect = allLessons.find(lesson => lesson.id === lastAccessedLessonId) || null;
    }

    // If no last accessed lesson or it's not found, find the first incomplete lesson
    if (!lessonToSelect) {
      lessonToSelect = allLessons.find(lesson => !completedLessons.includes(lesson.id)) || null;
    }

    // If all lessons are completed or no incomplete found, load the first lesson
    if (!lessonToSelect && allLessons.length > 0) {
      lessonToSelect = allLessons[0];
    }

    if (lessonToSelect && (!currentLesson || currentLesson.id !== lessonToSelect.id)) {
      setCurrentLesson(lessonToSelect);
      if (enrollmentId) {
        loadVideoPosition(lessonToSelect.id, enrollmentId);
      }
    }
  };

  const loadCourseData = async () => {
    if (!courseId || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch course enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError) {
        throw new Error('You are not enrolled in this course');
      }
      
      setEnrollmentId(enrollment.id);

      // Fetch course with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          creator_id,
          course_modules!inner (
            id,
            title,
            description,
            order_index,
            lessons!inner (
              id,
              title,
              description,
              video_url,
              content,
              module_id,
              order_index,
              duration_minutes
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Transform the data structure
      const transformedCourse: Course = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        creator_id: courseData.creator_id,
        modules: courseData.course_modules
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((module: any) => ({
            id: module.id,
            title: module.title,
            description: module.description,
            order_index: module.order_index,
            lessons: module.lessons
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((lesson: any) => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                video_url: lesson.video_url,
                content: lesson.content,
                module_id: lesson.module_id,
                order_index: lesson.order_index,
                duration_minutes: lesson.duration_minutes
              }))
          }))
      };

      setCourse(transformedCourse);

      // Fetch lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', enrollment.id);

      const completed = progressData?.filter(p => p.is_completed).map(p => p.lesson_id) || [];
      setCompletedLessons(completed);

      // Fetch course progress to get last accessed lesson
      const { data: courseProgress, error: progressError } = await supabase
        .from('course_progress')
        .select('last_accessed_lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!progressError && courseProgress?.last_accessed_lesson_id) {
        setLastAccessedLessonId(courseProgress.last_accessed_lesson_id);
      }

      // Fetch final exam if exists
      const { data: examData } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (examData) {
        setFinalExam(examData);
        
        // Check if user has exam results
        const { data: examResults } = await supabase
          .from('final_exam_results')
          .select('*')
          .eq('user_id', user.id)
          .eq('exam_id', examData.id)
          .order('attempt_number', { ascending: false })
          .limit(1);
          
        if (examResults && examResults.length > 0) {
          const latestResult = examResults[0];
          setHasPassedExam(latestResult.passed);
          setCanRetakeExam(!latestResult.passed);
          
          // Convert quiz_scores from Json to number[]
          const quizScores = Array.isArray(latestResult.quiz_scores) 
            ? latestResult.quiz_scores as number[]
            : [];
            
          setExamResult({
            id: latestResult.id,
            passed: latestResult.passed,
            score: latestResult.score,
            final_grade: latestResult.final_grade,
            quiz_scores: quizScores,
            attempt_number: latestResult.attempt_number
          });
        }
      }

    } catch (error: any) {
      console.error('Error loading course:', error);
      toast.error(error.message || 'Failed to load course');
      navigate('/learning');
    } finally {
      setLoading(false);
    }
  };

  const loadVideoPosition = async (lessonId: string, enrollmentId: string) => {
    try {
      const { data } = await supabase
        .from('lesson_progress')
        .select('last_position_seconds')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId)
        .maybeSingle();
        
      if (data?.last_position_seconds) {
        setCurrentVideoTime(data.last_position_seconds);
      } else {
        setCurrentVideoTime(0);
      }
    } catch (error) {
      console.error('Error loading video position:', error);
      setCurrentVideoTime(0);
    }
  };

  const saveVideoProgress = async (lessonId: string, position: number, completed: boolean = false) => {
    if (!enrollmentId) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          last_position_seconds: position,
          is_completed: completed,
          completion_date: completed ? new Date().toISOString() : null
        }, {
          onConflict: 'lesson_id,enrollment_id'
        });

      if (error) throw error;

      if (completed && !completedLessons.includes(lessonId)) {
        setCompletedLessons(prev => [...prev, lessonId]);
        toast.success('Lesson completed!');
      }

      // Update course progress with last accessed lesson
      await updateCourseProgress(lessonId);
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };

  const updateCourseProgress = async (lastAccessedLessonId: string) => {
    if (!user || !courseId) return;

    try {
      const totalLessons = course?.modules.reduce((acc, module) => acc + module.lessons.length, 0) || 0;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          last_accessed_lesson_id: lastAccessedLessonId,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!enrollmentId) return;
    
    try {
      await saveVideoProgress(lessonId, 0, true);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const handleVideoTimeUpdate = (currentTime: number, duration: number, percent: number) => {
    setCurrentVideoTime(currentTime);
    
    // Clear existing interval
    if (progressSaveInterval.current) {
      clearInterval(progressSaveInterval.current);
    }
    
    // Save progress every 10 seconds
    progressSaveInterval.current = setInterval(() => {
      if (currentLesson) {
        const isCompleted = percent >= 95; // Consider completed at 95%
        saveVideoProgress(currentLesson.id, currentTime, isCompleted);
      }
    }, 10000);
  };

  const handleVideoEnded = () => {
    if (currentLesson && enrollmentId) {
      saveVideoProgress(currentLesson.id, 0, true);
      
      // Auto-transition to next lesson
      setTimeout(() => {
        handleNextLesson();
      }, 1500);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    // Clear progress interval when switching lessons
    if (progressSaveInterval.current) {
      clearInterval(progressSaveInterval.current);
    }
    
    setCurrentLesson(lesson);
    setCurrentVideoTime(0);
    
    if (enrollmentId) {
      loadVideoPosition(lesson.id, enrollmentId);
    }

    // Update course progress
    updateCourseProgress(lesson.id);
  };

  const handleNextLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.modules.flatMap(m => m.lessons).sort((a, b) => {
      const moduleA = course.modules.find(m => m.id === a.module_id);
      const moduleB = course.modules.find(m => m.id === b.module_id);
      if (moduleA && moduleB && moduleA.order_index !== moduleB.order_index) {
        return moduleA.order_index - moduleB.order_index;
      }
      return a.order_index - b.order_index;
    });
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex < allLessons.length - 1) {
      // Mark current lesson as completed if not already
      if (!completedLessons.includes(currentLesson.id)) {
        markLessonComplete(currentLesson.id);
      }
      
      const nextLesson = allLessons[currentIndex + 1];
      handleLessonSelect(nextLesson);
    }
  };

  const handlePreviousLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.modules.flatMap(m => m.lessons).sort((a, b) => {
      const moduleA = course.modules.find(m => m.id === a.module_id);
      const moduleB = course.modules.find(m => m.id === b.module_id);
      if (moduleA && moduleB && moduleA.order_index !== moduleB.order_index) {
        return moduleA.order_index - moduleB.order_index;
      }
      return a.order_index - b.order_index;
    });
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex > 0) {
      const previousLesson = allLessons[currentIndex - 1];
      handleLessonSelect(previousLesson);
    }
  };

  const handleTakeFinalExam = () => {
    if (finalExam && (courseCompleted || canRetakeExam)) {
      setShowFinalExamModal(true);
    }
  };

  const handleExamComplete = (result: any) => {
    console.log('Exam completed with result:', result);
    setShowFinalExamModal(false);
    
    // Convert result to match ExamResult interface
    const examResultData: ExamResult = {
      id: result.id || '',
      passed: result.passed,
      score: result.score,
      final_grade: result.final_grade,
      quiz_scores: Array.isArray(result.quiz_scores) ? result.quiz_scores : [],
      attempt_number: result.attempt_number
    };
    
    setExamResult(examResultData);
    setHasPassedExam(result.passed);
    setCanRetakeExam(!result.passed);
    
    // Show results modal immediately after exam completion
    setTimeout(() => {
      setShowExamResultsModal(true);
    }, 100);
    
    // Refresh course data to get updated exam status
    loadCourseData();
  };

  const handleRetakeExam = () => {
    setShowExamResultsModal(false);
    setShowFinalExamModal(true);
  };

  const handleCloseExamResults = () => {
    setShowExamResultsModal(false);
    setExamResult(null);
  };

  const calculateProgress = () => {
    if (!course) return 0;
    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    return totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  };

  const shouldShowViewResults = () => {
    return finalExam && (hasPassedExam || canRetakeExam);
  };

  const shouldShowFinalExamButton = () => {
    return finalExam && courseCompleted && !hasPassedExam;
  };

  const shouldShowRetakeButton = () => {
    return finalExam && canRetakeExam && !hasPassedExam;
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
          <Button asChild>
            <Link to="/learning">Back to Learning</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/learning">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1">
              <Progress value={calculateProgress()} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">
              {calculateProgress()}% Complete
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course curriculum sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Curriculum</CardTitle>
                  <CardDescription>
                    {completedLessons.length} of {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {course.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
                        {module.title}
                      </h4>
                      {module.lessons.map((lesson) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const isCurrent = currentLesson?.id === lesson.id;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full text-left p-3 rounded-md transition-colors ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                  )}
                                  {lesson.video_url ? (
                                    <Play className="h-4 w-4" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{lesson.title}</p>
                                  {lesson.duration_minutes && (
                                    <p className="text-xs text-muted-foreground">
                                      {lesson.duration_minutes} min
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Final Exam Section */}
                  {shouldShowFinalExamButton() && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-sm text-muted-foreground">Final Assessment</h4>
                      <Button
                        onClick={handleTakeFinalExam}
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Take Final Exam
                      </Button>
                    </div>
                  )}

                  {/* Retake Exam Button */}
                  {shouldShowRetakeButton() && (
                    <div className="pt-2">
                      <Button
                        onClick={handleRetakeExam}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-100"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake Exam
                      </Button>
                    </div>
                  )}

                  {/* View Course Results Button */}
                  {shouldShowViewResults() && (
                    <div className="pt-2">
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/course/${courseId}/results`)}
                      >
                        View Course Results
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Video Player */}
                {currentLesson.video_url ? (
                  <div className="bg-black rounded-md overflow-hidden">
                    <VideoPlayer
                      src={currentLesson.video_url}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={handleVideoEnded}
                      autoplay={false}
                      controls={true}
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded-md">
                    <div className="text-center p-8">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No video content</h3>
                      <p className="text-muted-foreground">This lesson contains text content only.</p>
                    </div>
                  </div>
                )}
                
                {/* Lesson details */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{currentLesson.title}</h2>
                    {completedLessons.includes(currentLesson.id) && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </Badge>
                    )}
                  </div>
                  
                  {currentLesson.description && (
                    <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                  )}
                </div>
                
                {/* Tabs for different content types */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Lesson Content</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="min-h-[300px]">
                    <Card>
                      <CardContent className="p-6">
                        {currentLesson.content ? (
                          <div 
                            className="prose max-w-none" 
                            dangerouslySetInnerHTML={{ __html: currentLesson.content }} 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-12">
                            <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/40" />
                            <h3 className="font-medium text-lg mb-2">No additional content</h3>
                            <p className="text-muted-foreground text-center">
                              This lesson doesn't have any additional text content.
                              <br />Watch the video above to learn about this topic.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="transcript">
                    <VideoTranscripts
                      lessonId={currentLesson.id}
                      currentTime={currentVideoTime}
                      onSeekTo={(time) => {
                        console.log('Seeking to time:', time);
                        // Note: VideoPlayer component would need to implement seeking functionality
                      }}
                    />
                  </TabsContent>
                </Tabs>
                
                {/* Lesson navigation */}
                <div className="flex justify-between pt-4 mt-8 border-t">
                  <Button 
                    variant="outline"
                    onClick={handlePreviousLesson}
                    disabled={!course || course.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson.id) === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  
                  <Button 
                    onClick={handleNextLesson}
                    disabled={!course || course.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson.id) === course.modules.flatMap(m => m.lessons).length - 1}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    Next <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to the Course</CardTitle>
                  <CardDescription>Loading your course content...</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{course.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Final Exam Modal */}
      {finalExam && enrollmentId && (
        <FinalExamModal
          isOpen={showFinalExamModal}
          onClose={() => setShowFinalExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollmentId}
          onComplete={handleExamComplete}
        />
      )}

      {/* Final Exam Results Modal */}
      {examResult && (
        <FinalExamResultsModal
          isOpen={showExamResultsModal}
          onClose={handleCloseExamResults}
          examScore={examResult.score}
          quizScores={examResult.quiz_scores}
          finalGrade={examResult.final_grade}
          passed={examResult.passed}
          courseName={course?.title || 'Course'}
          studentName={user?.email || 'Student'}
          enrollmentId={enrollmentId || ''}
          onRetake={handleRetakeExam}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
