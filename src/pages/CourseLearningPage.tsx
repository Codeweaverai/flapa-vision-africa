import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import CourseModuleList from '@/components/course/CourseModuleList';
import CourseReviews from '@/components/course/CourseReviews';
import CourseDiscussionSection from '@/components/community/CourseDiscussionSection';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import FinalExamModal from '@/components/course/FinalExamModal';

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

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
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
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      if (user) {
        fetchEnrollmentData();
        fetchProgress();
        fetchCompletedLessons();
      }
    }
  }, [courseId, user]);

  const fetchCompletedLessons = async () => {
    if (!user || !enrollment) return;
    
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      if (error) throw error;
      setCompletedLessons(data?.map(item => item.lesson_id) || []);
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
    }
  };

  const updateLessonProgress = async (lessonId: string, isCompleted: boolean = true) => {
    if (!user || !enrollment) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: isCompleted,
          completion_date: isCompleted ? new Date().toISOString() : null
        }, {
          onConflict: 'enrollment_id,lesson_id'
        });

      if (error) throw error;

      // Update local state
      if (isCompleted) {
        setCompletedLessons(prev => [...new Set([...prev, lessonId])]);
      }

      // Update course progress
      await updateCourseProgress();
      toast.success('Lesson marked as complete!');
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      toast.error('Failed to update lesson progress');
    }
  };

  const updateCourseProgress = async () => {
    if (!user || !courseId || !modules.length) return;

    const allLessons = modules.flatMap(m => m.lessons);
    const completedCount = completedLessons.length;
    const progressPercentage = Math.round((completedCount / allLessons.length) * 100);

    try {
      const { error } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (error) throw error;

      // Update local progress state
      setProgress(prev => prev ? { ...prev, progress_percentage: progressPercentage } : null);
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const isLessonUnlocked = (lesson: CourseLesson, moduleIndex: number, lessonIndex: number) => {
    // First lesson is always unlocked
    if (moduleIndex === 0 && lessonIndex === 0) return true;
    
    // Get all lessons before this one
    const allLessons = modules.flatMap(m => m.lessons);
    const currentLessonGlobalIndex = allLessons.findIndex(l => l.id === lesson.id);
    
    if (currentLessonGlobalIndex === 0) return true;
    
    // Check if previous lesson is completed
    const previousLesson = allLessons[currentLessonGlobalIndex - 1];
    return completedLessons.includes(previousLesson.id);
  };

  const handleLessonSelect = (lesson: CourseLesson) => {
    const moduleIndex = modules.findIndex(m => m.lessons.some(l => l.id === lesson.id));
    const lessonIndex = modules[moduleIndex].lessons.findIndex(l => l.id === lesson.id);
    
    if (!isLessonUnlocked(lesson, moduleIndex, lessonIndex)) {
      toast.error('Complete the previous lesson to unlock this one');
      return;
    }
    
    setCurrentLessonId(lesson.id);
    // Navigate to lesson player
    window.location.href = `/course/${courseId}/lesson/${lesson.id}`;
  };

  const handleNextLesson = () => {
    if (!currentLessonId) return;
    
    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    
    if (currentIndex < allLessons.length - 1) {
      // Mark current lesson as complete
      updateLessonProgress(currentLessonId, true);
      
      // Move to next lesson
      const nextLesson = allLessons[currentIndex + 1];
      handleLessonSelect(nextLesson);
    }
  };

  const handlePreviousLesson = () => {
    if (!currentLessonId) return;
    
    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    
    if (currentIndex > 0) {
      const previousLesson = allLessons[currentIndex - 1];
      handleLessonSelect(previousLesson);
    }
  };

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData as Course);

      // Fetch modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch lessons for each module - using correct table name 'lessons'
      const modulesWithLessons = await Promise.all(
        (modulesData as CourseModule[]).map(async (module) => {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('order_index', { ascending: true });

          if (lessonsError) {
            console.error('Error fetching lessons:', lessonsError);
            return module;
          }

          return {
            ...module,
            lessons: lessonsData as CourseLesson[],
          };
        })
      );
      setModules(modulesWithLessons);

      // Fetch enrollment count with updated table name
      const { count: enrolledCount, error: enrollCountError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact' })
        .eq('course_id', courseId);

      if (enrollCountError) throw enrollCountError;
      setEnrollmentCount(enrolledCount || 0);

      // Fetch average rating and review count
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

      // Fetch learning outcomes with updated table name
      const { data: outcomesData, error: outcomesError } = await supabase
        .from('course_learning_outcomes')
        .select('*')
        .eq('course_id', courseId);

      if (outcomesError) throw outcomesError;
      setLearningOutcomes(outcomesData as LearningOutcome[]);

      // Fetch final exam
      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (examError) {
        console.error('Error fetching final exam:', examError);
      } else {
        setFinalExam(examData as FinalExam);
      }

      // Fetch instructor profile
      if (courseData) {
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', courseData.creator_id)
          .single();

        if (instructorError) {
          console.error('Error fetching instructor profile:', instructorError);
        } else {
          setInstructor(instructorData as Profile);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('course_id', courseId)
        .eq('payment_status', 'completed') // Only allow completed payments
        .single();

      if (enrollmentError) {
        if (enrollmentError.message !== 'No rows found') {
          console.error('Error fetching enrollment data:', enrollmentError);
        }
        setEnrollment(null);
      } else {
        setEnrollment(enrollmentData as CourseEnrollment);
      }
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('course_id', courseId)
        .single();

      if (progressError) {
        setProgress(null);
      } else {
        setProgress(progressData as ProgressData);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
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

      const { error: progressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: 100,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (progressError) {
        console.error('Error updating course progress:', progressError);
      } else {
        await fetchProgress();
        await fetchCompletedLessons();
        toast.success('All lessons marked as complete!');
      }
    } catch (error) {
      console.error('Error marking lessons complete:', error);
      toast.error('Failed to mark lessons complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleStartLearning = () => {
    if (modules.length > 0 && modules[0].lessons.length > 0) {
      const firstLesson = modules[0].lessons[0];
      handleLessonSelect(firstLesson);
    }
  };

  const handleTakeExam = () => {
    setShowExamModal(true);
  };

  const enrolledUser = enrollment && enrollment.payment_status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;
  const isNotComplete = progressPercentage < 100;
  const hasLessons = modules.some(module => module.lessons.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <Link to="/explore/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show payment required message if not enrolled
  if (!enrolledUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Required</h1>
            <p className="text-lg text-gray-600 mb-6">
              You need to complete payment for this course to access the content.
            </p>
            <Link to={`/course-detail/${courseId}`}>
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Go to Course Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
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

        {/* Progress Bar */}
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
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Course Curriculum Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="bg-card rounded-lg border">
                      <div className="p-4 border-b">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Module {moduleIndex + 1}
                        </h4>
                        <h3 className="font-semibold">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isUnlocked = isLessonUnlocked(lesson, moduleIndex, lessonIndex);
                          const isCompleted = completedLessons.includes(lesson.id);
                          const isCurrent = currentLessonId === lesson.id;
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(lesson)}
                              disabled={!isUnlocked}
                              className={`w-full text-left p-3 rounded-md border transition-colors ${
                                isCurrent
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : isUnlocked
                                  ? 'hover:bg-muted border-border'
                                  : 'opacity-50 cursor-not-allowed border-border bg-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium opacity-60">
                                    {moduleIndex + 1}.{lessonIndex + 1}
                                  </span>
                                  <div>
                                    <p className="font-medium text-sm">{lesson.title}</p>
                                    {lesson.description && (
                                      <p className="text-xs opacity-60 mt-1">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCompleted && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  {!isUnlocked && (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  )}
                                  {lesson.content_type === 'video' && (
                                    <Clock className="h-4 w-4 opacity-60" />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation Buttons */}
                {currentLessonId && (
                  <div className="flex justify-between mt-6 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousLesson}
                      className="flex-1 max-w-[120px]"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNextLesson}
                      size="sm"
                      className="flex-1 max-w-[120px] bg-gradient-to-r from-orange-500 to-purple-600"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
                
                {/* Final Exam */}
                {finalExam && (
                  <div className="mt-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-orange-800">Final Exam</span>
                      </div>
                      <Badge variant="outline" className="text-orange-700">
                        {finalExam.passing_score}% to pass
                      </Badge>
                    </div>
                    <p className="text-sm text-orange-600 mt-2">{finalExam.description}</p>
                    <Button 
                      size="sm" 
                      className="mt-3 bg-orange-600 hover:bg-orange-700"
                      onClick={handleTakeExam}
                    >
                      Take Final Exam
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="lesson-notes" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="lesson-notes" className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Lesson Notes
                </TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lesson-notes" className="space-y-6">
                <LessonNotesTab 
                  lessonId={currentLessonId || modules[0]?.lessons[0]?.id || ''} 
                  currentVideoTime={0}
                />
              </TabsContent>
              
              <TabsContent value="curriculum">
                {/* Mobile-friendly curriculum view */}
                <div className="lg:hidden">
                  <div className="space-y-4">
                    {modules.map((module, moduleIndex) => (
                      <div key={module.id} className="bg-card rounded-lg border">
                        <div className="p-4 border-b">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Module {moduleIndex + 1}
                          </h4>
                          <h3 className="font-semibold">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const isUnlocked = isLessonUnlocked(lesson, moduleIndex, lessonIndex);
                            const isCompleted = completedLessons.includes(lesson.id);
                            const isCurrent = currentLessonId === lesson.id;
                            
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonSelect(lesson)}
                                disabled={!isUnlocked}
                                className={`w-full text-left p-3 rounded-md border transition-colors ${
                                  isCurrent
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : isUnlocked
                                    ? 'hover:bg-muted border-border'
                                    : 'opacity-50 cursor-not-allowed border-border bg-muted'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium opacity-60">
                                      {moduleIndex + 1}.{lessonIndex + 1}
                                    </span>
                                    <div>
                                      <p className="font-medium text-sm">{lesson.title}</p>
                                      {lesson.description && (
                                        <p className="text-xs opacity-60 mt-1">{lesson.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    {!isUnlocked && (
                                      <Lock className="h-4 w-4 text-gray-400" />
                                    )}
                                    {lesson.content_type === 'video' && (
                                      <Clock className="h-4 w-4 opacity-60" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-muted-foreground">View curriculum in the sidebar</p>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <CourseReviews courseId={courseId!} />
              </TabsContent>
              
              <TabsContent value="discussion">
                <CourseDiscussionSection courseId={courseId!} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Instructor Card */}
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

        {/* Final Exam Modal */}
        {finalExam && (
          <FinalExamModal
            isOpen={showExamModal}
            onClose={() => setShowExamModal(false)}
            exam={finalExam}
            enrollmentId={enrollment?.id || ''}
          />
        )}
      </div>
    </div>
  );
};

export default CourseLearningPage;
