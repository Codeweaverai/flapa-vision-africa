import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import GiftCourseButton from '@/components/course/GiftCourseButton';

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

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
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
                Loading Course
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

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setAuthChecked(true);
        
        // If we have a user, check enrollment status
        if (session?.user && id) {
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', id)
            .eq('user_id', session.user.id)
            .eq('payment_status', 'completed')
            .single();

          setIsEnrolled(!!enrollment);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      // If user just signed in, check enrollment status
      if (session?.user && id && event === 'SIGNED_IN') {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('user_id', session.user.id)
          .eq('payment_status', 'completed')
          .single();

        setIsEnrolled(!!enrollment);
      }
    });

    return () => subscription.unsubscribe();
  }, [id]);

  useEffect(() => {
    if (id && authChecked) {
      fetchCourse();
    }
  }, [id, authChecked]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      console.log('Fetching course with ID:', id);
      
      // Use Promise.all for parallel data fetching
      const [
        courseResult,
        creatorResult,
        previewResult,
        modulesResult,
        outcomesResult,
        reviewsResult,
        enrollmentsResult
      ] = await Promise.allSettled([
        // Basic course data
        supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .eq('is_published', true)
          .single(),

        // Creator profile
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .eq('id', course?.creator_id || '')
          .single(),

        // Course preview
        supabase
          .from('course_previews')
          .select('id, preview_video_url, preview_video_path')
          .eq('course_id', id)
          .maybeSingle(),

        // Course modules with lessons
        supabase
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
          .order('order_index', { ascending: true }),

        // Learning outcomes
        supabase
          .from('course_learning_outcomes')
          .select('id, outcome, order_index')
          .eq('course_id', id)
          .order('order_index', { ascending: true }),

        // Course reviews
        supabase
          .from('course_reviews')
          .select(`
            id,
            rating,
            review_text,
            created_at,
            user_id
          `)
          .eq('course_id', id)
          .order('created_at', { ascending: false })
          .limit(20), // Limit reviews for performance

        // Course enrollments
        supabase
          .from('course_enrollments')
          .select('id, enrollment_date')
          .eq('course_id', id)
      ]);

      // Process course data
      if (courseResult.status === 'fulfilled' && !courseResult.value.error && courseResult.value.data) {
        const courseData = courseResult.value.data;

        // Process creator data
        const creatorData = creatorResult.status === 'fulfilled' && !creatorResult.value.error ? 
          creatorResult.value.data : { id: courseData.creator_id, full_name: 'Unknown Creator' };

        // Process preview data
        const previewData = previewResult.status === 'fulfilled' && !previewResult.value.error ? 
          previewResult.value.data : undefined;

        // Process modules data
        const modulesData = modulesResult.status === 'fulfilled' && !modulesResult.value.error ? 
          modulesResult.value.data : [];

        // Process outcomes data
        const outcomesData = outcomesResult.status === 'fulfilled' && !outcomesResult.value.error ? 
          outcomesResult.value.data : [];

        // Process enrollments data
        const enrollmentsData = enrollmentsResult.status === 'fulfilled' && !enrollmentsResult.value.error ? 
          enrollmentsResult.value.data : [];

        // Process reviews with user profiles
        let reviewsWithProfiles = [];
        if (reviewsResult.status === 'fulfilled' && !reviewsResult.value.error && reviewsResult.value.data) {
          const reviewsData = reviewsResult.value.data;
          const userIds = reviewsData.map(review => review.user_id);
          
          // Fetch user profiles for reviews in parallel
          const { data: reviewProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          reviewsWithProfiles = reviewsData.map(review => ({
            ...review,
            profiles: reviewProfiles?.find(profile => profile.id === review.user_id) || {
              full_name: 'Unknown User',
              avatar_url: null
            }
          }));
        }

        // Combine all data
        const completeCourse: Course = {
          ...courseData,
          profiles: creatorData,
          course_preview: previewData,
          course_modules: modulesData,
          course_learning_outcomes: outcomesData,
          course_reviews: reviewsWithProfiles,
          course_enrollments: enrollmentsData
        };

        setCourse(completeCourse);

        // Fetch creator profile with stats in background
        if (courseData.creator_id) {
          fetchCreatorProfile(courseData.creator_id);
        }
      } else {
        console.error('Error fetching course:', courseResult.status === 'fulfilled' ? courseResult.value.error : courseResult.reason);
        toast.error('Failed to load course');
        return;
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
      // Use Promise.all for parallel data fetching
      const [profileResult, coursesResult, enrollmentsResult, reviewsResult] = await Promise.allSettled([
        // Creator basic info
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .eq('id', creatorId)
          .single(),

        // Creator courses
        supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('is_published', true),

        // Course enrollments
        supabase
          .from('course_enrollments')
          .select('id')
          .eq('payment_status', 'completed')
          .in('course_id', course?.id ? [course.id] : []),

        // Course reviews
        supabase
          .from('course_reviews')
          .select('rating')
          .in('course_id', course?.id ? [course.id] : [])
      ]);

      const profile = profileResult.status === 'fulfilled' && !profileResult.value.error ? 
        profileResult.value.data : null;

      const courses = coursesResult.status === 'fulfilled' && !coursesResult.value.error ? 
        coursesResult.value.data : [];

      const enrollments = enrollmentsResult.status === 'fulfilled' && !enrollmentsResult.value.error ? 
        enrollmentsResult.value.data : [];

      const reviews = reviewsResult.status === 'fulfilled' && !reviewsResult.value.error ? 
        reviewsResult.value.data : [];

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
      // Store the current path for redirect after authentication
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (isEnrolled) {
      toast.info('You are already enrolled in this course');
      navigate(`/learning/course/${course.id}`);
      return;
    }

    try {
      setLoading(true);
      await addToCart({
        itemType: 'course',
        itemId: course.id,
        itemName: course.title,
        quantity: 1,
        price: course.price,
        ticketHolderNames: []
      });
      toast.success('Course added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollNow = () => {
    if (!user) {
      // Store the current path for redirect after authentication
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (isEnrolled) {
      toast.info('You are already enrolled in this course');
      navigate(`/learning/course/${course.id}`);
      return;
    }

    if (course?.is_free) {
      handleFreeEnrollment();
    } else {
      // For paid courses, add to cart and go to checkout
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

  // Gradient Icon Component
  const GradientIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-1 rounded-lg text-white">
      {children}
    </div>
  );

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
            <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate('/courses')} 
              className="mt-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
            >
              Browse Courses
            </Button>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                        {course.category}
                      </Badge>
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        {course.difficulty_level}
                      </Badge>
                      {course.certificate_enabled && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Award className="w-3 h-3 mr-1" />
                          Certificate
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
                    <p className="text-gray-600 text-lg mb-6">{course.summary}</p>
                    
                    {/* Course Stats */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Star className="w-4 h-4" />
                        </GradientIcon>
                        <span>{averageRating.toFixed(1)}</span>
                        <span>({course.course_reviews.length} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Users className="w-4 h-4" />
                        </GradientIcon>
                        <span>{course.course_enrollments.length} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Clock className="w-4 h-4" />
                        </GradientIcon>
                        <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <BookOpen className="w-4 h-4" />
                        </GradientIcon>
                        <span>{totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Preview Video */}
                  {course.course_preview?.preview_video_url && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Course Preview</h3>
                      <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 to-purple-600 p-1">
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
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                    <Avatar className="w-12 h-12 border-2 border-orange-300">
                      <AvatarImage src={course.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        {course.profiles?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="font-semibold text-gray-900">{course.profiles?.full_name || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Tabs */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="curriculum" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Curriculum
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger value="instructor" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Instructor
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        About this course
                      </h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed text-lg">{course.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {course.course_learning_outcomes.length > 0 && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                          What you'll learn
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.course_learning_outcomes
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((outcome) => (
                              <div key={outcome.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-purple-50">
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
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        Course curriculum
                      </h3>
                      <div className="space-y-4">
                        {course.course_modules
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((module, moduleIndex) => (
                            <div key={module.id} className="border border-gray-200 rounded-lg p-4 bg-white/80 backdrop-blur-sm">
                              <h4 className="font-semibold text-lg mb-2 text-gray-900">
                                Module {moduleIndex + 1}: {module.title}
                              </h4>
                              {module.description && (
                                <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                              )}
                              <div className="space-y-2">
                                {module.lessons
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 rounded-lg transition-all duration-200">
                                      <Play className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm text-gray-700">
                                        {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                      </span>
                                      {lesson.content_type === 'video' && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Video</Badge>
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
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-16 h-16 border-2 border-orange-300">
                          <AvatarImage src={course.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-lg">
                            {course.profiles?.full_name?.charAt(0) || 'I'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{course.profiles?.full_name || 'Unknown'}</h3>
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price and Enrollment Card */}
              <Card className="lg:sticky lg:top-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
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
                      className="w-full mb-4 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                      onClick={() => navigate(`/learning/course/${course.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 font-semibold py-3"
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
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-semibold py-3"
                          onClick={handleAddToCart}
                          disabled={loading}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {loading ? 'Adding...' : 'Add to Cart'}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-center text-sm text-gray-600 mt-6 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p>30-day money-back guarantee</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p>Full lifetime access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Card */}
              {creatorProfile && (
                <div className="lg:block">
                  <CreatorCard creator={creatorProfile} />
                </div>
              )}

              {/* Course Features */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900">This course includes:</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <Clock className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">{Math.floor(course.duration_minutes / 60)} hours on-demand video</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <BookOpen className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <Users className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">Access on mobile and desktop</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center gap-3">
                        <GradientIcon>
                          <Award className="w-4 h-4" />
                        </GradientIcon>
                        <span className="text-sm text-gray-700">Certificate of completion</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Wishlist Button - Only show if not enrolled */}
                  {!isEnrolled && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                      <WishlistButton
                        itemId={course.id}
                        itemType="course"
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Add to Wishlist
                      </WishlistButton>
                      
                      {/* Gift Course Button */}
                      <GiftCourseButton
                        course={{
                          id: course.id,
                          title: course.title,
                          price: course.price
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-gray-900">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200 text-orange-700"
                        >
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
