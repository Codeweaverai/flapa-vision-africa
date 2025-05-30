import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Course, fetchCourseDetails, fetchModuleLessons } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import CreatorProfile from '@/components/creator/CreatorProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, Users, BookOpen, Play, Check, ChevronRight } from 'lucide-react';
import ReactPlayer from 'react-player';
import { toast } from 'sonner';
import CourseReviews from '@/components/course/CourseReviews';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id, user]);

  const loadCourseData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const courseData = await fetchCourseDetails(id);
      if (!courseData) {
        toast.error('Course not found');
        navigate('/learning');
        return;
      }
      
      const modulesData = await fetchModuleLessons(id, user?.id || '');
      
      setCourse(courseData);
      setModules(modulesData);
      
      // Check if user is enrolled
      if (user) {
        // Check enrollment logic here
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-purple">
        <Layout>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Layout>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-light-purple">
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Course not found</h1>
              <Button onClick={() => navigate('/learning')}>
                Back to Learning
              </Button>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  // Get dynamic learning outcomes from course data
  const learningOutcomes = course?.course_learning_outcomes?.map(outcome => outcome.outcome) || [
    "Master the fundamentals of the subject",
    "Apply practical skills in real-world scenarios",
    "Build portfolio-worthy projects",
    "Understand industry best practices",
    "Develop problem-solving capabilities"
  ];

  const faqs = [
    {
      question: "How long do I have access to the course?",
      answer: "You have lifetime access to the course materials once enrolled."
    },
    {
      question: "Is there a certificate upon completion?",
      answer: course.certificate_enabled ? "Yes, you'll receive a certificate upon successful completion." : "No certificate is provided for this course."
    },
    {
      question: "Can I download the course materials?",
      answer: "Course videos are available for streaming. Additional materials may be downloadable."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied."
    }
  ];

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Course Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.difficulty_level}</Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{course.summary}</p>
                
                <div className="flex items-center space-x-6 text-sm mb-6">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.8</span>
                    <span className="text-muted-foreground">(1,234 reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span>5,678 students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{Math.ceil((course.duration_minutes || 0) / 60)} hours</span>
                  </div>
                </div>
              </div>

              {/* Preview Video */}
              <Card className="mb-8">
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {course?.course_previews?.[0]?.preview_video_url ? (
                      <div className="relative w-full h-full">
                        <video 
                          src={course.course_previews[0].preview_video_url} 
                          controls
                          className="w-full h-full object-contain"
                          poster={course.thumbnail_url}
                        />
                      </div>
                    ) : course?.thumbnail_url ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button 
                            size="lg" 
                            className="rounded-full"
                            onClick={() => setPreviewMode(true)}
                          >
                            <Play className="w-6 h-6 mr-2" />
                            Preview Course
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-white">No preview available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.is_free ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold">${course.price}</div>
                    )}
                  </div>
                  
                  {isEnrolled ? (
                    <Button className="w-full" asChild>
                      <Link to={`/learning/course/${course.id}`}>
                        Continue Learning
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full">
                      {course.is_free ? 'Enroll for Free' : 'Enroll Now'}
                    </Button>
                  )}
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Mobile and desktop access</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Certificate of completion</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Creator Profile */}
              {course.creator_id && (
                <CreatorProfile creatorId={course.creator_id} />
              )}
            </div>
          </div>

          {/* Course Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>What you'll learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p>{course.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="curriculum">
              <Card>
                <CardHeader>
                  <CardTitle>Course Curriculum</CardTitle>
                  <p className="text-muted-foreground">
                    {modules.length} modules • {Math.ceil((course.duration_minutes || 0) / 60)} hours total
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {modules.map((module, index) => (
                      <AccordionItem key={module.id} value={`module-${index}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">Module {index + 1}: {module.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-4">
                            {module.lessons && module.lessons.map((lesson: any, lessonIndex: number) => (
                              <div key={lesson.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div className="flex items-center space-x-3">
                                  <Play className="w-4 h-4 text-primary" />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">5 min</span>
                              </div>
                            ))}
                            {module.description && (
                              <p className="text-sm text-muted-foreground mt-2">{module.description}</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="instructor">
              {course.creator_id && (
                <CreatorProfile creatorId={course.creator_id} className="max-w-2xl" />
              )}
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
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </div>
  );
};

export default CourseDetailPage;
