
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DollarSign
} from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';

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
      <div className="container mx-auto py-8 px-4 max-w-6xl">
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

            {/* Course Header */}
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
                  0 students
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  4.5 (0 reviews)
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.modules?.length || 0} modules
                </div>
              </div>
            </div>

            {/* Course Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            </Card>

            {/* Learning Outcomes */}
            {course.course_learning_outcomes && course.course_learning_outcomes.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>What You'll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.course_learning_outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{outcome.outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Content */}
            {course.modules && course.modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                  <CardDescription>
                    {course.modules.length} modules • {course.modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.modules.map((module, index) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">
                            Module {index + 1}: {module.title}
                          </h3>
                          <Badge variant="outline">
                            {module.lessons?.length || 0} lessons
                          </Badge>
                        </div>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {module.description}
                          </p>
                        )}
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-center gap-2 text-sm">
                                <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                <span>{lessonIndex + 1}. {lesson.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                        <span className="text-sm text-muted-foreground">{course.currency || 'USD'}</span>
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
                      {course.certificate_enabled && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>Certificate of completion</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {course.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">No tags</span>}
                    </div>
                  </div>
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
