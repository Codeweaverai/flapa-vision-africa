
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Star, Award, Play, BookOpen, CheckCircle, User, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AddToCartButton from '@/components/cart/AddToCartButton';
import CourseEnrollmentButton from '@/components/payment/CourseEnrollmentButton';
import ReactPlayer from 'react-player';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  price: number;
  is_free: boolean;
  duration_minutes: number;
  difficulty_level: string;
  thumbnail_url: string;
  category: string;
  creator_id: string;
  certificate_enabled: boolean;
  tags: string[];
}

interface Creator {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
}

interface LearningOutcome {
  id: string;
  outcome: string;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  content_type: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
}

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  is_published: boolean;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface PreviewVideo {
  id: string;
  preview_video_url: string;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [previewVideo, setPreviewVideo] = useState<PreviewVideo | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
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

      // Fetch learning outcomes
      const { data: outcomes } = await supabase
        .from('course_learning_outcomes')
        .select('*')
        .eq('course_id', id)
        .order('order_index');

      setLearningOutcomes(outcomes || []);

      // Fetch modules with lessons and quizzes
      const { data: modulesData } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons (*),
          quizzes (*)
        `)
        .eq('course_id', id)
        .order('order_index');

      setModules(modulesData || []);

      // Fetch final exam
      const { data: examData } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', id)
        .eq('is_published', true)
        .single();

      if (examData) {
        setFinalExam(examData);
      }

      // Fetch course preview video
      const { data: previewData } = await supabase
        .from('course_previews')
        .select('*')
        .eq('course_id', id)
        .single();

      if (previewData) {
        setPreviewVideo(previewData);
      }

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // Fetch related courses
      const { data: relatedData } = await supabase
        .from('courses')
        .select('*')
        .eq('category', data.category)
        .neq('id', id)
        .eq('is_published', true)
        .limit(4);

      setRelatedCourses(relatedData || []);

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
      const { count } = await supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', id)
        .eq('payment_status', 'completed');

      setEnrollmentCount(count || 0);

      // Get rating stats
      const { data: reviewsData } = await supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', id);

      if (reviewsData && reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setRating(Math.round(avgRating * 10) / 10);
        setReviewCount(reviewsData.length);
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
              {/* Hero Section with Video Player */}
              <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <div className="relative">
                  <AspectRatio ratio={16/9}>
                    {previewVideo?.preview_video_url ? (
                      <ReactPlayer
                        url={previewVideo.preview_video_url}
                        width="100%"
                        height="100%"
                        controls={true}
                        light={course.thumbnail_url}
                        playIcon={
                          <div className="flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transition-colors">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        }
                      />
                    ) : course.thumbnail_url ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                        <Video className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </AspectRatio>
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
                      <div className="space-y-6">
                        <p className="whitespace-pre-line text-gray-700 leading-relaxed">{course.description}</p>
                        
                        {learningOutcomes.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {learningOutcomes.map((outcome) => (
                                <div key={outcome.id} className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{outcome.outcome}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {course.tags && course.tags.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {course.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="curriculum" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle>Course Curriculum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {modules.map((module, moduleIndex) => (
                          <div key={module.id} className="border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2">
                              Module {moduleIndex + 1}: {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-gray-600 mb-3">{module.description}</p>
                            )}
                            
                            {/* Lessons */}
                            {module.lessons.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">Lessons</h4>
                                <div className="space-y-2 pl-4">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-2">
                                      <Play className="w-4 h-4 text-orange-500" />
                                      <span>{lessonIndex + 1}. {lesson.title}</span>
                                      {lesson.content_type && (
                                        <Badge variant="outline" className="text-xs">
                                          {lesson.content_type}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quizzes */}
                            {module.quizzes.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Quizzes</h4>
                                <div className="space-y-2 pl-4">
                                  {module.quizzes.map((quiz) => (
                                    <div key={quiz.id} className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span>{quiz.title}</span>
                                      <Badge variant="outline" className="text-xs">
                                        Passing: {quiz.passing_score}%
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Final Exam */}
                        {finalExam && (
                          <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                              <Award className="w-5 h-5 text-orange-600" />
                              Final Exam
                            </h3>
                            <p className="text-gray-700 mb-2">{finalExam.description}</p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>Time Limit: {finalExam.time_limit_minutes} minutes</span>
                              <span>Passing Score: {finalExam.passing_score}%</span>
                            </div>
                          </div>
                        )}

                        {modules.length === 0 && !finalExam && (
                          <p className="text-gray-600 text-center py-8">
                            Course curriculum will be available after enrollment.
                          </p>
                        )}
                      </div>
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
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center">
                            {creator.avatar_url ? (
                              <img 
                                src={creator.avatar_url} 
                                alt={creator.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-xl">
                                {creator.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-800">{creator.full_name}</h3>
                            <p className="text-muted-foreground">Course Instructor</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => window.location.href = `/creator/${creator.id}`}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Creator
                          </Button>
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
                      {reviews.length > 0 ? (
                        <div className="space-y-6">
                          {reviews.map((review) => (
                            <div key={review.id} className="border-b pb-4 last:border-b-0">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {review.profiles?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">{review.profiles?.full_name || 'Anonymous'}</span>
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < review.rating 
                                              ? 'fill-yellow-400 text-yellow-400' 
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {review.review_text && (
                                    <p className="text-gray-700">{review.review_text}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-center py-8">
                          No reviews yet. Be the first to review this course!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Related Courses */}
              {relatedCourses.length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle>Related Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relatedCourses.map((relatedCourse) => (
                        <div
                          key={relatedCourse.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.location.href = `/learning/course-detail/${relatedCourse.id}`}
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-r from-orange-400 to-purple-600 flex-shrink-0">
                              {relatedCourse.thumbnail_url ? (
                                <img 
                                  src={relatedCourse.thumbnail_url} 
                                  alt={relatedCourse.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 mb-1">{relatedCourse.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{relatedCourse.summary}</p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs">
                                  {relatedCourse.category}
                                </Badge>
                                <span className="text-sm font-semibold text-orange-600">
                                  {relatedCourse.is_free ? 'Free' : `$${relatedCourse.price}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>{formatDuration(course.duration_minutes)} of content</span>
                      </div>
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
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center">
                        {creator.avatar_url ? (
                          <img 
                            src={creator.avatar_url} 
                            alt={creator.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {creator.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
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
