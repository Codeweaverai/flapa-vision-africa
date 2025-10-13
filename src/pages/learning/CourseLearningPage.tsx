import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactPlayer from 'react-player';
import { 
  Play, Clock, User, BookOpen, Award, Star, Users,
  MessageCircle, Target, CheckCircle, StickyNote,
  CheckCircle2, GraduationCap, Eye, FileText, ChevronUp, ChevronDown,
  Zap, Bookmark, Share, Download, Crown, Rocket, Trophy, Sparkles,
  Menu, X, HelpCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import EnhancedCourseModuleList from '@/components/course/EnhancedCourseModuleList';
import CourseReviewsTab from '@/components/course/CourseReviewsTab';
import LessonDiscussionTab from '@/components/course/LessonDiscussionTab';
import AddToCartButton from '@/components/cart/AddToCartButton';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import FinalExamModal from '@/components/course/FinalExamModal';
import QuizModal from '@/components/course/QuizModal';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import QuizResultsModal from '@/components/course/QuizResultsModal';
import FloatingAILearningAssistant from '@/components/learning/FloatingAILearningAssistant';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import Layout from '@/components/layout/Layout';
import PriceDisplay from '@/components/currency/PriceDisplay';

// Beautiful Loading Animation Component
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
                Loading Your Course
              </h3>
              <p className="text-muted-foreground text-lg">
                Preparing your learning experience...
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

// ... (keep all existing interfaces the same)

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url?: string;
  category: string;
  price: number;
  is_free: boolean;
  creator_id: string;
  duration_minutes: number;
  difficulty_level: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  certificate_enabled: boolean;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: any;
  content_type: string;
  video_url?: string;
  materials_urls: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
  is_complete?: boolean;
  duration_minutes?: number;
  has_quiz?: boolean;
  quiz_id?: string;
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  payment_status: string;
}

interface ProgressData {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  last_accessed_lesson_id?: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface FinalExam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  created_at: string;
  updated_at: string;
}

interface ExamResult {
  id: string;
  enrollment_id: string;
  exam_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  attempts: number;
}

const CourseLearningPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const courseId = params.courseId || params.id;
  
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [instructor, setInstructor] = useState<Profile | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string>('');
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showQuizResultsModal, setShowQuizResultsModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLesson, setResumeLesson] = useState<CourseLesson | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [secondaryTab, setSecondaryTab] = useState('transcripts');
  
  const isEnrolled = enrollment?.payment_status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;
  const isNotComplete = progressPercentage < 100;
  const hasLessons = modules.some(module => module.lessons.length > 0);
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
  const isCourseCompleted = progressPercentage === 100;
  const hasPassedExam = examResult?.passed;
  const isFirstExamAttempt = !examResult;
  const showTakeExamButton = isCourseCompleted && finalExam && isFirstExamAttempt;
  const showRetakeExamButton = isCourseCompleted && finalExam && examResult && !hasPassedExam;
  const showViewCertificateButton = isCourseCompleted && (!finalExam || hasPassedExam);

  const calculateCourseProgress = (completed: string[], total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed.length / total) * 100);
  };

  const syncCourseProgress = async () => {
    if (!user || !courseId || !enrollment) return;

    try {
      const { data: completedData, error: completedError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      if (completedError) throw completedError;

      const completedLessonIds = completedData?.map(item => item.lesson_id) || [];
      const progressPercentage = calculateCourseProgress(completedLessonIds, totalLessons);

      setCompletedLessons(completedLessonIds);
      
      const { error: progressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (progressError) throw progressError;

      const { data: progressData } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      setProgress(progressData);
    } catch (error) {
      console.error('Error syncing course progress:', error);
    }
  };

  // Load exam result
  const loadExamResult = async () => {
    if (!enrollment || !finalExam) return;

    try {
      const { data: examResultData, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('exam_id', finalExam.id)
        .maybeSingle();

      if (error) throw error;
      setExamResult(examResultData);
    } catch (error) {
      console.error('Error loading exam result:', error);
    }
  };

  // Load data only once
  useEffect(() => {
    const loadData = async () => {
      if (!courseId || dataLoaded) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();

        if (courseError) throw courseError;
        if (!courseData) {
          setCourse(null);
          setLoading(false);
          return;
        }

        setCourse(courseData);

        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        const modulesWithLessons = await Promise.all(
          (modulesData as CourseModule[]).map(async (module) => {
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('order_index', { ascending: true });

            if (lessonsError) return { ...module, lessons: [] };
            
            // Check for quizzes for each lesson
            const lessonsWithQuizInfo = await Promise.all(
              (lessonsData as CourseLesson[]).map(async (lesson) => {
                const { data: quizData } = await supabase
                  .from('quizzes')
                  .select('id')
                  .eq('lesson_id', lesson.id)
                  .maybeSingle();

                return {
                  ...lesson,
                  has_quiz: !!quizData,
                  quiz_id: quizData?.id
                };
              })
            );

            return { ...module, lessons: lessonsWithQuizInfo };
          })
        );
        
        setModules(modulesWithLessons);

        const [
          enrolledCount,
          ratingData,
          examData,
          instructorData
        ] = await Promise.all([
          supabase
            .from('course_enrollments')
            .select('*', { count: 'exact' })
            .eq('course_id', courseId),
          supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', courseId),
          supabase
            .from('final_exams')
            .select('*')
            .eq('course_id', courseId)
            .maybeSingle(),
          courseData.creator_id ? 
            supabase
              .from('profiles')
              .select('*')
              .eq('id', courseData.creator_id)
              .maybeSingle() : 
            Promise.resolve({ data: null, error: null })
        ]);

        setEnrollmentCount(enrolledCount.count || 0);

        const ratings = ratingData.data?.map((review) => review.rating) || [];
        const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
        const avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;
        setAverageRating(avgRating);
        setReviewCount(ratings.length);
        if (examData.data) setFinalExam(examData.data);
        if (instructorData.data) setInstructor(instructorData.data);

        if (user?.id) {
          const [enrollmentData, progressData] = await Promise.all([
            supabase
              .from('course_enrollments')
              .select('*')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .maybeSingle(),
            supabase
              .from('course_progress')
              .select('*')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .maybeSingle()
          ]);

          setEnrollment(enrollmentData.data);
          setProgress(progressData.data);

          if (enrollmentData.data) {
            const { data: completedData } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('enrollment_id', enrollmentData.data.id)
              .eq('is_completed', true);
            setCompletedLessons(completedData?.map(item => item.lesson_id) || []);
          }
        }

        setDataLoaded(true);
      } catch (error) {
        toast.error('Failed to load course data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user, dataLoaded]);

  useEffect(() => {
    if (finalExam && enrollment) {
      loadExamResult();
    }
  }, [finalExam, enrollment]);

  useEffect(() => {
    if (isEnrolled && selectedLesson) {
      supabase
        .from('course_progress')
        .upsert({
          user_id: user?.id,
          course_id: courseId,
          last_accessed_lesson_id: selectedLesson.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        })
        .then(({ error }) => {
          if (error) console.error('Error updating last accessed:', error);
        });
    }
  }, [selectedLesson, isEnrolled]);

  useEffect(() => {
    if (isEnrolled && modules.length > 0 && !selectedLesson && !loading) {
      const determineInitialLesson = () => {
        if (progress?.last_accessed_lesson_id) {
          const lastLesson = modules.flatMap(m => m.lessons)
            .find(l => l.id === progress.last_accessed_lesson_id);
          if (lastLesson) {
            setResumeLesson(lastLesson);
            setShowResumeModal(true);
            return lastLesson;
          }
        }

        const firstIncomplete = modules.flatMap(m => m.lessons)
          .find(l => !completedLessons.includes(l.id));
        if (firstIncomplete) return firstIncomplete;

        return modules[0]?.lessons?.[0];
      };

      const initialLesson = determineInitialLesson();
      if (initialLesson) {
        setSelectedLesson(initialLesson);
        setCurrentLessonId(initialLesson.id);
      }
    }
  }, [isEnrolled, modules, progress, completedLessons, loading]);

  const handleVideoProgress = async (progress: { played: number, playedSeconds: number }) => {
    setCurrentVideoTime(progress.playedSeconds);
    
    if (!selectedLesson || !isEnrolled || !enrollment) return;

    const watchPercentage = progress.played * 100;
    
    if (watchPercentage > 80 && !completedLessons.includes(selectedLesson.id)) {
      try {
        const { error } = await supabase
          .from('lesson_progress')
          .upsert({
            enrollment_id: enrollment.id,
            lesson_id: selectedLesson.id,
            is_completed: true,
            completion_date: new Date().toISOString(),
            last_position_seconds: Math.floor(progress.playedSeconds)
          }, {
            onConflict: 'enrollment_id,lesson_id'
          });

        if (error) throw error;
        await syncCourseProgress();

        // Auto-show quiz if lesson has one and was just completed
        if (selectedLesson.has_quiz && selectedLesson.quiz_id) {
          setTimeout(() => {
            setCurrentQuizId(selectedLesson.quiz_id!);
            setShowQuizModal(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error updating lesson progress:', error);
      }
    }
  };

  const markAllLessonsComplete = async () => {
    if (!user || !courseId || !modules.length || !enrollment) {
      toast.error('Unable to mark lessons complete');
      return;
    }

    setMarkingComplete(true);
    try {
      const allLessonIds = modules.flatMap(module => 
        module.lessons.map(lesson => lesson.id)
      );

      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          allLessonIds.map(lessonId => ({
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
            is_completed: true,
            completion_date: new Date().toISOString()
          })), {
            onConflict: 'enrollment_id,lesson_id'
          }
        );

      if (error) throw error;
      await syncCourseProgress();
      toast.success('All lessons marked as complete!');
    } catch (error) {
      console.error('Error marking lessons complete:', error);
      toast.error('Failed to mark lessons complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleResumeLearning = () => {
    if (resumeLesson) {
      setSelectedLesson(resumeLesson);
      setCurrentLessonId(resumeLesson.id);
      setShowResumeModal(false);
    }
  };

  const handleStartFromBeginning = () => {
    const firstLesson = modules[0]?.lessons?.[0];
    if (firstLesson) {
      setSelectedLesson(firstLesson);
      setCurrentLessonId(firstLesson.id);
      setShowResumeModal(false);
    }
  };

  const handleTakeExam = () => {
    setShowExamModal(true);
  };

  const handleQuizStart = (quizId: string, lessonId: string) => {
    setCurrentQuizId(quizId);
    setCurrentLessonId(lessonId);
    setShowQuizModal(true);
  };

  const handleQuizComplete = (quiz: any, score: number, passed: boolean) => {
    setCurrentQuiz(quiz);
    setQuizScore(score);
    setQuizPassed(passed);
    setShowQuizModal(false);
    setShowQuizResultsModal(true);
  };

  const handleRetakeQuiz = () => {
    setShowQuizResultsModal(false);
    setShowQuizModal(true);
  };

  const handleLessonSelect = (lesson: CourseLesson) => {
    setCurrentLessonId(lesson.id);
    setSelectedLesson(lesson);
    setIsMobileSidebarOpen(false);
  };

  const handleSeekTo = (time: number) => {
    setCurrentVideoTime(time);
  };

  const navigateToCourseResults = () => {
    navigate(`/course/${courseId}/results`);
  };

  const handleExamComplete = async (result: any) => {
    setShowExamModal(false);
    await loadExamResult(); // Reload exam result after completion
  };

  // Use the beautiful loading animation
  if (loading) {
    return <PulseLoading />;
  }

  if (!courseId) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid course URL</h1>
            <p className="text-gray-600 mb-4">The course ID is missing from the URL.</p>
            <Link to="/explore-courses">
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Browse Courses
              </Button>
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <Link to="/explore-courses">
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Browse Courses
              </Button>
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="flex-grow bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Simplified Header Section */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-700">{course.category}</Badge>
              <Badge variant="outline" className="text-sm border-orange-200 text-orange-600">{course.difficulty_level}</Badge>
              {course.is_free && <Badge className="bg-green-500 text-sm">Free</Badge>}
              {course.certificate_enabled && <Badge className="bg-purple-500 text-sm flex items-center gap-1"><Award className="h-3 w-3" /> Certificate</Badge>}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{course.title}</h1>
          </div>

          {/* Progress Section */}
          {isEnrolled && (
            <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Learning Progress</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {progressPercentage < 50 ? 'Keep going! You\'re doing great.' : 
                       progressPercentage < 80 ? 'You\'re making excellent progress!' :
                       'Almost there! Finish strong!'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                      {progressPercentage}%
                    </span>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                
                <Progress value={progressPercentage} className="h-3 bg-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </Progress>

                <div className="flex flex-wrap gap-3 mt-4">
                  {isNotComplete && hasLessons && (
                    <Button
                      onClick={markAllLessonsComplete}
                      disabled={markingComplete}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {markingComplete ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {markingComplete ? 'Processing...' : 'Mark All Complete'}
                    </Button>
                  )}
                  
                  {showTakeExamButton && (
                    <Button
                      onClick={handleTakeExam}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Take Final Exam
                    </Button>
                  )}

                  {showRetakeExamButton && (
                    <Button
                      onClick={handleTakeExam}
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Retake Final Exam
                    </Button>
                  )}

                  {showViewCertificateButton && (
                    <Button
                      onClick={navigateToCourseResults}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      View Certificate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {isMobileSidebarOpen ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <Menu className="h-4 w-4 mr-2" />
              )}
              {isMobileSidebarOpen ? 'Close Curriculum' : 'Show Curriculum'}
            </Button>
          </div>

          {/* Main Content Grid - Reduced main content width */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Sidebar - Course Curriculum - Increased Width with Better Spacing */}
            <div className={`xl:col-span-1 ${isMobileSidebarOpen ? 'block' : 'hidden'} xl:block`}>
              <Card className="sticky top-8 shadow-xl border-0 h-fit min-w-[400px] mt-4 mb-8">
                <CardHeader className="p-6 border-b bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      Course Content
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="xl:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{completedLessons.length} of {totalLessons} lessons completed</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <EnhancedCourseModuleList 
                    modules={modules}
                    courseId={courseId}
                    creatorId={course.creator_id}
                    onLessonSelect={handleLessonSelect}
                    currentLessonId={currentLessonId}
                    completedLessons={completedLessons}
                    onQuizStart={handleQuizStart}
                    onFinalExamStart={() => setShowExamModal(true)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area - Reduced Width to prevent overlay */}
            <div className="xl:col-span-3 max-w-5xl">
              <Card className="shadow-xl border-0">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Single Content Tab */}
                    <TabsList className="w-full h-12 bg-slate-50/50 p-1 rounded-t-lg">
                      <TabsTrigger 
                        value="content" 
                        className="w-full text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 transition-all duration-200"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Content
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="p-6 m-0">
                      {isEnrolled ? (
                        selectedLesson || modules[0]?.lessons[0] ? (
                          <div className="space-y-6">
                            {/* Lesson Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                  {selectedLesson?.title || modules[0]?.lessons[0]?.title}
                                </h2>
                                {selectedLesson?.description && (
                                  <p className="text-gray-600 text-lg">
                                    {selectedLesson.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedLesson && completedLessons.includes(selectedLesson.id) && (
                                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed
                                  </Badge>
                                )}
                                {selectedLesson?.has_quiz && (
                                  <Badge className="bg-blue-500 text-white flex items-center gap-1">
                                    <HelpCircle className="h-3 w-3" />
                                    Quiz Available
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Video Player */}
                            {(selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url) && (
                              <div className="space-y-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                                  <ReactPlayer
                                    url={selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url}
                                    width="100%"
                                    height="100%"
                                    controls={true}
                                    config={{
                                      file: {
                                        attributes: {
                                          controlsList: 'nodownload'
                                        }
                                      }
                                    }}
                                    onProgress={handleVideoProgress}
                                    progressInterval={1000}
                                    light={course.thumbnail_url}
                                    playing={false}
                                  />
                                </div>
                                
                                {/* Video Controls */}
                                <div className="flex flex-wrap gap-3">
                                  <Button variant="outline" size="sm">
                                    <Bookmark className="h-4 w-4 mr-2" />
                                    Bookmark
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Share className="h-4 w-4 mr-2" />
                                    Share
                                  </Button>
                                  {selectedLesson?.has_quiz && selectedLesson.quiz_id && (
                                    <Button 
                                      onClick={() => handleQuizStart(selectedLesson.quiz_id!, selectedLesson.id)}
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-2" />
                                      Take Quiz
                                    </Button>
                                  )}
                                </div>

                                {/* Secondary Tabs Below Video Player */}
                                <div className="border border-gray-200 rounded-lg mt-6">
                                  <Tabs value={secondaryTab} onValueChange={setSecondaryTab} className="w-full">
                                    <TabsList className="w-full grid grid-cols-4 h-12 bg-gray-50/50 p-1">
                                      <TabsTrigger value="transcripts" className="text-sm">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Transcript
                                      </TabsTrigger>
                                      <TabsTrigger value="notes" className="text-sm">
                                        <StickyNote className="h-4 w-4 mr-2" />
                                        Notes
                                      </TabsTrigger>
                                      <TabsTrigger value="reviews" className="text-sm">
                                        <Star className="h-4 w-4 mr-2" />
                                        Reviews
                                      </TabsTrigger>
                                      <TabsTrigger value="discussion" className="text-sm">
                                        <Users className="h-4 w-4 mr-2" />
                                        Discussion
                                      </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="transcripts" className="p-4">
                                      <VideoTranscripts 
                                        lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} 
                                        currentTime={currentVideoTime}
                                        onSeekTo={handleSeekTo}
                                        showHeader={false}
                                      />
                                    </TabsContent>
                                    
                                    <TabsContent value="notes" className="p-4">
                                      <LessonNotesTab 
                                        lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} 
                                      />
                                    </TabsContent>
                                    
                                    <TabsContent value="reviews" className="p-4">
                                      <CourseReviewsTab courseId={courseId} />
                                    </TabsContent>
                                    
                                    <TabsContent value="discussion" className="p-4">
                                      <LessonDiscussionTab lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} />
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </div>
                            )}

                            {/* Lesson Content - Improved Section */}
                            {(selectedLesson?.content || modules[0]?.lessons[0]?.content) && (
                              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mt-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <FileText className="h-6 w-6 text-orange-500" />
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Lesson Materials</h3>
                                    <p className="text-gray-600 text-sm">
                                      Supplementary resources and materials to enhance your learning experience
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="prose prose-lg max-w-none bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  {typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
                                    ? (selectedLesson?.content || modules[0]?.lessons[0]?.content)
                                    : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content)
                                  }
                                </div>
                                
                                {selectedLesson?.materials_urls && selectedLesson.materials_urls.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Downloadable Resources</h4>
                                    <div className="space-y-2">
                                      {selectedLesson.materials_urls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                                          <Download className="h-4 w-4" />
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            Resource {index + 1}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 text-lg">This course doesn't have any lessons yet</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Crown className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Enroll to Access Content</h3>
                          <p className="text-gray-600 mb-6">Join thousands of students learning this course</p>
                          <Button 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-lg px-8 py-3 shadow-lg transition-all duration-200"
                            onClick={() => navigate(`/course/${courseId}/enroll`)}
                          >
                            <Rocket className="h-5 w-5 mr-2" />
                            Enroll Now
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enrollment Card for Non-Enrolled Users */}
          {!isEnrolled && (
            <Card className="mt-8 sticky bottom-6 shadow-2xl border-0 bg-gradient-to-r from-orange-50 to-purple-50 z-10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {course.is_free ? 'Free' : (
                        <PriceDisplay 
                          amount={course.price} 
                          originalCurrency="USD" 
                          className="text-orange-600"
                        />
                      )}
                    </div>
                    <p className="text-gray-600">Lifetime access • Certificate included</p>
                  </div>
                  {user ? (
                    <div className="flex gap-3">
                      {!course.is_free && (
                        <AddToCartButton
                          itemType="course"
                          itemId={courseId}
                          itemName={course.title}
                          price={course.price || 0}
                          size="lg"
                        />
                      )}
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-lg px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                        size="lg"
                        onClick={() => navigate(`/course/${courseId}/enroll`)}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {course.is_free ? 'Enroll Free' : 'Enroll Now'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-lg px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                      size="lg"
                      onClick={() => navigate('/auth')}
                    >
                      Sign in to Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Courses */}
          <div className="mt-12">
            <RecommendedCourses 
              currentCourseId={course.id} 
              category={course.category} 
            />
          </div>
        </div>

        {/* AI Learning Assistant */}
        <FloatingAILearningAssistant 
          courseId={courseId}
          lessonId={selectedLesson?.id || modules[0]?.lessons[0]?.id || ''}
          lessonTitle={selectedLesson?.title || modules[0]?.lessons[0]?.title || ''}
          lessonContent={typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
            ? (selectedLesson?.content || modules[0]?.lessons[0]?.content || '')
            : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content || {})}
        />
      </main>

      {/* Resume Learning Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-orange-50 to-purple-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              {isCourseCompleted ? 'Course Completed!' : 'Continue Learning?'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            {isCourseCompleted ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Congratulations! 🎉</h3>
                <p className="text-gray-600">
                  {finalExam 
                    ? "You've completed all lessons! Ready to take the final exam and earn your certificate?"
                    : "You've successfully completed this course! You can now generate your certificate."
                  }
                </p>
                {examResult && !hasPassedExam && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Previous exam score: {examResult.score}%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Welcome Back!</h3>
                <p className="text-gray-600">
                  Continue from where you left off or start from the beginning.
                </p>
                {resumeLesson && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                    <p className="font-medium text-gray-900">{resumeLesson.title}</p>
                    <p className="text-sm text-gray-600 mt-1">Your last watched lesson</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isCourseCompleted ? (
              <>
                <Button
                  onClick={() => setShowResumeModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  Review Course
                </Button>
                {showTakeExamButton && (
                  <Button
                    onClick={handleTakeExam}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    Take Final Exam
                  </Button>
                )}
                {showRetakeExamButton && (
                  <Button
                    onClick={handleTakeExam}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg"
                  >
                    Retake Exam
                  </Button>
                )}
                {showViewCertificateButton && (
                  <Button
                    onClick={navigateToCourseResults}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    View Certificate
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleStartFromBeginning}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleResumeLearning}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Modal */}
      {finalExam && (
        <FinalExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollment?.id || ''}
          onComplete={handleExamComplete}
          previousAttempt={examResult}
        />
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        quizId={currentQuizId}
        lessonId={currentLessonId}
        onComplete={handleQuizComplete}
      />

      {/* Quiz Results Modal */}
      {currentQuiz && (
        <QuizResultsModal
          isOpen={showQuizResultsModal}
          onClose={() => setShowQuizResultsModal(false)}
          quiz={currentQuiz}
          score={quizScore}
          passed={quizPassed}
          onRetake={handleRetakeQuiz}
          onProceed={() => setShowQuizResultsModal(false)}
          hasNextContent={true}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
