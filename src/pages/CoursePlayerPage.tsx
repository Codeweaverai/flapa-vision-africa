import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { SimplifiedCourse, SimplifiedModule, SimplifiedLesson } from '@/types/eventTypes';
import VideoPlayer from '@/components/course/VideoPlayer';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

// Create a simplified CourseModuleList component to avoid type conflicts
const SimplifiedCourseModuleList: React.FC<{
  modules: SimplifiedModule[];
  currentLessonId?: string;
  onSelectLesson: (lesson: SimplifiedLesson) => void;
  isEnrolled: boolean;
}> = ({ modules, currentLessonId, onSelectLesson, isEnrolled }) => {
  return (
    <div className="space-y-4">
      {modules.map((module, moduleIndex) => (
        <div key={module.id} className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h4 className="font-medium text-sm text-muted-foreground">
              Module {moduleIndex + 1}
            </h4>
            <h3 className="font-semibold">{module.title}</h3>
            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
            )}
          </div>
          <div className="p-4 space-y-2">
            {module.lessons.map((lesson, lessonIndex) => (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                disabled={!isEnrolled}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  currentLessonId === lesson.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted border-border'
                } ${!isEnrolled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium opacity-60">
                      {moduleIndex + 1}.{lessonIndex + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-xs opacity-60 mt-1">{lesson.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.is_completed && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {lesson.content_type === 'video' && (
                      <Clock className="h-4 w-4 opacity-60" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface LessonProgress {
  position: number;
  completed: boolean;
}

const CoursePlayerPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<SimplifiedCourse | null>(null);
  const [currentLesson, setCurrentLesson] = useState<SimplifiedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('User not authenticated');
        }
        
        const { course, enrollmentId } = await fetchAndFormatCourseData(courseId, user.user.id);
        setCourse(course);
        setEnrollmentId(enrollmentId);
        
        // If lessonId is provided in URL params, set it as current lesson
        if (lessonId && course.modules.length > 0) {
          const foundLesson = findLessonById(course.modules, lessonId);
          if (foundLesson) {
            setCurrentLesson(foundLesson);
          } else {
            // If lesson not found, set first lesson as default
            setCurrentLesson(course.modules[0].lessons[0]);
          }
        } else if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
          // Otherwise set first lesson as default
          setCurrentLesson(course.modules[0].lessons[0]);
        }
      } catch (error: any) {
        console.error("Error loading course:", error);
        toast.error(error.message || "Failed to load course data");
        navigate('/learning');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, lessonId, navigate]);

  const findLessonById = (modules: SimplifiedModule[], id: string): SimplifiedLesson | null => {
    for (const module of modules) {
      const lesson = module.lessons.find(l => l.id === id);
      if (lesson) return lesson;
    }
    return null;
  }

  const handleLessonChange = (lesson: SimplifiedLesson) => {
    setCurrentLesson(lesson);
    // Update URL without full page reload
    navigate(`/course/${courseId}/lesson/${lesson.id}`);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (enrollmentId && currentLesson) {
      const completed = currentTime >= duration * 0.95; // Consider completed at 95%
      saveLessonProgress(currentLesson.id, enrollmentId, { position: currentTime, completed });
    }
  };

  const handleVideoEnded = async () => {
    if (enrollmentId && currentLesson) {
      await saveLessonProgress(currentLesson.id, enrollmentId, { position: 0, completed: true });
      
      // Mark lesson as completed in state
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;
        
        const updatedModules = prevCourse.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson =>
            lesson.id === currentLesson.id ? { ...lesson, is_completed: true } : lesson
          )
        }));
        
        return { ...prevCourse, modules: updatedModules };
      });

      toast.success("Lesson completed!");
      
      // Move to next lesson if available
      if (course) {
        const allLessons = course.modules.flatMap(m => m.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
        
        if (currentIndex < allLessons.length - 1) {
          const nextLesson = allLessons[currentIndex + 1];
          handleLessonChange(nextLesson);
        }
      }
    }
  };

  const fetchAndFormatCourseData = async (courseId: string, userId: string) => {
    try {
      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();
        
      if (courseError) throw courseError;
      
      // Fetch enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();
        
      if (enrollmentError) {
        console.error('No enrollment found:', enrollmentError);
        throw new Error('You are not enrolled in this course');
      }
      
      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('id, title, description, course_id, order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
        
      if (modulesError) throw modulesError;
      
      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, video_url, module_id, order_index')
        .in('module_id', modulesData.map(m => m.id))
        .order('order_index', { ascending: true });
        
      if (lessonsError) throw lessonsError;
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed, last_position_seconds')
        .eq('enrollment_id', enrollmentData.id);
        
      if (progressError) {
        console.error('Error fetching lesson progress:', progressError);
      }
      
      // Format modules and lessons with explicit type casting
      const modules = modulesData.map((moduleItem) => {
        const moduleLessons = lessonsData
          .filter((lessonItem) => lessonItem.module_id === moduleItem.id)
          .sort((a, b) => a.order_index - b.order_index)
          .map((lessonItem) => {
            // Create a new object with the correct type
            const lesson: SimplifiedLesson = {
              id: lessonItem.id,
              title: lessonItem.title,
              description: lessonItem.description || '',
              video_url: lessonItem.video_url,
              module_id: lessonItem.module_id,
              order_index: lessonItem.order_index,
              content_type: lessonItem.video_url ? 'video' : 'quiz',
              content: lessonItem.video_url ? null : { questions: [], pass_percentage: 70 },
              is_completed: progressData?.some(p => p.lesson_id === lessonItem.id && p.is_completed) || false
            };
            return lesson;
          });
        
        // Create a new module object with the correct type
        const moduleObj: SimplifiedModule = {
          id: moduleItem.id,
          title: moduleItem.title,
          description: moduleItem.description || '',
          course_id: moduleItem.course_id,
          order_index: moduleItem.order_index,
          lessons: moduleLessons
        };
        
        return moduleObj;
      });
      
      // Create the final course object with the correct type
      const course: SimplifiedCourse = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || '',
        modules: modules
      };
      
      return {
        course,
        enrollmentId: enrollmentData.id
      };
    } catch (error) {
      console.error('Error in fetchAndFormatCourseData:', error);
      throw error;
    }
  };

  const saveLessonProgress = async (lessonId: string, enrollmentId: string, progress: LessonProgress): Promise<boolean> => {
    try {
      // Check if progress record exists
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId)
        .single();
        
      if (existing) {
        // Update existing progress
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            last_position_seconds: progress.position || 0,
            is_completed: progress.completed || false,
            completion_date: progress.completed ? new Date().toISOString() : null
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('lesson_progress')
          .insert({
            lesson_id: lessonId,
            enrollment_id: enrollmentId,
            last_position_seconds: progress.position || 0,
            is_completed: progress.completed || false,
            completion_date: progress.completed ? new Date().toISOString() : null
          });
          
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving lesson progress:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading course content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="mb-6 text-muted-foreground">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to={`/courses/${courseId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Course</Link>
          </Button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Course navigation */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Course Content</h3>
              <SimplifiedCourseModuleList
                modules={course.modules}
                currentLessonId={currentLesson?.id}
                onSelectLesson={handleLessonChange}
                isEnrolled={!!enrollmentId}
              />
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-2">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Video Player */}
                {currentLesson.video_url ? (
                  <div className="bg-black rounded-md overflow-hidden">
                    <VideoPlayer
                      src={currentLesson.video_url}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnded}
                      controls={true}
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded-md">
                    <div className="text-center p-8">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No video content available</h3>
                      <p className="text-muted-foreground">This lesson contains text content only.</p>
                    </div>
                  </div>
                )}
                
                {/* Lesson details */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{currentLesson.title}</h2>
                    {currentLesson.is_completed && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </Badge>
                    )}
                  </div>
                  
                  {currentLesson.description && (
                    <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                  )}
                </div>
                
                {/* Tabs for different content types */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Lesson Content</TabsTrigger>
                    {currentLesson.content_type === 'quiz' && (
                      <TabsTrigger value="quiz">Quiz</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="content" className="min-h-[300px] bg-card p-6 rounded-md border">
                    {currentLesson.content ? (
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(typeof currentLesson.content === 'string' ? currentLesson.content : JSON.stringify(currentLesson.content)) }} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/40" />
                        <h3 className="font-medium text-lg mb-2">No additional content</h3>
                        <p className="text-muted-foreground text-center">
                          This lesson doesn't have any additional text content.
                          <br />Watch the video above to learn about this topic.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {currentLesson.content_type === 'quiz' && (
                    <TabsContent value="quiz">
                      <Card>
                        <CardHeader>
                          <CardTitle>Lesson Quiz</CardTitle>
                          <CardDescription>
                            Test your knowledge of the concepts covered in this lesson
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">Quiz content will be loaded here</p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button disabled>Start Quiz</Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
                
                {/* Lesson navigation */}
                <div className="flex justify-between pt-4 mt-8 border-t">
                  <Button 
                    variant="outline"
                    disabled={!course.modules.length}
                    onClick={() => {
                      if (!course.modules.length) return;
                      
                      const allLessons = course.modules.flatMap(m => m.lessons);
                      const currentIndex = currentLesson ? allLessons.findIndex(l => l.id === currentLesson.id) : -1;
                      
                      if (currentIndex > 0) {
                        handleLessonChange(allLessons[currentIndex - 1]);
                      }
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous Lesson
                  </Button>
                  
                  <Button 
                    disabled={!course.modules.length}
                    onClick={() => {
                      if (!course.modules.length) return;
                      
                      const allLessons = course.modules.flatMap(m => m.lessons);
                      const currentIndex = currentLesson ? allLessons.findIndex(l => l.id === currentLesson.id) : -1;
                      
                      if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
                        handleLessonChange(allLessons[currentIndex + 1]);
                      }
                    }}
                  >
                    Next Lesson <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Welcome to the Course</CardTitle>
                  <CardDescription>Select a lesson from the course outline to begin</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{course?.description}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Mobile course navigation */}
            <div className="lg:hidden mt-12">
              <h3 className="text-lg font-semibold mb-4">Course Content</h3>
              <SimplifiedCourseModuleList
                modules={course.modules}
                currentLessonId={currentLesson?.id}
                onSelectLesson={handleLessonChange}
                isEnrolled={!!enrollmentId}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursePlayerPage;
