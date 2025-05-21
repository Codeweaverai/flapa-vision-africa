import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
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
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  
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
        toast({ title: 'Error', description: 'Course not found', variant: 'destructive' });
        navigate('/learning');
        return;
      }
      
      // Fetch user enrollment
      const enrollmentData = await fetchCourseEnrollment(courseId, user.id);
      if (!enrollmentData) {
        toast({ title: 'Access Denied', description: 'You are not enrolled in this course', variant: 'destructive' });
        navigate(`/course/${courseId}`);
        return;
      }
      
      // Fetch modules and lessons with progress
      const modulesData = await fetchModuleLessons(courseId, user.id);
      
      setCourse(courseData);
      setEnrollment(enrollmentData);
      setModules(modulesData);
      
      // Set the current lesson to the first incomplete lesson, or the first lesson if all are complete
      let lessonFound = false;
      let firstLesson: Lesson | null = null;
      
      for (const module of modulesData) {
        if (module.lessons && module.lessons.length > 0) {
          // Keep track of the first lesson overall
          if (!firstLesson) {
            firstLesson = module.lessons[0];
          }
          
          // Find the first incomplete lesson
          for (const lesson of module.lessons) {
            if (!lesson.is_completed) {
              setCurrentLesson(lesson);
              lessonFound = true;
              break;
            }
          }
          if (lessonFound) break;
        }
      }
      
      // If all lessons are complete, set the first lesson
      if (!lessonFound && firstLesson) {
        setCurrentLesson(firstLesson);
      }
      
      // Calculate overall progress
      calculateProgress(modulesData);
      
    } catch (error) {
      console.error('Error loading course data:', error);
      toast({ title: 'Error', description: 'Failed to load course data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  const calculateProgress = (modulesData: CourseModule[]) => {
    let totalLessons = 0;
    let completedLessons = 0;
    
    modulesData.forEach(module => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        module.lessons.forEach(lesson => {
          if (lesson.is_completed) {
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
  
  const handleLessonComplete = () => {
    // Implementation for marking a lesson as complete would go here
    toast({ title: 'Lesson Completed', description: 'Moving to the next lesson' });
    
    // Find the next lesson in sequence
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
      // No more lessons, possibly show course completion screen
      toast({ title: 'Congratulations!', description: 'You have completed all lessons in this course!' });
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
      <div className="container max-w-7xl py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">{course?.title}</h1>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% Complete</span>
              {enrollment && <span>Enrolled on {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {currentLesson ? (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="aspect-video bg-black">
                    {currentLesson.video_url ? (
                      <ReactPlayer
                        url={currentLesson.video_url}
                        width="100%"
                        height="100%"
                        controls
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <p className="text-muted-foreground">No video available for this lesson</p>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle>{currentLesson.title}</CardTitle>
                    {currentLesson.description && (
                      <CardDescription>{currentLesson.description}</CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs defaultValue="content">
                      <TabsList className="mb-4">
                        <TabsTrigger value="content">Lesson Content</TabsTrigger>
                        <TabsTrigger value="materials">Additional Materials</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content">
                        <div className="prose max-w-none">
                          {currentLesson.content ? (
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                          ) : (
                            <p>No additional content for this lesson.</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="materials">
                        {currentLesson.materials_urls?.length > 0 ? (
                          <ul className="space-y-2">
                            {currentLesson.materials_urls.map((url: string, idx: number) => (
                              <li key={idx}>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Material {idx + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No additional materials for this lesson.</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  
                  <CardFooter>
                    <Button onClick={handleLessonComplete} className="ml-auto">
                      Mark as Completed
                    </Button>
                  </CardFooter>
                </Card>
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
            </div>
            
            <div>
              <Card className="border-0 shadow">
                <CardHeader>
                  <CardTitle>Course Outline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {modules.map((module) => (
                      <div key={module.id} className="space-y-2">
                        <h3 className="font-medium text-lg">{module.title}</h3>
                        <div className="space-y-1">
                          {module.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(lesson)}
                              className={`flex items-center w-full p-2 rounded text-left ${
                                currentLesson?.id === lesson.id
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'hover:bg-muted'
                              } ${lesson.is_completed ? 'text-green-600' : ''}`}
                            >
                              <span className="mr-2">
                                {lesson.is_completed ? '✅' : '○'}
                              </span>
                              <span className="flex-1">{lesson.title}</span>
                            </button>
                          ))}
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
