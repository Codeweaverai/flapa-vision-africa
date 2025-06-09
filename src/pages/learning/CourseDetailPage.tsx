import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import { BookOpen, Clock, Award, Check, Users, Play, MessageCircle, Star, Globe, Mail, DollarSign, CheckCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CourseReviews from '@/components/course/CourseReviews';
import ReactPlayer from 'react-player';

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
  certificate_enabled: boolean;
  creator_id: string;
  modules?: CourseModule[];
  course_learning_outcomes?: LearningOutcome[];
  course_preview?: CoursePreview;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  video_url?: string;
  content_type: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
}

interface LearningOutcome {
  id: string;
  outcome: string;
}

interface CoursePreview {
  preview_video_url?: string;
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
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [courseStats, setCourseStats] = useState<any>(null);

  const faqs = [
    {
      question: "What prerequisites do I need for this course?",
      answer: "No prior experience is required. This course is designed for beginners and will guide you through all the fundamentals step by step."
    },
    {
      question: "How long do I have access to the course?",
      answer: "You get lifetime access to the course content, including all future updates and additions."
    },
    {
      question: "Is there a certificate upon completion?",
      answer: course?.certificate_enabled ? "Yes, you will receive a certificate of completion when you finish all the course modules and pass the final assessment." : "No certificate is provided for this course."
    },
    {
      question: "Can I download the videos for offline viewing?",
      answer: "Currently, offline downloads are not available. However, you can access the course content anytime with an internet connection."
    },
    {
      question: "What if I'm not satisfied with the course?",
      answer: "We offer a 30-day money-back guarantee. If you're not satisfied, you can request a full refund within 30 days of purchase."
    }
  ];

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        console.log('Loading course data for:', courseId);
        
        // Fetch course with modules, lessons, and quizzes
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            course_learning_outcomes (*),
            course_modules (
              *,
              lessons (*),
              quizzes (*)
            )
          `)
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        // Fetch course preview separately
        const { data: previewData } = await supabase
          .from('course_previews')
          .select('*')
          .eq('course_id', courseId)
          .single();

        // Combine course data with preview
        const enrichedCourseData = {
          ...courseData,
          course_preview: previewData || null,
          modules: courseData.course_modules || []
        };

        console.log('Course data loaded:', enrichedCourseData);
        setCourse(enrichedCourseData);
        
        if (enrichedCourseData) {
          // Fetch creator profile and calculate ratings
          const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', enrichedCourseData.creator_id)
            .single();

          if (!creatorError && creatorData) {
            // Calculate creator's average rating from all their courses
            const { data: creatorCourses } = await supabase
              .from('courses')
              .select('id')
              .eq('creator_id', enrichedCourseData.creator_id);

            if (creatorCourses && creatorCourses.length > 0) {
              const courseIds = creatorCourses.map(c => c.id);
              
              const { data: reviews } = await supabase
                .from('course_reviews')
                .select('rating')
                .in('course_id', courseIds);

              const { data: enrollments } = await supabase
                .from('course_enrollments')
                .select('id')
                .in('course_id', courseIds);

              const avgRating = reviews && reviews.length > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                : 0;

              setCreator({
                ...creatorData,
                average_rating: Math.round(avgRating * 10) / 10,
                total_courses: creatorCourses.length,
                total_students: enrollments ? enrollments.length : 0,
                total_reviews: reviews ? reviews.length : 0
              });
            } else {
              setCreator(creatorData);
            }
          }
          
          // Fetch course-specific stats
          const { data: enrollmentStats } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', courseId);

          const { data: reviewStats } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', courseId);

          const avgCourseRating = reviewStats && reviewStats.length > 0 
            ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length 
            : 0;

          setCourseStats({
            totalStudents: enrollmentStats ? enrollmentStats.length : 0,
            averageRating: Math.round(avgCourseRating * 10) / 10,
            totalReviews: reviewStats ? reviewStats.length : 0
          });
        }
        
        // Check enrollment status
        if (user && enrichedCourseData) {
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', courseId)
            .eq('user_id', user.id)
            .single();
          
          setIsEnrolled(!!enrollment);
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to enroll in courses');
      navigate('/auth', { state: { from: `/courses/${courseId}` } });
      return;
    }
    
    if (!course) return;
    
    setEnrolling(true);
    
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          user_id: user.id,
          course_id: course.id,
          payment_status: course.is_free ? 'completed' : 'pending'
        }]);

      if (error) throw error;

      setIsEnrolled(true);
      toast.success('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in the course');
    } finally {
      setEnrolling(false);
    }
  };

  const startCourse = () => {
    navigate(`/learning/course/${courseId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
          <div className="container mx-auto px-4 py-16">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
              <p className="mb-6 text-gray-600">The course you are looking for might have been removed or doesn't exist.</p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600">
                <Link to="/explore/courses">Browse Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-purple-200">
                  {/* Course Video Preview - Increased height and no downloads */}
                  <div className="relative h-96 md:h-[500px] bg-black rounded-t-2xl overflow-hidden">
                    {course.course_preview?.preview_video_url ? (
                      <div className="w-full h-full">
                        <ReactPlayer
                          url={course.course_preview.preview_video_url}
                          controls={true}
                          playing={false}
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
                          style={{
                            minHeight: '500px'
                          }}
                        />
                      </div>
                    ) : course.thumbnail_url ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Button 
                            size="lg" 
                            className="bg-white/90 text-purple-600 hover:bg-white rounded-full h-16 w-16 p-0"
                          >
                            <Play className="h-8 w-8" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-white text-center">
                          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-80" />
                          <h3 className="text-xl font-semibold">Course Preview</h3>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">{course.category}</Badge>
                      <Badge variant="outline" className="border-orange-200 text-orange-600">{course.difficulty_level}</Badge>
                      {course.is_free ? (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">${course.price}</Badge>
                      )}
                      {courseStats && courseStats.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{courseStats.averageRating}</span>
                        </div>
                      )}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                      {course.title}
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-6">{course.summary}</p>
                    
                    {/* Dynamic Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm font-medium text-purple-800">Duration</div>
                        <div className="text-purple-600">{formatDuration(course.duration_minutes)}</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                        <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm font-medium text-orange-800">Students</div>
                        <div className="text-orange-600">{courseStats?.totalStudents?.toLocaleString() || 0}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                        <Star className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm font-medium text-purple-800">Rating</div>
                        <div className="text-purple-600">{courseStats?.averageRating || 0} ({courseStats?.totalReviews || 0} reviews)</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                        <BookOpen className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm font-medium text-orange-800">Modules</div>
                        <div className="text-orange-600">{course.modules?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
               {/* Sidebar */}
            <div className="space-y-6">
              {/* Price and Enrollment Card */}
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.is_free ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">${course.price}</div>
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
                    
                    <Button variant="outline" className="w-full mb-6 border-purple-200 text-purple-600 hover:bg-purple-50" asChild>
                      <Link to={`/community/courses?course=${courseId}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Join Discussion
                      </Link>
                    </Button>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-3" />
                        <span className="text-sm">{formatDuration(course.duration_minutes)} of content</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-3" />
                        <span className="text-sm">{course.modules?.length || 0} modules</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-3" />
                        <span className="text-sm">Full lifetime access</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-3" />
                        <span className="text-sm">Access on mobile and desktop</span>
                      </div>
                      {course.certificate_enabled && (
                        <div className="flex items-center text-green-600">
                          <Check className="h-5 w-5 mr-3" />
                          <span className="text-sm">Certificate of completion</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Course Content Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-8">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-8 bg-purple-50 border border-purple-200">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Instructor</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Reviews</TabsTrigger>
                <TabsTrigger value="faq" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">FAQ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">About This Course</h2>
                  <div className="prose max-w-none text-gray-600">
                    <p className="leading-relaxed mb-6">{course.description}</p>
                  </div>
                </div>
                
                {/* Learning Outcomes */}
                {course.course_learning_outcomes && course.course_learning_outcomes.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">What You'll Learn</h2>
                    <div className="grid gap-3">
                      {course.course_learning_outcomes.map((outcome, index) => (
                        <div key={outcome.id || index} className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span>{outcome.outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="curriculum">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Course Curriculum</h2>
                  {course.modules && course.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {course.modules.map((module: CourseModule, index) => (
                        <AccordionItem key={module.id} value={`module-${index}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center justify-between w-full mr-4">
                              <span className="font-medium">
                                Module {index + 1}: {module.title}
                              </span>
                              <Badge variant="outline">
                                {module.lessons?.length || 0} lessons
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {module.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {module.description}
                              </p>
                            )}
                            
                            {/* Lessons */}
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <h4 className="font-medium text-sm mb-2">Lessons:</h4>
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div key={lesson.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {lessonIndex + 1}. {lesson.title}
                                      </div>
                                      {lesson.description && (
                                        <div className="text-xs text-muted-foreground">
                                          {lesson.description}
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {lesson.content_type}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Quizzes */}
                            {module.quizzes && module.quizzes.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium text-sm mb-2">Module Quizzes:</h4>
                                <div className="space-y-2">
                                  {module.quizzes.map((quiz, quizIndex) => (
                                    <div key={quiz.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                                      <Award className="h-4 w-4 text-blue-600" />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm text-blue-800">
                                          Quiz {quizIndex + 1}: {quiz.title}
                                        </div>
                                        {quiz.description && (
                                          <div className="text-xs text-blue-600">
                                            {quiz.description}
                                          </div>
                                        )}
                                      </div>
                                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                                        Passing: {quiz.passing_score}%
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center p-12 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border-2 border-dashed border-purple-200">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-lg font-medium mb-2 text-gray-800">No curriculum available yet</h3>
                      <p className="text-gray-600">
                        This course is still being developed. Check back soon!
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="instructor">
                <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
                  <CardHeader>
                    <CardTitle>Meet Your Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creator ? (
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3">
                          <Avatar className="w-32 h-32 mx-auto md:mx-0">
                            <AvatarImage src={creator.avatar_url} />
                            <AvatarFallback className="text-2xl">
                              {creator.full_name?.split(' ').map((n: string) => n[0]).join('') || 'IN'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="md:w-2/3">
                          <h3 className="text-2xl font-bold mb-2">{creator.full_name || 'Anonymous'}</h3>
                          <p className="text-lg text-muted-foreground mb-4">Course Creator</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{creator.average_rating || 0}</div>
                              <div className="text-sm text-muted-foreground">Rating</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{creator.total_courses || 0}</div>
                              <div className="text-sm text-muted-foreground">Courses</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{creator.total_students || 0}</div>
                              <div className="text-sm text-muted-foreground">Students</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{creator.total_reviews || 0}</div>
                              <div className="text-sm text-muted-foreground">Reviews</div>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {creator.bio || 'No bio available for this instructor.'}
                          </p>
                          
                          <div className="flex gap-4">
                            <Link to={`/creator/profile/${user.id}`}>
                            <Button variant="outline" size="sm">
                              <Globe className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                              </Link>
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <p className="text-muted-foreground">Loading instructor information...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <CourseReviews courseId={course.id} />
              </TabsContent>
              
              <TabsContent value="faq">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">
                              {faq.answer}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
