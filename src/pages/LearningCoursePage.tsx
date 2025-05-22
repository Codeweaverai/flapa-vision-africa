
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, FileText, MessageCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order_number: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  order_number: number;
  is_completed?: boolean;
}

const LearningCoursePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id || !user) return;

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
        
        if (courseError) throw courseError;
        
        setCourse(courseData);
        
        // Check enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single();
        
        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          throw enrollmentError;
        }
        
        if (!enrollmentData) {
          toast.error("You are not enrolled in this course");
          return;
        }
        
        // Fetch modules with lessons
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            *,
            lessons:course_lessons(
              *,
              completed_lessons:lesson_completions(id, completed_at)
            )
          `)
          .eq('course_id', id)
          .order('order_number');
        
        if (modulesError) throw modulesError;
        
        // Process modules and mark completed lessons
        const processedModules = modulesData.map((module: any) => {
          const processedLessons = module.lessons
            .sort((a: any, b: any) => a.order_number - b.order_number)
            .map((lesson: any) => {
              // Check if lesson is completed
              const isCompleted = lesson.completed_lessons && lesson.completed_lessons.some(
                (completion: any) => completion.user_id === user.id
              );
              
              if (isCompleted) {
                setCompletedLessons(prev => new Set(prev).add(lesson.id));
              }
              
              return {
                ...lesson,
                is_completed: isCompleted
              };
            });
          
          return {
            ...module,
            lessons: processedLessons
          };
        });
        
        setModules(processedModules);
        
        // Set initial module and lesson
        if (processedModules.length > 0) {
          setCurrentModule(processedModules[0]);
          if (processedModules[0].lessons.length > 0) {
            setCurrentLesson(processedModules[0].lessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error("Failed to load course content");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [id, user]);

  const handleLessonSelect = (moduleIndex: number, lessonIndex: number) => {
    const selectedModule = modules[moduleIndex];
    setCurrentModule(selectedModule);
    setCurrentLesson(selectedModule.lessons[lessonIndex]);
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !user) return;
    
    try {
      const { error } = await supabase
        .from('lesson_completions')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          completed_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // Update local state
      setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
      
      // Update current lesson in state
      setCurrentLesson({
        ...currentLesson,
        is_completed: true
      });
      
      toast.success("Lesson marked as completed!");
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error("Failed to mark lesson as complete");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Button asChild>
            <Link to="/learning">Back to My Learning</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Module Navigation */}
          <div className="lg:w-1/4">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-4">Course Content</h2>
                  
                  <div className="space-y-4">
                    {modules.map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-2">
                        <h3 className="font-medium">{module.title}</h3>
                        
                        <ul className="space-y-1 pl-4">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <li key={lesson.id}>
                              <button
                                onClick={() => handleLessonSelect(moduleIndex, lessonIndex)}
                                className={`text-sm flex items-center gap-2 w-full text-left p-2 rounded-md transition-colors ${
                                  currentLesson?.id === lesson.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                {completedLessons.has(lesson.id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  lesson.video_url ? (
                                    <Play className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                  )
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:w-3/4">
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <Separator className="my-4" />
            
            {currentLesson ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{currentLesson.title}</h2>
                  <p className="text-muted-foreground">{currentLesson.description}</p>
                </div>
                
                <Tabs defaultValue="content" className="mb-8">
                  <TabsList>
                    <TabsTrigger value="content">Lesson Content</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-4">
                    {currentLesson.video_url ? (
                      <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                        <video
                          controls
                          src={currentLesson.video_url}
                          className="w-full h-full"
                          poster={course.thumbnail_url}
                        />
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-lg p-8 text-center mb-6">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">This lesson contains reading material only.</p>
                      </div>
                    )}
                    
                    <div className="prose prose-slate max-w-none">
                      <p>{currentLesson.content || currentLesson.description}</p>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={markLessonComplete}
                        disabled={completedLessons.has(currentLesson.id)}
                      >
                        {completedLessons.has(currentLesson.id) ? 'Completed' : 'Mark as Complete'}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="discussion" className="mt-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center h-32">
                          <MessageCircle className="h-8 w-8 text-muted-foreground mr-2" />
                          <p className="text-muted-foreground">Discussion for this lesson will be available soon.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a lesson from the sidebar to start learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LearningCoursePage;
