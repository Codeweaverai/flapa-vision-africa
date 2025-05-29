import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Book, Clock, Users, Star, Play, FileText, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Layout from '@/components/layout/Layout';
import { Course, CourseModule, fetchCourseWithModulesAndLessons } from '@/services/courseService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CourseEnrollmentButton from '@/components/payment/CourseEnrollmentButton';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    fetchCourseData();
    fetchEnrollmentCount();
    
    if (user) {
      checkEnrollmentStatus();
    }
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      const courseData = await fetchCourseWithModulesAndLessons(id!);
      if (courseData) {
        setCourse(courseData);
        setModules(courseData.modules || []);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', id);
      
      if (error) throw error;
      setEnrollmentCount(count || 0);
    } catch (error) {
      console.error('Error fetching enrollment count:', error);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select()
        .eq('course_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setIsEnrolled(!!data);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
  };

  const getTotalDuration = () => {
    return Math.ceil((course?.duration_minutes || 0) / 60);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="section-container py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="section-container py-8 flex flex-col justify-center items-center gap-4">
            <p>Course not found</p>
            <Button asChild>
              <Link to="/learning">Back to Learning</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="section-container py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <Card className="border-purple-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                        {course.category}
                      </Badge>
                      <CardTitle className="text-3xl text-gray-900">{course.title}</CardTitle>
                      <CardDescription className="text-lg text-gray-600">
                        {course.summary}
                      </CardDescription>
                    </div>
                    <Badge variant={course.difficulty_level === 'beginner' ? 'secondary' : 
                                  course.difficulty_level === 'intermediate' ? 'default' : 'destructive'}>
                      {course.difficulty_level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{getTotalDuration()} hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Book className="h-4 w-4" />
                      <span>{getTotalLessons()} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{enrollmentCount} students</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>Certificate</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                {course.thumbnail_url && (
                  <div className="px-6 pb-6">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Course Description */}
              <Card className="border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">About This Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-700">{course.description}</p>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Card className="border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Course Content</CardTitle>
                  <CardDescription>
                    {modules.length} modules • {getTotalLessons()} lessons • {getTotalDuration()} hours total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {modules.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Course content is being prepared. Check back soon!
                    </p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      {modules.map((module, moduleIndex) => (
                        <AccordionItem 
                          key={module.id} 
                          value={module.id}
                          className="border border-purple-200 rounded-lg px-4"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full mr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 text-sm font-medium">
                                  {moduleIndex + 1}
                                </div>
                                <div className="text-left">
                                  <h3 className="font-medium text-gray-900">{module.title}</h3>
                                  <p className="text-sm text-gray-500">
                                    {module.lessons?.length || 0} lessons
                                  </p>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="ml-11 space-y-3">
                              {module.description && (
                                <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                              )}
                              
                              {module.lessons && module.lessons.length > 0 ? (
                                <div className="space-y-2">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-3 p-3 bg-purple-25 rounded-md border border-purple-100">
                                      <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 text-xs">
                                        {lessonIndex + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          {lesson.content_type === 'video' ? (
                                            <Play className="h-4 w-4 text-purple-600" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-purple-600" />
                                          )}
                                          <span className="font-medium text-gray-900">{lesson.title}</span>
                                        </div>
                                        {lesson.description && (
                                          <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                                        )}
                                      </div>
                                      {!isEnrolled && (
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                          Preview
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm italic">
                                  Lessons are being prepared for this module.
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-purple-200 shadow-lg sticky top-8">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {course.is_free ? 'Free' : `$${course.price}`}
                      </div>
                      {!course.is_free && (
                        <p className="text-sm text-gray-500">One-time payment</p>
                      )}
                    </div>

                    <Separator />

                    {isEnrolled ? (
                      <div className="space-y-3">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg" asChild>
                          <Link to={`/learning/course/${course.id}`}>
                            Continue Learning
                          </Link>
                        </Button>
                        <p className="text-center text-sm text-green-600 font-medium">
                          ✓ You're enrolled in this course
                        </p>
                      </div>
                    ) : (
                      <CourseEnrollmentButton
                        courseId={course.id}
                        courseName={course.title}
                        isFree={course.is_free}
                        price={course.price || 0}
                        currency="USD"
                        isUserEnrolled={isEnrolled}
                        creatorId={course.creator_id}
                      />
                    )}

                    <div className="text-center text-sm text-gray-500">
                      30-day money-back guarantee
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Skill Level:</span>
                        <span className="font-medium capitalize">{course.difficulty_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium">{enrollmentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modules:</span>
                        <span className="font-medium">{modules.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lessons:</span>
                        <span className="font-medium">{getTotalLessons()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{getTotalDuration()} hours</span>
                      </div>
                      {course.certificate_enabled && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Certificate:</span>
                          <span className="font-medium text-purple-600">Included</span>
                        </div>
                      )}
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
