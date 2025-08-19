import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Users, 
  BookOpen, 
  Star, 
  Play, 
  CheckCircle,
  Award,
  ShoppingCart,
  Heart
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CourseReviews from '@/components/course/CourseReviews';
import CreatorCard from '@/components/course/CreatorCard';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import { useCart } from '@/contexts/CartContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import ReactPlayer from 'react-player';
import WishlistButton from '@/components/wishlist/WishlistButton';

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
  profiles: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  course_preview?: {
    id: string;
    preview_video_url?: string;
    preview_video_path?: string;
  };
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

interface CreatorProfile {
  id: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  average_rating?: number;
  total_courses?: number;
  total_students?: number;
  total_reviews?: number;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      console.log('Fetching course with ID:', id);
      
      // First, get the basic course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        toast.error('Failed to load course');
        return;
      }

      if (!courseData) {
        toast.error('Course not found');
        navigate('/courses');
        return;
      }

      console.log('Course data:', courseData);

      // Get creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', courseData.creator_id)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
      }

      // Get course preview
      const { data: previewData, error: previewError } = await supabase
        .from('course_previews')
        .select('id, preview_video_url, preview_video_path')
        .eq('course_id', id)
        .maybeSingle();

      if (previewError) {
        console.error('Error fetching course preview:', previewError);
      }

      // Get course modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          id,
          title,
          description,
          order_index,
          lessons (
            id,
            title,
            description,
            order_index,
            content_type,
            video_url
          )
        `)
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
      }

      // Get learning outcomes
      const { data: outcomesData, error: outcomesError } = await supabase
        .from('course_learning_outcomes')
        .select('id, outcome, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (outcomesError) {
        console.error('Error fetching outcomes:', outcomesError);
      }

      // Get course reviews with user profiles
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('course_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          user_id
        `)
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Get user profiles for reviews
      let reviewsWithProfiles = [];
      if (reviewsData && reviewsData.length > 0) {
        const userIds = reviewsData.map(review => review.user_id);
        const { data: reviewProfiles, error: reviewProfilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (!reviewProfilesError && reviewProfiles) {
          reviewsWithProfiles = reviewsData.map(review => ({
            ...review,
            profiles: reviewProfiles.find(profile => profile.id === review.user_id) || {
              full_name: 'Unknown User',
              avatar_url: null
            }
          }));
        }
      }

      // Get enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('id, enrollment_date')
        .eq('course_id', id);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      }

      // Combine all data
      const completeCourse: Course = {
        ...courseData,
        profiles: creatorData || { id: courseData.creator_id, full_name: 'Unknown Creator' },
        course_preview: previewData || undefined,
        course_modules: modulesData || [],
        course_learning_outcomes: outcomesData || [],
        course_reviews: reviewsWithProfiles || [],
        course_enrollments: enrollmentsData || []
      };

      setCourse(completeCourse);

      // Fetch creator profile with stats
      if (courseData.creator_id) {
        await fetchCreatorProfile(courseData.creator_id);
      }

      // Check if user is enrolled
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('user_id', user.id)
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

  const fetchCreatorProfile = async (creatorId: string) => {
    try {
      // Get creator basic info
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', creatorId)
        .single();

      // Get creator stats
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('is_published', true);

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('payment_status', 'completed')
        .in('course_id', courses?.map(c => c.id) || []);

      const { data: reviews } = await supabase
        .from('course_reviews')
        .select('rating')
        .in('course_id', courses?.map(c => c.id) || []);

      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      setCreatorProfile({
        ...profile,
        total_courses: courses?.length || 0,
        total_students: enrollments?.length || 0,
        total_reviews: reviews?.length || 0,
        average_rating: averageRating
      });
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      await addToCart({
        itemType: 'course',
        itemId: course.id,
        itemName: course.title,
        quantity: 1,
        price: course.price,
        ticketHolderNames: []
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollNow = () => {
    if (!user) {
      toast.error('Please sign in to enroll in courses');
      navigate('/auth');
      return;
    }

    if (course?.is_free) {
      handleFreeEnrollment();
    } else {
      handleAddToCart();
      navigate('/checkout');
    }
  };

  const handleFreeEnrollment = async () => {
    if (!course || !user) return;

    try {
      setEnrollmentLoading(true);
      console.log('Starting free enrollment for user:', user.id, 'course:', course.id);
      
      // Check for existing enrollment with detailed logging
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id, user_id, course_id, payment_status')
        .eq('user_id', user.id)
        .eq('course_id', course.id);

      console.log('Existing enrollment check result:', { existingEnrollment, checkError });

      if (checkError) {
        console.error('Error checking enrollment:', checkError);
        toast.error('Failed to check enrollment status');
        return;
      }

      // If any enrollment exists, consider user enrolled
      if (existingEnrollment && existingEnrollment.length > 0) {
        console.log('User already has enrollment:', existingEnrollment[0]);
        setIsEnrolled(true);
        toast.success('You are already enrolled in this course!');
        navigate(`/learning/course/${course.id}`);
        return;
      }

      console.log('No existing enrollment found, proceeding with insertion...');

      // Proceed with enrollment
      const enrollmentData = {
        user_id: user.id,
        course_id: course.id,
        payment_status: 'completed',
        enrollment_date: new Date().toISOString()
      };

      console.log('Inserting enrollment with data:', enrollmentData);

      const { data: newEnrollment, error: insertError } = await supabase
        .from('course_enrollments')
        .insert(enrollmentData)
        .select();

      console.log('Insert result:', { newEnrollment, insertError });

      if (insertError) {
        console.error('Enrollment error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });

        // Handle specific error cases
        if (insertError.code === '23505') { // Unique constraint violation
          console.log('Unique constraint violation detected');
          setIsEnrolled(true);
          toast.success('You are already enrolled in this course!');
          navigate(`/learning/course/${course.id}`);
          return;
        }
        
        toast.error(`Failed to enroll: ${insertError.message}`);
        return;
      }

      console.log('Enrollment successful:', newEnrollment);
      setIsEnrolled(true);
      toast.success('Successfully enrolled in course!');
      navigate(`/learning/course/${course.id}`);
    } catch (error) {
      console.error('Unexpected enrollment error:', error);
      toast.error('An unexpected error occurred during enrollment');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 rounded bg-gradient-to-r from-orange-500 to-purple-600 opacity-30"></div>
            <div className="h-4 w-1/2 rounded bg-gradient-to-r from-orange-500 to-purple-600 opacity-20"></div>
            <div className="h-64 w-full rounded bg-gradient-to-r from-orange-500 to-purple-600 opacity-30"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
          <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or has been removed.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header - Removed thumbnail image */}
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{course.category}</Badge>
                      <Badge variant="outline">{course.difficulty_level}</Badge>
                      {course.certificate_enabled && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Award className="w-3 h-3 mr-1" />
                          Certificate
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                    <p className="text-gray-600 mb-4">{course.summary}</p>
                    
                    {/* Course Stats */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{averageRating.toFixed(1)}</span>
                        <span>({course.course_reviews.length} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.course_enrollments.length} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Preview Video */}
                  {course.course_preview?.preview_video_url && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Course Preview</h3>
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-purple-600">
                        <ReactPlayer
                          url={course.course_preview.preview_video_url}
                          controls={true}
                          playing={true}
                          width="100%"
                          height="100%"
                          light={course.thumbnail_url}
                          config={{
                            file: {
                              attributes: {
                                controlsList: 'nodownload noremoteplayback',
                                disablePictureInPicture: true,
                                onContextMenu: (e: React.MouseEvent) => e.preventDefault()
                              }
                            }
                          }}
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Instructor */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={course.profiles?.avatar_url} />
                      <AvatarFallback>
                        {course.profiles?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="font-semibold">{course.profiles?.full_name || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Tabs */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">About this course</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed">{course.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {course.course_learning_outcomes.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">What you'll learn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.course_learning_outcomes
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((outcome) => (
                              <div key={outcome.id} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{outcome.outcome}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="curriculum">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Course curriculum</h3>
                      <div className="space-y-4">
                        {course.course_modules
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((module, moduleIndex) => (
                            <div key={module.id} className="border rounded-lg p-4">
                              <h4 className="font-semibold text-lg mb-2">
                                Module {moduleIndex + 1}: {module.title}
                              </h4>
                              {module.description && (
                                <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                              )}
                              <div className="space-y-2">
                                {module.lessons
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                      <Play className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm">
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
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={course.profiles?.avatar_url} />
                          <AvatarFallback className="text-lg">
                            {course.profiles?.full_name?.charAt(0) || 'I'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">{course.profiles?.full_name || 'Unknown'}</h3>
                          <p className="text-gray-600">Course Instructor</p>
                        </div>
                      </div>
                      <div className="text-gray-700">
                        <p>{course.profiles?.bio || 'Meet your instructor and learn more about their expertise and teaching style.'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Made creator card static instead of sticky */}
            <div className="space-y-6">
              {/* Price and Enrollment Card */}
              <Card className="lg:sticky lg:top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.is_free ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        <PriceDisplay amount={course.price} originalCurrency="USD" />
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Button 
                      className="w-full mb-4" 
                      onClick={() => navigate(`/learning/course/${course.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        className="w-full" 
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
                          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-center text-sm text-gray-600 mt-4">
                    <p>30-day money-back guarantee</p>
                    <p>Full lifetime access</p>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Card - Removed sticky positioning */}
              {creatorProfile && (
                <div className="lg:block">
                  <CreatorCard creator={creatorProfile} />
                </div>
              )}

              {/* Course Features */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">This course includes:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{Math.floor(course.duration_minutes / 60)} hours on-demand video</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Access on mobile and desktop</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span>Certificate of completion</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Wishlist Button */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <WishlistButton
                      itemId={course.id}
                      itemType="course"
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Add to Wishlist
                    </WishlistButton>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Tags</h3>
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

        {/* Recommended Courses Section */}
        <RecommendedCourses 
          currentCourseId={course.id} 
          category={course.category} 
        />
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
