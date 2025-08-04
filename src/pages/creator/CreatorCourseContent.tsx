import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, ArrowLeft, Plus, GraduationCap, Edit, Trash2, Eye } from 'lucide-react';
import { 
  Course, 
  CourseModule, 
  Lesson, 
  deleteModule, 
  deleteLesson, 
  fetchCourseWithModulesAndLessons,
  updateModuleOrder
} from '@/services/courseService';
import ModuleAccordion from '@/components/admin/ModuleAccordion';
import ModuleFormDialog from '@/components/admin/ModuleFormDialog';
import LessonFormDialog from '@/components/admin/LessonFormDialog';
import QuizFormDialog from '@/components/admin/QuizFormDialog';
import FinalExamFormDialog from '@/components/admin/FinalExamFormDialog';
import LessonTranscriptManager from '@/components/creator/LessonTranscriptManager';
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

const CreatorCourseContent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);

  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [finalExamDialogOpen, setFinalExamDialogOpen] = useState(false);
  
  // Selected items for editing
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingFinalExam, setEditingFinalExam] = useState<FinalExam | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/creator/courses');
      return;
    }

    const loadCourseData = async () => {
      setLoading(true);
      try {
        const courseData = await fetchCourseWithModulesAndLessons(id);
        if (courseData) {
          setCourse(courseData);
          setModules(courseData.modules || []);
          await loadFinalExam(id);
        } else {
          toast.error('Course not found');
          navigate('/creator/courses');
        }
      } catch (error) {
        console.error('Error loading course content:', error);
        toast.error('Failed to load course content');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
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

  const handleQuizSaved = () => {
    if (id) {
      fetchCourseWithModulesAndLessons(id).then(courseData => {
        if (courseData) {
          setCourse(courseData);
          setModules(courseData.modules || []);
        }
      });
    }
    setQuizDialogOpen(false);
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
    // Reload to get question count
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

  // Module ordering handlers
  const handleMoveModuleUp = (index: number) => {
    if (index <= 0) return;
    const newModules = [...modules];
    [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
    setModules(newModules);
    
    newModules.forEach((module, idx) => {
      updateModuleOrder(module.id, idx);
    });
  };

  const handleMoveModuleDown = (index: number) => {
    if (index >= modules.length - 1) return;
    const newModules = [...modules];
    [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
    setModules(newModules);
    
    newModules.forEach((module, idx) => {
      updateModuleOrder(module.id, idx);
    });
  };

  // Enhanced ModuleAccordion component that includes transcript managers
  const EnhancedModuleAccordion = ({ modules }: { modules: CourseModule[] }) => {
    return (
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <Card key={module.id} className="border border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  {module.description && (
                    <CardDescription>{module.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditModule(module)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLesson(module.id)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Lesson
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {module.lessons && module.lessons.length > 0 ? (
                <div className="space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-sm text-gray-600">{lesson.description}</p>
                          )}
                          <Badge variant="outline" className="mt-1">
                            {lesson.content_type}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLesson(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddQuiz(lesson.id, module.id)}
                          >
                            Add Quiz
                          </Button>
                        </div>
                      </div>
                      
                      {/* Add LessonTranscriptManager for video lessons */}
                      {lesson.content_type === 'video' && lesson.video_url && (
                        <LessonTranscriptManager 
                          lessonId={lesson.id} 
                          lessonTitle={lesson.title}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No lessons in this module yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLesson(module.id)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Lesson
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div>
          <h1 className="text-2xl font-bold mb-6">Course Content</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Course Content</h1>
        
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/creator/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>

        {/* Course Header */}
        {course && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{course.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {course.summary || course.description.substring(0, 100) + '...'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={course.is_published ? "default" : "outline"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                  {course.is_free ? (
                    <Badge variant="secondary">Free</Badge>
                  ) : (
                    <Badge variant="outline">${course.price}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
          <Tabs defaultValue="modules" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger
      value="modules"
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
    >
      Modules & Lessons
    </TabsTrigger>

    <TabsTrigger
      value="final-exam"
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
    >
      Final Exam
    </TabsTrigger>
     </TabsList>
          
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Book className="h-5 w-5 mr-2" />
                      Course Content
                    </CardTitle>
                    <CardDescription>
                      Organize your course into modules and lessons
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddModule}
                     className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-md">
                    <h3 className="text-lg font-medium mb-2">No modules yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your course by adding modules
                    </p>
                    <Button onClick={handleAddModule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Module
                    </Button>
                  </div>
                ) : (
                  <EnhancedModuleAccordion modules={modules} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="final-exam">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-orange-500" />
                      Final Exam
                    </CardTitle>
                    <CardDescription>
                      Create a comprehensive final exam to test student understanding
                    </CardDescription>
                  </div>
                  {!finalExam && (
                    <Button onClick={handleCreateFinalExam} className="bg-gradient-to-r from-orange-500 to-purple-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Final Exam
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!finalExam ? (
                  <div className="text-center py-12 border border-dashed rounded-md">
                    <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Final Exam Created</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a comprehensive final exam with MCQ questions covering all course materials
                    </p>
                    <Button onClick={handleCreateFinalExam} className="bg-gradient-to-r from-orange-500 to-purple-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Final Exam
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{finalExam.title}</CardTitle>
                            {finalExam.description && (
                              <CardDescription className="mt-2">{finalExam.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={finalExam.is_published ? "default" : "outline"}>
                              {finalExam.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Questions</p>
                            <p className="text-lg font-semibold">{finalExam.question_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Time Limit</p>
                            <p className="text-lg font-semibold">{finalExam.time_limit_minutes} min</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Passing Score</p>
                            <p className="text-lg font-semibold">{finalExam.passing_score}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="text-lg font-semibold">{finalExam.is_published ? "Live" : "Draft"}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={handleEditFinalExam} variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button onClick={handleToggleExamPublished} variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            {finalExam.is_published ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button onClick={handleDeleteFinalExam} variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-orange-50 to-purple-50">
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Exam Guidelines</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Recommended: 60% Easy/Moderate questions (recall & understanding)</li>
                          <li>• 30% Application-based questions (practical knowledge)</li>
                          <li>• 10% Advanced/Critical-thinking questions</li>
                          <li>• Students must achieve 70% average (including all quizzes) to pass</li>
                          <li>• Certificates are generated automatically upon successful completion</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Module Form Dialog */}
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

        {/* Lesson Form Dialog */}
        {lessonDialogOpen && selectedModuleId && (
          <LessonFormDialog
            open={lessonDialogOpen}
            onOpenChange={setLessonDialogOpen}
            moduleId={selectedModuleId}
            onLessonSaved={handleLessonSaved}
            editingLesson={editingLesson}
          />
        )}

        {/* Quiz Form Dialog */}
        {quizDialogOpen && selectedLessonId && selectedModuleId && (
          <QuizFormDialog
            open={quizDialogOpen}
            onOpenChange={setQuizDialogOpen}
            lessonId={selectedLessonId}
            moduleId={selectedModuleId}
            onQuizSaved={handleQuizSaved}
          />
        )}

        {/* Final Exam Form Dialog */}
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
