
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import VideoPlayer from '@/components/video/VideoPlayer';
import { 
  Course, 
  Module, 
  Lesson, 
  fetchCourseById, 
  fetchCourseWithModulesAndLessons,
  saveLessonProgress
} from '@/services/courseService';
import { getVideoMetadata } from '@/services/wasabiService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, CheckCircle, Circle, PlayCircle, List } from 'lucide-react';

const CourseLearningPage = () => {
  const params = useParams<{courseId: string; lessonId?: string}>();
  const courseId = params.courseId;
  const initialLessonId = params.lessonId;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState<Record<string, { position: number; completed: boolean }>>({});
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [courseProgress, setCourseProgress] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId || !user) return;

      setLoading(true);
      try {
        const courseData = await fetchCourseWithModulesAndLessons(courseId);
        setCourse(courseData);
        
        // Get enrollment ID
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();
        
        if (enrollmentData) {
          setEnrollmentId(enrollmentData.id);
          
          // Load lesson progress for this enrollment
          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('enrollment_id', enrollmentData.id);
            
          if (progressData) {
            const progressMap: Record<string, { position: number; completed: boolean }> = {};
            let completedCount = 0;
            
            progressData.forEach((progress) => {
              progressMap[progress.lesson_id] = {
                position: progress.last_position_seconds || 0,
                completed: progress.is_completed || false
              };
              
              if (progress.is_completed) {
                completedCount++;
              }
            });
            
            setLessonProgress(progressMap);
            
            // Calculate overall course progress
            let totalLessons = 0;
            courseData?.modules?.forEach(module => {
              totalLessons += module.lessons?.length || 0;
            });
            
            if (totalLessons > 0) {
              setCourseProgress((completedCount / totalLessons) * 100);
            }
          }
        }
        
        // Set initial module and lesson
        if (courseData?.modules && courseData.modules.length > 0) {
          let foundLesson = false;
          
          // If a specific lesson ID was provided in the URL, try to find it
          if (initialLessonId) {
            for (const module of courseData.modules) {
              if (module.lessons) {
                const lesson = module.lessons.find(l => l.id === initialLessonId);
                if (lesson) {
                  setCurrentModule(module);
                  setCurrentLesson(lesson);
                  foundLesson = true;
                  break;
                }
              }
            }
          }
          
          // If no specific lesson was found, use the first lesson
          if (!foundLesson) {
            setCurrentModule(courseData.modules[0]);
            if (courseData.modules[0].lessons && courseData.modules[0].lessons.length > 0) {
              setCurrentLesson(courseData.modules[0].lessons[0]);
            }
          }
        }
      } catch (error: any) {
        console.error("Error loading course:", error);
        toast.error(error.message || "Failed to load course data");
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, initialLessonId, user]);

  useEffect(() => {
    const loadVideoSource = async () => {
      if (!currentLesson) return;
      
      // Check if it's a YouTube video URL
      if (currentLesson.video_url) {
        setVideoUrl(currentLesson.video_url);
        return;
      }
      
      // Check if it's a Wasabi video
      if (currentLesson.content && currentLesson.content.wasabi_url) {
        setVideoUrl(currentLesson.content.wasabi_url);
        return;
      }
      
      // If not in content directly, try to fetch the video metadata
      try {
        const metadata = await getVideoMetadata(currentLesson.id);
        if (metadata && metadata.wasabi_url) {
          setVideoUrl(metadata.wasabi_url);
        } else {
          setVideoUrl('');
        }
      } catch (error) {
        console.error("Error loading video metadata:", error);
        setVideoUrl('');
      }
    };
    
    loadVideoSource();
  }, [currentLesson]);

  const handleLessonChange = (lesson: Lesson, module: Module) => {
    setCurrentModule(module);
    setCurrentLesson(lesson);
  };
  
  const handleLessonComplete = async () => {
    if (!currentLesson || !enrollmentId) return;
    
    try {
      await saveLessonProgress(currentLesson.id, enrollmentId, { 
        position: 0,
        completed: true 
      });
      
      // Update local state
      setLessonProgress({
        ...lessonProgress,
        [currentLesson.id]: { position: 0, completed: true }
      });
      
      // Update course progress
      let totalLessons = 0;
      let completedLessons = 0;
      
      course?.modules?.forEach(module => {
        module.lessons?.forEach(lesson => {
          totalLessons++;
          if (
            lessonProgress[lesson.id]?.completed || 
            lesson.id === currentLesson.id
          ) {
            completedLessons++;
          }
        });
      });
      
      if (totalLessons > 0) {
        setCourseProgress((completedLessons / totalLessons) * 100);
      }
      
      toast.success("Lesson completed!");
    } catch (error) {
      console.error("Error marking lesson as complete:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleVideoProgress = (currentTime: number, duration: number, percent: number) => {
    if (!currentLesson || !enrollmentId) return;
    
    // Save progress periodically (every 5 seconds)
    const now = Date.now();
    if (!lastProgressUpdate.current || (now - lastProgressUpdate.current > 5000)) {
      lastProgressUpdate.current = now;
      
      // Don't await this to avoid blocking the UI
      saveLessonProgress(currentLesson.id, enrollmentId, {
        position: currentTime,
        completed: percent >= 0.95
      }).then(() => {
        // If the video is 95% watched, mark it as completed
        if (percent >= 0.95 && !lessonProgress[currentLesson.id]?.completed) {
          setLessonProgress({
            ...lessonProgress,
            [currentLesson.id]: { position: currentTime, completed: true }
          });
        } else if (lessonProgress[currentLesson.id]) {
          // Just update the position
          setLessonProgress({
            ...lessonProgress,
            [currentLesson.id]: { 
              ...lessonProgress[currentLesson.id],
              position: currentTime
            }
          });
        } else {
          // Create a new entry
          setLessonProgress({
            ...lessonProgress,
            [currentLesson.id]: { position: currentTime, completed: false }
          });
        }
      }).catch(error => {
        console.error("Error saving progress:", error);
      });
    }
  };
  
  const lastProgressUpdate = React.useRef<number | null>(null);

  const handleVideoEnded = () => {
    if (!currentLesson || !enrollmentId) return;
    
    // Mark lesson as completed
    saveLessonProgress(currentLesson.id, enrollmentId, {
      position: 0,
      completed: true
    }).then(() => {
      setLessonProgress({
        ...lessonProgress,
        [currentLesson.id]: { position: 0, completed: true }
      });
      
      // Find the next lesson
      const nextLesson = findNextLesson();
      if (nextLesson) {
        const nextModule = course?.modules?.find(m => 
          m.lessons?.some(l => l.id === nextLesson.id)
        );
        
        if (nextModule) {
          toast.success("Lesson completed! Moving to the next lesson...");
          setTimeout(() => {
            handleLessonChange(nextLesson, nextModule);
          }, 1500);
        }
      } else {
        toast.success("Congratulations! You've finished all the lessons in this course!");
      }
    }).catch(error => {
      console.error("Error marking lesson as complete:", error);
    });
  };

  const findNextLesson = (): Lesson | null => {
    if (!currentLesson || !course?.modules) return null;
    
    let foundCurrentLesson = false;
    let nextLesson: Lesson | null = null;
    
    // Search within the current module first
    if (currentModule && currentModule.lessons) {
      for (let i = 0; i < currentModule.lessons.length; i++) {
        if (foundCurrentLesson) {
          nextLesson = currentModule.lessons[i];
          break;
        }
        if (currentModule.lessons[i].id === currentLesson.id) {
          foundCurrentLesson = true;
        }
      }
    }
    
    // If no next lesson in current module, look in the next modules
    if (!nextLesson) {
      let foundCurrentModule = false;
      
      for (const module of course.modules) {
        if (foundCurrentModule && module.lessons && module.lessons.length > 0) {
          nextLesson = module.lessons[0];
          break;
        }
        
        if (module.id === currentModule?.id) {
          foundCurrentModule = true;
        }
      }
    }
    
    return nextLesson;
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return !!lessonProgress[lessonId]?.completed;
  };

  const calculateModuleProgress = (module: Module): number => {
    if (!module.lessons || module.lessons.length === 0) return 0;
    
    let completedCount = 0;
    module.lessons.forEach(lesson => {
      if (isLessonCompleted(lesson.id)) {
        completedCount++;
      }
    });
    
    return (completedCount / module.lessons.length) * 100;
  };

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
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-light-purple min-h-screen py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{course.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center">
                <Progress value={courseProgress} className="w-24 h-2 mr-2" />
                <span className="text-sm font-medium">{Math.round(courseProgress)}% complete</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <List className="h-4 w-4 mr-2" />
                Course Content
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Course Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {videoUrl ? (
                  <div className="aspect-video">
                    <VideoPlayer 
                      src={videoUrl}
                      poster={course.thumbnail_url}
                      onTimeUpdate={handleVideoProgress}
                      onEnded={handleVideoEnded}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <div className="text-center p-6">
                      <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No video available for this lesson</p>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{currentLesson?.title}</h2>
                      <p className="text-sm text-gray-500">
                        {currentModule?.title} • Lesson {currentModule?.lessons?.findIndex(l => l.id === currentLesson?.id) ? currentModule?.lessons?.findIndex(l => l.id === currentLesson?.id)! + 1 : 1} 
                        of {currentModule?.lessons?.length}
                      </p>
                    </div>
                    
                    <div className="mt-2 lg:mt-0">
                      {isLessonCompleted(currentLesson?.id || '') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleLessonComplete}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p>{currentLesson?.description || 'No description available for this lesson.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
              <div className="sticky top-8 bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold mb-4 text-lg">Course Content</h3>
                
                <div className="space-y-4">
                  {course.modules?.map((module) => (
                    <div key={module.id} className="border rounded-md">
                      <div className="p-3 border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">{module.title}</h4>
                          <span className="text-xs text-gray-500">
                            {module.lessons?.filter(l => isLessonCompleted(l.id)).length || 0}/{module.lessons?.length || 0}
                          </span>
                        </div>
                        <Progress value={calculateModuleProgress(module)} className="h-1 mt-2" />
                      </div>
                      
                      <div className="divide-y">
                        {module.lessons?.map((lesson) => (
                          <button
                            key={lesson.id}
                            className={`w-full text-left p-2 hover:bg-gray-50 flex items-center ${
                              currentLesson?.id === lesson.id ? 'bg-primary/5 font-medium' : ''
                            }`}
                            onClick={() => handleLessonChange(lesson, module)}
                          >
                            <span className="mr-2">
                              {isLessonCompleted(lesson.id) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : currentLesson?.id === lesson.id ? (
                                <PlayCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-300" />
                              )}
                            </span>
                            <span className="text-sm truncate">{lesson.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
