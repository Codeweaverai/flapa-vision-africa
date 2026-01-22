import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Book, ArrowLeft, Plus, GraduationCap, Edit, Trash2, Eye,
  FileText, PlayCircle, Clock, CheckCircle, XCircle
} from 'lucide-react';
import {
  Course,
  CourseModule,
  Lesson,
  deleteModule,
  deleteLesson,
  fetchCourseWithModulesAndLessons,
  updateModuleOrder
} from '@/services/courseService';
import ModuleFormDialog from '@/components/admin/ModuleFormDialog';
import LessonFormDialog from '@/components/admin/LessonFormDialog';
import QuizFormDialog from '@/components/admin/QuizFormDialog';
import QuizEditDialog from '@/components/admin/QuizEditDialog';
import FinalExamFormDialog from '@/components/admin/FinalExamFormDialog';
import LessonTranscriptManager from '@/components/creator/LessonTranscriptManager';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { supabase } from '@/lib/supabaseClient';

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  is_published: boolean;
  question_count?: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  lesson_id: string;
  module_id: string;
  created_at: string;
  question_count?: number;
}

const CreatorCourseContent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [quizzes, setQuizzes] = useState<{[key: string]: Quiz[]}>({});

  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizEditDialogOpen, setQuizEditDialogOpen] = useState(false);
  const [finalExamDialogOpen, setFinalExamDialogOpen] = useState(false);

  // Selected items for editing
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingFinalExam, setEditingFinalExam] = useState<FinalExam | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/creator/courses');
      return;
    }

    let isMounted = true;

    const loadCourseData = async () => {
      setLoading(true);
      try {
        const courseData = await fetchCourseWithModulesAndLessons(id);
        if (isMounted && courseData) {
          setCourse(courseData);
          setModules(courseData.modules || []);
          await loadFinalExam(id);

          // Load quizzes for all lessons in all modules
          const quizMap: {[key: string]: Quiz[]} = {};

          for (const module of courseData.modules || []) {
            for (const lesson of module.lessons || []) {
              const { data: quizData, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('lesson_id', lesson.id);

              if (error) {
                console.error('Error loading quizzes:', error);
                continue;
              }

              if (quizData && quizData.length > 0) {
                // Get question count for each quiz
                const quizzesWithCounts = await Promise.all(
                  quizData.map(async (quiz) => {
                    const { count } = await supabase
                      .from('quiz_questions')
                      .select('*', { count: 'exact', head: true })
                      .eq('quiz_id', quiz.id);

                    return {
                      ...quiz,
                      question_count: count || 0
                    };
                  })
                );

                quizMap[lesson.id] = quizzesWithCounts;
              }
            }
          }

          setQuizzes(quizMap);
        } else if (isMounted) {
          toast.error('Course not found');
          navigate('/creator/courses');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading course content:', error);
          toast.error('Failed to load course content');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCourseData();

    // Cleanup function to handle unmounting
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const loadFinalExam = async (courseId: string) => {
    try {
      const { data: examData, error } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Final exam query error:', error);
        return;
      }

      if (examData) {
        const { count } = await supabase
          .from('final_exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examData.id);

        setFinalExam({
          ...examData,
          question_count: count || 0
        });
      }
    } catch (error) {
      console.error('Error loading final exam:', error);
    }
  };


  // Module handlers
  const handleAddModule = () => {
    setEditingModule(null);
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setModuleDialogOpen(true);
  };

  const handleModuleSaved = (moduleData: CourseModule) => {
    if (editingModule) {
      setModules(prevModules =>
        prevModules.map(m => (m.id === moduleData.id ? moduleData : m))
      );
    } else {
      setModules(prevModules => [...prevModules, moduleData]);
    }
    setModuleDialogOpen(false);
    setEditingModule(null);
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const success = await deleteModule(moduleId);
      if (success) {
        setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
        toast.success('Module deleted successfully');
      } else {
        toast.error('Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Error deleting module');
    }
  };

  // Lesson handlers
  const handleAddLesson = (moduleId: string) => {
    setEditingLesson(null);
    setSelectedModuleId(moduleId);
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedModuleId(lesson.module_id);
    setLessonDialogOpen(true);
  };

  const handleLessonSaved = (lessonData: Lesson) => {
    setModules(prevModules =>
      prevModules.map(module => {
        if (module.id === lessonData.module_id) {
          const existingLessonIndex = module.lessons.findIndex(
            l => l.id === lessonData.id
          );

          if (existingLessonIndex >= 0) {
            const updatedLessons = [...module.lessons];
            updatedLessons[existingLessonIndex] = lessonData;
            return { ...module, lessons: updatedLessons };
          } else {
            return { ...module, lessons: [...module.lessons, lessonData] };
          }
        }
        return module;
      })
    );
    setLessonDialogOpen(false);
    setEditingLesson(null);
    setSelectedModuleId(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const success = await deleteLesson(lessonId);
      if (success) {
        setModules(prevModules =>
          prevModules.map(module => ({
            ...module,
            lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
          }))
        );
        // Remove quizzes for deleted lesson
        setQuizzes(prev => {
          const updated = { ...prev };
          delete updated[lessonId];
          return updated;
        });
        toast.success('Lesson deleted successfully');
      } else {
        toast.error('Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Error deleting lesson');
    }
  };

  // Quiz handlers
  const handleAddQuiz = (lessonId: string, moduleId: string) => {
    setSelectedLessonId(lessonId);
    setSelectedModuleId(moduleId);
    setQuizDialogOpen(true);
  };

  const handleQuizSaved = async () => {
    // Reload quizzes for the specific lesson
    if (selectedLessonId) {
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', selectedLessonId);

      if (error) {
        console.error('Error loading quizzes:', error);
      } else if (quizData) {
        // Get question count for each quiz
        const quizzesWithCounts = await Promise.all(
          quizData.map(async (quiz) => {
            const { count } = await supabase
              .from('quiz_questions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);

            return {
              ...quiz,
              question_count: count || 0
            };
          })
        );

        setQuizzes(prev => ({
          ...prev,
          [selectedLessonId]: quizzesWithCounts
        }));
      }
    }
    setQuizDialogOpen(false);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizEditDialogOpen(true);
  };

  const handleQuizUpdated = async () => {
    // Reload quizzes for the lesson that was updated
    if (editingQuiz) {
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', editingQuiz.lesson_id);

      if (error) {
        console.error('Error loading quizzes:', error);
      } else if (quizData) {
        // Get question count for each quiz
        const quizzesWithCounts = await Promise.all(
          quizData.map(async (quiz) => {
            const { count } = await supabase
              .from('quiz_questions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);

            return {
              ...quiz,
              question_count: count || 0
            };
          })
        );

        setQuizzes(prev => ({
          ...prev,
          [editingQuiz.lesson_id]: quizzesWithCounts
        }));
      }
    }
    setQuizEditDialogOpen(false);
    setEditingQuiz(null);
  };

  const handleDeleteQuiz = async (quizId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      // Remove quiz from state
      setQuizzes(prev => {
        const updated = { ...prev };
        if (updated[lessonId]) {
          updated[lessonId] = updated[lessonId].filter(q => q.id !== quizId);
        }
        return updated;
      });

      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  // Final Exam handlers
  const handleCreateFinalExam = () => {
    setEditingFinalExam(null);
    setFinalExamDialogOpen(true);
  };

  const handleEditFinalExam = () => {
    setEditingFinalExam(finalExam);
    setFinalExamDialogOpen(true);
  };

  const handleFinalExamSaved = (examData: FinalExam) => {
    setFinalExam(examData);
    setFinalExamDialogOpen(false);
    if (id) {
      loadFinalExam(id);
    }
  };

  const handleDeleteFinalExam = async () => {
    if (!finalExam) return;

    if (!confirm('Are you sure you want to delete this final exam? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('final_exams')
        .delete()
        .eq('id', finalExam.id);

      if (error) throw error;

      setFinalExam(null);
      toast.success('Final exam deleted successfully');
    } catch (error) {
      console.error('Error deleting final exam:', error);
      toast.error('Failed to delete final exam');
    }
  };

  const handleToggleExamPublished = async () => {
    if (!finalExam) return;

    try {
      const { error } = await supabase
        .from('final_exams')
        .update({ is_published: !finalExam.is_published })
        .eq('id', finalExam.id);

      if (error) throw error;

      setFinalExam({ ...finalExam, is_published: !finalExam.is_published });
      toast.success(`Final exam ${finalExam.is_published ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error updating final exam:', error);
      toast.error('Failed to update final exam');
    }
  };

  // Enhanced Module Component with Modern Design
  const EnhancedModuleCard = React.memo(({ module, moduleIndex }: { module: CourseModule, moduleIndex: number }) => {
    return (
      <Card key={module.id} className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {moduleIndex + 1}
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  {module.title}
                </CardTitle>
              </div>
              {module.description && (
                <CardDescription className="text-gray-600 ml-11">
                  {module.description}
                </CardDescription>
              )}
              <div className="flex items-center space-x-4 mt-3 ml-11">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  <FileText className="h-3 w-3 mr-1" />
                  {module.lessons?.length || 0} {module.lessons?.length === 1 ? 'Lesson' : 'Lessons'}
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  {module.lessons?.filter(l => l.content_type === 'video').length || 0} Videos
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditModule(module)}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteModule(module.id)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddLesson(module.id)}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Lesson
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {module.lessons && module.lessons.length > 0 ? (
            <div className="space-y-4 ml-11">
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  lessonIndex={lessonIndex}
                  moduleId={module.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg ml-11">
              <p className="mb-4">No lessons in this module yet.</p>
              <Button
                size="sm"
                onClick={() => handleAddLesson(module.id)}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Lesson
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  // Lesson Card Component
  const LessonCard = React.memo(({ lesson, lessonIndex, moduleId }: {
    lesson: Lesson;
    lessonIndex: number;
    moduleId: string;
  }) => {
    const lessonQuizzes = quizzes[lesson.id] || [];

    return (
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-gray-100 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {lessonIndex + 1}
                </div>
                <h4 className="font-semibold text-gray-800">
                  {lesson.title}
                </h4>
              </div>
              {lesson.description && (
                <p className="text-sm text-gray-600 ml-9">{lesson.description}</p>
              )}
              <div className="flex items-center space-x-3 mt-2 ml-9">
                <Badge variant="outline" className={`${
                  lesson.content_type === 'video'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {lesson.content_type}
                </Badge>
                {lessonQuizzes.length > 0 && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {lessonQuizzes.length} Quiz{lessonQuizzes.length !== 1 ? 'zes' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditLesson(lesson)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteLesson(lesson.id)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddQuiz(lesson.id, moduleId)}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Quiz
              </Button>
            </div>
          </div>

          {/* Quizzes Section - Always show if quizzes exist */}
          {lessonQuizzes.length > 0 && (
            <div className="ml-9 mt-4 space-y-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                Quizzes:
                <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  {lessonQuizzes.length} {lessonQuizzes.length !== 1 ? 'quizzes' : 'quiz'}
                </span>
              </h5>

              {lessonQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  lessonId={lesson.id}
                />
              ))}
            </div>
          )}

          {/* Lesson Transcript Manager for video lessons */}
          {lesson.content_type === 'video' && lesson.video_url && (
            <div className="ml-9 mt-4">
              <LessonTranscriptManager
                lessonId={lesson.id}
                lessonTitle={lesson.title}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  // Quiz Card Component
  const QuizCard = React.memo(({ quiz, lessonId }: { quiz: Quiz; lessonId: string }) => {
    return (
      <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <h6 className="font-medium text-gray-800">{quiz.title}</h6>
              </div>
              {quiz.description && (
                <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{quiz.passing_score}% to pass</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3 text-blue-600" />
                  <span>{quiz.question_count || 0} questions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-purple-600" />
                  <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditQuiz(quiz)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteQuiz(quiz.id, lessonId)}
                className="border-red-200 text-red-600 hover:bg-red-50 h-8"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/creator/courses')}
              className="mb-6 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>

            {/* Course Header */}
            {course && (
              <Card className="bg-gradient-to-r from-white to-gray-50/80 shadow-lg border-0">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="mt-3 text-lg text-gray-600">
                        {course.summary || course.description.substring(0, 150) + '...'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant={course.is_published ? "default" : "outline"} 
                             className={course.is_published 
                               ? "bg-green-100 text-green-700 border-green-200" 
                               : "bg-gray-100 text-gray-700 border-gray-200"}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                      {course.is_free ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">Free</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <PriceDisplay amount={course.price} originalCurrency="USD" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="modules" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-2xl shadow-md">
              <TabsTrigger
                value="modules"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all"
              >
                <Book className="h-4 w-4 mr-2" />
                Modules & Lessons
              </TabsTrigger>
              <TabsTrigger
                value="final-exam"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Final Exam
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="modules">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center text-2xl font-bold">
                        <Book className="h-6 w-6 mr-3 text-orange-500" />
                        Course Content
                      </CardTitle>
                      <CardDescription className="text-lg mt-2">
                        Organize your course into modules and lessons with interactive quizzes
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleAddModule}
                      className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {modules.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50">
                      <Book className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-600">No modules yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Start building your course by adding modules. Each module can contain lessons, videos, and quizzes.
                      </p>
                      <Button 
                        onClick={handleAddModule}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 shadow-lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add First Module
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {modules.map((module, index) => (
                        <EnhancedModuleCard 
                          key={module.id} 
                          module={module} 
                          moduleIndex={index} 
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="final-exam">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center text-2xl font-bold">
                        <GraduationCap className="h-6 w-6 mr-3 text-orange-500" />
                        Final Exam
                      </CardTitle>
                      <CardDescription className="text-lg mt-2">
                        Create a comprehensive final exam to test student understanding
                      </CardDescription>
                    </div>
                    {!finalExam && (
                      <Button 
                        onClick={handleCreateFinalExam} 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 shadow-lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Final Exam
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!finalExam ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50">
                      <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-600">No Final Exam Created</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Create a comprehensive final exam with MCQ questions covering all course materials
                      </p>
                      <Button 
                        onClick={handleCreateFinalExam} 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 shadow-lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Final Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <Card className="border-l-4 border-l-orange-500 shadow-lg">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-2xl font-bold">{finalExam.title}</CardTitle>
                              {finalExam.description && (
                                <CardDescription className="mt-3 text-lg">{finalExam.description}</CardDescription>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={finalExam.is_published ? "default" : "outline"}
                                     className={finalExam.is_published 
                                       ? "bg-green-100 text-green-700 border-green-200" 
                                       : "bg-gray-100 text-gray-700 border-gray-200"}>
                                {finalExam.is_published ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                              <p className="text-sm text-orange-600 font-medium">Questions</p>
                              <p className="text-2xl font-bold text-orange-700">{finalExam.question_count || 0}</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                              <p className="text-sm text-blue-600 font-medium">Time Limit</p>
                              <p className="text-2xl font-bold text-blue-700">{finalExam.time_limit_minutes} min</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                              <p className="text-sm text-green-600 font-medium">Passing Score</p>
                              <p className="text-2xl font-bold text-green-700">{finalExam.passing_score}%</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                              <p className="text-sm text-purple-600 font-medium">Status</p>
                              <p className="text-2xl font-bold text-purple-700">{finalExam.is_published ? "Live" : "Draft"}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              onClick={handleEditFinalExam} 
                              variant="outline"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              onClick={handleToggleExamPublished} 
                              variant="outline"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {finalExam.is_published ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Button 
                              onClick={handleDeleteFinalExam} 
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 shadow-lg">
                        <CardContent className="pt-6">
                          <h4 className="font-bold text-lg mb-3 text-gray-800">Exam Guidelines</h4>
                          <ul className="text-gray-600 space-y-2">
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Recommended: 60% Easy/Moderate questions (recall & understanding)
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              30% Application-based questions (practical knowledge)
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              10% Advanced/Critical-thinking questions
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Students must achieve 70% average (including all quizzes) to pass
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Certificates are generated automatically upon successful completion
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        {moduleDialogOpen && (
          <ModuleFormDialog
            open={moduleDialogOpen}
            onOpenChange={setModuleDialogOpen}
            courseId={id!}
            onModuleSaved={handleModuleSaved}
            editingModule={editingModule}
            modules={modules}
          />
        )}

        {lessonDialogOpen && selectedModuleId && (
          <LessonFormDialog
            open={lessonDialogOpen}
            onOpenChange={setLessonDialogOpen}
            moduleId={selectedModuleId}
            onLessonSaved={handleLessonSaved}
            editingLesson={editingLesson}
          />
        )}

        {quizDialogOpen && selectedLessonId && selectedModuleId && (
          <QuizFormDialog
            open={quizDialogOpen}
            onOpenChange={setQuizDialogOpen}
            lessonId={selectedLessonId}
            moduleId={selectedModuleId}
            onQuizSaved={handleQuizSaved}
          />
        )}

        {quizEditDialogOpen && editingQuiz && (
          <QuizEditDialog
            open={quizEditDialogOpen}
            onOpenChange={setQuizEditDialogOpen}
            quiz={editingQuiz}
            onQuizUpdated={handleQuizUpdated}
          />
        )}

        {finalExamDialogOpen && (
          <FinalExamFormDialog
            open={finalExamDialogOpen}
            onOpenChange={setFinalExamDialogOpen}
            courseId={id!}
            onExamSaved={handleFinalExamSaved}
            editingExam={editingFinalExam}
          />
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseContent;
