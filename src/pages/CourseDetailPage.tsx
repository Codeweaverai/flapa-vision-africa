import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { BookOpen, Clock, Award, Check, Users, Play, MessageCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseModule, checkEnrollmentStatus, enrollInCourse, fetchCourseWithModulesAndLessons } from '@/services/courseService';
import CourseDiscussionSection from '@/components/community/CourseDiscussionSection';
import ReactPlayer from 'react-player';

const CourseDetailPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
      
      if (user && courseData) {
        const status = await checkEnrollmentStatus(courseId);
        setIsEnrolled(status);
      }
      
      setLoading(false);
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
      const success = await enrollInCourse(course.id);
      
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
    navigate(`/course/${courseId}/learn`);
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-purple-200">
                  {/* Course Video/Thumbnail */}
                  <div className="relative h-64 md:h-80 bg-gradient-to-r from-purple-600 to-orange-500">
                    {course.thumbnail_url ? (
                      <div className="relative w-full h-full">
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
                        <Badge className="bg-green-100 text-green-800 border-green-200">Free</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">${course.price}</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">4.8</span>
                      </div>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                      {course.title}
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-6">{course.summary}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm font-medium text-purple-800">Duration</div>
                        <div className="text-purple-600">{Math.round(course.duration_minutes / 60)} hours</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                        <BookOpen className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm font-medium text-orange-800">Modules</div>
                        <div className="text-orange-600">{course.modules?.length || 0}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                        <Award className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-sm font-medium text-purple-800">Certificate</div>
                        <div className="text-purple-600">{course.certificate_enabled ? 'Yes' : 'No'}</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                        <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-sm font-medium text-orange-800">Students</div>
                        <div className="text-orange-600">1,234</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enrollment Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 bg-white/80 backdrop-blur-sm border-purple-200 shadow-xl">
                  <CardContent className="p-6">
                    {course.is_free ? (
                      <div className="text-3xl font-bold mb-4 text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold mb-4 text-purple-600">${course.price}</div>
                    )}
                    
                    {isEnrolled ? (
                      <>
                        <Button 
                          className="w-full mb-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700" 
                          onClick={startCourse}
                          size="lg"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Continue Learning
                        </Button>
                        <div className="flex items-center text-sm text-green-600 mb-4 bg-green-50 p-3 rounded-lg border border-green-200">
                          <Check className="h-4 w-4 mr-2" />
                          <span>You are enrolled in this course</span>
                        </div>
                      </>
                    ) : (
                      <Button
                        className="w-full mb-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        onClick={handleEnroll}
                        disabled={enrolling}
                        size="lg"
                      >
                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
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
                        <span className="text-sm">{Math.round(course.duration_minutes / 60)} hours of content</span>
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

          {/* Course Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-8">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-purple-50 border border-purple-200">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Overview</TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Course Content</TabsTrigger>
                <TabsTrigger value="discussion" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">About This Course</h2>
                  <div className="prose max-w-none text-gray-600">
                    {course.description}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Course Content</h2>
                  {course.modules && course.modules.length > 0 ? (
                    course.modules.map((module: CourseModule, index) => (
                      <div key={module.id} className="border border-purple-200 rounded-lg overflow-hidden bg-white/50">
                        <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-4 font-medium flex justify-between border-b border-purple-200">
                          <div className="text-gray-800">Module {index + 1}: {module.title}</div>
                          <div className="text-purple-600">
                            {module.lessons?.length || 0} lessons
                          </div>
                        </div>
                        <div className="divide-y divide-purple-100">
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-purple-25">
                              <div>
                                <div className="font-medium text-gray-800">
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                                {lesson.description && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                              {lesson.video_url ? (
                                <Badge variant="outline" className="border-purple-200 text-purple-600">
                                  <Play className="h-3 w-3 mr-1" />
                                  Video
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-orange-200 text-orange-600">Text</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-12 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border-2 border-dashed border-purple-200">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-lg font-medium mb-2 text-gray-800">No content available yet</h3>
                      <p className="text-gray-600">
                        This course is still being developed. Check back soon!
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="discussion">
                <CourseDiscussionSection courseId={course.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
