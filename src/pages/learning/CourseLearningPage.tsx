
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import CreatorProfile from '@/components/creator/CreatorProfile';
import LessonNotes from '@/components/course/LessonNotes';
import LessonDiscussions from '@/components/course/LessonDiscussions';
import LessonResources from '@/components/course/LessonResources';
import { 
  fetchCourseDetails, 
  fetchCourseEnrollment, 
  fetchModuleLessons,
  CourseModule,
  Lesson
} from '@/services/courseService';
import { supabase } from '@/lib/supabaseClient';
import { 
  CheckCircle, 
  Play, 
  SkipForward, 
  Clock, 
  Award,
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageSquare,
  FileText,
  Download
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showNextLessonModal, setShowNextLessonModal] = useState(false);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [autoplayCountdown, setAutoplayCountdown] = useState(5);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (user && courseId) {
      // Set up real-time subscription for lesson progress
      const channel = supabase
        .channel(`lesson_progress_${courseId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'lesson_progress',
            filter: `enrollment_id=eq.${enrollment?.id}` 
          }, 
          () => {
            loadLessonProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, courseId, enrollment]);

  // Autoplay countdown effect
  useEffect(() => {
    if (showNextLessonModal && autoplayCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoplayCountdown(autoplayCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showNextLessonModal && autoplayCountdown === 0) {
      handleNextLesson();
    }
  }, [showNextLessonModal, autoplayCountdown]);
  
  const loadCourseData = async () => {
    if (!courseId || !user) return;
    
    setLoading(true);
    try {
      const courseData = await fetchCourseDetails(courseId);
      if (!courseData) {
        toast.error('Course not found');
        navigate('/learning');
        return;
      }
      
      const enrollmentData = await fetchCourseEnrollment(courseId, user.id);
      if (!enrollmentData) {
        toast.error('You are not enrolled in this course');
        navigate(`/learning/course-detail/${courseId}`);
        return;
      }
      
      const modulesData = await fetchModuleLessons(courseId, user.id);
      
      setCourse(courseData);
      setEnrollment(enrollmentData);
      setModules(modulesData);
      
      // Set current lesson
      let lessonFound = false;
      let firstLesson: Lesson | null = null;
      
      for (const module of modulesData) {
        if (module.lessons && module.lessons.length > 0) {
          if (!firstLesson) {
            firstLesson = module.lessons[0];
          }
          
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
      
      if (!lessonFound && firstLesson) {
        setCurrentLesson(firstLesson);
      }
      
      calculateProgress(modulesData);
      await loadLessonProgress();
      
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const loadLessonProgress = async () => {
    if (!enrollment) return;

    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id, is_completed')
      .eq('enrollment_id', enrollment.id);

    if (!error && data) {
      const progressMap = data.reduce((acc, item) => {
        acc[item.lesson_id] = item.is_completed;
        return acc;
      }, {} as Record<string, boolean>);
      setLessonProgress(progressMap);
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
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const findNextLesson = (currentLessonId: string): Lesson | null => {
    let foundCurrent = false;
    
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (foundCurrent) {
          return lesson;
        }
        if (lesson.id === currentLessonId) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const handleLessonComplete = async () => {
    if (!currentLesson || !enrollment) return;

    // Mark lesson as complete in database
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollment.id,
        lesson_id: currentLesson.id,
        is_completed: true,
        completion_date: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to mark lesson as complete');
      return;
    }

    // Update local state
    setLessonProgress(prev => ({
      ...prev,
      [currentLesson.id]: true
    }));

    toast.success('Lesson completed!');
    
    const next = findNextLesson(currentLesson.id);
    if (next) {
      setNextLesson(next);
      setAutoplayCountdown(5);
      setShowNextLessonModal(true);
    } else {
      // Course completed
      toast.success('Congratulations! You have completed the course!');
      
      // Update enrollment completion status
      await supabase
        .from('course_enrollments')
        .update({ 
          is_completed: true, 
          completion_date: new Date().toISOString() 
        })
        .eq('id', enrollment.id);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      setIsPlaying(false);
      setCurrentTime(0);
    }
    setShowNextLessonModal(false);
    setAutoplayCountdown(5);
  };

  const handleVideoEnd = () => {
    handleLessonComplete();
  };

  const toggleModuleCollapse = (moduleId: string) => {
    const newCollapsed = new Set(collapsedModules);
    if (newCollapsed.has(moduleId)) {
      newCollapsed.delete(moduleId);
    } else {
      newCollapsed.add(moduleId);
    }
    setCollapsedModules(newCollapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
        <Layout>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Layout>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
      <Layout>
        <div className="container max-w-7xl py-6">
          {/* Course Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                {course?.title}
              </h1>
              {progress === 100 && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Award className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Course Progress</span>
                <span className="text-sm font-bold text-purple-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-gray-200" />
              {enrollment && (
                <p className="text-xs text-gray-500 mt-1">
                  Enrolled on {new Date(enrollment.enrollment_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Video Player */}
              {currentLesson ? (
                <Card className="overflow-hidden shadow-lg bg-white border-0">
                  <div className="aspect-video bg-black relative">
                    {currentLesson.video_url ? (
                      <ReactPlayer
                        url={currentLesson.video_url}
                        width="100%"
                        height="100%"
                        controls
                        playing={isPlaying}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                        onEnded={handleVideoEnd}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center text-white">
                          <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No video available for this lesson</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-800">{currentLesson.title}</CardTitle>
                        {currentLesson.description && (
                          <CardDescription className="mt-2 text-gray-600">
                            {currentLesson.description}
                          </CardDescription>
                        )}
                      </div>
                      {lessonProgress[currentLesson.id] && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardFooter className="bg-white">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(currentTime)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {!lessonProgress[currentLesson.id] && (
                          <Button 
                            onClick={handleLessonComplete} 
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                        
                        {findNextLesson(currentLesson.id) && (
                          <Button 
                            onClick={() => {
                              const next = findNextLesson(currentLesson.id);
                              if (next) handleLessonSelect(next);
                            }}
                            variant="outline"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                          >
                            <SkipForward className="h-4 w-4 mr-2" />
                            Next Lesson
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="shadow-lg bg-white border-0">
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Welcome to the Course</h3>
                    <p className="text-gray-600 mb-4">Select a lesson from the course outline to begin learning</p>
                    {course?.description && (
                      <p className="text-gray-500 max-w-2xl mx-auto">{course.description}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lesson Content Tabs */}
              {currentLesson && (
                <Card className="shadow-lg bg-white border-0">
                  <Tabs defaultValue="notes" className="w-full">
                    <CardHeader className="pb-0">
                      <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-orange-50 to-purple-50">
                        <TabsTrigger value="notes" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Notes
                        </TabsTrigger>
                        <TabsTrigger value="discussions" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Q&A
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Resources
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Overview
                        </TabsTrigger>
                      </TabsList>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      <TabsContent value="notes">
                        <LessonNotes lessonId={currentLesson.id} currentTime={currentTime} />
                      </TabsContent>
                      
                      <TabsContent value="discussions">
                        <LessonDiscussions lessonId={currentLesson.id} />
                      </TabsContent>
                      
                      <TabsContent value="resources">
                        <LessonResources lessonId={currentLesson.id} />
                      </TabsContent>
                      
                      <TabsContent value="overview">
                        <div className="prose max-w-none">
                          <h3>About this lesson</h3>
                          <p>{currentLesson.description || 'No additional information available for this lesson.'}</p>
                          
                          {currentLesson.content && (
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                          )}
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sticky Course Outline */}
              <Card className="sticky top-24 shadow-lg bg-white border-0 max-h-[80vh] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Course Outline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {modules.map((module) => (
                      <div key={module.id} className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => toggleModuleCollapse(module.id)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{module.title}</h3>
                            <p className="text-sm text-gray-500">
                              {module.lessons.filter(l => lessonProgress[l.id]).length} / {module.lessons.length} lessons
                            </p>
                          </div>
                          {collapsedModules.has(module.id) ? (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        
                        {!collapsedModules.has(module.id) && (
                          <div className="bg-gray-50">
                            {module.lessons.map((lesson, index) => (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonSelect(lesson)}
                                className={`w-full p-3 pl-8 text-left hover:bg-white transition-colors flex items-center gap-3 ${
                                  currentLesson?.id === lesson.id
                                    ? 'bg-gradient-to-r from-orange-100 to-purple-100 border-r-4 border-purple-500'
                                    : ''
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {lessonProgress[lesson.id] ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : currentLesson?.id === lesson.id ? (
                                    <Play className="h-5 w-5 text-purple-600" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    currentLesson?.id === lesson.id ? 'text-purple-700' : 'text-gray-700'
                                  }`}>
                                    {index + 1}. {lesson.title}
                                  </p>
                                  <p className="text-xs text-gray-500">{lesson.content_type}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Creator Profile */}
              {course?.creator_id && (
                <CreatorProfile creatorId={course.creator_id} />
              )}
            </div>
          </div>
        </div>

        {/* Next Lesson Modal */}
        <Dialog open={showNextLessonModal} onOpenChange={setShowNextLessonModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SkipForward className="h-5 w-5 text-purple-600" />
                Next Lesson
              </DialogTitle>
              <DialogDescription>
                Great job completing this lesson! Ready for the next one?
              </DialogDescription>
            </DialogHeader>
            
            {nextLesson && (
              <div className="py-4">
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-1">{nextLesson.title}</h4>
                  <p className="text-sm text-gray-600">{nextLesson.description}</p>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Starting automatically in <span className="font-bold text-purple-600">{autoplayCountdown}</span> seconds
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={handleNextLesson}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                Start Next Lesson
              </Button>
              <Button variant="outline" onClick={() => setShowNextLessonModal(false)}>
                Stay Here
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </div>
  );
};

export default CourseLearningPage;
