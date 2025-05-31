
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fetchCourseDetails, checkEnrollmentStatus, enrollInCourse } from '@/services/courseService';
import type { Course } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  PlayCircle,
  Award,
  CheckCircle,
  DollarSign,
  MessageSquare,
  ThumbsUp,
  Globe,
  Mail
} from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import CourseReviews from '@/components/course/CourseReviews';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const courseData = await fetchCourseDetails(id);
        setCourse(courseData);
        
        // Check enrollment status if user is logged in
        if (user) {
          const enrollmentStatus = await checkEnrollmentStatus(id);
          setIsEnrolled(enrollmentStatus);
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!course || !id) return;

    try {
      setEnrolling(true);
      await enrollInCourse(id);
      setIsEnrolled(true);
      toast.success('Successfully enrolled in course!');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    navigate(`/learning/course/${id}`);
  };

  // Mock instructor data - in a real app, this would come from the course data
  const instructor = {
    name: "John Doe",
    title: "Senior Software Engineer",
    bio: "John is a passionate educator with over 10 years of experience in software development. He has taught thousands of students and helped them launch successful careers in tech.",
    avatar: "https://github.com/shadcn.png",
    courses: 15,
    students: 12500,
    rating: 4.8,
    website: "https://johndoe.dev",
    email: "john@example.com"
  };

  // Mock FAQs data
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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Course Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Course Preview Video */}
              {course.course_preview?.preview_video_url && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Course Preview</h2>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                      src={course.course_preview.preview_video_url}
                      poster={course.thumbnail_url}
                      controls={true}
                      autoplay={false}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Course Info */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.difficulty_level}</Badge>
                  {course.certificate_enabled && (
                    <Badge variant="outline">
                      <Award className="h-3 w-3 mr-1" />
                      Certificate
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-xl text-muted-foreground mb-6">{course.summary}</p>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    1,234 students
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    4.5 (128 reviews)
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.modules?.length || 0} modules
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <div className="text-center">
                    {course.thumbnail_url && (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full aspect-video object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="mb-4">
                      {course.is_free ? (
                        <div className="text-3xl font-bold text-green-600">Free</div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="h-6 w-6" />
                          <span className="text-3xl font-bold">{course.price}</span>
                          <span className="text-sm text-muted-foreground">USD</span>
                        </div>
                      )}
                    </div>

                    {isEnrolled ? (
                      <Button 
                        className="w-full mb-4" 
                        size="lg"
                        onClick={handleStartLearning}
                      >
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        className="w-full mb-4" 
                        size="lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? 'Enrolling...' : course.is_free ? 'Enroll for Free' : 'Enroll Now'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">This course includes:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m on-demand video</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{course.modules?.length || 0} modules</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span>Full lifetime access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span>Access on mobile and desktop</span>
                        </div>
                        {course.certificate_enabled && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span>Certificate of completion</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {course.description}
                    </p>
                    
                    {/* Learning Outcomes */}
                    {course.course_learning_outcomes && course.course_learning_outcomes.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">What You'll Learn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.course_learning_outcomes.map((outcome, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{outcome.outcome}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="curriculum" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Curriculum</CardTitle>
                  <CardDescription>
                    {course.modules?.length || 0} modules • {course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {course.modules && course.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {course.modules.map((module, index) => (
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
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="space-y-2">
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
                                      {lesson.video_url ? 'Video' : 'Text'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No curriculum available</h3>
                      <p className="text-muted-foreground">
                        This course is still being developed. Check back soon!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="instructor" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meet Your Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <Avatar className="w-32 h-32 mx-auto md:mx-0">
                        <AvatarImage src={instructor.avatar} />
                        <AvatarFallback className="text-2xl">
                          {instructor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="md:w-2/3">
                      <h3 className="text-2xl font-bold mb-2">{instructor.name}</h3>
                      <p className="text-lg text-muted-foreground mb-4">{instructor.title}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{instructor.rating}</div>
                          <div className="text-sm text-muted-foreground">Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{instructor.courses}</div>
                          <div className="text-sm text-muted-foreground">Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{instructor.students.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">5+</div>
                          <div className="text-sm text-muted-foreground">Years</div>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {instructor.bio}
                      </p>
                      
                      <div className="flex gap-4">
                        <Button variant="outline" size="sm" asChild>
                          <a href={instructor.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${instructor.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Contact
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <CourseReviews courseId={course.id} />
            </TabsContent>
            
            <TabsContent value="faq" className="mt-6">
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
    </Layout>
  );
};

export default CourseDetailPage;
