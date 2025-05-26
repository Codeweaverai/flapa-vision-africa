
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Book, Clock, Users, Star, Play, FileText, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Layout from '@/components/layout/Layout';
import { 
  Course, 
  CourseModule,
  fetchCourseWithModulesAndLessons,
  checkEnrollmentStatus,
  enrollInCourse 
} from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    loadCourseData();
    if (user) {
      checkEnrollment();
    }
  }, [id, user]);

  const loadCourseData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const courseData = await fetchCourseWithModulesAndLessons(id);
      if (courseData) {
        setCourse(courseData);
        setModules(courseData.modules || []);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!id || !user) return;
    
    try {
      const enrolled = await checkEnrollmentStatus(id, user.id);
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!id || !user) {
      toast.error('Please log in to enroll in this course');
      return;
    }

    setEnrolling(true);
    try {
      const success = await enrollInCourse(id, user.id);
      if (success) {
        setIsEnrolled(true);
        toast.success('Successfully enrolled in course!');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-light-purple">
          <div className="section-container py-12">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-light-purple">
          <div className="section-container py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Course not found</h1>
              <Button asChild>
                <Link to="/learning">Back to Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="section-container py-12">
          {/* Course Header */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Badge className="mb-2">{course.category}</Badge>
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-xl text-gray-600 mb-6">{course.summary}</p>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(course.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  <span>{getTotalLessons()} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.difficulty_level}</span>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">About This Course</h2>
                <p className="whitespace-pre-line text-gray-700">{course.description}</p>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  {course.thumbnail_url && (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {course.is_free ? 'Free' : `$${course.price}`}
                      </p>
                    </div>
                    
                    {user ? (
                      isEnrolled ? (
                        <Button asChild className="w-full" size="lg">
                          <Link to={`/learning/course/${course.id}/learn`}>
                            Continue Learning
                          </Link>
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleEnroll}
                          disabled={enrolling}
                        >
                          {enrolling ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      )
                    ) : (
                      <Button asChild className="w-full" size="lg">
                        <Link to="/auth/login">Login to Enroll</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Course Content</CardTitle>
              <p className="text-gray-600">
                {modules.length} modules • {getTotalLessons()} lessons • {formatDuration(course.duration_minutes)} total length
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {modules.map((module, moduleIndex) => (
                  <AccordionItem key={module.id} value={`module-${moduleIndex}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {module.lessons.length} lessons
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              {isEnrolled ? (
                                <Play className="h-4 w-4 text-primary" />
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                {lesson.description && (
                                  <p className="text-sm text-gray-600">{lesson.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {lesson.content_type === 'video' && (
                                <span className="flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  Video
                                </span>
                              )}
                              {lesson.quizzes && lesson.quizzes.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Quiz
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
