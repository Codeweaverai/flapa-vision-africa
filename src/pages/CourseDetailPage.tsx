import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { BookOpen, Clock, Award, Check, Users, Play, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseModule, checkEnrollmentStatus, enrollInCourse, fetchCourseWithModulesAndLessons } from '@/services/courseService';
import CourseDiscussionSection from '@/components/community/CourseDiscussionSection';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
      
      if (user) {
        checkEnrollmentStatus(user.id, courseId).then(status => {
          setIsEnrolled(status);
          setCheckingEnrollment(false);
        });
      }
      
      setLoading(false);
    };
    
    loadCourse();
  }, [courseId, user]);

  const checkEnrollment = async () => {
    if (user && course && courseId) {
      // Pass user.id instead of user object
      const isEnrolled = await checkEnrollmentStatus(courseId, user.id);
      setIsEnrolled(isEnrolled);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to enroll in courses');
      navigate('/auth', { state: { from: `/learning/course/${courseId}` } });
      return;
    }
    
    if (!course) return;
    
    setEnrolling(true);
    
    try {
      // Pass user.id instead of user object
      const success = await enrollInCourse(course.id, user.id);
      
      if (success) {
        setIsEnrolled(true);
        toast.success('Successfully enrolled in the course!');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in the course');
    } finally {
      setEnrolling(false);
    }
  };

  const startCourse = () => {
    navigate(`/learning/player/${courseId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="section-container">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="mb-6">The course you are looking for might have been removed or doesn't exist.</p>
            <Button asChild>
              <Link to="/learning">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-light-purple">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-card rounded-lg shadow-lg overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title} 
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-muted flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge>{course.category}</Badge>
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                    {course.is_free ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      <Badge variant="secondary">${course.price}</Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                  
                  <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="content">Course Content</TabsTrigger>
                      <TabsTrigger value="discussion">Discussion</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-6">
                      <p className="text-lg">{course.summary}</p>
                      <div className="mt-4">{course.description}</div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-sm font-medium">Duration</div>
                          <div>{Math.round(course.duration_minutes / 60)} hours</div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-sm font-medium">Modules</div>
                          <div>{course.modules?.length || 0}</div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-sm font-medium">Certificate</div>
                          <div>{course.certificate_enabled ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <div className="text-sm font-medium">Community</div>
                          <div>Active</div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="content">
                      <div className="space-y-6">
                        {course.modules && course.modules.length > 0 ? (
                          course.modules.map((module: CourseModule, index) => (
                            <div key={module.id} className="border rounded-lg overflow-hidden">
                              <div className="bg-muted p-4 font-medium flex justify-between">
                                <div>Module {index + 1}: {module.title}</div>
                                <div className="text-muted-foreground">
                                  {module.lessons?.length || 0} lessons
                                </div>
                              </div>
                              <div className="divide-y">
                                {module.lessons?.map((lesson, lessonIndex) => (
                                  <div key={lesson.id} className="p-4 flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">
                                        {lessonIndex + 1}. {lesson.title}
                                      </div>
                                      {lesson.description && (
                                        <div className="text-sm text-muted-foreground">
                                          {lesson.description}
                                        </div>
                                      )}
                                    </div>
                                    {lesson.video_url ? (
                                      <Badge variant="outline">
                                        <Play className="h-3 w-3 mr-1" />
                                        Video
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Text</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-12">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                            <h3 className="text-lg font-medium mb-2">No content available yet</h3>
                            <p className="text-muted-foreground">
                              This course is still being developed. Check back soon!
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="discussion">
                      {/* Course Discussion Section */}
                      <section className="mt-16">
                        <CourseDiscussionSection courseId={course.id} />
                      </section>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  {course.is_free ? (
                    <div className="text-2xl font-bold mb-2">Free</div>
                  ) : (
                    <div className="text-2xl font-bold mb-2">${course.price}</div>
                  )}
                  
                  {isEnrolled ? (
                    <>
                      <Button className="w-full mb-4" onClick={startCourse}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                      <div className="flex items-center text-sm text-primary mb-4">
                        <Check className="h-4 w-4 mr-1" />
                        <span>You are enrolled in this course</span>
                      </div>
                    </>
                  ) : (
                    <Button
                      className="w-full mb-4"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full mb-6" asChild>
                    <Link to={`/community/courses?course=${courseId}`}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Join Discussion
                    </Link>
                  </Button>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3" />
                      <span>{Math.round(course.duration_minutes / 60)} hours of content</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3" />
                      <span>{course.modules?.length || 0} modules</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3" />
                      <span>Access on mobile and desktop</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span>Certificate of completion</span>
                      </div>
                    )}
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
