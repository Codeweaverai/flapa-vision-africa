
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, CheckCircle, Play, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourseWithModulesAndLessons, CourseWithModules, Lesson, checkEnrollmentStatus, saveLessonProgress } from '@/services/courseService';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, { completed: boolean, position: number }>>({});
  const [courseProgress, setCourseProgress] = useState<{ completed: number, total: number }>({ completed: 0, total: 0 });
  const [videoPosition, setVideoPosition] = useState(0);
  
  // Handle video player element
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!courseId || !user) {
        navigate('/learning');
        return;
      }
      
      try {
        setLoading(true);
        const isEnrolled = await checkEnrollmentStatus(courseId);
        
        if (!isEnrolled) {
          navigate(`/learning/course/${courseId}`);
          return;
        }
        
        // Fetch enrollment data
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();
        
        if (enrollment) {
          setEnrollmentId(enrollment.id);
          
          // Fetch progress data
          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('enrollment_id', enrollment.id);
            
          // Create a map of lesson progress
          const progressMap: Record<string, { completed: boolean, position: number }> = {};
          let completedLessons = 0;
          
          if (progressData) {
            progressData.forEach(item => {
              progressMap[item.lesson_id] = {
                completed: item.is_completed,
                position: item.last_position_seconds || 0
              };
              if (item.is_completed) completedLessons++;
            });
          }
          
          setLessonProgress(progressMap);
          
          // Fetch course data
          const courseData = await fetchCourseWithModulesAndLessons(courseId);
          if (courseData) {
            setCourse(courseData);
            
            // Count total lessons
            let totalLessons = 0;
            courseData.modules?.forEach(module => {
              if (module.lessons) {
                totalLessons += module.lessons.length;
                
                // Set first lesson as selected if not already set
                if (!selectedLesson && module.lessons.length > 0) {
                  const firstLesson = module.lessons[0];
                  setSelectedLesson(firstLesson);
                  
                  // Set video position for first lesson
                  if (progressMap[firstLesson.id]) {
                    setVideoPosition(progressMap[firstLesson.id].position);
                  }
                }
              }
            });
            
            setCourseProgress({
              completed: completedLessons,
              total: totalLessons
            });
          }
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Error loading course data');
      } finally {
        setLoading(false);
      }
    };
    
    checkEnrollment();
  }, [courseId, user, navigate]);

  // Save progress periodically
  useEffect(() => {
    if (!selectedLesson || !enrollmentId) return;
    
    const saveInterval = setInterval(() => {
      if (videoElement && !videoElement.paused) {
        const currentPosition = Math.floor(videoElement.currentTime);
        saveLessonProgress(
          enrollmentId, 
          selectedLesson.id, 
          currentPosition, 
          false
        );
        setLessonProgress(prev => ({
          ...prev,
          [selectedLesson.id]: {
            ...(prev[selectedLesson.id] || { completed: false }),
            position: currentPosition
          }
        }));
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [selectedLesson, enrollmentId, videoElement]);

  const handleVideoRef = (element: HTMLVideoElement) => {
    setVideoElement(element);
    
    if (element && videoPosition > 0) {
      element.currentTime = videoPosition;
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setVideoPosition(lessonProgress[lesson.id]?.position || 0);
  };

  const handleVideoEnded = async () => {
    if (!selectedLesson || !enrollmentId) return;
    
    // Mark lesson as completed
    try {
      await saveLessonProgress(
        enrollmentId,
        selectedLesson.id,
        videoElement?.duration || 0,
        true
      );
      
      // Update local state
      setLessonProgress(prev => ({
        ...prev,
        [selectedLesson.id]: {
          position: videoElement?.duration || 0,
          completed: true
        }
      }));
      
      // Update course progress
      setCourseProgress(prev => ({
        ...prev,
        completed: lessonProgress[selectedLesson.id]?.completed ? prev.completed : prev.completed + 1
      }));
      
      toast.success('Lesson completed!');
      
      // Auto-advance to next lesson
      if (course) {
        let foundCurrent = false;
        let nextLesson: Lesson | null = null;
        
        for (const module of course.modules) {
          if (!module.lessons) continue;
          
          for (const lesson of module.lessons) {
            if (foundCurrent) {
              nextLesson = lesson;
              break;
            }
            
            if (lesson.id === selectedLesson.id) {
              foundCurrent = true;
            }
          }
          
          if (nextLesson) break;
        }
        
        if (nextLesson) {
          setSelectedLesson(nextLesson);
          setVideoPosition(lessonProgress[nextLesson.id]?.position || 0);
        }
      }
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading course content...</div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="section-container min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="mb-6">The course you're looking for doesn't exist or you're not enrolled.</p>
          <Button asChild>
            <a href="/learning">Browse Courses</a>
          </Button>
        </div>
      </Layout>
    );
  }

  const progressPercentage = courseProgress.total > 0 
    ? Math.round((courseProgress.completed / courseProgress.total) * 100) 
    : 0;

  return (
    <Layout>
      <div className="bg-muted py-4">
        <div className="container">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => navigate(`/learning/course/${courseId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
            
            <div className="flex items-center">
              <Progress value={progressPercentage} className="w-40 mr-4" />
              <span className="text-sm font-medium">{progressPercentage}% Complete</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="section-container py-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
            
            <Card className="mb-6 overflow-hidden">
              {selectedLesson?.video_url ? (
                <div className="aspect-video bg-black">
                  <video
                    ref={handleVideoRef}
                    src={selectedLesson.video_url}
                    controls
                    className="w-full h-full"
                    onEnded={handleVideoEnded}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto opacity-20" />
                    <p className="mt-2">No video available for this lesson</p>
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">{selectedLesson?.title}</h2>
                {selectedLesson?.description && (
                  <p className="text-muted-foreground">{selectedLesson.description}</p>
                )}
              </CardContent>
            </Card>
            
            <Tabs defaultValue="materials">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="materials" className="py-4">
                {selectedLesson?.materials_urls && selectedLesson.materials_urls.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Lesson Materials</h3>
                    <ul className="space-y-2">
                      {selectedLesson.materials_urls.map((url, index) => (
                        <li key={index}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 hover:bg-muted rounded-md"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            <span>Material {index + 1}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto opacity-20" />
                    <p className="mt-2">No materials available for this lesson</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="discussion" className="py-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>Discussion forum coming soon!</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 bg-muted">
                    <h2 className="text-lg font-bold">Course Content</h2>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{course.modules?.length || 0} modules</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{course.duration_minutes} min</span>
                    </div>
                  </div>
                  
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {course.modules?.map((module, moduleIndex) => (
                      <div key={module.id} className="p-0">
                        <div className="p-4 bg-muted/50">
                          <h3 className="font-medium">
                            Module {moduleIndex + 1}: {module.title}
                          </h3>
                        </div>
                        
                        <div className="divide-y">
                          {module.lessons?.map((lesson) => {
                            const isCompleted = lessonProgress[lesson.id]?.completed;
                            const isActive = selectedLesson?.id === lesson.id;
                            
                            return (
                              <button
                                key={lesson.id}
                                className={`w-full text-left p-4 flex items-start hover:bg-muted/30 ${
                                  isActive ? 'bg-muted/50' : ''
                                }`}
                                onClick={() => handleLessonSelect(lesson)}
                              >
                                <div className="mr-3 mt-1">
                                  {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Play className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${isCompleted ? 'text-green-600' : ''}`}>
                                    {lesson.title}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {course.certificate_enabled && (
                    <div className="p-4 bg-muted/30 border-t">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Certificate Available</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete the course to get your certificate
                      </p>
                    </div>
                  )}
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
