
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Star, Award, Play, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AddToCartButton from '@/components/cart/AddToCartButton';
import CourseEnrollmentButton from '@/components/payment/CourseEnrollmentButton';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  duration_minutes: number;
  difficulty_level: string;
  thumbnail_url: string;
  category: string;
  creator_id: string;
  certificate_enabled: boolean;
}

interface Creator {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
      fetchEnrollmentStats();
      if (user) {
        checkEnrollmentStatus();
      }
    }
  }, [id, user]);

  const fetchCourseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCourse(data as Course);

      // Fetch creator details
      if (data.creator_id) {
        const { data: creatorData, error: creatorError } = await supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url')
          .eq('id', data.creator_id)
          .single();

        if (!creatorError && creatorData) {
          setCreator(creatorData);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentStats = async () => {
    try {
      // Get enrollment count
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', id);

      if (!enrollmentError) {
        setEnrollmentCount(enrollments?.length || 0);
      }

      // Get rating stats
      const { data: reviews, error: reviewError } = await supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', id);

      if (!reviewError && reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        setRating(Math.round(avgRating * 10) / 10);
        setReviewCount(reviews.length);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (!error && data) {
        setIsEnrolled(true);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleFreeEnrollment = async () => {
    if (!user || !course) {
      toast.error('Please sign in to enroll in this course');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          payment_status: 'completed'
        });

      if (error) throw error;

      toast.success('Successfully enrolled in the course!');
      setIsEnrolled(true);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex flex-col justify-center items-center gap-4">
          <p>Course not found</p>
          <Button asChild>
            <Link to="/explore/courses">Back to Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="section-container">
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/explore/courses" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Courses
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Section */}
              <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <div className="relative">
                  {course.thumbnail_url && (
                    <AspectRatio ratio={16/9}>
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <Badge className="mb-2 bg-gradient-to-r from-orange-500 to-purple-600">
                          {course.category}
                        </Badge>
                        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(course.duration_minutes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{enrollmentCount} students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="border-white text-white">
                              {course.difficulty_level}
                            </Badge>
                          </div>
                          {rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{rating} ({reviewCount})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </AspectRatio>
                  )}
                </div>
              </Card>

              {/* Tabs Section */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle>About This Course</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line text-gray-700 leading-relaxed">{course.description}</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="curriculum" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle>Course Curriculum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Course curriculum will be available after enrollment.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="instructor" className="space-y-4">
                  {creator && (
                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                      <CardHeader>
                        <CardTitle>Meet Your Instructor</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                            {creator.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-800">{creator.full_name}</h3>
                            <p className="text-muted-foreground">Course Instructor</p>
                          </div>
                        </div>
                        
                        {creator.bio && (
                          <p className="text-gray-600 leading-relaxed">{creator.bio}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Student Reviews
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{rating}</span>
                            <span className="text-muted-foreground">({reviewCount} reviews)</span>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reviewCount === 0 ? (
                        <p className="text-gray-600 text-center py-8">
                          No reviews yet. Be the first to review this course!
                        </p>
                      ) : (
                        <p className="text-gray-600">
                          Reviews will be displayed here once available.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {course.is_free ? 'Free' : `$${course.price}`}
                    </p>
                  </div>

                  {isEnrolled ? (
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                      size="lg"
                      asChild
                    >
                      <Link to={`/learning/course/${course.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  ) : course.is_free ? (
                    <Button 
                      onClick={handleFreeEnrollment}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700" 
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enroll for Free
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <AddToCartButton
                        itemType="course"
                        itemId={course.id}
                        itemName={course.title}
                        price={course.price}
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      />
                      <CourseEnrollmentButton
                        courseId={course.id}
                        courseName={course.title}
                        price={course.price}
                        isFree={course.is_free}
                        className="w-full"
                        variant="outline"
                      />
                      <p className="text-sm text-gray-600 text-center">30-day money-back guarantee</p>
                    </div>
                  )}

                  {/* Course Benefits */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">This course includes:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                        <span>Full lifetime access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span>Access on mobile and desktop</span>
                      </div>
                      {course.certificate_enabled && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-orange-600" />
                          <span>Certificate of completion</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Card */}
              {creator && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Instructor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {creator.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{creator.full_name}</h3>
                        <p className="text-sm text-muted-foreground">Course Instructor</p>
                      </div>
                    </div>
                    
                    {creator.bio && (
                      <p className="text-sm text-gray-600 line-clamp-3">{creator.bio}</p>
                    )}
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
