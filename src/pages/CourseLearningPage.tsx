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
import { GraduationCap, CheckCircle, AlertCircle, RotateCcw, Award, Lock, Clock, FileText, Star, BookOpen, Target } from 'lucide-react';

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  is_published: boolean;
  questions?: FinalExamQuestion[];
}

interface FinalExamQuestion {
  id: string;
  question: string;
  question_type: string;
  difficulty_level: string;
  order_index: number;
  answers: FinalExamAnswer[];
}

interface FinalExamAnswer {
  id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}

interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  completed_at: string;
  answers: any;
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
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
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  
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
      const courseData = await fetchCourseDetails(courseId);
      if (!courseData) {
        uiToast({ title: 'Error', description: 'Course not found', variant: 'destructive' });
        navigate('/learning');
        return;
      }
      
      const enrollmentData = await fetchCourseEnrollment(courseId, user.id);
      if (!enrollmentData) {
        uiToast({ title: 'Access Denied', description: 'You are not enrolled in this course', variant: 'destructive' });
        navigate(`/course/${courseId}`);
        return;
      }
      
      const modulesData = await fetchModuleLessons(courseId, user.id);
      
      await loadFinalExam();
      
      setCourse(courseData);
      setEnrollment(enrollmentData);
      setModules(modulesData);
      
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
      
    } catch (error) {
      console.error('Error loading course data:', error);
      uiToast({ title: 'Error', description: 'Failed to load course data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadFinalExam = async () => {
    if (!courseId || !user) return;

    try {
      // Fetch final exam with questions and answers
      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select(`
          *,
          final_exam_questions (
            *,
            final_exam_answers (*)
          )
        `)
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (examError) throw examError;
      
      if (examData) {
        // Sort questions and answers by order_index and properly map the structure
        if (examData.final_exam_questions) {
          examData.final_exam_questions.sort((a: any, b: any) => a.order_index - b.order_index);
          examData.final_exam_questions.forEach((question: any) => {
            if (question.final_exam_answers) {
              question.final_exam_answers.sort((a: any, b: any) => a.order_index - b.order_index);
              // Map final_exam_answers to answers for the component
              question.answers = question.final_exam_answers;
            }
          });
          
          // Map the questions to match our interface
          const mappedQuestions = examData.final_exam_questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            question_type: q.question_type,
            difficulty_level: q.difficulty_level,
            order_index: q.order_index,
            answers: q.final_exam_answers || []
          }));
          
          setFinalExam({
            ...examData,
            questions: mappedQuestions
          });
        } else {
          setFinalExam({
            ...examData,
            questions: []
          });
        }
        
        // Fetch exam attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('final_exam_attempts')
          .select('*')
          .eq('exam_id', examData.id)
          .eq('user_id', user.id)
          .order('attempt_number', { ascending: false });

        if (attemptsError) throw attemptsError;
        setExamAttempts(attemptsData || []);

        // Check if certificate exists
        if (enrollment?.id) {
          const { data: certificate } = await supabase
            .from('certificates')
            .select('*')
            .eq('enrollment_id', enrollment.id)
            .maybeSingle();

          if (certificate) {
            setCertificateGenerated(true);
          }
        }
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
  
  const isAllContentComplete = () => {
    return modules.every(module => 
      module.lessons.every(lesson => lesson.is_completed)
    );
  };

  const generateCertificate = async () => {
    if (!enrollment) return;

    try {
      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          enrollmentId: enrollment.id
        })
      });

      if (response.ok) {
        setCertificateGenerated(true);
        toast('Certificate generated successfully!');
      } else {
        throw new Error('Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast('Failed to generate certificate');
    }
  };
  
  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };
  
  const handleLessonComplete = () => {
    uiToast({ title: 'Lesson Completed', description: 'Moving to the next lesson' });
    
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
      uiToast({ title: 'Congratulations!', description: 'You have completed all lessons in this course!' });
    }
  };

  const handleStartExam = () => {
    if (!isAllContentComplete()) {
      toast('Please complete all lessons before taking the final exam');
      return;
    }
    setShowExamModal(true);
  };

  const handleExamComplete = async (score: number, passed: boolean) => {
    setExamLoading(true);
    
    // Simulate 30-second processing time
    setTimeout(async () => {
      setLastExamResult({ score, passed });
      setShowResultsModal(true);
      
      if (passed && course?.certificate_enabled) {
        await generateCertificate();
      }
      
      await loadFinalExam(); // Reload exam data
      setExamLoading(false);
    }, 30000); // 30 seconds
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
            Failed - Retake Available
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            Ready to Take
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
            
            {/* Enhanced Curriculum Sidebar */}
            <div>
              <Card className="border-0 shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Curriculum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Course Modules */}
                    {modules.map((module) => (
                      <div key={module.id} className="space-y-2">
                        <h3 className="font-medium text-lg flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-500" />
                          {module.title}
                        </h3>
                        <div className="space-y-1">
                          {module.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(lesson)}
                              className={`flex items-center w-full p-3 rounded-lg text-left transition-all ${
                                currentLesson?.id === lesson.id
                                  ? 'bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 text-orange-700 font-medium'
                                  : 'hover:bg-muted'
                              } ${lesson.is_completed ? 'text-green-600' : ''}`}
                            >
                              <span className="mr-3">
                                {lesson.is_completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                )}
                              </span>
                              <span className="flex-1">{lesson.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Final Exam Section - Enhanced */}
                    {finalExam && (
                      <div className="space-y-2 mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <GraduationCap className="h-6 w-6 text-orange-500" />
                          <h3 className="font-semibold text-lg text-gray-800">Final Assessment</h3>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-orange-200 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-lg text-gray-800">{finalExam.title}</h4>
                            {getExamStatusBadge()}
                          </div>
                          
                          {finalExam.description && (
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{finalExam.description}</p>
                          )}
                          
                          {/* Exam Details Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white/60 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-medium text-gray-600">Duration</span>
                              </div>
                              <div className="text-sm font-semibold text-gray-800">{finalExam.time_limit_minutes} minutes</div>
                            </div>
                            
                            <div className="bg-white/60 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-medium text-gray-600">Pass Score</span>
                              </div>
                              <div className="text-sm font-semibold text-gray-800">{finalExam.passing_score}%</div>
                            </div>
                            
                            {finalExam.questions && (
                              <div className="bg-white/60 p-3 rounded-lg col-span-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <span className="text-xs font-medium text-gray-600">Questions</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-800">{finalExam.questions.length} questions</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Exam Attempt History */}
                          {examAttempts.length > 0 && (
                            <div className="bg-white/60 p-3 rounded-lg mb-4">
                              <div className="text-xs font-medium text-gray-600 mb-2">Latest Attempt</div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Score: {examAttempts[0].score}%</span>
                                <span className="text-xs text-gray-500">Attempt #{examAttempts[0].attempt_number}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Lock Message */}
                          {!isAllContentComplete() && (
                            <div className="flex items-center gap-2 text-sm text-orange-600 mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <Lock className="h-4 w-4" />
                              <span className="font-medium">Complete all lessons to unlock the final exam</span>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            {getExamStatus() === 'not_taken' && (
                              <Button 
                                onClick={handleStartExam} 
                                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold"
                                disabled={!isAllContentComplete()}
                              >
                                <GraduationCap className="h-4 w-4 mr-2" />
                                {isAllContentComplete() ? 'Start Final Exam' : 'Complete Course First'}
                              </Button>
                            )}
                            
                            {getExamStatus() === 'failed' && (
                              <Button 
                                onClick={handleRetakeExam} 
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Retake Exam
                              </Button>
                            )}
                            
                            {getExamStatus() === 'passed' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="font-medium">Exam Completed Successfully!</span>
                                </div>
                                {course?.certificate_enabled && certificateGenerated && (
                                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <Award className="h-4 w-4" />
                                    <span className="font-medium">Certificate Generated</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Navigation hint for completed course */}
                            {isAllContentComplete() && finalExam && getExamStatus() === 'not_taken' && (
                              <div className="text-center mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-blue-700 mb-2">🎉 Course Complete!</p>
                                <p className="text-xs text-blue-600">Proceed to Final Exam to earn your certificate</p>
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

      {/* Exam Loading Modal */}
      {examLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Your Exam</h3>
              <p className="text-gray-600">Your exam is being marked automatically. This will take about 30 seconds...</p>
            </CardContent>
          </Card>
        </div>
      )}

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
          passed={lastExamResult.passed}
          courseName={course?.title || ''}
          studentName={user?.user_metadata?.full_name || 'Student'}
          enrollmentId={enrollment?.id}
          onRetake={lastExamResult.passed ? undefined : handleRetakeExam}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
