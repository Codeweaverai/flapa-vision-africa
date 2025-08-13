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
import ReactPlayer from 'react-player';
import { 
  Play, Clock, User, BookOpen, Award, Star, Users,
  MessageCircle, Target, CheckCircle, StickyNote,
  CheckCircle2, GraduationCap, Eye, FileText
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
  const [showResumeButton, setShowResumeButton] = useState(false);
  const [resumeLesson, setResumeLesson] = useState<CourseLesson | null>(null);
  
  const isEnrolled = enrollment?.payment_status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;
  const isNotComplete = progressPercentage < 100;
  const hasLessons = modules.some(module => module.lessons.length > 0);
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);

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

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) {
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
            return { ...module, lessons: lessonsData as CourseLesson[] };
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
      } catch (error) {
        toast.error('Failed to load course data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user]);

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
    if (isEnrolled && modules.length > 0 && !selectedLesson) {
      const determineInitialLesson = () => {
        if (progress?.last_accessed_lesson_id) {
          const lastLesson = modules.flatMap(m => m.lessons)
            .find(l => l.id === progress.last_accessed_lesson_id);
          if (lastLesson) {
            setResumeLesson(lastLesson);
            setShowResumeButton(true);
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
  }, [isEnrolled, modules, progress, completedLessons]);

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
      setShowResumeButton(false);
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
  };

  const handleSeekTo = (time: number) => {
    setCurrentVideoTime(time);
  };

  const navigateToCourseResults = () => {
    navigate(`/course/${courseId}/results`);
  };

  const handleExamComplete = (result: any) => {
    setShowExamModal(false);
    fetchCourseData();
  };

  const fetchCourseData = async () => {
    if (!courseId) return;
    
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseData) setCourse(courseData);
  };

  if (loading) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </main>
      </Layout>
    );
  }

  if (!courseId) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid course URL</h1>
            <p className="text-gray-600 mb-4">The course ID is missing from the URL.</p>
            <Link to="/explore-courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <Link to="/explore-courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="flex-grow bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Resume Button */}
          {showResumeButton && resumeLesson && (
            <div className="mb-4">
              <Button 
                onClick={handleResumeLearning}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                size="sm"
              >
                <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Resume: {resumeLesson.title.length > 20 ? 
                  `${resumeLesson.title.substring(0, 20)}...` : 
                  resumeLesson.title}
              </Button>
            </div>
          )}

          {/* Course Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <Badge variant="secondary" className="text-xs sm:text-sm">{course.category}</Badge>
              <Badge variant="outline" className="text-xs sm:text-sm">{course.difficulty_level}</Badge>
              {course.is_free && <Badge className="bg-green-500 text-xs sm:text-sm">Free</Badge>}
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">{course.title}</h1>
            <p className="text-base sm:text-xl text-gray-600 mb-4 sm:mb-6">{course.summary}</p>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-600">
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{course.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{modules.length} mods</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{enrollmentCount}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)} ({reviewCount})</span>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          {isEnrolled && (
            <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-orange-100 to-purple-100 border-0">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold">Your Progress</h3>
                  <span className="text-xl sm:text-2xl font-bold text-orange-600">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2 sm:h-3" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 gap-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Keep going! You're doing great.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {isNotComplete && hasLessons && (
                      <Button
                        onClick={markAllLessonsComplete}
                        disabled={markingComplete}
                        size="xs"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        {markingComplete ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {markingComplete ? 'Processing...' : 'Mark Complete'}
                      </Button>
                    )}
                    
                    {(!hasLessons || progressPercentage === 100) && finalExam && (
                    
                       <Button
                 onClick={handleTakeExam}
                    size="sm" // Changed from 'xs' to 'sm' for better visibility
                 className="bg-orange-600 hover:bg-orange-700 text-white text-sm py-1 px-3" // Added padding and increased text size
                >
                <GraduationCap className="h-4 w-4 mr-2" /> {/* Increased icon size */}
                 Final Exam
                  </Button>
              
                    )}

                    {progressPercentage === 100 && (
                      <Button
                        onClick={navigateToCourseResults}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-1 px-3"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Results
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Course Curriculum */}
            <div className="lg:col-span-4">
              <Card className="sticky top-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    Curriculum
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <EnhancedCourseModuleList 
                    modules={modules}
                    courseId={courseId}
                    creatorId={course.creator_id}
                    onLessonSelect={handleLessonSelect}
                    currentLessonId={currentLessonId}
                    completedLessons={completedLessons}
                    onQuizStart={handleQuizStart}
                    onFinalExamStart={() => setShowExamModal(true)}
                    mobileView={window.innerWidth < 768}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Content Tabs */}
            <div className="lg:col-span-8">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-10 sm:h-12">
                  <TabsTrigger value="content" className="text-xs sm:text-sm p-1 sm:p-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="lesson-notes" className="text-xs sm:text-sm p-1 sm:p-2">
                    <StickyNote className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="transcripts" className="text-xs sm:text-sm">Transcript</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs sm:text-sm">Reviews</TabsTrigger>
                  <TabsTrigger value="discussion" className="text-xs sm:text-sm">Discuss</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-6">
                  {isEnrolled ? (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        {selectedLesson || modules[0]?.lessons[0] ? (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">
                              {selectedLesson?.title || modules[0]?.lessons[0]?.title}
                            </h3>
                            {(selectedLesson?.description || modules[0]?.lessons[0]?.description) && (
                              <p className="text-gray-600 mb-4">
                                {selectedLesson?.description || modules[0]?.lessons[0]?.description}
                              </p>
                            )}
                            {(selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url) && (
                              <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
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
                                />
                              </div>
                            )}
                            {(selectedLesson?.content || modules[0]?.lessons[0]?.content) && (
                              <div className="prose max-w-none">
                                {typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
                                  ? (selectedLesson?.content || modules[0]?.lessons[0]?.content)
                                  : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content)
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">This course doesn't have any lessons yet</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-4">Enroll in this course to access lesson content</p>
                        <Button 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          onClick={() => navigate(`/course/${courseId}/enroll`)}
                        >
                          Enroll Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="lesson-notes" className="space-y-6">
                  {isEnrolled ? (
                    <LessonNotesTab 
                      lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} 
                    />
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-4">Enroll in this course to start taking lesson notes</p>
                        <Button 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          onClick={() => navigate(`/course/${courseId}/enroll`)}
                        >
                          Enroll Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="transcripts">
                  {isEnrolled ? (
                    <VideoTranscripts 
                      lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} 
                      currentTime={currentVideoTime}
                      onSeekTo={handleSeekTo}
                    />
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-4">Enroll in this course to access video transcripts</p>
                        <Button 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          onClick={() => navigate(`/course/${courseId}/enroll`)}
                        >
                          Enroll Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="reviews">
                  <CourseReviewsTab courseId={courseId} />
                </TabsContent>
                
                <TabsContent value="discussion">
                  <LessonDiscussionTab lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Enrollment Card */}
          {!isEnrolled && (
            <Card className="mt-6 sm:mt-8 sticky bottom-4">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">
                      {course.is_free ? 'Free' : (
                        <PriceDisplay 
                          amount={course.price} 
                          originalCurrency="USD" 
                          className="text-orange-600"
                        />
                      )}
                    </div>
                    {!course.is_free && (
                      <p className="text-xs sm:text-sm text-gray-600">One-time payment</p>
                    )}
                  </div>
                  {user ? (
                    <div className="flex gap-2">
                      {!course.is_free && (
                        <AddToCartButton
                          itemType="course"
                          itemId={courseId}
                          itemName={course.title}
                          price={course.price || 0}
                          size="sm"
                        />
                      )}
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-sm"
                        size="sm"
                        onClick={() => navigate(`/course/${courseId}/enroll`)}
                      >
                        {course.is_free ? 'Enroll Free' : 'Enroll Now'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-sm"
                      size="sm"
                      onClick={() => navigate('/auth')}
                    >
                      Sign in to Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructor Card */}
          {instructor && (
            <Card className="mt-6 sm:mt-8">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Instructor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={instructor.avatar_url || undefined} />
                    <AvatarFallback>
                      {instructor.full_name?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">{instructor.full_name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Course Creator</p>
                  </div>
                </div>
                
                {instructor.bio && (
                  <p className="text-xs sm:text-sm text-gray-700">{instructor.bio}</p>
                )}
                
                <div className="flex gap-2">
                  <Link to={`/creator/profile/${instructor.id}`}>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      View Profile
                    </Button>
                  </Link>
                  <Link to={`/inbox?username=${instructor.username || instructor.full_name}`}>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Message
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Courses */}
          <div className="mt-6 sm:mt-8">
            <RecommendedCourses 
              currentCourseId={course.id} 
              category={course.category} 
            />
          </div>

          <FloatingAILearningAssistant 
            courseId={courseId}
            lessonId={selectedLesson?.id || modules[0]?.lessons[0]?.id || ''}
            lessonTitle={selectedLesson?.title || modules[0]?.lessons[0]?.title || ''}
            lessonContent={typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
              ? (selectedLesson?.content || modules[0]?.lessons[0]?.content || '')
              : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content || {})}
          />
        </div>
      </main>

      {finalExam && (
        <FinalExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollment?.id || ''}
          onComplete={handleExamComplete}
        />
      )}

      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        quizId={currentQuizId}
        lessonId={currentLessonId}
        onComplete={handleQuizComplete}
      />

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
       {/* Recommended Courses Section */}
      <div className="mt-8">
        <RecommendedCourses 
          currentCourseId={course.id} 
          category={course.category} 
        />
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
