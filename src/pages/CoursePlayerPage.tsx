
import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CourseWithModules, fetchCourseWithModulesAndLessons, checkEnrollmentStatus } from '@/services/courseService';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle, 
  PlayCircle, 
  FileText, 
  Download, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;

      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
      
      if (user) {
        const enrolled = await checkEnrollmentStatus(courseId);
        setIsEnrolled(enrolled);
      }
      
      setLoading(false);
    };

    loadCourse();
  }, [courseId, user]);

  // Guard against non-enrolled users
  if (!loading && (!user || !isEnrolled)) {
    return <Navigate to={`/learning/course/${courseId}`} />;
  }

  // Function to get the active lesson
  const getActiveLesson = () => {
    if (!course || !course.modules[activeModuleIndex]) return null;
    return course.modules[activeModuleIndex].lessons[activeLessonIndex];
  };

  // Navigation functions
  const goToNextLesson = () => {
    if (!course) return;
    
    const currentModule = course.modules[activeModuleIndex];
    if (activeLessonIndex < currentModule.lessons.length - 1) {
      // Next lesson in the same module
      setActiveLessonIndex(activeLessonIndex + 1);
    } else if (activeModuleIndex < course.modules.length - 1) {
      // First lesson in the next module
      setActiveModuleIndex(activeModuleIndex + 1);
      setActiveLessonIndex(0);
    }
  };

  const goToPreviousLesson = () => {
    if (!course) return;
    
    if (activeLessonIndex > 0) {
      // Previous lesson in the same module
      setActiveLessonIndex(activeLessonIndex - 1);
    } else if (activeModuleIndex > 0) {
      // Last lesson in the previous module
      setActiveModuleIndex(activeModuleIndex - 1);
      const prevModule = course.modules[activeModuleIndex - 1];
      setActiveLessonIndex(prevModule.lessons.length - 1);
    }
  };

  const selectLesson = (moduleIndex: number, lessonIndex: number) => {
    setActiveModuleIndex(moduleIndex);
    setActiveLessonIndex(lessonIndex);
  };

  const activeLesson = getActiveLesson();

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
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p>The course you are looking for could not be found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Course title and navigation */}
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span>Module {activeModuleIndex + 1}</span>
                <span className="mx-2">•</span>
                <span>Lesson {activeLessonIndex + 1}</span>
              </div>
            </div>
            
            {/* Video player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {activeLesson?.video_url ? (
                <iframe
                  src={activeLesson.video_url.replace('watch?v=', 'embed/')}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-gray-500" />
                  <p className="ml-4 text-white">No video available for this lesson</p>
                </div>
              )}
            </div>
            
            {/* Lesson title and navigation buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{activeLesson?.title}</h2>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousLesson}
                  disabled={activeModuleIndex === 0 && activeLessonIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  onClick={goToNextLesson}
                  disabled={
                    activeModuleIndex === course.modules.length - 1 && 
                    activeLessonIndex === course.modules[activeModuleIndex].lessons.length - 1
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            
            {/* Lesson content tabs */}
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="p-4 border rounded-lg mt-2">
                {activeLesson?.description ? (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">{activeLesson.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No additional content available for this lesson.</p>
                )}
              </TabsContent>
              
              <TabsContent value="resources" className="p-4 border rounded-lg mt-2">
                {activeLesson?.materials_urls && activeLesson.materials_urls.length > 0 ? (
                  <div className="space-y-3">
                    {activeLesson.materials_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-primary mr-2" />
                          <span>Resource {index + 1}</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No downloadable resources available for this lesson.</p>
                )}
              </TabsContent>
              
              <TabsContent value="discussion" className="p-4 border rounded-lg mt-2">
                <p className="text-muted-foreground">Discussion board coming soon!</p>
              </TabsContent>
            </Tabs>

            {/* Mark as complete button */}
            <div className="flex justify-end">
              <Button variant="outline">
                <CheckSquare className="h-5 w-5 mr-2" />
                Mark as Complete
              </Button>
            </div>
          </div>
          
          {/* Sidebar with course content */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4 sticky top-8">
              <h3 className="font-semibold mb-4">Course Content</h3>
              <div className="text-sm text-muted-foreground mb-4">
                {course.modules.length} modules • {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons • {Math.ceil(course.duration_minutes / 60)} hours
              </div>
              
              <Separator className="my-2" />
              
              <Accordion type="multiple" className="w-full">
                {course.modules.map((module, moduleIndex) => (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    defaultChecked={moduleIndex === activeModuleIndex}
                    className="border-b border-border"
                  >
                    <AccordionTrigger className="text-sm hover:no-underline py-3">
                      <div className="text-left">
                        <div>Module {moduleIndex + 1}: {module.title}</div>
                        <div className="text-xs text-muted-foreground">{module.lessons.length} lessons</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-1">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <Button
                            key={lesson.id}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-xs py-1 px-2 h-auto ${
                              moduleIndex === activeModuleIndex && lessonIndex === activeLessonIndex
                                ? 'bg-primary/10 text-primary'
                                : ''
                            }`}
                            onClick={() => selectLesson(moduleIndex, lessonIndex)}
                          >
                            {moduleIndex === activeModuleIndex && lessonIndex === activeLessonIndex ? (
                              <PlayCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate text-left">{lessonIndex + 1}. {lesson.title}</span>
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursePlayerPage;
