
import React, { useState, useEffect } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video,
  HelpCircle,
  Award,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  video_url?: string;
  order_index: number;
  quizzes?: Quiz[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface FinalExam {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes: number;
}

interface EnhancedCourseModuleListProps {
  modules: Module[];
  courseId: string;
  onLessonSelect: (lesson: Lesson) => void;
  currentLessonId?: string;
  completedLessons?: string[];
  onQuizStart?: (quizId: string, lessonId: string) => void;
  onFinalExamStart?: (examId: string) => void;
}

const EnhancedCourseModuleList: React.FC<EnhancedCourseModuleListProps> = ({
  modules,
  courseId,
  onLessonSelect,
  currentLessonId,
  completedLessons = [],
  onQuizStart,
  onFinalExamStart
}) => {
  const { user } = useAuth();
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz[]>>({});
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [courseProgress, setCourseProgress] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchQuizzes();
      fetchFinalExam();
    }
  }, [courseId]);

  useEffect(() => {
    calculateProgress();
  }, [modules, completedLessons]);

  const fetchQuizzes = async () => {
    try {
      const lessonIds = modules.flatMap(m => m.lessons.map(l => l.id));
      if (lessonIds.length === 0) return;

      const { data, error } = await supabase
        .from('lesson_quizzes')
        .select('*')
        .in('lesson_id', lessonIds);

      if (error) throw error;

      const quizzesByLesson: Record<string, Quiz[]> = {};
      data?.forEach(quiz => {
        if (!quizzesByLesson[quiz.lesson_id]) {
          quizzesByLesson[quiz.lesson_id] = [];
        }
        quizzesByLesson[quiz.lesson_id].push(quiz);
      });

      setQuizzes(quizzesByLesson);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchFinalExam = async () => {
    try {
      const { data, error } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setFinalExam(data);
    } catch (error) {
      console.error('Error fetching final exam:', error);
    }
  };

  const calculateProgress = () => {
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
    if (totalLessons === 0) {
      setCourseProgress(0);
      return;
    }
    const progress = (completedLessons.length / totalLessons) * 100;
    setCourseProgress(Math.round(progress));
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Course Progress */}
      <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-800">Course Progress</span>
          <span className="text-sm font-bold text-orange-600">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-2" />
      </div>

      {/* Modules */}
      <Accordion 
        type="multiple" 
        value={openModules}
        onValueChange={setOpenModules}
        className="space-y-2"
      >
        {modules.map((module) => (
          <AccordionItem 
            key={module.id} 
            value={module.id}
            className="border rounded-lg bg-gradient-to-r from-orange-50 to-purple-50"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 text-left">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">{module.title}</span>
                  <Badge variant="outline" className="bg-white">
                    {module.lessons?.length || 0} lessons
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {module.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
              )}
              
              {module.lessons && module.lessons.length > 0 ? (
                <div className="space-y-2">
                  {module.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="space-y-2">
                      {/* Lesson Item */}
                      <div 
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                          currentLessonId === lesson.id 
                            ? 'bg-gradient-to-r from-orange-100 to-purple-100 border-orange-300 shadow-sm' 
                            : 'hover:bg-gray-50 hover:shadow-sm'
                        }`}
                        onClick={() => onLessonSelect(lesson)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">{index + 1}</span>
                              </div>
                            )}
                            {lesson.content_type === 'video' ? (
                              <Video className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant={currentLessonId === lesson.id ? "default" : "outline"}
                            size="sm"
                            className={currentLessonId === lesson.id ? 
                              "bg-gradient-to-r from-orange-500 to-purple-600" : ""
                            }
                          >
                            <Play className="h-4 w-4 mr-1" />
                            {currentLessonId === lesson.id ? 'Watching' : 'Watch'}
                          </Button>
                        </div>
                      </div>

                      {/* Lesson Quizzes */}
                      {quizzes[lesson.id] && quizzes[lesson.id].length > 0 && (
                        <div className="ml-8 space-y-2">
                          {quizzes[lesson.id].map((quiz) => (
                            <div 
                              key={quiz.id}
                              className="flex items-center justify-between p-2 border border-orange-200 rounded bg-orange-50"
                            >
                              <div className="flex items-center space-x-2">
                                <HelpCircle className="h-4 w-4 text-orange-500" />
                                <div>
                                  <span className="text-sm font-medium">{quiz.title}</span>
                                  {quiz.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {quiz.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-orange-600">
                                    Passing Score: {quiz.passing_score}%
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuizStart?.(quiz.id, lesson.id);
                                }}
                                className="border-orange-300 text-orange-600 hover:bg-orange-100"
                              >
                                <HelpCircle className="h-4 w-4 mr-1" />
                                Take Quiz
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No lessons available in this module
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Final Exam */}
      {finalExam && courseProgress >= 80 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-800">{finalExam.title}</h4>
                {finalExam.description && (
                  <p className="text-sm text-orange-600 mt-1">{finalExam.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    {finalExam.passing_score}% to pass
                  </Badge>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {finalExam.time_limit_minutes} minutes
                  </div>
                </div>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              onClick={() => onFinalExamStart?.(finalExam.id)}
            >
              <Award className="h-4 w-4 mr-2" />
              Take Final Exam
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCourseModuleList;
