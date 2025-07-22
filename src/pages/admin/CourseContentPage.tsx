import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { 
  fetchCourseWithModulesAndLessons, 
  createModule, 
  updateModule, 
  deleteModule,
  deleteLesson,
  CourseModule,
  Course,
  Lesson
} from '@/services/courseService';
import ModuleFormDialog from '@/components/admin/ModuleFormDialog';
import LessonFormDialog from '@/components/admin/LessonFormDialog';
import QuizFormDialog from '@/components/admin/QuizFormDialog';
import ModuleAccordion from '@/components/admin/ModuleAccordion';

const CourseContentPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');
  
  // Dialog states
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [quizFormOpen, setQuizFormOpen] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    
    const loadCourseContent = async () => {
      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      
      if (courseData) {
        // Type-safe conversion
        const typedCourse: Course = {
          ...courseData,
          modules: courseData.modules?.map((module: any): CourseModule => ({
            id: module.id,
            course_id: module.course_id,
            title: module.title,
            description: module.description,
            order_index: module.order_index,
            created_at: module.created_at,
            updated_at: module.updated_at,
            lessons: module.lessons?.map((lesson: any): Lesson => ({
              id: lesson.id,
              module_id: lesson.module_id,
              title: lesson.title,
              description: lesson.description,
              content_type: lesson.content_type,
              video_url: lesson.video_url,
              content: lesson.content,
              materials_urls: lesson.materials_urls,
              order_index: lesson.order_index,
              created_at: lesson.created_at,
              updated_at: lesson.updated_at,
              quizzes: lesson.quizzes?.map((quiz: any) => ({
                ...quiz,
                time_limit_minutes: quiz.time_limit_minutes || null
              })) || []
            })) || []
          })) || []
        };

        setCourse(typedCourse);
        setModules(typedCourse.modules || []);
      } else {
        toast({
          title: "Error",
          description: "Could not load course content",
          variant: "destructive"
        });
      }
      
      setLoading(false);
    };
    
    loadCourseContent();
  }, [courseId]);

  const handleCreateModule = () => {
    setEditingModule(null);
    setModuleFormOpen(true);
  };
  
  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setModuleFormOpen(true);
  };
  
  const handleModuleSaved = (savedModule: CourseModule) => {
    if (editingModule) {
      // Update existing module
      setModules(modules.map(m => m.id === savedModule.id ? { ...savedModule, lessons: m.lessons } : m));
    } else {
      // Add new module
      setModules([...modules, { ...savedModule, lessons: [] }]);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    const success = await deleteModule(moduleId);
    
    if (success) {
      setModules(modules.filter(m => m.id !== moduleId));
      toast({
        title: "Module Deleted",
        description: "Module and its lessons have been deleted",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the module",
        variant: "destructive",
      });
    }
  };
  
  const handleAddLesson = (moduleId: string) => {
    setEditingLesson(null);
    setCurrentModuleId(moduleId);
    setLessonFormOpen(true);
  };
  
  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setCurrentModuleId(lesson.module_id);
    setLessonFormOpen(true);
  };
  
  const handleLessonSaved = (savedLesson: Lesson) => {
    const updatedModules = [...modules];
    const moduleIndex = updatedModules.findIndex(m => m.id === savedLesson.module_id);
    
    if (moduleIndex !== -1) {
      if (!updatedModules[moduleIndex].lessons) {
        updatedModules[moduleIndex].lessons = [];
      }
      
      if (editingLesson) {
        // Update existing lesson
        updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons!.map(
          l => l.id === savedLesson.id ? savedLesson : l
        );
      } else {
        // Add new lesson
        updatedModules[moduleIndex].lessons!.push(savedLesson);
      }
      
      setModules(updatedModules);
    }
  };
  
  const handleDeleteLesson = async (lessonId: string) => {
    const success = await deleteLesson(lessonId);
    
    if (success) {
      const updatedModules = modules.map(module => ({
        ...module,
        lessons: module.lessons ? module.lessons.filter(lesson => lesson.id !== lessonId) : []
      }));
      
      setModules(updatedModules);
      
      toast({
        title: "Lesson Deleted",
        description: "Lesson has been deleted successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the lesson",
        variant: "destructive",
      });
    }
  };
  
  const handleAddQuiz = (lessonId: string, moduleId: string) => {
    setCurrentLessonId(lessonId);
    setCurrentModuleId(moduleId);
    setQuizFormOpen(true);
  };
  
  const handleQuizSaved = () => {
    // Reload the course content to get the updated quiz data
    if (courseId) {
      loadCourseContent();
    }
  };
  
  const loadCourseContent = async () => {
    if (!courseId) return;
    
    setLoading(true);
    const courseData = await fetchCourseWithModulesAndLessons(courseId);
    
    if (courseData) {
      // Type-safe conversion
      const typedCourse: Course = {
        ...courseData,
        modules: courseData.modules?.map((module: any): CourseModule => ({
          id: module.id,
          course_id: module.course_id,
          title: module.title,
          description: module.description,
          order_index: module.order_index,
          created_at: module.created_at,
          updated_at: module.updated_at,
          lessons: module.lessons?.map((lesson: any): Lesson => ({
            id: lesson.id,
            module_id: lesson.module_id,
            title: lesson.title,
            description: lesson.description,
            content_type: lesson.content_type,
            video_url: lesson.video_url,
            content: lesson.content,
            materials_urls: lesson.materials_urls,
            order_index: lesson.order_index,
            created_at: lesson.created_at,
            updated_at: lesson.updated_at,
            quizzes: lesson.quizzes?.map((quiz: any) => ({
              ...quiz,
              time_limit_minutes: quiz.time_limit_minutes || null
            })) || []
          })) || []
        })) || []
      };

      setCourse(typedCourse);
      setModules(typedCourse.modules || []);
    } else {
      toast({
        title: "Error",
        description: "Could not reload course content",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };
  
  const handleMoveModuleUp = (index: number) => {
    if (index <= 0) return;
    
    const updatedModules = [...modules];
    const moduleToMove = updatedModules[index];
    const moduleToSwap = updatedModules[index - 1];
    
    // Swap order_index values
    const tempOrderIndex = moduleToMove.order_index;
    moduleToMove.order_index = moduleToSwap.order_index;
    moduleToSwap.order_index = tempOrderIndex;
    
    // Update in database
    updateModule(moduleToMove.id, { order_index: moduleToMove.order_index });
    updateModule(moduleToSwap.id, { order_index: moduleToSwap.order_index });
    
    // Swap positions in array
    updatedModules[index] = moduleToSwap;
    updatedModules[index - 1] = moduleToMove;
    
    setModules(updatedModules);
  };
  
  const handleMoveModuleDown = (index: number) => {
    if (index >= modules.length - 1) return;
    
    const updatedModules = [...modules];
    const moduleToMove = updatedModules[index];
    const moduleToSwap = updatedModules[index + 1];
    
    // Swap order_index values
    const tempOrderIndex = moduleToMove.order_index;
    moduleToMove.order_index = moduleToSwap.order_index;
    moduleToSwap.order_index = tempOrderIndex;
    
    // Update in database
    updateModule(moduleToMove.id, { order_index: moduleToMove.order_index });
    updateModule(moduleToSwap.id, { order_index: moduleToSwap.order_index });
    
    // Swap positions in array
    updatedModules[index] = moduleToSwap;
    updatedModules[index + 1] = moduleToMove;
    
    setModules(updatedModules);
  };

  return (
    <AdminLayout title={`${course?.title || 'Course'} Content`}>
      <div className="mb-4 flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Course Content: {course?.title || 'Loading...'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="modules">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Course Modules</h2>
                <Button onClick={handleCreateModule}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
              
              {modules.length === 0 ? (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground mb-4">This course doesn't have any modules yet</p>
                    <Button onClick={handleCreateModule}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create First Module
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
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
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="quizzes">
              <h2 className="text-xl font-semibold mb-4">Course Quizzes</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Manage all course quizzes in one place (coming soon)</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <h2 className="text-xl font-semibold mb-4">Content Settings</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Configure course completion settings, certificates, and more (coming soon)</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      
      {/* Module Form Dialog */}
      <ModuleFormDialog 
        open={moduleFormOpen}
        onOpenChange={setModuleFormOpen}
        courseId={courseId || ''}
        onModuleSaved={handleModuleSaved}
        editingModule={editingModule}
        modules={modules}
      />
      
      {/* Lesson Form Dialog */}
      {currentModuleId && (
        <LessonFormDialog 
          open={lessonFormOpen}
          onOpenChange={setLessonFormOpen}
          moduleId={currentModuleId}
          onLessonSaved={handleLessonSaved}
          editingLesson={editingLesson}
          courseId={courseId || ''}
        />
      )}
      
      {/* Quiz Form Dialog */}
      {currentLessonId && currentModuleId && (
        <QuizFormDialog 
          open={quizFormOpen}
          onOpenChange={setQuizFormOpen}
          lessonId={currentLessonId}
          moduleId={currentModuleId}
          onQuizSaved={handleQuizSaved}
        />
      )}
    </AdminLayout>
  );
};

export default CourseContentPage;
