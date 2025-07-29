
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Award, 
  CheckCircle, 
  Play,
  MessageSquare,
  StickyNote,
  FileText
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number;
  order_index: number;
  video_url?: string;
  content?: string;
  is_preview: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  tags: string[];
  is_free: boolean;
  price: number;
  modules: Module[];
  enrollments_count: number;
  reviews_count: number;
  average_rating: number;
  creator: {
    full_name: string;
    avatar_url?: string;
  };
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchProgress();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const { data: courseData, error } = await supabase
        .from('courses')
        .select(`
          *,
          creator:profiles!courses_creator_id_fkey(full_name, avatar_url),
          course_modules!course_modules_course_id_fkey(
            id,
            title,
            order_index,
            lessons!lessons_module_id_fkey(
              id,
              title,
              duration_minutes,
              order_index,
              video_url,
              content,
              is_preview
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;

      // Transform the data to match the Course interface
      const transformedCourse: Course = {
        ...courseData,
        modules: courseData.course_modules?.map((module: any) => ({
          ...module,
          lessons: module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index) || []
        })).sort((a: any, b: any) => a.order_index - b.order_index) || [],
        enrollments_count: 0,
        reviews_count: 0,
        average_rating: 0,
        creator: Array.isArray(courseData.creator) ? courseData.creator[0] : courseData.creator || { full_name: 'Unknown', avatar_url: null }
      };

      setCourse(transformedCourse);

      // Set the first lesson as selected if none is selected
      if (!selectedLessonId && transformedCourse.modules.length > 0) {
        const firstLesson = transformedCourse.modules[0].lessons[0];
        if (firstLesson) {
          setSelectedLessonId(firstLesson.id);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_progress')
        .select('progress_percentage')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProgress(data.progress_percentage);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const selectedLesson = course?.modules
    .flatMap(module => module.lessons)
    .find(lesson => lesson.id === selectedLessonId);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <p className="text-gray-600">The course you're looking for doesn't exist.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Content */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {course.difficulty_level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration_minutes} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrollments_count} students
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {course.average_rating.toFixed(1)} ({course.reviews_count} reviews)
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Progress */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm text-gray-600">{progress}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>

              {/* Video Player / Lesson Content */}
              {selectedLesson && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      {selectedLesson.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedLesson.video_url ? (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-600">Video Player Component</p>
                      </div>
                    ) : (
                      <div className="prose max-w-none">
                        <p>{selectedLesson.content || 'No content available for this lesson.'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lesson Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-gray-700">{course.description}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <StickyNote className="h-5 w-5" />
                        <p>Take notes while you learn</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="discussion" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MessageSquare className="h-5 w-5" />
                        <p>Join the discussion with other students</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="resources" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="h-5 w-5" />
                        <p>Download course materials and resources</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Course Modules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-900">
                          {moduleIndex + 1}. {module.title}
                        </h4>
                        <div className="space-y-1">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <Button
                              key={lesson.id}
                              variant={selectedLessonId === lesson.id ? "default" : "ghost"}
                              size="sm"
                              className={`w-full justify-start text-left h-auto p-2 ${
                                selectedLessonId === lesson.id 
                                  ? 'bg-gradient-to-r from-orange-500 to-purple-600' 
                                  : ''
                              }`}
                              onClick={() => setSelectedLessonId(lesson.id)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {lessonIndex + 1}. {lesson.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {lesson.duration_minutes} min
                                  </p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Instructor */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={course.creator.avatar_url} />
                      <AvatarFallback>
                        {course.creator.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{course.creator.full_name}</p>
                      <p className="text-sm text-gray-600">Course Instructor</p>
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

export default CourseLearningPage;
