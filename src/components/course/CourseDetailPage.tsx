
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  Star, 
  Play, 
  BookOpen, 
  Award, 
  ShoppingCart,
  Heart,
  Share2,
  CheckCircle,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';

interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  creator_id: string;
  course_learning_outcomes?: LearningOutcome[];
  course_modules?: CourseModule[];
  course_reviews?: Review[];
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface LearningOutcome {
  id: string;
  outcome: string;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  video_url?: string;
  content_type: string;
}

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, items: cartItems } = useCart();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'not_enrolled' | 'enrolled' | 'pending'>('not_enrolled');
  const [isInCart, setIsInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourse();
      if (user) {
        checkEnrollmentStatus();
      }
    }
  }, [id, user]);

  useEffect(() => {
    // Check if course is already in cart
    const courseInCart = cartItems.some(item => 
      item.item_type === 'course' && item.item_id === id
    );
    setIsInCart(courseInCart);
  }, [cartItems, id]);

  const loadCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_learning_outcomes (*),
          course_modules (
            *,
            lessons (*)
          ),
          course_reviews (
            *,
            profiles (full_name, avatar_url)
          ),
          profiles (full_name, avatar_url)
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('payment_status')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setEnrollmentStatus(data.payment_status === 'completed' ? 'enrolled' : 'pending');
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in to add courses to cart');
      navigate('/auth');
      return;
    }

    if (!course) return;

    setAddingToCart(true);
    try {
      await addToCart({
        item_type: 'course',
        item_id: course.id,
        price: course.price,
        quantity: 1
      });

      toast.success('Course added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleEnrollNow = () => {
    if (!user) {
      toast.error('Please log in to enroll in courses');
      navigate('/auth');
      return;
    }

    if (isInCart) {
      navigate('/cart');
    } else {
      handleAddToCart();
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const averageRating = course?.course_reviews?.length
    ? course.course_reviews.reduce((sum, review) => sum + review.rating, 0) / course.course_reviews.length
    : 0;

  const totalLessons = course?.course_modules?.reduce((total, module) => 
    total + (module.lessons?.length || 0), 0
  ) || 0;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Course Not Found</h2>
              <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/explore/courses')}>Browse Courses</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      {course.category}
                    </Badge>
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      {course.difficulty_level}
                    </Badge>
                  </div>

                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    {course.title}
                  </h1>

                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    {course.summary}
                  </p>

                  {/* Course Stats */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>{formatDuration(course.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{course.course_modules?.length || 0} modules</span>
                    </div>
                    {course.course_reviews && course.course_reviews.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{averageRating.toFixed(1)} ({course.course_reviews.length} reviews)</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor Info */}
                  {course.profiles && (
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center">
                        {course.profiles.avatar_url ? (
                          <img 
                            src={course.profiles.avatar_url} 
                            alt={course.profiles.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Instructor</p>
                        <p className="text-gray-600">{course.profiles.full_name}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Course Description */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">About This Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {course.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Outcomes */}
              {course.course_learning_outcomes && course.course_learning_outcomes.length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-500" />
                      What You'll Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {course.course_learning_outcomes.map((outcome) => (
                        <li key={outcome.id} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{outcome.outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Course Content */}
              {course.course_modules && course.course_modules.length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Course Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {course.course_modules
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((module) => (
                          <div key={module.id} className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-2">{module.title}</h4>
                            {module.description && (
                              <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                            )}
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="space-y-2">
                                {module.lessons
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((lesson) => (
                                    <div key={lesson.id} className="flex items-center gap-3 text-sm text-gray-600">
                                      <Play className="w-4 h-4 text-blue-500" />
                                      <span>{lesson.title}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Preview */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl sticky top-6">
                <CardContent className="p-6">
                  {course.thumbnail_url && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gradient-to-r from-orange-400 to-purple-600">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {course.is_free ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>${course.price}</span>
                      )}
                    </div>
                    {!course.is_free && (
                      <p className="text-sm text-gray-600">One-time payment</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {enrollmentStatus === 'enrolled' ? (
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        onClick={() => navigate(`/learning/course/${course.id}`)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                    ) : enrollmentStatus === 'pending' ? (
                      <Button className="w-full" disabled>
                        Enrollment Pending
                      </Button>
                    ) : (
                      <>
                        <Button 
                          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          onClick={handleEnrollNow}
                          disabled={addingToCart}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {isInCart ? 'Go to Cart' : addingToCart ? 'Adding...' : 'Add to Cart'}
                        </Button>
                        
                        {!course.is_free && (
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" size="sm">
                              <Heart className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button variant="outline" className="flex-1" size="sm">
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{formatDuration(course.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lessons</span>
                      <span className="font-medium">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Level</span>
                      <span className="font-medium">{course.difficulty_level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Certificate</span>
                      <span className="font-medium">Yes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
