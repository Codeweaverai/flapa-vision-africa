
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Play, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Users, 
  Star,
  Award,
  Download,
  MessageCircle,
  FileText
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  creator: {
    full_name: string;
    avatar_url: string;
  };
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  modules: any[];
  enrollments_count: number;
  reviews_count: number;
  average_rating: number;
}

interface CourseProgress {
  progress_percentage: number;
  last_lesson_completed: string;
  last_accessed_lesson_id: string;
}

interface Enrollment {
  id: string;
  enrollment_date: string;
  is_completed: boolean;
  completion_date: string | null;
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          creator:profiles!courses_creator_id_fkey(full_name, avatar_url),
          course_modules(
            id,
            title,
            description,
            order_index,
            lessons(
              id,
              title,
              duration_minutes,
              order_index,
              video_url,
              lesson_type
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch enrollment data
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .single();

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw enrollmentError;
      }

      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      // Transform courseData to match Course interface
      const transformedCourse: Course = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        thumbnail_url: courseData.thumbnail_url,
        creator: courseData.creator,
        duration_minutes: courseData.duration_minutes,
        difficulty_level: courseData.difficulty_level,
        category: courseData.category,
        modules: courseData.course_modules || [],
        enrollments_count: 0, // Default value
        reviews_count: 0, // Default value
        average_rating: 0, // Default value
      };

      setCourse(transformedCourse);
      setEnrollment(enrollmentData);
      setProgress(progressData);

      // If not enrolled, redirect to course detail page
      if (!enrollmentData) {
        toast.error('You are not enrolled in this course');
        navigate(`/course/${courseId}`);
        return;
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const startLearning = () => {
    if (course && course.modules.length > 0) {
      const firstModule = course.modules[0];
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons[0];
        navigate(`/lesson/${firstLesson.id}`);
      }
    }
  };

  const continueFromLastLesson = () => {
    if (progress?.last_accessed_lesson_id) {
      navigate(`/lesson/${progress.last_accessed_lesson_id}`);
    } else {
      startLearning();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
              <p className="text-gray-600 mb-8">The course you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/my-courses')}>
                Back to My Courses
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/my-courses')}
                  className="flex items-center gap-2"
                >
                  ← Back to My Courses
                </Button>
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{course.difficulty_level}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrollments_count} students
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {course.average_rating?.toFixed(1) || 'No ratings'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Course Progress</span>
                  <span className="text-sm text-gray-600">{progress?.progress_percentage || 0}%</span>
                </div>
                <Progress value={progress?.progress_percentage || 0} className="h-2" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={continueFromLastLesson}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {progress?.progress_percentage ? 'Continue Learning' : 'Start Learning'}
                </Button>
                
                {enrollment?.is_completed && (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </Button>
                )}
              </div>
            </div>

            {/* Course Content */}
            <Tabs defaultValue="curriculum" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
                <TabsTrigger value="notes">My Notes</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum">
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Module {moduleIndex + 1}: {module.title}
                        </CardTitle>
                        {module.description && (
                          <CardDescription>{module.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => navigate(`/lesson/${lesson.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-full text-sm font-medium">
                                  {lessonIndex + 1}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration_minutes} min
                                    </span>
                                    <span className="capitalize">{lesson.lesson_type}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <Play className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="discussions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Course Discussions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Course discussions will be available here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      My Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Your personal notes for this course will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Course Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Downloadable resources and materials will be available here.</p>
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

export default CourseLearningPage;
