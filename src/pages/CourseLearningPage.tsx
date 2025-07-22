import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  FileText, 
  Play,
  Award,
  Lock,
  RotateCcw
} from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import FinalExamModal from '@/components/course/FinalExamModal';

interface Course {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  modules: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  content: string | null;
  module_id: string;
  order_index: number;
  duration_minutes?: number;
  is_completed?: boolean;
}

interface FinalExam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  is_published: boolean;
}

interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  last_accessed_lesson_id: string | null;
  created_at: string;
  updated_at: string;
}

const CourseLearningPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [showFinalExamModal, setShowFinalExamModal] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [hasPassedExam, setHasPassedExam] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [lastAccessedLessonId, setLastAccessedLessonId] = useState<string | null>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (courseId && user) {
      loadCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    // Check if all lessons are completed
    if (course && completedLessons.length > 0) {
      const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
      const allCompleted = totalLessons > 0 && completedLessons.length >= totalLessons;
      setCourseCompleted(allCompleted);
    }
  }, [completedLessons, course]);

  // Load the appropriate lesson when course data is available
  useEffect(() => {
    if (course && course.modules.length > 0) {
      loadAppropriateLesson();
    }
  }, [course, lastAccessedLessonId, completedLessons]);

  const loadAppropriateLesson = () => {
    if (!course || !course.modules.length) return;

    const allLessons = course.modules.flatMap(m => m.lessons).sort((a, b) => {
      // Sort by module order first, then lesson order
      const moduleA = course.modules.find(m => m.id === a.module_id);
      const moduleB = course.modules.find(m => m.id === b.module_id);
      if (moduleA && moduleB && moduleA.order_index !== moduleB.order_index) {
        return moduleA.order_index - moduleB.order_index;
      }
      return a.order_index - b.order_index;
    });

    let lessonToSelect: Lesson | null = null;

    // If we have a last accessed lesson, try to load it
    if (lastAccessedLessonId) {
      lessonToSelect = allLessons.find(lesson => lesson.id === lastAccessedLessonId) || null;
    }

    // If no last accessed lesson or it's not found, find the first incomplete lesson
    if (!lessonToSelect) {
      lessonToSelect = allLessons.find(lesson => !completedLessons.includes(lesson.id)) || null;
    }

    // If all lessons are completed or no incomplete found, load the first lesson
    if (!lessonToSelect && allLessons.length > 0) {
      lessonToSelect = allLessons[0];
    }

    if (lessonToSelect && (!currentLesson || currentLesson.id !== lessonToSelect.id)) {
      setCurrentLesson(lessonToSelect);
      if (enrollmentId) {
        loadVideoPosition(lessonToSelect.id, enrollmentId);
      }
    }
  };

  const loadCourseData = async () => {
    if (!courseId || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch course enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError) {
        throw new Error('You are not enrolled in this course');
      }
      
      setEnrollmentId(enrollment.id);

      // Fetch course with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          creator_id,
          course_modules!inner (
            id,
            title,
            description,
            order_index,
            lessons!inner (
              id,
              title,
              description,
              video_url,
              content,
              module_id,
              order_index,
              duration_minutes
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Transform the data structure
      const transformedCourse: Course = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        creator_id: courseData.creator_id,
        modules: courseData.course_modules
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((module: any) => ({
            id: module.id,
            title: module.title,
            description: module.description,
            order_index: module.order_index,
            lessons: module.lessons
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((lesson: any) => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                video_url: lesson.video_url,
                content: lesson.content,
                module_id: lesson.module_id,
                order_index: lesson.order_index,
                duration_minutes: lesson.duration_minutes
              }))
          }))
      };

      setCourse(transformedCourse);

      // Fetch lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', enrollment.id);

      const completed = progressData?.filter(p => p.is_completed).map(p => p.lesson_id) || [];
      setCompletedLessons(completed);

      // Fetch course progress to get last accessed lesson
      const { data: courseProgress, error: progressError } = await supabase
        .from('course_progress')
        .select('last_accessed_lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!progressError && courseProgress?.last_accessed_lesson_id) {
        setLastAccessedLessonId(courseProgress.last_accessed_lesson_id);
      }

      // Fetch final exam
      const { data: examData } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .single();

      if (examData) {
        setFinalExam(examData);
        
        // Check if user has passed the exam
        const { data: examResults } = await supabase
          .from('final_exam_results')
          .select('passed')
          .eq('user_id', user.id)
          .eq('exam_id', examData.id)
          .eq('passed', true)
          .limit(1);
          
        setHasPassedExam(examResults && examResults.length > 0);
      }

    } catch (error: any) {
      console.error('Error loading course:', error);
      toast.error(error.message || 'Failed to load course');
      navigate('/learning');
    } finally {
      setLoading(false);
    }
  };

  const loadVideoPosition = async (lessonId: string, enrollmentId: string) => {
    try {
      const { data } = await supabase
        .from('lesson_progress')
        .select('last_position_seconds')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId)
        .single();
        
      if (data?.last_position_seconds) {
        setCurrentVideoTime(data.last_position_seconds);
      } else {
        setCurrentVideoTime(0);
      }
    } catch (error) {
      console.error('Error loading video position:', error);
      setCurrentVideoTime(0);
    }
  };

  const saveVideoProgress = async (lessonId: string, position: number, completed: boolean = false) => {
    if (!enrollmentId) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          last_position_seconds: position,
          is_completed: completed,
          completion_date: completed ? new Date().toISOString() : null
        }, {
          onConflict: 'lesson_id,enrollment_id'
        });

      if (error) throw error;

      if (completed && !completedLessons.includes(lessonId)) {
        setCompletedLessons(prev => [...prev, lessonId]);
      }

      // Update course progress with last accessed lesson
      await updateCourseProgress(lessonId);
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };

  const updateCourseProgress = async (lastAccessedLessonId: string) => {
    if (!user || !courseId) return;

    try {
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          last_accessed_lesson_id: lastAccessedLessonId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const handleVideoTimeUpdate = (currentTime: number, duration: number, percent: number) => {
    setCurrentVideoTime(currentTime);
    
    // Clear existing interval
    if (progressSaveInterval.current) {
      clearInterval(progressSaveInterval.current);
    }
    
    // Save progress every 10 seconds
    progressSaveInterval.current = setInterval(() => {
      if (currentLesson) {
        const isCompleted = percent >= 95; // Consider completed at 95%
        saveVideoProgress(currentLesson.id, currentTime, isCompleted);
      }
    }, 10000);
  };

  const handleVideoEnded = () => {
    if (currentLesson && enrollmentId) {
      saveVideoProgress(currentLesson.id, 0, true);
      toast.success('Lesson completed!');
      
      // Auto-transition to next lesson
      setTimeout(() => {
        handleNextLesson();
      }, 1500);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    // Clear progress interval when switching lessons
    if (progressSaveInterval.current) {
      clearInterval(progressSaveInterval.current);
    }
    
    setCurrentLesson(lesson);
    setCurrentVideoTime(0);
    
    if (enrollmentId) {
      loadVideoPosition(lesson.id, enrollmentId);
    }

    // Update course progress
    updateCourseProgress(lesson.id);
  };

  const handleNextLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      
      // Mark current lesson as completed if not already
      if (!completedLessons.includes(currentLesson.id)) {
        saveVideoProgress(currentLesson.id, 0, true);
      }
      
      handleLessonSelect(nextLesson);
    }
  };

  const handlePreviousLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    
    if (currentIndex > 0) {
      const previousLesson = allLessons[currentIndex - 1];
      handleLessonSelect(previousLesson);
    }
  };

  const handleTakeFinalExam = () => {
    if (courseCompleted && finalExam) {
      setShowFinalExamModal(true);
    }
  };

  const handleExamComplete = () => {
    setShowFinalExamModal(false);
    // Refresh exam status
    loadCourseData();
  };

  const calculateProgress = () => {
    if (!course) return 0;
    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    return totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading course content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="mb-6 text-muted-foreground">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link to="/learning">Back to Learning</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/learning">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1">
              <Progress value={calculateProgress()} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">
              {calculateProgress()}% Complete
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course curriculum sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Curriculum</CardTitle>
                  <CardDescription>
                    {completedLessons.length} of {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {course.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
                        {module.title}
                      </h4>
                      {module.lessons.map((lesson) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const isCurrent = currentLesson?.id === lesson.id;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full text-left p-3 rounded-md transition-colors ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                  )}
                                  {lesson.video_url ? (
                                    <Play className="h-4 w-4" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{lesson.title}</p>
                                  {lesson.duration_minutes && (
                                    <p className="text-xs text-muted-foreground">
                                      {lesson.duration_minutes} min
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Final Exam Section */}
                  {finalExam && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-sm text-muted-foreground">Final Assessment</h4>
                      <button
                        onClick={handleTakeFinalExam}
                        disabled={!courseCompleted}
                        className={`w-full text-left p-3 rounded-md transition-colors ${
                          courseCompleted
                            ? 'hover:bg-muted border-orange-200 bg-orange-50'
                            : 'opacity-50 cursor-not-allowed bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {hasPassedExam ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : courseCompleted ? (
                                <Award className="h-4 w-4 text-orange-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{finalExam.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {finalExam.time_limit_minutes} minutes • {finalExam.passing_score}% to pass
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Show exam button when course is completed */}
              {courseCompleted && finalExam && (
                <div className="mt-4">
                  <Button 
                    onClick={handleTakeFinalExam}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    disabled={hasPassedExam}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    {hasPassedExam ? 'Exam Completed' : 'Take Final Exam'}
                  </Button>
                </div>
              )}
              
              {/* View Results Button */}
              {hasPassedExam && (
                <div className="mt-2">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/course/${courseId}/results`)}
                  >
                    View Course Results
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Video Player */}
                {currentLesson.video_url ? (
                  <div className="bg-black rounded-md overflow-hidden">
                    <VideoPlayer
                      src={currentLesson.video_url}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={handleVideoEnded}
                      autoplay={false}
                      controls={true}
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded-md">
                    <div className="text-center p-8">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No video content</h3>
                      <p className="text-muted-foreground">This lesson contains text content only.</p>
                    </div>
                  </div>
                )}
                
                {/* Lesson details */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{currentLesson.title}</h2>
                    {completedLessons.includes(currentLesson.id) && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </Badge>
                    )}
                  </div>
                  
                  {currentLesson.description && (
                    <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                  )}
                </div>
                
                {/* Tabs for different content types */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Lesson Content</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="min-h-[300px]">
                    <Card>
                      <CardContent className="p-6">
                        {currentLesson.content ? (
                          <div 
                            className="prose max-w-none" 
                            dangerouslySetInnerHTML={{ __html: currentLesson.content }} 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-12">
                            <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/40" />
                            <h3 className="font-medium text-lg mb-2">No additional content</h3>
                            <p className="text-muted-foreground text-center">
                              This lesson doesn't have any additional text content.
                              <br />Watch the video above to learn about this topic.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="transcript">
                    <VideoTranscripts
                      lessonId={currentLesson.id}
                      currentTime={currentVideoTime}
                      onSeekTo={(time) => {
                        console.log('Seeking to time:', time);
                        // Note: VideoPlayer component would need to implement seeking functionality
                      }}
                    />
                  </TabsContent>
                </Tabs>
                
                {/* Lesson navigation */}
                <div className="flex justify-between pt-4 mt-8 border-t">
                  <Button 
                    variant="outline"
                    onClick={handlePreviousLesson}
                    disabled={!course || course.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson.id) === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  
                  <Button 
                    onClick={handleNextLesson}
                    disabled={!course || course.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson.id) === course.modules.flatMap(m => m.lessons).length - 1}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    Next <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to the Course</CardTitle>
                  <CardDescription>Select a lesson from the curriculum to begin</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{course.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Final Exam Modal */}
      {finalExam && enrollmentId && (
        <FinalExamModal
          isOpen={showFinalExamModal}
          onClose={() => setShowFinalExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollmentId}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
