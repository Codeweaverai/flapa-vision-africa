import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// Define YT type for TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Simplified types to avoid excessive type instantiation
interface SimplifiedLesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  module_id: string;
  order_index: number;
  content_type?: 'video' | 'quiz';
  content?: any;
  is_completed?: boolean;
}

interface SimplifiedModule {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  order_index: number;
  lessons: SimplifiedLesson[];
}

interface SimplifiedCourse {
  id: string;
  title: string;
  description: string;
  modules: SimplifiedModule[];
}

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<SimplifiedCourse | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
    };
    
    fetchCourseData();
    
    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [courseId]);
  
  useEffect(() => {
    if (course && course.modules.length > 0) {
      let totalCount = 0;
      let completedCount = 0;
      
      course.modules.forEach(module => {
        totalCount += module.lessons.length;
        module.lessons.forEach(lesson => {
          if (lesson.is_completed) completedCount++;
        });
      });
      
      setTotalLessons(totalCount);
      setCompletedLessons(completedCount);
      setProgressPercentage(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);
    }
  }, [course]);
  
  useEffect(() => {
    if (course && course.modules.length > 0) {
      const currentLesson = getCurrentLesson();
      
      if (currentLesson?.content_type === 'video' && currentLesson.video_url) {
        const videoId = extractVideoId(currentLesson.video_url);
        
        if (videoId) {
          // Initialize YouTube player if YouTube API is loaded
          if (window.YT && window.YT.Player) {
            initializePlayer(videoId);
          } else {
            // Wait for YouTube API to load
            const checkYouTubeAPI = setInterval(() => {
              if (window.YT && window.YT.Player) {
                clearInterval(checkYouTubeAPI);
                initializePlayer(videoId);
              }
            }, 100);
          }
        }
      }
    }
  }, [currentModuleIndex, currentLessonIndex, course]);
  
  const initializePlayer = (videoId: string) => {
    if (!playerContainerRef.current) return;
    
    // Clear any existing player
    if (player) {
      player.destroy();
    }
    
    // Clear container
    while (playerContainerRef.current.firstChild) {
      playerContainerRef.current.removeChild(playerContainerRef.current.firstChild);
    }
    
    // Create player element
    const playerElement = document.createElement('div');
    playerElement.id = 'youtube-player';
    playerContainerRef.current.appendChild(playerElement);
    
    // Create new player
    const newPlayer = new window.YT.Player('youtube-player', {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onStateChange: onPlayerStateChange
      }
    });
    
    setPlayer(newPlayer);
  };
  
  const onPlayerStateChange = (event: any) => {
    // Mark lesson as completed when video ends
    if (event.data === window.YT.PlayerState.ENDED) {
      const currentLesson = getCurrentLesson();
      if (currentLesson) {
        markLessonAsCompleted(currentLesson.id);
      }
    }
  };
  
  // Simplified fetch function to avoid deep type instantiation
  const fetchCourseData = async () => {
    if (!courseId || !user) return;
    
    try {
      setLoading(true);
      
      // Get course with modules
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;
      
      // Get modules for this course
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      
      if (modulesError) throw modulesError;
      
      if (!modulesData || modulesData.length === 0) {
        setCourse({
          ...courseData,
          modules: []
        });
        setLoading(false);
        return;
      }
      
      // Get all module IDs for querying lessons
      const moduleIds = modulesData.map(module => module.id);
      
      // Get lessons for all modules
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true });
      
      if (lessonsError) throw lessonsError;
      
      if (!lessonsData || lessonsData.length === 0) {
        setCourse({
          ...courseData,
          modules: modulesData.map(module => ({ ...module, lessons: [] }))
        });
        setLoading(false);
        return;
      }
      
      // Get all lesson IDs for querying progress
      const lessonIds = lessonsData.map(lesson => lesson.id);
      
      // Get user progress
      let progressData: { lesson_id: string, is_completed: boolean }[] = [];
      
      try {
        // Using simple fetch to avoid TypeScript issues
        const { data, error } = await supabase
          .from('lesson_progress')
          .select('lesson_id,is_completed')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        
        if (error) throw error;
        progressData = data || [];
      } catch (err) {
        console.error('Error fetching lesson progress:', err);
      }
      
      // Format the data with minimal typing to avoid deep instantiation
      const modules = modulesData.map((module: any) => {
        const moduleLessons = lessonsData
          .filter((lesson: any) => lesson.module_id === module.id)
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((lesson: any) => ({
            ...lesson,
            content_type: lesson.video_url ? 'video' : 'quiz',
            content: lesson.video_url ? null : { questions: [], pass_percentage: 70 },
            is_completed: progressData.some(p => p.lesson_id === lesson.id && p.is_completed) || false
          }));
        
        return {
          ...module,
          lessons: moduleLessons
        };
      });
      
      setCourse({
        ...courseData,
        modules
      });
      
      // Find first incomplete lesson
      let foundIncomplete = false;
      
      for (let mi = 0; mi < modules.length; mi++) {
        const module = modules[mi];
        for (let li = 0; li < module.lessons.length; li++) {
          const lesson = module.lessons[li];
          if (!lesson.is_completed && !foundIncomplete) {
            setCurrentModuleIndex(mi);
            setCurrentLessonIndex(li);
            foundIncomplete = true;
            break;
          }
        }
        if (foundIncomplete) break;
      }
      
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };
  
  const markLessonAsCompleted = async (lessonId: string) => {
    if (!user || !courseId) return;
    
    try {
      // Check if already marked as completed
      const currentLesson = getCurrentLesson();
      if (currentLesson?.is_completed) return;
      
      // Find enrollment for this course
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();
      
      if (enrollmentError) throw enrollmentError;
      
      if (!enrollmentData) {
        throw new Error('No enrollment found for this course');
      }
      
      // Simplify the insert operation to avoid type issues
      const { error } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentData.id,
          is_completed: true,
          last_position_seconds: 0,
          completion_date: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Lesson completed');
      
      // Update local state
      setCourse(prevCourse => {
        if (!prevCourse) return null;
        
        const updatedModules = prevCourse.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, is_completed: true } 
              : lesson
          )
        }));
        
        return {
          ...prevCourse,
          modules: updatedModules
        };
      });
      
      setCompletedLessons(prev => prev + 1);
      setProgressPercentage(totalLessons > 0 ? ((completedLessons + 1) / totalLessons) * 100 : 0);
      
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      toast.error('Failed to update progress');
    }
  };
  
  const submitQuiz = async () => {
    const currentLesson = getCurrentLesson();
    if (!currentLesson || currentLesson.content_type !== 'quiz') return;
    
    const quizContent = currentLesson.content;
    const questions = quizContent?.questions || [];
    
    let correct = 0;
    let total = questions.length;
    
    questions.forEach((question: any) => {
      if (quizAnswers[question.id] === question.correct_answer) {
        correct++;
      }
    });
    
    const passPercentage = quizContent?.pass_percentage || 70;
    const score = total > 0 ? (correct / total) * 100 : 0;
    const passed = score >= passPercentage;
    
    if (passed) {
      markLessonAsCompleted(currentLesson.id);
      toast.success(`Quiz completed! Score: ${score.toFixed(0)}%`);
    } else {
      toast.error(`Try again. Score: ${score.toFixed(0)}%. Required: ${passPercentage}%`);
    }
  };
  
  const handleAnswerChange = (questionId: string, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  const goToNextLesson = () => {
    const currentModule = course?.modules[currentModuleIndex];
    if (!currentModule) return;
    
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      // Next lesson in same module
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < (course?.modules.length || 0) - 1) {
      // First lesson in next module
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    }
  };
  
  const goToPrevLesson = () => {
    if (currentLessonIndex > 0) {
      // Previous lesson in same module
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      // Last lesson in previous module
      setCurrentModuleIndex(currentModuleIndex - 1);
      const prevModuleLessons = course?.modules[currentModuleIndex - 1].lessons.length || 0;
      setCurrentLessonIndex(Math.max(0, prevModuleLessons - 1));
    }
  };
  
  const getCurrentLesson = (): SimplifiedLesson | null => {
    if (!course) return null;
    
    const currentModule = course.modules[currentModuleIndex];
    if (!currentModule) return null;
    
    return currentModule.lessons[currentLessonIndex] || null;
  };
  
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  
  const currentLesson = getCurrentLesson();
  const currentModule = course?.modules[currentModuleIndex];
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
            <div className="h-64 bg-gray-200 rounded w-full mb-4"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!course) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p>The course you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <Progress value={progressPercentage} className="w-full h-2" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {completedLessons}/{totalLessons} lessons
                </span>
              </div>
              
              {/* Module and Lesson title */}
              <div className="flex items-center mb-2">
                <h2 className="text-lg font-semibold">
                  {currentModule?.title}: {currentLesson?.title}
                </h2>
                {currentLesson?.is_completed && (
                  <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                )}
              </div>
            </div>
            
            {/* Lesson content */}
            {currentLesson?.content_type === 'video' && (
              <Card className="mb-6">
                <CardContent className="p-0">
                  <div ref={playerContainerRef} className="w-full aspect-video bg-black">
                    {/* YouTube player will be inserted here */}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {currentLesson?.content_type === 'quiz' && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Quiz: {currentLesson.title}</h3>
                  
                  {currentLesson.content?.questions?.map((question: any, index: number) => (
                    <div key={question.id} className="mb-6">
                      <h4 className="text-lg font-medium mb-3">Question {index + 1}: {question.text}</h4>
                      <div className="space-y-2">
                        {question.options.map((option: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center">
                            <input
                              type="radio"
                              id={`q${question.id}-opt${optIndex}`}
                              name={`question-${question.id}`}
                              value={option}
                              checked={quizAnswers[question.id] === option}
                              onChange={() => handleAnswerChange(question.id, option)}
                              className="mr-2"
                            />
                            <label htmlFor={`q${question.id}-opt${optIndex}`}>{option}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={submitQuiz} className="mt-4">
                    Submit Quiz
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goToPrevLesson}
                disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Lesson
              </Button>
              
              <Button 
                onClick={goToNextLesson}
                disabled={currentModuleIndex === course.modules.length - 1 && 
                         currentLessonIndex === course.modules[currentModuleIndex].lessons.length - 1}
              >
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="md:w-1/3 lg:w-1/4">
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3">Course Content</h3>
              
              <div className="space-y-3">
                {course.modules.map((module, mIndex) => (
                  <div key={module.id}>
                    <div className="font-medium mb-1">{module.title}</div>
                    <ul className="space-y-1 pl-4">
                      {module.lessons.map((lesson, lIndex) => (
                        <li 
                          key={lesson.id}
                          className={`text-sm py-1 px-2 rounded cursor-pointer flex items-center justify-between
                                    ${currentModuleIndex === mIndex && currentLessonIndex === lIndex 
                                      ? 'bg-primary text-primary-foreground' 
                                      : lesson.is_completed
                                      ? 'text-muted-foreground'
                                      : 'hover:bg-muted-foreground/10'
                                    }`}
                          onClick={() => { 
                            setCurrentModuleIndex(mIndex);
                            setCurrentLessonIndex(lIndex);
                          }}
                        >
                          <span>{lesson.title}</span>
                          {lesson.is_completed && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursePlayerPage;
