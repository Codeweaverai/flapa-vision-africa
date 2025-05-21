import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, ChevronLeft, ChevronRight, AlertCircle, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import {
  fetchCourseDetails,
  fetchCourseEnrollment,
  fetchModuleLessons,
  saveLessonProgress
} from '@/services/courseService';

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  modules: {
    id: string;
    title: string;
    description: string;
    order_index: number;
    lessons: {
      id: string;
      title: string;
      description: string;
      video_url: string;
      order_index: number;
    }[];
  }[];
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState<{ [key: string]: boolean }>({});
  const [isCourseComplete, setIsCourseComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  
  const currentModule = course?.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];
  const currentLessonId = currentLesson?.id;
  
  useEffect(() => {
    if (!courseId || !user) {
      navigate('/courses');
      return;
    }
    
    const loadCourseDetails = async () => {
      setIsLoading(true);
      try {
        const courseDetails = await fetchCourseDetails(courseId);
        if (courseDetails) {
          setCourse(courseDetails);
          
          // Fetch enrollment status
          const enrollment = await fetchCourseEnrollment(user.id, courseId);
          if (enrollment) {
            setEnrollmentId(enrollment.id);
            
            // Load lessons with progress
            const lessonsWithProgress = await fetchModuleLessons(enrollment.id, courseDetails.modules);
            
            // Initialize lessonsCompleted state
            const initialLessonsCompleted: { [key: string]: boolean } = {};
            lessonsWithProgress.forEach(module => {
              module.lessons.forEach(lesson => {
                initialLessonsCompleted[lesson.id] = lesson.is_completed || false;
              });
            });
            setLessonsCompleted(initialLessonsCompleted);
          } else {
            toast.error('You are not enrolled in this course.');
            navigate('/courses');
          }
        } else {
          toast.error('Course not found.');
          navigate('/courses');
        }
      } catch (error) {
        console.error('Error loading course details:', error);
        toast.error('Failed to load course details.');
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourseDetails();
  }, [courseId, user, navigate]);
  
  useEffect(() => {
    checkIfCourseIsComplete();
  }, [lessonsCompleted]);
  
  const checkIfCourseIsComplete = () => {
    if (!course) return;
    
    let allLessonsCompleted = true;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!lessonsCompleted[lesson.id]) {
          allLessonsCompleted = false;
          break;
        }
      }
      if (!allLessonsCompleted) break;
    }
    
    setIsCourseComplete(allLessonsCompleted);
  };
  
  const handleModuleChange = (moduleIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(0); // Reset to the first lesson of the new module
    setCurrentTime(0); // Reset video time
    setLastSavedTime(0); // Reset last saved time
    if (playerRef.current) {
      playerRef.current.seekTo(0); // Seek video to start
    }
  };
  
  const handleLessonChange = (lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    setCurrentTime(0); // Reset video time
    setLastSavedTime(0); // Reset last saved time
    if (playerRef.current) {
      playerRef.current.seekTo(0); // Seek video to start
    }
  };
  
  const handlePrevLesson = () => {
    if (!currentModule) return;
    
    if (currentLessonIndex > 0) {
      handleLessonChange(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      // Go to the last lesson of the previous module
      const prevModuleIndex = currentModuleIndex - 1;
      const prevModule = course?.modules[prevModuleIndex];
      if (prevModule) {
        setCurrentModuleIndex(prevModuleIndex);
        handleLessonChange(prevModule.lessons.length - 1);
      }
    }
  };
  
  const handleNextLesson = () => {
    if (!currentModule) return;
    
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      handleLessonChange(currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      // Go to the first lesson of the next module
      setCurrentModuleIndex(currentModuleIndex + 1);
      handleLessonChange(0);
    }
  };

  const handleTimeUpdate = (time: number) => {
    if (!currentLessonId || !enrollmentId) return;
    
    setCurrentTime(time);
    
    // Update progress if time has changed significantly (every 10 seconds)
    if (Math.abs(time - lastSavedTime) > 10) {
      saveLessonProgress(enrollmentId, currentLessonId, {
        last_position_seconds: Math.floor(time)
      });
      setLastSavedTime(time);
    }
  };
  
  const handleLessonComplete = async () => {
    if (!currentLessonId || !enrollmentId) return;
    
    try {
      await saveLessonProgress(enrollmentId, currentLessonId, {
        is_completed: true,
        last_position_seconds: Math.floor(currentTime)
      });
      
      toast.success('Lesson completed!');
      
      // Update local state
      setLessonsCompleted(prev => ({
        ...prev,
        [currentLessonId]: true
      }));
      
      // Check if course is complete
      checkIfCourseIsComplete();
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };
  
  const handleManualMarkComplete = async () => {
    if (!currentLessonId || !enrollmentId) return;
    
    try {
      setIsUpdatingProgress(true);
      
      await saveLessonProgress(enrollmentId, currentLessonId, {
        is_completed: true,
        last_position_seconds: Math.floor(currentTime)
      });
      
      toast.success('Lesson marked as complete!');
      
      // Update local state
      setLessonsCompleted(prev => ({
        ...prev,
        [currentLessonId]: true
      }));
      
      // Check if course is complete
      checkIfCourseIsComplete();
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Failed to mark lesson as complete');
    } finally {
      setIsUpdatingProgress(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="section-container py-12">
          <div className="w-full max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Loading Course...</CardTitle>
                <CardDescription>Please wait while we load the course details.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!course || !currentModule || !currentLesson) {
    return (
      <Layout>
        <div className="section-container py-12">
          <div className="w-full max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Course Not Found</CardTitle>
                <CardDescription>The course you are looking for does not exist.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="section-container py-12">
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Player */}
                <div className="relative aspect-video">
                  <ReactPlayer
                    ref={playerRef}
                    url={currentLesson.video_url}
                    width="100%"
                    height="100%"
                    controls
                    onProgress={data => handleTimeUpdate(data.playedSeconds)}
                    onEnded={handleLessonComplete}
                  />
                </div>
                
                {/* Lesson Title and Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{currentLesson.title}</h3>
                  <p className="text-muted-foreground">{currentLesson.description}</p>
                </div>
                
                {/* Completion Button */}
                <Button
                  variant="secondary"
                  onClick={handleManualMarkComplete}
                  disabled={lessonsCompleted[currentLessonId] || isUpdatingProgress}
                >
                  {lessonsCompleted[currentLessonId] ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </>
                  ) : isUpdatingProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mark as Complete
                    </>
                  ) : (
                    'Mark as Complete'
                  )}
                </Button>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevLesson} disabled={currentModuleIndex === 0 && currentLessonIndex === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="outline" onClick={handleNextLesson} disabled={isCourseComplete}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Course Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>Modules and Lessons</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-2">
                    {course.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-1">
                        <div
                          className={`px-3 py-2 rounded-md cursor-pointer ${currentModuleIndex === moduleIndex ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                          onClick={() => handleModuleChange(moduleIndex)}
                        >
                          {module.title}
                        </div>
                        {currentModuleIndex === moduleIndex && (
                          <div className="ml-4 space-y-1">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className={`px-3 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between ${currentLessonIndex === lessonIndex ? 'bg-muted text-muted-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                onClick={() => handleLessonChange(lessonIndex)}
                              >
                                <span>{lesson.title}</span>
                                {lessonsCompleted[lesson.id] && (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
