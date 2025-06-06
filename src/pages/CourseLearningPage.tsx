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
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CourseModuleList from '@/components/course/CourseModuleList';
import CourseReviews from '@/components/course/CourseReviews';
import CourseDiscussionSection from '@/components/community/CourseDiscussionSection';
import AddToCartButton from '@/components/cart/AddToCartButton';

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

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      if (user) {
        fetchEnrollmentData();
        fetchProgress();
      }
    }
  }, [courseId, user]);

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
        .single();

      if (enrollmentError) {
        // Check if the error is because no record was found
        if (enrollmentError.message !== 'No rows found') {
          console.error('Error fetching enrollment data:', enrollmentError);
          toast.error('Failed to load enrollment data');
        }
        // If no record found, it's not an error, just means the user isn't enrolled
        setEnrollment(null);
      } else {
        setEnrollment(enrollmentData as CourseEnrollment);
      }
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      toast.error('Failed to load enrollment data');
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
        // If no record found, it's not an error, just means no progress yet
        setProgress(null);
      } else {
        setProgress(progressData as ProgressData);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to load progress data');
    }
  };

  const handleStartLearning = () => {
    if (modules.length > 0 && modules[0].lessons.length > 0) {
      const firstLesson = modules[0].lessons[0];
      window.location.href = `/course/${courseId}/lesson/${firstLesson.id}`;
    }
  };

  const enrolledUser = enrollment && enrollment.payment_status === 'completed';

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
                <span className="text-2xl font-bold text-orange-600">{progress?.progress_percentage || 0}%</span>
              </div>
              <Progress value={progress?.progress_percentage || 0} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                Keep going! You're doing great.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                {/* Course Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
                  </CardContent>
                </Card>

                {/* Learning Outcomes */}
                {learningOutcomes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        What You'll Learn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {learningOutcomes.map((outcome) => (
                          <div key={outcome.id} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{outcome.outcome}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Course Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Course Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Master the core concepts and principles covered in this course</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Apply learned skills through practical exercises and projects</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Build confidence in implementing solutions in real-world scenarios</span>
                      </div>
                      {course.certificate_enabled && (
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Earn a certificate of completion to showcase your achievement</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="curriculum">
                <CourseModuleList 
                  modules={modules}
                  onLessonSelect={(lesson) => {
                    window.location.href = `/course/${courseId}/lesson/${lesson.id}`;
                  }}
                  currentLessonId={undefined}
                  completedLessons={[]}
                  onQuizStart={(quizId) => {
                    console.log('Starting quiz:', quizId);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="reviews">
                <CourseReviews courseId={courseId!} />
              </TabsContent>
              
              <TabsContent value="discussion">
                <CourseDiscussionSection courseId={courseId!} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                {!enrolledUser ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {course.is_free ? 'Free' : `$${course.price}`}
                      </div>
                      {!course.is_free && (
                        <p className="text-sm text-gray-600">One-time payment</p>
                      )}
                    </div>
                    {user ? (
                      <div className="space-y-2">
                        {course.is_free ? (
                          <Button 
                            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                            onClick={() => window.location.href = `/course/${courseId}/enroll`}
                          >
                            Enroll for Free
                          </Button>
                        ) : (
                          <>
                            <AddToCartButton
                              itemType="course"
                              itemId={courseId!}
                              itemName={course.title}
                              price={course.price || 0}
                              className="w-full mb-2"
                            />
                            <Button 
                              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                              onClick={() => window.location.href = `/course/${courseId}/enroll`}
                            >
                              Enroll Now
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        onClick={() => window.location.href = '/auth'}
                      >
                        Sign in to Enroll
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-green-600 mb-2">Enrolled</h3>
                      <p className="text-sm text-gray-600">You have access to this course</p>
                    </div>
                    <Button 
                      onClick={handleStartLearning}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructor Card */}
            {instructor && (
              <Card>
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
                      <h4 className="font-semibold">{creator.full_name}</h4>
                      <p className="text-sm text-gray-600">Course Creator</p>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-sm text-gray-700">{creator.bio}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <Link to={`/creator/profile/${creator.id}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        View Profile
                      </Button>
                    </Link>
                    <Link to={`/inbox?username=${instructor.username || instructor.full_name}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;
