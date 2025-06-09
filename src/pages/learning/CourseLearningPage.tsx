import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import LessonDiscussion from '@/components/course/LessonDiscussion';
import FloatingAIAssistant from '@/components/course/FloatingAIAssistant';
import QuizModal from '@/components/course/QuizModal';
import QuizInstructionsModal from '@/components/course/QuizInstructionsModal';
import QuizResultsModal from '@/components/course/QuizResultsModal';
import FinalExamModal from '@/components/course/FinalExamModal';
import FinalExamResultsModal from '@/components/course/FinalExamResultsModal';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import { supabase } from '@/lib/supabaseClient';
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  MessageSquare,
  FileText,
  Users,
  Globe,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
  Lock,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  GraduationCap,
  StickyNote
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  thumbnail_url?: string;
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
  video_url?: string;
  content?: string;
  content_type: string;
  order_index: number;
  is_completed?: boolean;
  materials_urls?: string[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  module_id?: string;
  lesson_id?: string;
  is_completed?: boolean;
  last_score?: number;
}

interface CreatorProfile {
  id: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  username?: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  enrollment_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  answers: any;
  created_at: string;
  updated_at: string;
}

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  is_published: boolean;
}

const CourseLearningPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [isFinalExamModalOpen, setIsFinalExamModalOpen] = useState(false);
  const [isFinalExamResultsOpen, setIsFinalExamResultsOpen] = useState(false);
  const [finalExamResults, setFinalExamResults] = useState<{
    examScore: number;
    quizScores: number[];
    finalGrade: number;
    passed: boolean;
  } | null>(null);
  const [examResults, setExamResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuizInstructionsOpen, setIsQuizInstructionsOpen] = useState(false);
  const [isQuizResultsOpen, setIsQuizResultsOpen] = useState(false);
  const [quizResults, setQuizResults] = useState<{ quiz: Quiz; score: number; passed: boolean } | null>(null);
  const [nextContent, setNextContent] = useState<{ type: 'lesson' | 'quiz'; content: Lesson | Quiz } | null>(null);
  const [blockedContent, setBlockedContent] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (currentLesson && modules.length > 0) {
      const module = modules.find(m => 
        m.lessons.some(l => l.id === currentLesson.id)
      );
      setCurrentModule(module || null);
    }
  }, [currentLesson, modules]);
  
  const loadCourseData = async () => {
    if (!courseId || !user) return;
    
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError) {
        toast.error('You are not enrolled in this course');
        navigate(`/learning/course-detail/${courseId}`);
        return;
      }
      
      if (courseData.creator_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', courseData.creator_id)
          .single();
        
        if (creatorData) {
          setCreator(creatorData);
        }
      }
      
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons (
            *,
            lesson_progress (
              is_completed,
              completion_date
            )
          ),
          quizzes (
            *
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, passed')
        .eq('user_id', user.id) as { data: { quiz_id: string; score: number; passed: boolean }[] | null };

      const { data: examData } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .single();

      if (examData) {
        setFinalExam(examData);
      }

      const processedModules = modulesData?.map(module => ({
        ...module,
        lessons: module.lessons
          ?.sort((a: any, b: any) => a.order_index - b.order_index)
          ?.map((lesson: any) => ({
            ...lesson,
            is_completed: lesson.lesson_progress?.[0]?.is_completed || false
          })) || [],
        quizzes: module.quizzes?.map((quiz: any) => {
          const attempt = quizAttempts?.find(a => a.quiz_id === quiz.id);
          return {
            ...quiz,
            is_completed: attempt?.passed || false,
            last_score: attempt?.score || 0
          };
        }) || []
      })) || [];
      
      setCourse(courseData);
      setEnrollment(enrollmentData);
      setModules(processedModules);
      
      const blocked = calculateBlockedContent(processedModules);
      setBlockedContent(blocked);
      
      setFirstAvailableLesson(processedModules, blocked);
      
      calculateProgress(processedModules);
      
      // Load exam results if available
      const { data: examResultsData } = await supabase
        .from('final_exam_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (examResultsData) {
        setExamResults(examResultsData);
      }

    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const calculateBlockedContent = (modulesData: CourseModule[]) => {
    const blocked: string[] = [];
    
    for (let i = 0; i < modulesData.length; i++) {
      const module = modulesData[i];
      
      if (i > 0) {
        const prevModule = modulesData[i - 1];
        const hasUnpassedQuiz = prevModule.quizzes.some(quiz => !quiz.is_completed);
        
        if (hasUnpassedQuiz) {
          module.lessons.forEach(lesson => blocked.push(lesson.id));
          module.quizzes.forEach(quiz => blocked.push(quiz.id));
          continue;
        }
      }
      
      for (let j = 0; j < module.lessons.length; j++) {
        const lesson = module.lessons[j];
        
        const lessonQuizzes = module.quizzes.filter(quiz => quiz.lesson_id === lesson.id);
        
        if (j > 0 && lessonQuizzes.length > 0) {
          const prevLesson = module.lessons[j - 1];
          const prevLessonQuizzes = module.quizzes.filter(quiz => quiz.lesson_id === prevLesson.id);
          const hasUnpassedQuiz = prevLessonQuizzes.some(quiz => !quiz.is_completed);
          
          if (hasUnpassedQuiz) {
            blocked.push(lesson.id);
          }
        }
      }
    }
    
    return blocked;
  };

  const setFirstAvailableLesson = (modulesData: CourseModule[], blocked: string[]) => {
    let lessonFound = false;
    let firstLesson: Lesson | null = null;
    
    for (const module of modulesData) {
      if (module.lessons && module.lessons.length > 0) {
        if (!firstLesson) {
          firstLesson = module.lessons[0];
        }
        
        for (const lesson of module.lessons) {
          if (!lesson.is_completed && !blocked.includes(lesson.id)) {
            setCurrentLesson(lesson);
            lessonFound = true;
            break;
          }
        }
        if (lessonFound) break;
      }
    }
    
    if (!lessonFound && firstLesson && !blocked.includes(firstLesson.id)) {
      setCurrentLesson(firstLesson);
    }
  };
  
  const calculateProgress = (modulesData: CourseModule[]) => {
    let totalItems = 0;
    let completedItems = 0;
    
    modulesData.forEach(module => {
      if (module.lessons) {
        totalItems += module.lessons.length;
        module.lessons.forEach(lesson => {
          if (lesson.is_completed) {
            completedItems++;
          }
        });
      }
      if (module.quizzes) {
        totalItems += module.quizzes.length;
        module.quizzes.forEach(quiz => {
          if (quiz.is_completed) {
            completedItems++;
          }
        });
      }
    });
    
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    setProgress(progressPercentage);
  };
  
  const findAdjacentLessons = () => {
    const allLessons: { lesson: Lesson; moduleTitle: string }[] = [];
    
    modules.forEach(module => {
      module.lessons.forEach(lesson => {
        allLessons.push({ lesson, moduleTitle: module.title });
      });
    });

    const currentIndex = allLessons.findIndex(item => item.lesson.id === currentLesson?.id);
    
    return {
      previous: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
    };
  };

  const findNextContent = () => {
    const allContent: Array<{ type: 'lesson' | 'quiz'; content: Lesson | Quiz; moduleTitle: string }> = [];
    
    modules.forEach(module => {
      module.lessons.forEach(lesson => {
        allContent.push({ type: 'lesson', content: lesson, moduleTitle: module.title });
        
        const lessonQuizzes = module.quizzes.filter(quiz => quiz.lesson_id === lesson.id);
        lessonQuizzes.forEach(quiz => {
          allContent.push({ type: 'quiz', content: quiz, moduleTitle: module.title });
        });
      });
      
      const moduleQuizzes = module.quizzes.filter(quiz => !quiz.lesson_id);
      moduleQuizzes.forEach(quiz => {
        allContent.push({ type: 'quiz', content: quiz, moduleTitle: module.title });
      });
    });

    const currentIndex = allContent.findIndex(item => 
      (currentLesson && item.type === 'lesson' && item.content.id === currentLesson.id) ||
      (currentQuiz && item.type === 'quiz' && item.content.id === currentQuiz.id)
    );
    
    if (currentIndex < allContent.length - 1) {
      const next = allContent[currentIndex + 1];
      setNextContent({ type: next.type, content: next.content });
    } else {
      setNextContent(null);
    }
  };

  useEffect(() => {
    findNextContent();
  }, [currentLesson, currentQuiz, modules]);

  const navigateToLesson = (lessonData: { lesson: Lesson; moduleTitle: string }) => {
    if (blockedContent.includes(lessonData.lesson.id)) {
      toast.error('Complete required quizzes to unlock this lesson');
      return;
    }
    setCurrentLesson(lessonData.lesson);
  };
  
  const handleLessonSelect = (lesson: Lesson) => {
    if (blockedContent.includes(lesson.id)) {
      toast.error('Complete required quizzes to unlock this lesson');
      return;
    }
    setCurrentLesson(lesson);
  };

  const handleQuizStart = (quiz: Quiz) => {
    if (blockedContent.includes(quiz.id)) {
      toast.error('Complete previous requirements to unlock this quiz');
      return;
    }
    setCurrentQuiz(quiz);
    setIsQuizInstructionsOpen(true);
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (!currentQuiz || !enrollment) return;

    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: currentQuiz.id,
          user_id: user.id,
          enrollment_id: enrollment.id,
          score: score,
          passed: passed
        } as const);

      if (error) throw error;

      setIsQuizModalOpen(false);
      setQuizResults({ quiz: currentQuiz, score, passed });
      setIsQuizResultsOpen(true);
      
      await loadCourseData();
      
    } catch (error) {
      console.error('Error recording quiz attempt:', error);
      toast.error('Failed to record quiz attempt');
    }
  };

  const handleRetakeQuiz = () => {
    setIsQuizResultsOpen(false);
    setIsQuizModalOpen(true);
  };

  const handleProceedAfterQuiz = () => {
    setIsQuizResultsOpen(false);
    
    if (nextContent) {
      if (nextContent.type === 'lesson') {
        setCurrentLesson(nextContent.content as Lesson);
        setCurrentQuiz(null);
      } else {
        setCurrentQuiz(nextContent.content as Quiz);
        setCurrentLesson(null);
        setIsQuizInstructionsOpen(true);
      }
    }
  };

  const handleNextLesson = async () => {
    if (!currentLesson || !enrollment) return;

    try {
      const { data: existingProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .eq('enrollment_id', enrollment.id)
        .single();

      if (existingProgress) {
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            is_completed: true,
            completion_date: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lesson_progress')
          .insert({
            lesson_id: currentLesson.id,
            enrollment_id: enrollment.id,
            is_completed: true,
            completion_date: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success('Lesson completed!');
      
      await loadCourseData();
      
      if (nextContent) {
        if (nextContent.type === 'lesson') {
          setCurrentLesson(nextContent.content as Lesson);
          setCurrentQuiz(null);
        } else {
          setCurrentQuiz(nextContent.content as Quiz);
          setCurrentLesson(null);
          setIsQuizInstructionsOpen(true);
        }
      }
      
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };
  
  const handleCreatorProfileClick = () => {
    if (creator?.username) {
      navigate(`/creator/profile/${creator.username}`);
    } else if (creator?.id) {
      navigate(`/creator/profile/${creator.id}`);
    }
  };
  
  const handleQuizInstructionsStart = (quiz: Quiz) => {
    setIsQuizInstructionsOpen(false);
    setIsQuizModalOpen(true);
  };

  const calculateFinalGrade = (examScore: number) => {
    const quizScores = [];
    
    modules.forEach(module => {
      module.quizzes?.forEach(quiz => {
        if (quiz.last_score && quiz.last_score > 0) {
          quizScores.push(quiz.last_score);
        }
      });
    });

    if (quizScores.length === 0) {
      return { finalGrade: examScore, quizScores: [] };
    }

    const quizAverage = quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length;
    
    const finalGrade = Math.round((quizAverage * 0.6) + (examScore * 0.4));
    
    return { finalGrade, quizScores };
  };

  const handleFinalExamStart = () => {
    if (!finalExam) return;
    
    const allCompleted = modules.every(module => 
      module.lessons.every(lesson => lesson.is_completed) &&
      module.quizzes.every(quiz => quiz.is_completed)
    );

    if (!allCompleted) {
      toast.error('Please complete all lessons and quizzes before taking the final exam');
      return;
    }

    setIsFinalExamModalOpen(true);
  };

  const handleFinalExamComplete = async (examScore: number, passed: boolean) => {
    const { finalGrade, quizScores } = calculateFinalGrade(examScore);
    const overallPassed = finalGrade >= 70;

    // Store exam results in database
    try {
      const { error: resultsError } = await supabase
        .from('final_exam_results')
        .insert({
          user_id: user.id,
          exam_id: finalExam?.id,
          course_id: courseId,
          enrollment_id: enrollment?.id,
          score: examScore,
          percentage_score: examScore,
          passed: overallPassed,
          quiz_scores: quizScores,
          final_grade: finalGrade,
          attempt_number: 1
        });

      if (resultsError) {
        console.error('Error storing exam results:', resultsError);
      }

      // Send email notification
      try {
        const { error: emailError } = await supabase.functions.invoke('send-exam-notification', {
          body: {
            userId: user.id,
            courseTitle: course?.title || '',
            finalGrade,
            passed: overallPassed,
            examScore,
            studentName: user?.user_metadata?.full_name || 'Student'
          }
        });

        if (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      setExamResults({
        score: examScore,
        percentage_score: examScore,
        passed: overallPassed,
        quiz_scores: quizScores,
        final_grade: finalGrade
      });

    } catch (error) {
      console.error('Error processing exam completion:', error);
    }

    setFinalExamResults({
      examScore,
      quizScores,
      finalGrade,
      passed: overallPassed
    });

    if (overallPassed && enrollment) {
      try {
        await supabase
          .from('course_enrollments')
          .update({
            is_completed: true,
            completion_date: new Date().toISOString()
          })
          .eq('id', enrollment.id);
      } catch (error) {
        console.error('Error updating course completion:', error);
      }
    }

    setIsFinalExamModalOpen(false);
    setIsFinalExamResultsOpen(true);
  };

  const handleFinalExamRetake = () => {
    setIsFinalExamResultsOpen(false);
    setIsFinalExamModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <Layout>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Layout>
      </div>
    );
  }
  
  const { previous: previousLesson, next: nextLesson } = findAdjacentLessons();
  
  const renderLessonContent = () => {
    if (!currentLesson) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="p-0">
            <div className="aspect-video bg-black">
              {currentLesson.video_url ? (
                <ReactPlayer
                  url={currentLesson.video_url}
                  width="100%"
                  height="100%"
                  controls
                  className="rounded-t-lg overflow-hidden"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-200 to-purple-200">
                  <div className="text-center">
                    <PlayCircle className="h-16 w-16 mx-auto mb-4 text-white/60" />
                    <p className="text-white/80 font-medium">No video available for this lesson</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="transcript" className="p-6">
            <VideoTranscripts 
              lessonId={currentLesson.id}
              onSeekTo={(time) => {
                // Implement video seeking functionality
                console.log('Seek to time:', time);
              }}
            />
          </TabsContent>
          
          <TabsContent value="notes" className="p-6">
            <LessonNotesTab 
              lessonId={currentLesson.id || ''} 
              currentVideoTime={0}
            />
          </TabsContent>
          
          <TabsContent value="discussion" className="p-6">
            <LessonDiscussion lessonId={currentLesson.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <Layout>
        <div className="container max-w-full py-6 relative z-10">
          <div className="flex flex-col gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {course?.title}
                    </h1>
                    <Badge variant="outline" className="border-purple-300">
                      {Math.round(progress)}% Complete
                    </Badge>
                  </div>
                  
                  <Progress value={progress} className="h-3 bg-gray-200">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </Progress>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.round(progress)}% Complete</span>
                    {enrollment && (
                      <span>Enrolled on {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                {/* Course Curriculum Sidebar */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      Course Curriculum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-6">
                        {modules.map((module, moduleIndex) => (
                          <div key={module.id} className="space-y-3">
                            <div className={`p-4 rounded-lg border-l-4 ${
                              currentModule?.id === module.id 
                                ? 'bg-gradient-to-r from-orange-100 to-purple-100 border-orange-500' 
                                : 'bg-gray-50 border-gray-300'
                            }`}>
                              <h3 className="font-semibold text-lg text-gray-800">
                                Module {moduleIndex + 1}: {module.title}
                              </h3>
                              {module.description && (
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                  {module.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {module.lessons.length} lessons
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {module.lessons.filter(l => l.is_completed).length} completed
                                </Badge>
                                {module.quizzes.length > 0 && (
                                  <Badge variant="outline" className="text-xs border-orange-300">
                                    {module.quizzes.length} quiz{module.quizzes.length !== 1 ? 'zes' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2 pl-2">
                              {module.lessons.map((lesson, lessonIndex) => {
                                const isBlocked = blockedContent.includes(lesson.id);
                                return (
                                  <button
                                    key={lesson.id}
                                    onClick={() => handleLessonSelect(lesson)}
                                    disabled={isBlocked}
                                    className={`flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 ${
                                      isBlocked
                                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                        : currentLesson?.id === lesson.id
                                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg transform scale-105'
                                        : 'hover:bg-white/80 hover:shadow-md'
                                    }`}
                                  >
                                    <div className="mr-3">
                                      {isBlocked ? (
                                        <Lock className="h-5 w-5 text-gray-400" />
                                      ) : lesson.is_completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <PlayCircle className={`h-5 w-5 ${
                                          currentLesson?.id === lesson.id ? 'text-white' : 'text-orange-500'
                                        }`} />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {lessonIndex + 1}. {lesson.title}
                                      </div>
                                      {lesson.description && (
                                        <div className={`text-xs mt-1 ${
                                          currentLesson?.id === lesson.id ? 'text-white/80' : 'text-gray-500'
                                        }`}>
                                          {lesson.description}
                                        </div>
                                      )}
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ml-2 ${
                                        currentLesson?.id === lesson.id 
                                          ? 'border-white text-white' 
                                          : 'border-purple-300 text-purple-600'
                                      }`}
                                    >
                                      {lesson.content_type}
                                    </Badge>
                                  </button>
                                );
                              })}
                              
                              {module.quizzes.map((quiz, quizIndex) => {
                                const isBlocked = blockedContent.includes(quiz.id);
                                return (
                                  <div key={quiz.id} className={`ml-4 p-3 rounded-lg border-2 ${
                                    quiz.is_completed 
                                      ? 'bg-green-50 border-green-200' 
                                      : isBlocked
                                      ? 'bg-gray-50 border-gray-200 opacity-50'
                                      : 'bg-orange-50 border-orange-200'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {isBlocked ? (
                                          <Lock className="h-4 w-4 text-gray-400" />
                                        ) : quiz.is_completed ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Award className="h-4 w-4 text-orange-500" />
                                        )}
                                        <div>
                                          <div className="font-medium text-sm">
                                            Quiz {quizIndex + 1}: {quiz.title}
                                          </div>
                                          {quiz.description && (
                                            <div className="text-xs text-gray-600">
                                              {quiz.description}
                                            </div>
                                          )}
                                          <div className="text-xs text-gray-500 mt-1">
                                            Passing Score: {quiz.passing_score}%
                                            {quiz.last_score > 0 && (
                                              <span className="ml-2">
                                                Last Score: {quiz.last_score}%
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={quiz.is_completed ? "outline" : "default"}
                                        onClick={() => handleQuizStart(quiz)}
                                        disabled={isBlocked}
                                        className={quiz.is_completed ? "text-green-600 border-green-600" : ""}
                                      >
                                        {quiz.is_completed ? 'Retake' : 'Start Quiz'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {finalExam && (
                          <div className="mt-6 p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-purple-600" />
                                <div>
                                  <div className="font-semibold text-lg text-purple-800">
                                    Final Exam: {finalExam.title}
                                  </div>
                                  {finalExam.description && (
                                    <div className="text-sm text-purple-600 mt-1">
                                      {finalExam.description}
                                    </div>
                                  )}
                                  <div className="text-xs text-purple-500 mt-2">
                                    Time Limit: {finalExam.time_limit_minutes} minutes • Passing Score: {finalExam.passing_score}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Exam Results Display */}
                            {examResults && (
                              <div className={`mb-4 p-3 rounded-lg border-2 ${
                                examResults.passed 
                                  ? 'bg-green-50 border-green-300' 
                                  : 'bg-red-50 border-red-300'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Latest Result:</span>
                                  <Badge variant={examResults.passed ? 'default' : 'destructive'}>
                                    {examResults.passed ? 'PASSED' : 'FAILED'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Exam Score:</span>
                                    <span className="font-bold ml-2">{examResults.percentage_score}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Final Grade:</span>
                                    <span className="font-bold ml-2">{examResults.final_grade}%</span>
                                  </div>
                                </div>
                                {examResults.passed && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                                    onClick={() => navigate('/course-results')}
                                  >
                                    View Results & Certificate
                                  </Button>
                                )}
                              </div>
                            )}

                            <Button
                              onClick={handleFinalExamStart}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              disabled={!modules.every(module => 
                                module.lessons.every(lesson => lesson.is_completed) &&
                                module.quizzes.every(quiz => quiz.is_completed)
                              )}
                            >
                              {modules.every(module => 
                                module.lessons.every(lesson => lesson.is_completed) &&
                                module.quizzes.every(quiz => quiz.is_completed)
                              ) ? (examResults ? 'Retake Final Exam' : 'Take Final Exam') : 'Complete Course First'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {creator && (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                        Course Creator
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={creator.avatar_url} />
                          <AvatarFallback className="text-lg bg-gradient-to-r from-orange-100 to-purple-100">
                            {creator.full_name?.split(' ').map(n => n[0]).join('') || 'IN'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{creator.full_name || 'Anonymous'}</h3>
                          <p className="text-sm text-gray-600">Course Creator</p>
                        </div>
                      </div>
                      
                      {creator.bio && (
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          {creator.bio}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={handleCreatorProfileClick}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="lg:col-span-8">
                {currentLesson ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={() => previousLesson && navigateToLesson(previousLesson)}
                        disabled={!previousLesson}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {previousLesson ? `Previous: ${previousLesson.lesson.title}` : 'No Previous Lesson'}
                      </Button>
                      
                      {nextContent ? (
                        <Button
                          onClick={handleNextLesson}
                          disabled={blockedContent.includes(nextContent.content.id)}
                          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                        >
                          {nextContent.type === 'quiz' ? (
                            <>
                              <Award className="h-4 w-4" />
                              {`Next: Quiz - ${nextContent.content.title}`}
                            </>
                          ) : (
                            <>
                              {`Next: ${nextContent.content.title}`}
                              <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                          {blockedContent.includes(nextContent.content.id) && <Lock className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Course Complete!
                        </Badge>
                      )}
                    </div>

                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                      {renderLessonContent()}
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome to the Course
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Select a lesson from the course outline to begin your learning journey
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 leading-relaxed">{course?.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>

      <FloatingAIAssistant 
        lessonTitle={currentLesson?.title}
        lessonContent={currentLesson?.content as string}
      />

      {currentQuiz && (
        <QuizInstructionsModal
          isOpen={isQuizInstructionsOpen}
          onClose={() => setIsQuizInstructionsOpen(false)}
          quiz={currentQuiz}
          onStartQuiz={() => handleQuizInstructionsStart(currentQuiz)}
        />
      )}

      {currentQuiz && (
        <QuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          quiz={currentQuiz}
          onComplete={handleQuizComplete}
        />
      )}

      {quizResults && (
        <QuizResultsModal
          isOpen={isQuizResultsOpen}
          onClose={() => setIsQuizResultsOpen(false)}
          quiz={quizResults.quiz}
          score={quizResults.score}
          passed={quizResults.passed}
          onRetake={handleRetakeQuiz}
          onProceed={handleProceedAfterQuiz}
          hasNextContent={!!nextContent}
        />
      )}

      {finalExam && (
        <FinalExamModal
          isOpen={isFinalExamModalOpen}
          onClose={() => setIsFinalExamModalOpen(false)}
          exam={finalExam}
          enrollmentId={enrollment?.id || ''}
          onComplete={handleFinalExamComplete}
        />
      )}

      {finalExamResults && (
        <FinalExamResultsModal
          isOpen={isFinalExamResultsOpen}
          onClose={() => setIsFinalExamResultsOpen(false)}
          examScore={finalExamResults.examScore}
          quizScores={finalExamResults.quizScores}
          finalGrade={finalExamResults.finalGrade}
          passed={finalExamResults.passed}
          courseName={course?.title || ''}
          studentName={user?.user_metadata?.full_name || 'Student'}
          enrollmentId={enrollment?.id || ''}
          onRetake={handleFinalExamRetake}
        />
      )}
    </div>
  );
};

export default CourseLearningPage;
