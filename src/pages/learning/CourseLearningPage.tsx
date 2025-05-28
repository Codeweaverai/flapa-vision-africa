
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, PlayCircle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import VideoPlayer from '@/components/video/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchCourseDetails, 
  fetchCourseEnrollment, 
  fetchModuleLessons,
  CourseModule,
  Lesson
} from '@/services/courseService';

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [lessonProgress, setLessonProgress] = useState<{ [key: string]: any }>({});
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);
  
  const loadCourseData = async () => {
    if (!courseId || !user) return;
    
    setLoading(true);
    try {
      // Fetch course details
      const courseData = await fetchCourseDetails(courseId);
      if (!courseData) {
        toast.error('Course not found');
        navigate('/learning');
        return;
      }
      
      // Fetch creator details
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', courseData.creator_id)
        .single();
      
      // Fetch user enrollment
      const enrollmentData = await fetchCourseEnrollment(courseId, user.id);
      if (!enrollmentData) {
        toast.error('You are not enrolled in this course');
        navigate(`/learning/course-detail/${courseId}`);
        return;
      }
      
      // Fetch modules and lessons with progress
      const modulesData = await fetchModuleLessons(courseId, user.id);
      
      // Fetch lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id);
      
      const progressMap = progressData?.reduce((acc, progress) => {
        acc[progress.lesson_id] = progress;
        return acc;
      }, {}) || {};
      
      setCourse(courseData);
      setCreator(creatorData);
      setEnrollment(enrollmentData);
      setModules(modulesData);
      setLessonProgress(progressMap);
      
      // Set the current lesson to the first incomplete lesson, or the first lesson if all are complete
      let lessonFound = false;
      let firstLesson: Lesson | null = null;
      
      for (const module of modulesData) {
        if (module.lessons && module.lessons.length > 0) {
          if (!firstLesson) {
            firstLesson = module.lessons[0];
          }
          
          for (const lesson of module.lessons) {
            if (!progressMap[lesson.id]?.is_completed) {
              setCurrentLesson(lesson);
              lessonFound = true;
              break;
            }
          }
          if (lessonFound) break;
        }
      }
      
      if (!lessonFound && firstLesson) {
        setCurrentLesson(firstLesson);
      }
      
      calculateProgress(modulesData, progressMap);
      
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateProgress = (modulesData: CourseModule[], progressMap: any) => {
    let totalLessons = 0;
    let completedLessons = 0;
    
    modulesData.forEach(module => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        module.lessons.forEach(lesson => {
          if (progressMap[lesson.id]?.is_completed) {
            completedLessons++;
          }
        });
      }
    });
    
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    setProgress(progressPercentage);
  };
  
  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };
  
  const handleLessonComplete = async () => {
    if (!currentLesson || !enrollment) return;
    
    try {
      // Update or create lesson progress
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: currentLesson.id,
          is_completed: true,
          completion_date: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Update local state
      setLessonProgress(prev => ({
        ...prev,
        [currentLesson.id]: { ...prev[currentLesson.id], is_completed: true }
      }));
      
      toast.success('Lesson completed!');
      
      // Find the next lesson
      let foundCurrent = false;
      let nextLesson: Lesson | null = null;
      
      outerLoop:
      for (const module of modules) {
        for (const lesson of module.lessons) {
          if (foundCurrent) {
            nextLesson = lesson;
            break outerLoop;
          }
          if (lesson.id === currentLesson?.id) {
            foundCurrent = true;
          }
        }
      }
      
      if (nextLesson) {
        setCurrentLesson(nextLesson);
      } else {
        toast.success('Congratulations! You have completed all lessons in this course!');
      }
      
      // Recalculate progress
      calculateProgress(modules, { ...lessonProgress, [currentLesson.id]: { is_completed: true } });
      
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };

  const handleVideoTimeUpdate = async (currentTime: number, duration: number) => {
    if (!currentLesson || !enrollment) return;
    
    // Save progress every 10 seconds
    if (Math.floor(currentTime) % 10 === 0) {
      try {
        await supabase
          .from('lesson_progress')
          .upsert({
            enrollment_id: enrollment.id,
            lesson_id: currentLesson.id,
            last_position_seconds: Math.floor(currentTime)
          });
      } catch (error) {
        console.error('Error saving video progress:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container max-w-7xl py-6">
          <div className="flex flex-col gap-6">
            {/* Course Header */}
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={creator?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <p className="font-semibold">{creator?.full_name || creator?.username || 'Unknown Creator'}</p>
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-purple-900">{course?.title}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {course?.difficulty_level}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {course?.duration_minutes} minutes
                  </div>
                </div>
                <Progress value={progress} className="h-3 mt-4 bg-purple-100" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{Math.round(progress)}% Complete</span>
                  {enrollment && <span>Enrolled on {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>}
                </div>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {currentLesson ? (
                  <Card className="bg-white/90 backdrop-blur-sm border-purple-200 overflow-hidden">
                    <div className="aspect-video bg-black">
                      {currentLesson.video_url ? (
                        <VideoPlayer
                          src={currentLesson.video_url}
                          poster={course?.thumbnail_url}
                          onTimeUpdate={handleVideoTimeUpdate}
                          className="w-full aspect-video"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-purple-900">
                          <div className="text-center text-white">
                            <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No video available for this lesson</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-purple-900">{currentLesson.title}</CardTitle>
                      {currentLesson.description && (
                        <CardDescription>{currentLesson.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-purple-100">
                          <TabsTrigger value="content" className="data-[state=active]:bg-white">Lesson Content</TabsTrigger>
                          <TabsTrigger value="materials" className="data-[state=active]:bg-white">Materials</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="content" className="mt-4">
                          <div className="prose max-w-none">
                            {currentLesson.content && typeof currentLesson.content === 'object' ? (
                              <div>{JSON.stringify(currentLesson.content)}</div>
                            ) : currentLesson.content ? (
                              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                            ) : (
                              <p className="text-muted-foreground">No additional content for this lesson.</p>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="materials" className="mt-4">
                          {currentLesson.materials_urls && currentLesson.materials_urls.length > 0 ? (
                            <ul className="space-y-2">
                              {currentLesson.materials_urls.map((url: string, idx: number) => (
                                <li key={idx}>
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                                    Material {idx + 1}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground">No additional materials for this lesson.</p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        onClick={handleLessonComplete} 
                        className="ml-auto bg-purple-600 hover:bg-purple-700"
                        disabled={lessonProgress[currentLesson.id]?.is_completed}
                      >
                        {lessonProgress[currentLesson.id]?.is_completed ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Completed
                          </>
                        ) : (
                          'Mark as Completed'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-purple-900">Welcome to the Course</CardTitle>
                      <CardDescription>Select a lesson from the course outline to begin</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{course?.description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div>
                <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900">Course Outline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {modules.map((module) => (
                        <div key={module.id} className="space-y-2">
                          <h3 className="font-medium text-lg text-purple-800">{module.title}</h3>
                          <div className="space-y-1">
                            {module.lessons.map((lesson) => {
                              const isCompleted = lessonProgress[lesson.id]?.is_completed;
                              const isCurrent = currentLesson?.id === lesson.id;
                              
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => handleLessonSelect(lesson)}
                                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
                                    isCurrent
                                      ? 'bg-purple-100 text-purple-900 font-medium border border-purple-300'
                                      : 'hover:bg-purple-50'
                                  }`}
                                >
                                  <span className="mr-3">
                                    {isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-purple-300" />
                                    )}
                                  </span>
                                  <span className="flex-1">{lesson.title}</span>
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
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
