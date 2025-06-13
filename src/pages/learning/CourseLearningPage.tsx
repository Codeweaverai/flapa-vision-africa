
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
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import CourseModuleList from '@/components/course/CourseModuleList';
import CourseReviews from '@/components/course/CourseReviews';
import CourseDiscussionSection from '@/components/community/CourseDiscussionSection';
import AddToCartButton from '@/components/cart/AddToCartButton';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import FinalExamModal from '@/components/course/FinalExamModal';
import VideoPlayer from '@/components/video/VideoPlayer';

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
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [instructor, setInstructor] = useState<Profile | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchEnrollmentData();
      fetchProgress();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    if (!user) return;
    
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

      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(
        (modulesData as CourseModule[]).map(async (module) => {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('order_index', { ascending: true });

          if (lessonsError) {
            console.error('Error fetching lessons:', lessonsError);
            return { ...module, lessons: [] };
          }

          return {
            ...module,
            lessons: lessonsData as CourseLesson[],
          };
        })
      );
      setModules(modulesWithLessons);

      // Set first lesson as selected by default
      if (modulesWithLessons.length > 0 && modulesWithLessons[0].lessons.length > 0) {
        setSelectedLesson(modulesWithLessons[0].lessons[0]);
      }

      // Fetch enrollment count
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

      // Fetch final exam
      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle();

      if (!examError && examData) {
        setFinalExam(examData as FinalExam);
      }

      // Fetch instructor profile
      if (courseData) {
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', courseData.creator_id)
          .maybeSingle();

        if (!instructorError && instructorData) {
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
    if (!user || !courseId) return;
    
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!enrollmentError && enrollmentData) {
        setEnrollment(enrollmentData as CourseEnrollment);
      }
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    }
  };

  const fetchProgress = async () => {
    if (!user || !courseId) return;
    
    try {
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!progressError && progressData) {
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
      // Get all lesson IDs from all modules
      const allLessonIds = modules.flatMap(module => 
        module.lessons.map(lesson => lesson.id)
      );

      // Mark all lessons as complete
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

      // Update course progress to 100%
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
        toast.success('All lessons marked as complete!');
      }
    } catch (error) {
      console.error('Error marking lessons complete:', error);
      toast.error('Failed to mark lessons complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleTakeExam = () => {
    setShowExamModal(true);
  };

  const handleLessonSelect = (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
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
          <Link to="/learning">
            <Button>Back to Learning</Button>
          </Link>
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

        {/* Progress Bar for Enrolled Users */}
        {enrolledUser && (
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
                      {markingComplete ? 'Marking Complete...' : 'Mark All Complete'}
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
        )}

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
                <CourseModuleList 
                  modules={modules}
                  onLessonSelect={handleLessonSelect}
                  currentLessonId={selectedLesson?.id}
                  completedLessons={[]}
                  onQuizStart={(quizId) => {
                    console.log('Starting quiz:', quizId);
                  }}
                />
                
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
                    {enrolledUser && (
                      <Button 
                        size="sm" 
                        className="mt-3 bg-orange-600 hover:bg-orange-700"
                        onClick={handleTakeExam}
                      >
                        Take Final Exam
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="lesson-notes" className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                {enrolledUser ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {selectedLesson ? selectedLesson.title : 'Select a lesson to begin'}
                      </CardTitle>
                      {selectedLesson && selectedLesson.description && (
                        <p className="text-muted-foreground">{selectedLesson.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {selectedLesson && selectedLesson.video_url ? (
                        <div className="space-y-4">
                          <VideoPlayer
                            src={selectedLesson.video_url}
                            poster={course.thumbnail_url}
                            className="w-full aspect-video rounded-lg overflow-hidden"
                            onTimeUpdate={(currentTime, duration, percent) => {
                              // You can add progress tracking here
                              console.log('Video progress:', percent);
                            }}
                            onEnded={() => {
                              // Mark lesson as complete when video ends
                              console.log('Video ended');
                            }}
                          />
                          {selectedLesson.materials_urls && selectedLesson.materials_urls.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">Additional Materials</h4>
                              <div className="space-y-2">
                                {selectedLesson.materials_urls.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    Material {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : selectedLesson ? (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">
                            This lesson doesn't have a video. Content coming soon!
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">
                            Select a lesson from the curriculum to start learning
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 mb-4">Enroll in this course to access the content</p>
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
                {enrolledUser ? (
                  <LessonNotesTab 
                    lessonId={selectedLesson?.id || ''} 
                    currentVideoTime={0}
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
              
              <TabsContent value="reviews">
                <CourseReviews courseId={courseId!} />
              </TabsContent>
              
              <TabsContent value="discussion">
                <CourseDiscussionSection courseId={courseId!} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Enrollment Actions */}
        {!enrolledUser && (
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
