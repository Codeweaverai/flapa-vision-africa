
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Award, 
  Check, 
  ExternalLink, 
  FileText as FileCheck, 
  Play as PlayCircle, 
  Lock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { 
  Course, 
  fetchCourseById, 
  fetchCourseWithModulesAndLessons, 
  enrollInCourse, 
  checkEnrollmentStatus 
} from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;

      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
      setLoading(false);
    };

    loadCourse();
  }, [courseId]);

  useEffect(() => {
    // Check if user is enrolled in this course
    const checkEnrollment = async () => {
      if (user && courseId) {
        const enrolled = await checkEnrollmentStatus(courseId, user);
        setIsEnrolled(enrolled);
      }
    };
    
    checkEnrollment();
  }, [user, courseId]);

  const handleEnroll = async () => {
    if (!user) {
      toast({
        description: "Please sign in to enroll in this course",
        variant: "destructive",
      });
      return;
    }

    if (!courseId) return;

    const success = await enrollInCourse(courseId, user);
    if (success) {
      setIsEnrolled(true);
    }
  };

  const lessonCount = course?.modules?.reduce(
    (count, module) => count + (module.lessons?.length || 0),
    0
  ) || 0;

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex justify-center items-center min-h-[40vh]">
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
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="mb-6">The course you are looking for does not exist or has been removed.</p>
            <Button asChild>
              <Link to="/learning">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        {/* Course Banner */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>{course.category}</Badge>
                <Badge variant="outline">{course.difficulty_level}</Badge>
                {course.is_free ? (
                  <Badge variant="secondary">Free</Badge>
                ) : (
                  <Badge variant="secondary">${course.price}</Badge>
                )}
                {course.certificate_enabled && (
                  <Badge variant="outline">Certificate</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              
              <p className="text-lg mb-6">{course.summary}</p>
              
              <div className="flex flex-wrap gap-6 text-sm mb-6">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  <span>{Math.ceil(course.duration_minutes / 60)} hours</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  <span>{course.modules?.length || 0} modules</span>
                </div>
                <div className="flex items-center">
                  <FileCheck className="mr-2 h-5 w-5 text-primary" />
                  <span>{lessonCount} lessons</span>
                </div>
                {course.certificate_enabled && (
                  <div className="flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    <span>Certificate included</span>
                  </div>
                )}
              </div>

              {isEnrolled ? (
                <Button size="lg" asChild>
                  <Link to={`/learning/player/${course.id}`}>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Continue Learning
                  </Link>
                </Button>
              ) : (
                <Button size="lg" onClick={handleEnroll}>
                  {course.is_free ? (
                    <>
                      <BookOpen className="mr-2 h-5 w-5" />
                      Enroll Now (Free)
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-5 w-5" />
                      Enroll Now (${course.price})
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="lg:col-span-1">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="rounded-lg shadow-lg w-full object-cover aspect-video"
                />
              ) : (
                <div className="rounded-lg bg-muted w-full aspect-video flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Description */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">About This Course</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{course.description}</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.modules?.flatMap((module) => 
                  module.lessons?.slice(0, 2).map((lesson) => (
                    <div key={lesson.id} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                      <span>{lesson.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{course.modules?.length || 0} modules • {lessonCount} lessons</span>
                  <span>Total: {Math.ceil(course.duration_minutes / 60)} hours</span>
                </div>
                
                <div className="space-y-3">
                  {course.modules?.map((module) => (
                    <div key={module.id} className="border rounded-lg">
                      <div className="p-4 bg-muted/40">
                        <h3 className="font-medium">{module.title}</h3>
                        <div className="text-sm text-muted-foreground">{module.lessons?.length || 0} lessons • {Math.ceil(((module.lessons?.length || 0) * 15) / 60)} hours</div>
                      </div>
                      <Separator />
                      <div className="p-4 space-y-2">
                        {module.lessons?.slice(0, 3).map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              {isEnrolled ? (
                                <PlayCircle className="h-4 w-4 text-primary mr-2" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                              )}
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">15 min</span>
                          </div>
                        ))}
                        
                        {(module.lessons?.length || 0) > 3 && (
                          <div className="text-sm text-muted-foreground pl-6">
                            + {(module.lessons?.length || 0) - 3} more lessons
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">This course includes:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <PlayCircle className="h-5 w-5 text-primary mr-2" />
                      <span>{Math.ceil(course.duration_minutes / 60)} hours of video content</span>
                    </li>
                    <li className="flex items-center">
                      <FileCheck className="h-5 w-5 text-primary mr-2" />
                      <span>{lessonCount} lessons</span>
                    </li>
                    {course.certificate_enabled && (
                      <li className="flex items-center">
                        <Award className="h-5 w-5 text-primary mr-2" />
                        <span>Completion certificate</span>
                      </li>
                    )}
                    <li className="flex items-center">
                      <BookOpen className="h-5 w-5 text-primary mr-2" />
                      <span>Full lifetime access</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                {isEnrolled ? (
                  <Button className="w-full" asChild>
                    <Link to={`/learning/player/${course.id}`}>
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleEnroll}>
                    {course.is_free ? (
                      <>
                        <BookOpen className="mr-2 h-5 w-5" />
                        Enroll Now (Free)
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-5 w-5" />
                        Enroll Now (${course.price})
                      </>
                    )}
                  </Button>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  {course.is_free ? "This course is free forever" : "30-day money-back guarantee"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
