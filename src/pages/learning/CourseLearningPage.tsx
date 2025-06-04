
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import LessonDiscussion from '@/components/course/LessonDiscussion';
import AIAssistant from '@/components/course/AIAssistant';
import { 
  fetchCourseDetails, 
  fetchCourseEnrollment, 
  fetchModuleLessons,
  CourseModule,
  Lesson
} from '@/services/courseService';
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  MessageSquare,
  Bot,
  FileText,
  Users
} from 'lucide-react';

const CourseLearningPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
      
      // Fetch user enrollment
      const enrollmentData = await fetchCourseEnrollment(courseId, user.id);
      if (!enrollmentData) {
        toast.error('You are not enrolled in this course');
        navigate(`/learning/course-detail/${courseId}`);
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
      toast.error('Failed to load course data');
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
    toast.success('Lesson Completed - Moving to the next lesson');
    
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
      toast.success('Congratulations! You have completed all lessons in this course!');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <Layout>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Layout>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 relative overflow-hidden">
      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <Layout>
        <div className="container max-w-full py-6 relative z-10">
          <div className="flex flex-col gap-6">
            {/* Course Header with Progress */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {course?.title}
                    </h1>
                    <Badge variant="outline" className="border-purple-300">
                      {Math.round(progress)}% Complete
                    </Badge>
                  </div>
                  
                  <Progress value={progress} className="h-3 bg-gray-200">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </Progress>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.round(progress)}% Complete</span>
                    {enrollment && (
                      <span>Enrolled on {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Course Curriculum Sidebar */}
              <div className="lg:col-span-3">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      Course Curriculum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-6">
                        {modules.map((module, moduleIndex) => (
                          <div key={module.id} className="space-y-3">
                            <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-3 rounded-lg">
                              <h3 className="font-semibold text-lg text-gray-800">
                                Module {moduleIndex + 1}: {module.title}
                              </h3>
                              {module.description && (
                                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2 pl-2">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => handleLessonSelect(lesson)}
                                  className={`flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 ${
                                    currentLesson?.id === lesson.id
                                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg transform scale-105'
                                      : 'hover:bg-white/80 hover:shadow-md'
                                  }`}
                                >
                                  <div className="mr-3">
                                    {lesson.is_completed ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <PlayCircle className={`h-5 w-5 ${
                                        currentLesson?.id === lesson.id ? 'text-white' : 'text-orange-500'
                                      }`} />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {lessonIndex + 1}. {lesson.title}
                                    </div>
                                    {lesson.description && (
                                      <div className={`text-xs mt-1 ${
                                        currentLesson?.id === lesson.id ? 'text-white/80' : 'text-gray-500'
                                      }`}>
                                        {lesson.description}
                                      </div>
                                    )}
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ml-2 ${
                                      currentLesson?.id === lesson.id 
                                        ? 'border-white text-white' 
                                        : 'border-purple-300 text-purple-600'
                                    }`}
                                  >
                                    {lesson.content_type}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Content Area */}
              <div className="lg:col-span-6">
                {currentLesson ? (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                    <div className="aspect-video bg-black">
                      {currentLesson.video_url ? (
                        <ReactPlayer
                          url={currentLesson.video_url}
                          width="100%"
                          height="100%"
                          controls
                          className="rounded-t-lg overflow-hidden"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-200 to-purple-200">
                          <div className="text-center">
                            <PlayCircle className="h-16 w-16 mx-auto mb-4 text-white/60" />
                            <p className="text-white/80 font-medium">No video available for this lesson</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl text-gray-800">{currentLesson.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">5 min</span>
                        </div>
                      </div>
                      {currentLesson.description && (
                        <CardDescription className="text-gray-600 text-base">
                          {currentLesson.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                          <TabsTrigger value="content" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Content
                          </TabsTrigger>
                          <TabsTrigger value="discussion" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Discussion
                          </TabsTrigger>
                          <TabsTrigger value="materials" className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Materials
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="content" className="mt-6">
                          <div className="prose max-w-none">
                            {currentLesson.content ? (
                              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                            ) : (
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">No additional content for this lesson.</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="discussion" className="mt-6">
                          <LessonDiscussion lessonId={currentLesson.id} />
                        </TabsContent>
                        
                        <TabsContent value="materials" className="mt-6">
                          {currentLesson.materials_urls && currentLesson.materials_urls.length > 0 ? (
                            <div className="space-y-3">
                              {currentLesson.materials_urls.map((url: string, idx: number) => (
                                <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    <a 
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-purple-600 hover:text-purple-800 hover:underline font-medium"
                                    >
                                      Material {idx + 1}
                                    </a>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-500">No additional materials for this lesson.</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50 border-t">
                      <Button 
                        onClick={handleLessonComplete} 
                        className="ml-auto bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-6"
                        size="lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome to the Course
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Select a lesson from the course outline to begin your learning journey
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 leading-relaxed">{course?.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* AI Assistant Sidebar */}
              <div className="lg:col-span-3">
                <div className="sticky top-6">
                  <AIAssistant 
                    lessonTitle={currentLesson?.title}
                    lessonContent={currentLesson?.content as string}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default CourseLearningPage;
