
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import FinalExamModal from '@/components/course/FinalExamModal';
import FinalExamResultsModal from '@/components/course/FinalExamResultsModal';
import { 
  fetchCourseDetails, 
  fetchCourseEnrollment, 
  fetchModuleLessons,
  CourseModule,
  Lesson
} from '@/services/courseService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { GraduationCap, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  is_published: boolean;
}

interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  completed_at: string;
}

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
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastExamResult, setLastExamResult] = useState<{ score: number; passed: boolean } | null>(null);
  
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
      
      // Fetch final exam
      await loadFinalExam();
      
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

  const loadFinalExam = async () => {
    if (!courseId || !user) return;

    try {
      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (examError) throw examError;
      
      if (examData) {
        setFinalExam(examData);
        
        // Load exam attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('final_exam_attempts')
          .select('*')
          .eq('exam_id', examData.id)
          .eq('user_id', user.id)
          .order('attempt_number', { ascending: false });

        if (attemptsError) throw attemptsError;
        setExamAttempts(attemptsData || []);
      }
    } catch (error) {
      console.error('Error loading final exam:', error);
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

  const handleStartExam = () => {
    setShowExamModal(true);
  };

  const handleExamComplete = (score: number, passed: boolean) => {
    setLastExamResult({ score, passed });
    setShowResultsModal(true);
    loadFinalExam(); // Reload to get updated attempts
  };

  const handleRetakeExam = () => {
    setShowExamModal(true);
  };

  const getExamStatus = () => {
    if (examAttempts.length === 0) return 'not_taken';
    const latestAttempt = examAttempts[0];
    return latestAttempt.passed ? 'passed' : 'failed';
  };

  const getExamStatusBadge = () => {
    const status = getExamStatus();
    switch (status) {
      case 'passed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed - Retake Required
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Not Started
          </Badge>
        );
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
                        {currentLesson.materials_urls && currentLesson.materials_urls.length > 0 ? (
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
                    
                    {/* Final Exam Section */}
                    {finalExam && (
                      <div className="space-y-2 mt-8 pt-6 border-t">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="h-5 w-5 text-orange-500" />
                          <h3 className="font-medium text-lg">Final Assessment</h3>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{finalExam.title}</h4>
                            {getExamStatusBadge()}
                          </div>
                          
                          {finalExam.description && (
                            <p className="text-sm text-muted-foreground mb-3">{finalExam.description}</p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                            <div>Time: {finalExam.time_limit_minutes} minutes</div>
                            <div>Pass: {finalExam.passing_score}%</div>
                          </div>
                          
                          {examAttempts.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-3">
                              Latest score: {examAttempts[0].score}% (Attempt {examAttempts[0].attempt_number})
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {getExamStatus() === 'not_taken' && (
                              <Button 
                                onClick={handleStartExam} 
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-purple-600"
                              >
                                Start Final Exam
                              </Button>
                            )}
                            
                            {getExamStatus() === 'failed' && (
                              <Button 
                                onClick={handleRetakeExam} 
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Retake Exam
                              </Button>
                            )}
                            
                            {getExamStatus() === 'passed' && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Exam Completed Successfully
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Final Exam Modal */}
      {finalExam && showExamModal && (
        <FinalExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollment?.id}
          onComplete={handleExamComplete}
        />
      )}

      {/* Results Modal */}
      {lastExamResult && (
        <FinalExamResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          examScore={lastExamResult.score}
          quizScores={[]}
          finalGrade={lastExamResult.score}
          passingScore={finalExam?.passing_score || 70}
          onRetake={lastExamResult.passed ? undefined : handleRetakeExam}
          courseId={courseId!}
          enrollmentId={enrollment?.id}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
