
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Users, 
  BookOpen, 
  Star, 
  Play, 
  CheckCircle,
  Calendar,
  MapPin,
  Globe,
  Award,
  Heart,
  ShoppingCart
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CourseReviews from './CourseReviews';
import { useCart } from '@/contexts/CartContext';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  is_published: boolean;
  certificate_enabled: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  profiles: Array<{
    full_name: string;
    avatar_url?: string;
  }>;
  course_modules: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      description?: string;
      order_index: number;
      content_type: string;
      video_url?: string;
    }>;
  }>;
  course_learning_outcomes: Array<{
    id: string;
    outcome: string;
    order_index: number;
  }>;
  course_reviews: Array<{
    id: string;
    rating: number;
    review_text?: string;
    created_at: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
    };
  }>;
  course_enrollments: Array<{
    id: string;
    enrollment_date: string;
  }>;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles!courses_creator_id_fkey(full_name, avatar_url),
          course_modules(
            id,
            title,
            description,
            order_index,
            lessons(
              id,
              title,
              description,
              order_index,
              content_type,
              video_url
            )
          ),
          course_learning_outcomes(
            id,
            outcome,
            order_index
          ),
          course_reviews(
            id,
            rating,
            review_text,
            created_at,
            profiles(full_name, avatar_url)
          ),
          course_enrollments(
            id,
            enrollment_date
          )
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course');
        return;
      }

      if (!data) {
        toast.error('Course not found');
        navigate('/courses');
        return;
      }

      // Type assertion with proper course structure
      const courseData = data as any;
      setCourse(courseData);

      // Check if user is enrolled
      if (currentUser) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('user_id', currentUser.id)
          .eq('payment_status', 'completed')
          .single();

        setIsEnrolled(!!enrollment);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading the course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!course) return;

    try {
      await addToCart({
        item_type: 'course',
        item_id: course.id,
        title: course.title,
        price: course.price,
        quantity: 1
      });
      toast.success('Course added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    }
  };

  const handleEnrollNow = () => {
    if (!currentUser) {
      toast.error('Please sign in to enroll in courses');
      navigate('/auth');
      return;
    }

    if (course?.is_free) {
      // Handle free course enrollment
      handleFreeEnrollment();
    } else {
      // Add to cart and redirect to checkout
      handleAddToCart();
      navigate('/checkout');
    }
  };

  const handleFreeEnrollment = async () => {
    if (!course || !currentUser) return;

    try {
      setEnrollmentLoading(true);
      
      // First check if user is already enrolled to prevent 409 conflicts
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('course_id', course.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking enrollment:', checkError);
        toast.error('Failed to check enrollment status');
        return;
      }

      if (existingEnrollment) {
        // User is already enrolled
        setIsEnrolled(true);
        toast.success('You are already enrolled in this course!');
        navigate(`/learning/courses/${course.id}`);
        return;
      }

      // Proceed with enrollment
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: currentUser.id,
          course_id: course.id,
          payment_status: 'completed',
          enrollment_date: new Date().toISOString()
        });

      if (error) {
        // Handle specific error cases
        if (error.code === '23505') { // Unique constraint violation
          // User might have enrolled in another tab/window
          setIsEnrolled(true);
          toast.success('You are already enrolled in this course!');
          navigate(`/learning/courses/${course.id}`);
          return;
        }
        
        console.error('Enrollment error:', error);
        toast.error('Failed to enroll in course. Please try again.');
        return;
      }

      setIsEnrolled(true);
      toast.success('Successfully enrolled in course!');
      navigate(`/learning/courses/${course.id}`);
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('An error occurred during enrollment');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 sm:h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-48 sm:h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4 sm:py-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Course not found</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">The course you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/courses')} className="mt-4">
            Browse Courses
          </Button>
        </div>
      </Layout>
    );
  }

  const averageRating = course.course_reviews.length > 0
    ? course.course_reviews.reduce((sum, review) => sum + review.rating, 0) / course.course_reviews.length
    : 0;

  const totalLessons = course.course_modules.reduce((total, module) => total + module.lessons.length, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-8">
              {/* Course Header */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full sm:w-24 sm:h-24 h-48 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs sm:text-sm">{course.category}</Badge>
                        <Badge variant="outline" className="text-xs sm:text-sm">{course.difficulty_level}</Badge>
                        {course.certificate_enabled && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs sm:text-sm">
                            <Award className="w-3 h-3 mr-1" />
                            Certificate
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">{course.title}</h1>
                      <p className="text-gray-600 mb-4 text-sm sm:text-base">{course.summary}</p>
                      
                      {/* Course Stats */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{averageRating.toFixed(1)}</span>
                          <span className="hidden sm:inline">({course.course_reviews.length} reviews)</span>
                          <span className="sm:hidden">({course.course_reviews.length})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="hidden sm:inline">{course.course_enrollments.length} students</span>
                          <span className="sm:hidden">{course.course_enrollments.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span className="hidden sm:inline">{totalLessons} lessons</span>
                          <span className="sm:hidden">{totalLessons}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={course.profiles[0]?.avatar_url} />
                      <AvatarFallback>
                        {course.profiles[0]?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Instructor</p>
                      <p className="font-semibold text-sm sm:text-base">{course.profiles[0]?.full_name || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Tabs */}
              <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum" className="text-xs sm:text-sm px-2 py-2">Curriculum</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs sm:text-sm px-2 py-2">Reviews</TabsTrigger>
                  <TabsTrigger value="instructor" className="text-xs sm:text-sm px-2 py-2">Instructor</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-semibold mb-4">About this course</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{course.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {course.course_learning_outcomes.length > 0 && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-semibold mb-4">What you'll learn</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {course.course_learning_outcomes
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((outcome) => (
                              <div key={outcome.id} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 text-sm sm:text-base">{outcome.outcome}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="curriculum">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-semibold mb-4">Course curriculum</h3>
                      <div className="space-y-4">
                        {course.course_modules
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((module, moduleIndex) => (
                            <div key={module.id} className="border rounded-lg p-3 sm:p-4">
                              <h4 className="font-semibold text-base sm:text-lg mb-2">
                                Module {moduleIndex + 1}: {module.title}
                              </h4>
                              {module.description && (
                                <p className="text-gray-600 text-xs sm:text-sm mb-3">{module.description}</p>
                              )}
                              <div className="space-y-2">
                                {module.lessons
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                      <Play className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                      <span className="text-xs sm:text-sm flex-1">
                                        {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                      </span>
                                      {lesson.content_type === 'video' && (
                                        <Badge variant="outline" className="text-xs">Video</Badge>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <CourseReviews courseId={course.id} />
                </TabsContent>

                <TabsContent value="instructor">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={course.profiles[0]?.avatar_url} />
                          <AvatarFallback className="text-lg">
                            {course.profiles[0]?.full_name?.charAt(0) || 'I'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                          <h3 className="text-lg sm:text-xl font-semibold">{course.profiles[0]?.full_name || 'Unknown'}</h3>
                          <p className="text-gray-600">Course Instructor</p>
                        </div>
                      </div>
                      <div className="text-gray-700">
                        <p className="text-sm sm:text-base">Meet your instructor and learn more about their expertise and teaching style.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6 order-first lg:order-last">
              {/* Price and Enrollment Card */}
              <Card className="lg:sticky lg:top-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center mb-4 sm:mb-6">
                    {course.is_free ? (
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">${course.price}</div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Button 
                      className="w-full mb-4 text-sm sm:text-base py-2 sm:py-3" 
                      onClick={() => navigate(`/learning/courses/${course.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        className="w-full text-sm sm:text-base py-2 sm:py-3" 
                        onClick={handleEnrollNow}
                        disabled={enrollmentLoading}
                      >
                        {enrollmentLoading ? (
                          'Enrolling...'
                        ) : course.is_free ? (
                          'Enroll for Free'
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                      {!course.is_free && (
                        <Button 
                          variant="outline" 
                          className="w-full text-sm sm:text-base py-2 sm:py-3"
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-center text-xs sm:text-sm text-gray-600 mt-4 space-y-1">
                    <p>30-day money-back guarantee</p>
                    <p>Full lifetime access</p>
                  </div>
                </CardContent>
              </Card>

              {/* Course Features */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-4 text-sm sm:text-base">This course includes:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span>{Math.floor(course.duration_minutes / 60)} hours on-demand video</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span>Access on mobile and desktop</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Award className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span>Certificate of completion</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
