import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CourseWithModules, 
  fetchCourseWithModulesAndLessons, 
  checkEnrollmentStatus,
  saveLessonProgress,
  LessonProgress,
  QuizAnswer
} from '@/services/courseService';
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
  CheckSquare,
  Award,
  PenSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import '@/types/youtube';

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const { user } = useAuth();
  const [enrollmentId, setEnrollmentId] = useState<string>('');
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [videoPosition, setVideoPosition] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [quizDialogOpen, setQuizDialogOpen] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean>(false);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState<boolean>(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  
  // Video player reference
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YT.Player | null>(null);
  const playerTimerRef = useRef<number | null>(null);

  // Load YouTube API
  useEffect(() => {
    // Add YouTube API script if it's not already added
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    // Define the onYouTubeIframeAPIReady function
    window.onYouTubeIframeAPIReady = loadVideoIfReady;
    
    return () => {
      // Cleanup timer when component unmounts
      if (playerTimerRef.current) {
        clearInterval(playerTimerRef.current);
      }
    };
  }, []);
  
  // Initialize YouTube player when active lesson changes
  useEffect(() => {
    loadVideoIfReady();
  }, [activeLessonIndex, activeModuleIndex, course]);
  
  // Function to load the YouTube player
  const loadVideoIfReady = () => {
    const activeLesson = getActiveLesson();
    
    // Clean up existing player and interval
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    }
    
    if (playerTimerRef.current) {
      clearInterval(playerTimerRef.current);
      playerTimerRef.current = null;
    }
    
    // Only proceed if we have a video URL
    if (!activeLesson?.video_url || !window.YT || !window.YT.Player || isCurrentItemQuiz()) {
      return;
    }
    
    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(activeLesson.video_url);
    if (!videoId) return;
    
    // Create YouTube Player
    if (videoPlayerRef.current) {
      try {
        youtubePlayerRef.current = new window.YT.Player(videoPlayerRef.current, {
          videoId: videoId,
          playerVars: {
            start: videoPosition,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 1,
            playsinline: 1
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
          }
        });
        
        // Setup interval to track progress
        playerTimerRef.current = window.setInterval(() => {
          if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
            const currentTime = Math.floor(youtubePlayerRef.current.getCurrentTime());
            setVideoPosition(currentTime);
            
            // Save progress every 10 seconds
            if (currentTime % 10 === 0 && enrollmentId && activeLesson.id) {
              saveVideoProgress(activeLesson.id, currentTime);
            }
          }
        }, 1000);
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    }
  };
  
  // Extract YouTube video ID from URL
  const extractYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  
  // YouTube player event handlers
  const onPlayerReady = (event: any) => {
    // Player is ready, can start playback if needed
    console.log("YouTube player is ready");
    if (videoPosition > 0) {
      event.target.seekTo(videoPosition);
    }
  };
  
  const onPlayerStateChange = (event: any) => {
    // Track player state changes if needed
    if (event.data === window.YT.PlayerState.ENDED) {
      console.log("Video ended");
      // Maybe auto-mark as complete?
    }
  };

  // Track video progress with a timer
  useEffect(() => {
    // This is now handled by the YouTube API timer
    return () => {
      // Cleanup timer when dependencies change
      if (playerTimerRef.current) {
        clearInterval(playerTimerRef.current);
        playerTimerRef.current = null;
      }
    };
  }, [enrollmentId]);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;

      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
      
      if (user) {
        const enrolled = await checkEnrollmentStatus(courseId);
        setIsEnrolled(enrolled);
        
        if (enrolled) {
          await loadEnrollmentData();
        }
      }
      
      setLoading(false);
    };

    loadCourse();
  }, [courseId, user]);

  // Load enrollment data, progress, and last position
  const loadEnrollmentData = async () => {
    if (!user || !courseId) return;
    
    try {
      // Get enrollment ID
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();
      
      if (enrollmentData) {
        setEnrollmentId(enrollmentData.id);
        
        // Get all lesson progress for this enrollment
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('enrollment_id', enrollmentData.id);
        
        if (progressData) {
          // Create a map of lesson_id -> progress
          const progressMap: Record<string, LessonProgress> = {};
          const completed = new Set<string>();
          
          progressData.forEach((progress: LessonProgress) => {
            progressMap[progress.lesson_id] = progress;
            if (progress.is_completed) {
              completed.add(progress.lesson_id);
            }
          });
          
          setLessonProgress(progressMap);
          setCompletedLessons(completed);
          
          // Calculate overall progress
          if (course) {
            const totalLessons = course.modules.reduce(
              (total, module) => total + module.lessons.length, 
              0
            );
            
            setProgressPercentage(totalLessons > 0 
              ? (completed.size / totalLessons) * 100 
              : 0);
          }
          
          // Find last watched lesson
          if (progressData.length > 0) {
            // Find the most recently updated lesson
            let lastLessonId = progressData[0].lesson_id;
            let lastUpdated = new Date(progressData[0].completion_date || 0).getTime();
            
            progressData.forEach((progress: LessonProgress) => {
              const updateTime = new Date(progress.completion_date || 0).getTime();
              if (updateTime > lastUpdated) {
                lastUpdated = updateTime;
                lastLessonId = progress.lesson_id;
              }
            });
            
            // Find module and lesson indices
            if (course) {
              for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
                const lessonIndex = course.modules[moduleIndex].lessons.findIndex(
                  l => l.id === lastLessonId
                );
                
                if (lessonIndex !== -1) {
                  setActiveModuleIndex(moduleIndex);
                  setActiveLessonIndex(lessonIndex);
                  
                  // Set video position
                  const progress = progressMap[lastLessonId];
                  if (progress) {
                    setVideoPosition(progress.last_position_seconds);
                  }
                  break;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading enrollment data:', error);
    }
  };

  // Save video progress
  const saveVideoProgress = async (lessonId: string, position: number) => {
    if (!enrollmentId) return;
    
    try {
      await saveLessonProgress(enrollmentId, lessonId, position);
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async () => {
    if (!activeLesson || !enrollmentId) return;
    
    try {
      const result = await saveLessonProgress(enrollmentId, activeLesson.id, videoPosition, true);
      
      if (result) {
        // Update local state
        setLessonProgress(prev => ({
          ...prev,
          [activeLesson.id]: result
        }));
        
        setCompletedLessons(prev => {
          const updated = new Set(prev);
          updated.add(activeLesson.id);
          return updated;
        });
        
        // Update progress percentage
        if (course) {
          const totalLessons = course.modules.reduce(
            (total, module) => total + module.lessons.length, 
            0
          );
          setProgressPercentage(totalLessons > 0 
            ? ((completedLessons.size + 1) / totalLessons) * 100 
            : 0);
        }
        
        toast({
          title: 'Lesson completed',
          description: 'Your progress has been saved.',
        });
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast({
        title: 'Error',
        description: 'Could not mark lesson as complete.',
        variant: 'destructive',
      });
    }
  };

  // Function to get the active lesson
  const getActiveLesson = () => {
    if (!course || !course.modules[activeModuleIndex]) return null;
    return course.modules[activeModuleIndex].lessons[activeLessonIndex];
  };

  // Get active module
  const getActiveModule = () => {
    if (!course) return null;
    return course.modules[activeModuleIndex];
  };

  // Check if the current active item is a quiz
  const isCurrentItemQuiz = () => {
    const module = getActiveModule();
    return module?.quiz && activeLessonIndex === module.lessons.length - 1;
  };

  // Navigation functions
  const goToNextLesson = () => {
    if (!course) return;
    
    const currentModule = course.modules[activeModuleIndex];
    if (activeLessonIndex < currentModule.lessons.length - 1) {
      // Next lesson in the same module
      setActiveLessonIndex(activeLessonIndex + 1);
      setVideoPosition(0);
    } else if (activeModuleIndex < course.modules.length - 1) {
      // First lesson in the next module
      setActiveModuleIndex(activeModuleIndex + 1);
      setActiveLessonIndex(0);
      setVideoPosition(0);
    }
  };

  const goToPreviousLesson = () => {
    if (!course) return;
    
    if (activeLessonIndex > 0) {
      // Previous lesson in the same module
      setActiveLessonIndex(activeLessonIndex - 1);
      setVideoPosition(0);
    } else if (activeModuleIndex > 0) {
      // Last lesson in the previous module
      setActiveModuleIndex(activeModuleIndex - 1);
      const prevModule = course.modules[activeModuleIndex - 1];
      setActiveLessonIndex(prevModule.lessons.length - 1);
      setVideoPosition(0);
    }
  };

  const selectLesson = (moduleIndex: number, lessonIndex: number) => {
    setActiveModuleIndex(moduleIndex);
    setActiveLessonIndex(lessonIndex);
    setVideoPosition(0);
  };

  const startQuiz = () => {
    setSelectedAnswers({});
    setQuizScore(null);
    setQuizPassed(false);
    setQuizDialogOpen(true);
  };

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const submitQuiz = () => {
    const activeModule = getActiveModule();
    if (!activeModule?.quiz || !activeModule.quiz.questions) {
      return;
    }
    
    const quiz = activeModule.quiz;
    let correctCount = 0;
    let totalQuestions = quiz.questions.length;
    
    quiz.questions.forEach(question => {
      const selectedAnswerId = selectedAnswers[question.id];
      if (selectedAnswerId) {
        const selectedAnswer = question.answers?.find(a => a.id === selectedAnswerId);
        if (selectedAnswer && selectedAnswer.is_correct) {
          correctCount++;
        }
      }
    });
    
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (quiz.passing_score || 70);
    
    setQuizScore(score);
    setQuizPassed(passed);
  };

  const completeQuiz = async () => {
    if (!quizPassed || !enrollmentId || !courseId || !course) return;
    
    // Close quiz dialog
    setQuizDialogOpen(false);
    
    // Check if all modules are complete
    let allModulesComplete = true;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!completedLessons.has(lesson.id)) {
          allModulesComplete = false;
          break;
        }
      }
      if (!allModulesComplete) break;
    }
    
    if (allModulesComplete && course.certificate_enabled) {
      // Generate certificate
      try {
        const response = await fetch(`https://rxqoczksnddbxcdwobnw.supabase.co/functions/v1/generate-certificate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          },
          body: JSON.stringify({
            enrollmentId: enrollmentId
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.certificate && result.certificate.pdf_url) {
            setCertificateUrl(result.certificate.pdf_url);
            setCertificateDialogOpen(true);
          }
        }
      } catch (error) {
        console.error('Error generating certificate:', error);
      }
    }
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

  // Guard against non-enrolled users
  if (!loading && (!user || !isEnrolled)) {
    return <Navigate to={`/learning/course/${courseId}`} />;
  }

  const isLessonCompleted = activeLesson && completedLessons.has(activeLesson.id);

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
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Course Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
            
            {/* Video player or Quiz button */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {isCurrentItemQuiz() ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-6">
                  <PenSquare className="h-16 w-16 mb-4" />
                  <h2 className="text-xl font-bold mb-2">Module Quiz</h2>
                  <p className="text-center mb-6">
                    Complete this quiz to test your knowledge from this module.
                    {getActiveModule()?.quiz && (
                      <span className="block mt-2">
                        Passing score: {getActiveModule()?.quiz.passing_score || 70}%
                      </span>
                    )}
                  </p>
                  <Button onClick={startQuiz}>
                    Start Quiz
                  </Button>
                </div>
              ) : activeLesson?.video_url ? (
                <div ref={videoPlayerRef} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-gray-500" />
                  <p className="ml-4 text-white">No video available for this lesson</p>
                </div>
              )}
            </div>
            
            {/* Lesson title and navigation buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isCurrentItemQuiz() 
                  ? `Quiz: ${getActiveModule()?.quiz?.title || 'Module Quiz'}` 
                  : activeLesson?.title}
              </h2>
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
                {isCurrentItemQuiz() ? (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">
                      {getActiveModule()?.quiz?.description || 
                        'This quiz will test your understanding of the concepts covered in this module. Click the "Start Quiz" button above to begin.'}
                    </p>
                  </div>
                ) : (
                  activeLesson?.description ? (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line">{activeLesson.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No additional content available for this lesson.</p>
                  )
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
            {!isCurrentItemQuiz() && (
              <div className="flex justify-end">
                <Button 
                  variant={isLessonCompleted ? "outline" : "default"}
                  onClick={markLessonComplete}
                  disabled={isLessonCompleted}
                >
                  <CheckSquare className="h-5 w-5 mr-2" />
                  {isLessonCompleted ? 'Completed' : 'Mark as Complete'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Sidebar with course content */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4 sticky top-8">
              <h3 className="font-semibold mb-4">Course Content</h3>
              <div className="text-sm text-muted-foreground mb-4">
                {course.modules.length} modules • {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons • {Math.ceil(course.duration_minutes / 60)} hours
              </div>
              
              <Separator className="my-2" />
              
              <Accordion 
                type="multiple" 
                className="w-full"
                defaultValue={[course.modules[activeModuleIndex]?.id || '']}
              >
                {course.modules.map((module, moduleIndex) => (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
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
                            {completedLessons.has(lesson.id) ? (
                              <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0 text-green-500" />
                            ) : moduleIndex === activeModuleIndex && lessonIndex === activeLessonIndex ? (
                              <PlayCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate text-left">{lessonIndex + 1}. {lesson.title}</span>
                          </Button>
                        ))}
                        
                        {/* Quiz button at the end of each module */}
                        {module.quiz && (
                          <Button
                            key={`quiz-${module.id}`}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-xs py-1 px-2 h-auto ${
                              moduleIndex === activeModuleIndex && 
                              activeLessonIndex === module.lessons.length - 1 &&
                              isCurrentItemQuiz()
                                ? 'bg-primary/10 text-primary'
                                : ''
                            }`}
                            onClick={() => {
                              setActiveModuleIndex(moduleIndex);
                              setActiveLessonIndex(module.lessons.length - 1);
                            }}
                          >
                            <PenSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="truncate text-left">Module Quiz</span>
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getActiveModule()?.quiz?.title || 'Module Quiz'}</DialogTitle>
          </DialogHeader>
          
          {quizScore === null ? (
            <>
              <div className="space-y-6">
                {getActiveModule()?.quiz?.questions?.map((question, index) => (
                  <div key={question.id} className="border p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Question {index + 1}: {question.question}</h3>
                    
                    <RadioGroup
                      value={selectedAnswers[question.id] || ''}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      {question.answers?.map((answer) => (
                        <div key={answer.id} className="flex items-center space-x-2 my-2">
                          <RadioGroupItem value={answer.id} id={answer.id} />
                          <Label htmlFor={answer.id}>{answer.answer}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={submitQuiz}>Submit Quiz</Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-6">
                <div className="text-4xl font-bold mb-2">{quizScore}%</div>
                <div className="text-xl mb-4">
                  {quizPassed ? (
                    <span className="text-green-500">Passed!</span>
                  ) : (
                    <span className="text-red-500">Failed</span>
                  )}
                </div>
                <p className="mb-6">
                  {quizPassed 
                    ? 'Congratulations! You have passed the quiz.' 
                    : `You did not meet the passing score of ${getActiveModule()?.quiz?.passing_score || 70}%. Please try again.`}
                </p>
                
                {quizPassed ? (
                  <Button onClick={completeQuiz}>Continue</Button>
                ) : (
                  <Button variant="outline" onClick={() => setQuizScore(null)}>Try Again</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Certificate Dialog */}
      <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
          </DialogHeader>
          
          <div className="text-center p-6 space-y-6">
            <Award className="h-16 w-16 mx-auto text-primary" />
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold">You've completed the course!</h2>
              <p>You have successfully completed all modules and quizzes for this course.</p>
            </div>
            
            {certificateUrl && (
              <div className="space-y-4">
                <p>Your certificate is ready to download.</p>
                
                <div className="flex justify-center">
                  <Button asChild>
                    <a href={certificateUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CoursePlayerPage;
