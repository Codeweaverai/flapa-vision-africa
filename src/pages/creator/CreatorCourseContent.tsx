
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, ArrowLeft, Plus } from 'lucide-react';
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

const CreatorCourseContent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);

  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  
  // Selected items for editing
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
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

  if (loading) {
    return (
      <CreatorLayout title="Course Content">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Course Content">
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
            <Button onClick={handleAddModule}>
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
            <ModuleAccordion
              modules={modules}
              onEditModule={handleEditModule}
              onDeleteModule={handleDeleteModule}
              onAddLesson={handleAddLesson}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
              onAddQuiz={handleAddQuiz}
              onMoveUp={handleMoveModuleUp}
              onMoveDown={handleMoveModuleDown}
            />
          )}
        </CardContent>
      </Card>

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
    </CreatorLayout>
  );
};

export default CreatorCourseContent;
