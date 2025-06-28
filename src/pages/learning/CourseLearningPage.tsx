
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Book, 
  Clock, 
  CheckCircle, 
  Lock, 
  ArrowLeft,
  Download,
  FileText,
  Video
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration_minutes: number;
  difficulty_level: string;
  course_modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: string;
  video_url: string;
  order_index: number;
  materials_urls: string[];
  lesson_progress: LessonProgress[];
}

interface LessonProgress {
  id: string;
  is_completed: boolean;
  last_position_seconds: number;
}

interface CourseProgress {
  progress_percentage: number;
  last_lesson_completed: string;
}

const CourseLearningPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    if (id && user) {
      loadCourseData();
    }
  }, [id, user]);

  const loadCourseData = async () => {
    try {
      setLoading(true);

      // Check if user is enrolled
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user?.id)
        .single();

      if (enrollmentError || !enrollment) {
        toast.error('You are not enrolled in this course');
        navigate('/courses');
        return;
      }

      // Load course with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            *,
            lessons (
              *,
              lesson_progress!inner (
                id,
                is_completed,
                last_position_seconds,
                enrollment_id
              )
            )
          )
        `)
        .eq('id', id)
        .eq('course_modules.lessons.lesson_progress.enrollment_id', enrollment.id)
        .order('course_modules.order_index', { ascending: true })
        .order('course_modules.lessons.order_index', { ascending: true })
        .single();

      if (courseError) throw courseError;

      setCourse(courseData);

      // Load course progress
      const { data: progressData } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user?.id)
        .single();

      setCourseProgress(progressData);

      // Set current lesson (first incomplete or first lesson)
      if (courseData.course_modules && courseData.course_modules.length > 0) {
        let firstIncompleteLesson = null;
        
        for (const module of courseData.course_modules) {
          for (const lesson of module.lessons) {
            if (!lesson.lesson_progress[0]?.is_completed) {
              firstIncompleteLesson = lesson;
              break;
            }
          }
          if (firstIncompleteLesson) break;
        }

        setCurrentLesson(firstIncompleteLesson || courseData.course_modules[0].lessons[0]);
      }

    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !currentLesson) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          is_completed: true,
          completion_date: new Date().toISOString(),
          last_position_seconds: videoProgress
        })
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', course?.id);

      if (error) throw error;

      toast.success('Lesson completed!');
      await loadCourseData(); // Refresh progress
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson complete');
    }
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setVideoProgress(lesson.lesson_progress[0]?.last_position_seconds || 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Course Not Found</h2>
              <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or you don't have access.</p>
              <Button onClick={() => navigate('/learning')} className="bg-gradient-to-r from-orange-500 to-purple-600">
                Back to Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/learning')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning
            </Button>
            
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="outline">{course.difficulty_level}</Badge>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration_minutes} minutes</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm text-gray-600">
                      {courseProgress?.progress_percentage || 0}%
                    </span>
                  </div>
                  <Progress value={courseProgress?.progress_percentage || 0} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Course Content */}
            <div className="lg:col-span-3">
              {currentLesson && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      {currentLesson.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Video Player */}
                    {currentLesson.video_url && (
                      <div className="mb-6">
                        <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                          <video
                            className="absolute inset-0 w-full h-full"
                            controls
                            src={currentLesson.video_url}
                            onTimeUpdate={(e) => setVideoProgress((e.target as HTMLVideoElement).currentTime)}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    {/* Lesson Description */}
                    {currentLesson.description && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
                        <p className="text-gray-600">{currentLesson.description}</p>
                      </div>
                    )}

                    {/* Lesson Materials */}
                    {currentLesson.materials_urls && currentLesson.materials_urls.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Resources</h3>
                        <div className="space-y-2">
                          {currentLesson.materials_urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                            >
                              <Download className="h-4 w-4" />
                              Resource {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Complete Lesson Button */}
                    {!currentLesson.lesson_progress[0]?.is_completed && (
                      <Button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Course Curriculum */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Course Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2">
                    {course.course_modules.map((module) => (
                      <div key={module.id} className="border-b last:border-b-0">
                        <div className="p-4 bg-gray-50">
                          <h4 className="font-medium text-gray-900">{module.title}</h4>
                        </div>
                        <div className="space-y-1">
                          {module.lessons.map((lesson) => {
                            const isCompleted = lesson.lesson_progress[0]?.is_completed;
                            const isCurrent = currentLesson?.id === lesson.id;
                            
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => selectLesson(lesson)}
                                className={`w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 ${
                                  isCurrent ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Play className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${isCurrent ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                                  {lesson.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
