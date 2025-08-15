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
  Lock,
  ChevronRight
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CourseReviews from '@/components/course/CourseReviews';
import CreatorCard from '@/components/course/CreatorCard';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import { useCart } from '@/contexts/CartContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import ReactPlayer from 'react-player';

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
      is_preview: boolean;
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
  }>;
}

interface CreatorProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  total_courses: number;
  total_students: number;
  average_rating: number;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user && course) {
        checkEnrollmentStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [course]);

  // Fetch course data
  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const checkEnrollmentStatus = async (userId: string) => {
    if (!course) return;
    
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('user_id', userId)
      .single();

    setIsEnrolled(!!enrollment);
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      
      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles(id, full_name, avatar_url, bio),
          course_previews(id, preview_video_url),
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
              video_url,
              is_preview
            )
          ),
          course_learning_outcomes(id, outcome, order_index),
          course_reviews(
            id,
            rating,
            review_text,
            created_at,
            profiles(full_name, avatar_url)
          ),
          course_enrollments(id)
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (courseError || !courseData) {
        navigate('/courses');
        return;
      }

      setCourse(courseData);
      await fetchCreatorProfile(courseData.creator_id);

      // Check if user is enrolled
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await checkEnrollmentStatus(user.id);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorProfile = async (creatorId: string) => {
    try {
      // Get creator stats
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .eq('creator_id', creatorId)
        .eq('is_published', true);

      const { count: totalStudents } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact' })
        .in('course_id', 
          await supabase
            .from('courses')
            .select('id')
            .eq('creator_id', creatorId)
            .then(({ data }) => data?.map(c => c.id) || []
        );

      const { data: reviews } = await supabase
        .from('course_reviews')
        .select('rating')
        .in('course_id', 
          await supabase
            .from('courses')
            .select('id')
            .eq('creator_id', creatorId)
            .then(({ data }) => data?.map(c => c.id) || [])
        );

      const averageRating = reviews && reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Get creator profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', creatorId)
        .single();

      setCreatorProfile({
        ...profile,
        total_courses: totalCourses || 0,
        total_students: totalStudents || 0,
        average_rating: parseFloat(averageRating.toFixed(1))
      });
    } catch (error) {
      console.error('Error fetching creator:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!course) return;

    try {
      await addToCart({
        itemType: 'course',
        itemId: course.id,
        itemName: course.title,
        quantity: 1,
        price: course.price,
        ticketHolderNames: []
      });
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleEnrollNow = () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
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
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .single();

      if (existingEnrollment) {
        setIsEnrolled(true);
        navigate(`/learning/course/${course.id}`);
        return;
      }

      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          payment_status: 'completed'
        });

      if (error) throw error;

      setIsEnrolled(true);
      toast.success('Enrolled successfully!');
      navigate(`/learning/course/${course.id}`);
    } catch (error) {
      toast.error('Failed to enroll');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
            <div className="aspect-video bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
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
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge>{course.difficulty_level}</Badge>
                    {course.certificate_enabled && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Certificate
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                  <p className="text-gray-600">{course.summary}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{averageRating.toFixed(1)}</span>
                      <span className="text-gray-500">({course.course_reviews.length})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.course_enrollments.length} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{totalLessons} lessons</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Video */}
              {course.course_preview?.preview_video_url && (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video">
                      <ReactPlayer
                        url={course.course_preview.preview_video_url}
                        controls
                        width="100%"
                        height="100%"
                        light={course.thumbnail_url}
                        config={{
                          file: {
                            attributes: {
                              controlsList: 'nodownload',
                              disablePictureInPicture: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Instructor Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Instructor</h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={course.profiles.avatar_url} />
                      <AvatarFallback>
                        {course.profiles.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{course.profiles.full_name || 'Instructor'}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {course.profiles.bio || 'Course creator'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Description</h3>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
                        </div>
                      </div>
                      
                      {course.course_learning_outcomes.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3">What You'll Learn</h3>
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="curriculum">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                      <div className="space-y-6">
                        {course.course_modules
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((module) => (
                            <div key={module.id} className="border rounded-lg overflow-hidden">
                              <div className="bg-gray-50 px-4 py-3">
                                <h4 className="font-medium">
                                  Module {module.order_index + 1}: {module.title}
                                </h4>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                              </div>
                              <div className="divide-y">
                                {module.lessons
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((lesson) => (
                                    <div 
                                      key={lesson.id} 
                                      className={`px-4 py-3 flex items-center gap-3 ${lesson.is_preview ? 'bg-blue-50' : ''}`}
                                    >
                                      {lesson.is_preview ? (
                                        <Play className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                      ) : (
                                        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">
                                          {module.order_index + 1}.{lesson.order_index + 1} {lesson.title}
                                        </p>
                                        {lesson.description && (
                                          <p className="text-xs text-gray-500 mt-1">{lesson.description}</p>
                                        )}
                                      </div>
                                      {lesson.is_preview ? (
                                        <Badge variant="outline" className="text-xs">Preview</Badge>
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
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
                  <CourseReviews 
                    courseId={course.id} 
                    reviews={course.course_reviews} 
                    averageRating={averageRating} 
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <Card className="sticky top-6">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    {course.is_free ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold">
                        <PriceDisplay amount={course.price} />
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/learning/course/${course.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={handleEnrollNow}
                      >
                        {course.is_free ? 'Enroll for Free' : 'Enroll Now'}
                      </Button>
                      {!course.is_free && (
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  )}

                  {!user && (
                    <p className="text-center text-sm text-gray-500">
                      <button 
                        onClick={() => navigate('/auth')}
                        className="text-blue-600 hover:underline"
                      >
                        Sign in
                      </button> to enroll
                    </p>
                  )}

                  <div className="pt-4 space-y-3">
                    <h4 className="font-medium text-sm">This course includes:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m on-demand video
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span>{totalLessons} lessons</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>Access on mobile and desktop</span>
                      </li>
                      {course.certificate_enabled && (
                        <li className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-500" />
                          <span>Certificate of completion</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Profile Card */}
              {creatorProfile && (
                <CreatorCard 
                  creator={creatorProfile} 
                  showViewProfileButton={true}
                />
              )}

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-3">Tags</h3>
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

          {/* Recommended Courses */}
          <div className="mt-16">
            <RecommendedCourses 
              currentCourseId={course.id} 
              category={course.category} 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
