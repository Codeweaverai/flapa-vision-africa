import React, { useState, useEffect, useRef } from 'react';
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
  Play, 
  Clock, 
  User, 
  BookOpen, 
  Award, 
  Star, 
  Users,
  MessageCircle,
  Target,
  CheckCircle,
  StickyNote,
  CheckCircle2,
  GraduationCap,
  Eye,
  FileText
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

interface Course {
  id?: string;
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
  last_accessed_module_id?: string;
  last_accessed_lesson_id?: string;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface LearningOutcome {
  id: string;
  course_id: string;
  outcome: string;
  created_at: string;
  updated_at: string;
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

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface ExamResult {
  id: string;
  passed: boolean;
  score: number;
  final_grade: number;
  quiz_scores: number[];
  attempt_number: number;
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
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
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
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [hasPassedExam, setHasPassedExam] = useState(false);
  const [canRetakeExam, setCanRetakeExam] = useState(false);
  const [showFinalExamModal, setShowFinalExamModal] = useState(false);
  const [showResumeButton, setShowResumeButton] = useState(false);
  const [resumeLesson, setResumeLesson] = useState<CourseLesson | null>(null);
  
  const lessonCompletedRef = useRef<Record<string, boolean>>({});
  const isEnrolled = enrollment?.payment_status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;
  const isNotComplete = progressPercentage < 100;
  const hasLessons = modules.some(module => module.lessons.length > 0);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      if (user?.id) {
        fetchEnrollmentData();
        fetchProgress();
        fetchCompletedLessons();
      }
    } else {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    if (isEnrolled && modules.length > 0 && !selectedLesson) {
      if (progress?.last_accessed_lesson_id) {
        const lastLesson = modules.flatMap(m => m.lessons)
          .find(l => l.id === progress.last_accessed_lesson_id);
        
        if (lastLesson) {
          setResumeLesson(lastLesson);
          setShowResumeButton(true);
          return;
        }
      }
      
      const firstLesson = modules[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
        setCurrentLessonId(firstLesson.id);
      }
    }
  }, [isEnrolled, modules, progress, selectedLesson]);

  useEffect(() => {
    const completedMap = completedLessons.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    lessonCompletedRef.current = completedMap;
  }, [completedLessons]);

  useEffect(() => {
    if (isEnrolled && selectedLesson) {
      supabase
        .from('course_progress')
        .upsert({
          user_id: user?.id,
          course_id: courseId,
          last_accessed_module_id: selectedLesson.module_id,
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

  const fetchCourseData = async () => {
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

      setCourse(courseData as Course);

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

          return {
            ...module,
            lessons: lessonsData as CourseLesson[],
          };
        })
      );
      
      setModules(modulesWithLessons);

      const { count: enrolledCount, error: enrollCountError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact' })
        .eq('course_id', courseId);

      if (enrollCountError) throw enrollCountError;
      setEnrollmentCount(enrolledCount || 0);

      const { data: ratingData, error: ratingError } = await supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', courseId);

      if (ratingError) throw ratingError;

      const ratings = ratingData?.map((review) => review.rating) || [];
      const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
      const avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;
      setAverageRating(avgRating);
      setReviewCount(ratings.length);

      const { data: outcomesData, error: outcomesError } = await supabase
        .from('course_learning_outcomes')
        .select('*')
        .eq('course_id', courseId);

      if (outcomesError) throw outcomesError;
      setLearningOutcomes(outcomesData as LearningOutcome[]);

      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle();

      if (examError) throw examError;
      if (examData) setFinalExam(examData as FinalExam);

      if (courseData?.creator_id) {
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', courseData.creator_id)
          .maybeSingle();

        if (instructorError) throw instructorError;
        if (instructorData) setInstructor(instructorData as Profile);
      }
    } catch (error) {
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async () => {
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      currentUser = sessionUser;
    }

    if (!currentUser?.id || !courseId) return;
    
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;
      setEnrollment(enrollmentData as CourseEnrollment);
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    }
  };

  const fetchProgress = async () => {
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      currentUser = sessionUser;
    }

    if (!currentUser?.id || !courseId) return;
    
    try {
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (progressError) throw progressError;
      if (progressData) setProgress(progressData as ProgressData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };

  const fetchCompletedLessons = async () => {
    if (!user || !enrollment) return;
    
    try {
      const { data: completedData, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      if (error) throw error;
      const completedIds = completedData?.map(item => item.lesson_id) || [];
      setCompletedLessons(completedIds);
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
    }
  };

  const updateCourseProgress = async (progressPercentage: number) => {
    if (!user || !courseId) return;

    try {
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
      await fetchProgress();
    } catch (error) {
      console.error('Error updating course progress:', error);
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

      for (const lessonId of allLessonIds) {
        const { error } = await supabase
          .from('lesson_progress')
          .upsert({
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
            is_completed: true,
            completion_date: new Date().toISOString()
          }, {
            onConflict: 'enrollment_id,lesson_id'
          });

        if (error) {
          console.error('Error marking lesson complete:', error);
        }
      }

      await updateCourseProgress(100);
      await fetchCompletedLessons();
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

  const handleStartLearning = () => {
    if (modules.length > 0 && modules[0].lessons.length > 0) {
      const firstLesson = modules[0].lessons[0];
      setSelectedLesson(firstLesson);
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

  const handleVideoProgress = (progress: { played: number, playedSeconds: number }) => {
    setCurrentVideoTime(progress.playedSeconds);
    
    if (progress.playedSeconds > 0 && (selectedLesson || modules[0]?.lessons[0]) && isEnrolled) {
      const currentLesson = selectedLesson || modules[0]?.lessons[0];
      const watchPercentage = progress.played * 100;
      
      if (watchPercentage > 80 && currentLesson && !lessonCompletedRef.current[currentLesson.id]) {
        lessonCompletedRef.current[currentLesson.id] = true;
        
        supabase
          .from('lesson_progress')
          .upsert({
            enrollment_id: enrollment?.id,
            lesson_id: currentLesson.id,
            is_completed: true,
            completion_date: new Date().toISOString()
          }, {
            onConflict: 'enrollment_id,lesson_id'
          })
          .then(() => {
            fetchCompletedLessons();
            const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
            const completedCount = [...new Set([...completedLessons, currentLesson.id])].length;
            const progressPercentage = Math.round((completedCount / totalLessons) * 100);
            updateCourseProgress(progressPercentage);
          });
      }
    }
  };

  const handleSeekTo = (time: number) => {
    setCurrentVideoTime(time);
  };

  const navigateToCourseResults = () => {
    navigate(`/course/${courseId}/results`);
  };

  const handleExamComplete = (result: any) => {
    setShowExamModal(false);
    
    const examResult: ExamResult = {
      id: result.id || '',
      passed: result.passed,
      score: result.score,
      final_grade: result.final_grade,
      quiz_scores: Array.isArray(result.quiz_scores) ? result.quiz_scores : [],
      attempt_number: result.attempt_number
    };
    
    setExamResult(examResult);
    setHasPassedExam(result.passed);
    setCanRetakeExam(!result.passed);
    setShowFinalExamModal(true);
    
    fetchCourseData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid course URL</h1>
          <p className="text-gray-600 mb-4">The course ID is missing from the URL.</p>
          <Link to="/explore-courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <Link to="/explore-courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {showResumeButton && resumeLesson && (
          <div className="mb-4">
            <Button 
              onClick={handleResumeLearning}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume where you left off: {resumeLesson.title}
            </Button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{course.category}</Badge>
            <Badge variant="outline">{course.difficulty_level}</Badge>
            {course.is_free && <Badge className="bg-green-500">Free</Badge>}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{course.summary}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{course.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>{modules.length} modules</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{enrollmentCount} students</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)} ({reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {isEnrolled && (
          <Card className="mb-8 bg-gradient-to-r from-orange-100 to-purple-100 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Progress</h3>
                <span className="text-2xl font-bold text-orange-600">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Keep going! You're doing great.
                </p>
                <div className="flex gap-2">
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
                      {markingComplete ? 'Marking Complete...' : 'Mark All Lessons Complete'}
                    </Button>
                  )}
                  
                  {(!hasLessons || progressPercentage === 100) && finalExam && (
                    <Button
                      onClick={handleTakeExam}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Take Final Exam
                    </Button>
                  )}

                  {progressPercentage === 100 && (
                    <Button
                      onClick={navigateToCourseResults}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Course Results
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedCourseModuleList 
                  modules={modules}
                  courseId={courseId!}
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

          <div className="lg:col-span-7">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="lesson-notes" className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                {isEnrolled ? (
                  <Card>
                    <CardContent className="p-6">
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
                        onClick={() => window.location.href = `/course/${courseId}/enroll`}
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
                        onClick={() => window.location.href = `/course/${courseId}/enroll`}
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
                        onClick={() => window.location.href = `/course/${courseId}/enroll`}
                      >
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="reviews">
                <CourseReviewsTab courseId={courseId!} />
              </TabsContent>
              
              <TabsContent value="discussion">
                <LessonDiscussionTab lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <FloatingAILearningAssistant 
          courseId={courseId!}
          lessonId={selectedLesson?.id || modules[0]?.lessons[0]?.id || ''}
          lessonTitle={selectedLesson?.title || modules[0]?.lessons[0]?.title || ''}
          lessonContent={typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
            ? (selectedLesson?.content || modules[0]?.lessons[0]?.content || '')
            : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content || {})}
        />

        {!isEnrolled && (
          <Card className="mt-8 sticky bottom-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {course.is_free ? 'Free' : `$${course.price}`}
                  </div>
                  {!course.is_free && (
                    <p className="text-sm text-gray-600">One-time payment</p>
                  )}
                </div>
                {user ? (
                  <div className="flex gap-2">
                    {!course.is_free && (
                      <AddToCartButton
                        itemType="course"
                        itemId={courseId!}
                        itemName={course.title}
                        price={course.price || 0}
                      />
                    )}
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      onClick={() => window.location.href = `/course/${courseId}/enroll`}
                    >
                      {course.is_free ? 'Enroll for Free' : 'Enroll Now'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Sign in to Enroll
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {instructor && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Instructor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={instructor.avatar_url || undefined} />
                  <AvatarFallback>
                    {instructor.full_name?.charAt(0) || 'I'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{instructor.full_name}</h4>
                  <p className="text-sm text-gray-600">Course Creator</p>
                </div>
              </div>
              
              {instructor.bio && (
                <p className="text-sm text-gray-700">{instructor.bio}</p>
              )}
              
              <div className="flex gap-2">
                <Link to={`/creator/profile/${instructor.id}`}>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                </Link>
                <Link to={`/inbox?username=${instructor.username || instructor.full_name}`}>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Send Message
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  );
};

export default CourseLearningPage;
