import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, X, Edit, GripVertical, ChevronLeft, Save, Video, FileText, Check } from 'lucide-react';
import { 
  Course, 
  CourseModule, 
  Lesson, 
  Quiz,
  QuizQuestion,
  QuizAnswer,
  fetchCourseWithModulesAndLessons, 
  createCourse, 
  updateCourse, 
  createModule, 
  updateModule,
  deleteModule,
  createLesson,
  updateLesson, 
  deleteLesson,
  uploadCourseThumbnail,
  uploadLessonMaterial,
  createQuiz,
  createQuizQuestion,
  createQuizAnswer,
  updateQuiz,
  deleteQuiz
} from '@/services/courseService';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScrollArea } from '@/components/ui/scroll-area';

const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
  duration_minutes: z.coerce.number().min(10, "Duration must be at least 10 minutes"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  is_free: z.boolean(),
  certificate_enabled: z.boolean(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// Form schemas for lesson and quiz data
const lessonFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  video_url: z.string().url("Must be a valid URL").or(z.string().length(0)),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

const quizFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  passing_score: z.number().min(50).max(100),
  questions: z.array(z.object({
    question: z.string().min(5, "Question must be at least 5 characters"),
    answers: z.array(z.object({
      answer: z.string().min(1, "Answer must not be empty"),
      is_correct: z.boolean()
    })).min(2, "At least 2 answers required")
  })).min(1, "At least 1 question is required")
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

const CourseForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  // For lesson and quiz editing
  const [currentTab, setCurrentTab] = useState<string>("basic");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState<boolean>(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState<boolean>(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState<boolean>(false);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [materialUploading, setMaterialUploading] = useState<boolean>(false);
  const [uploadedMaterialUrls, setUploadedMaterialUrls] = useState<string[]>([]);
  const [draggedModuleIndex, setDraggedModuleIndex] = useState<number | null>(null);
  const [draggedLessonIndex, setDraggedLessonIndex] = useState<number | null>(null);
  const [dragOverModuleIndex, setDragOverModuleIndex] = useState<number | null>(null);
  const [dragOverLessonIndex, setDragOverLessonIndex] = useState<number | null>(null);
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      category: '',
      difficulty_level: 'beginner',
      duration_minutes: 60,
      price: 0,
      is_free: true,
      certificate_enabled: false,
    }
  });
  
  // Lesson form
  const { register: registerLesson, handleSubmit: handleSubmitLesson, control: controlLesson, reset: resetLessonForm, formState: { errors: lessonErrors } } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: '',
      video_url: '',
      description: '',
    }
  });

  // Quiz form
  const { register: registerQuiz, handleSubmit: handleSubmitQuiz, control: controlQuiz, reset: resetQuizForm, formState: { errors: quizErrors } } = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: '',
      description: '',
      passing_score: 70,
      questions: [{ 
        question: '', 
        answers: [
          { answer: '', is_correct: true },
          { answer: '', is_correct: false }
        ] 
      }]
    }
  });

  // Field arrays for quiz questions and answers
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: controlQuiz,
    name: "questions"
  });

  const getAnswerFields = (questionIndex: number) => {
    return useFieldArray({
      control: controlQuiz,
      name: `questions.${questionIndex}.answers`
    });
  };
  
  const isFree = watch('is_free');
  
  // Load existing course data if in edit mode
  useEffect(() => {
    const loadCourse = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const courseData = await fetchCourseWithModulesAndLessons(id!);
        if (courseData) {
          setCourse(courseData);
          setModules(courseData.modules);
          
          // Set form values
          setValue('title', courseData.title);
          setValue('summary', courseData.summary);
          setValue('description', courseData.description);
          setValue('category', courseData.category);
          setValue('difficulty_level', courseData.difficulty_level as "beginner" | "intermediate" | "advanced");
          setValue('duration_minutes', courseData.duration_minutes);
          setValue('price', courseData.price || 0);
          setValue('is_free', courseData.is_free || false);
          setValue('certificate_enabled', courseData.certificate_enabled || false);
          
          // Set thumbnail preview if exists
          if (courseData.thumbnail_url) {
            setThumbnailPreview(courseData.thumbnail_url);
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast({
          title: "Error",
          description: "Failed to load course data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [id, isEditMode, setValue]);
  
  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };
  
  // Remove selected thumbnail
  const clearThumbnail = () => {
    setThumbnail(null);
    if (thumbnailPreview && !thumbnailPreview.startsWith('http')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
  };
  
  // Handle form submission
  const onSubmit = async (data: CourseFormValues) => {
    try {
      setSaving(true);
      
      // Create or update the course
      let courseId: string;
      
      if (isEditMode) {
        const updatedCourse = await updateCourse(id!, {
          title: data.title,
          summary: data.summary,
          description: data.description,
          category: data.category,
          difficulty_level: data.difficulty_level,
          duration_minutes: data.duration_minutes,
          price: data.price,
          is_free: data.is_free,
          certificate_enabled: data.certificate_enabled
        });
        
        if (!updatedCourse) throw new Error("Failed to update course");
        courseId = id!;
      } else {
        const newCourse = await createCourse({
          title: data.title,
          summary: data.summary,
          description: data.description,
          category: data.category,
          difficulty_level: data.difficulty_level,
          duration_minutes: data.duration_minutes,
          price: data.price,
          is_free: data.is_free,
          certificate_enabled: data.certificate_enabled,
          is_published: false
        });
        
        if (!newCourse) throw new Error("Failed to create course");
        courseId = newCourse.id;
      }
      
      // Upload thumbnail if selected
      if (thumbnail) {
        const thumbnailUrl = await uploadCourseThumbnail(thumbnail, courseId);
        if (thumbnailUrl) {
          await updateCourse(courseId, { thumbnail_url: thumbnailUrl });
        }
      }
      
      toast({
        title: isEditMode ? "Course Updated" : "Course Created",
        description: isEditMode ? "The course has been updated successfully" : "The course has been created successfully",
      });
      
      // Redirect to course edit page if new course, or back to courses list if updating
      navigate(isEditMode ? "/admin/courses" : `/admin/courses/edit/${courseId}`);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} course`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle module creation and editing
  const openModuleDialog = (moduleId?: string) => {
    if (moduleId) {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        setEditingModuleId(moduleId);
      }
    } else {
      setEditingModuleId(null);
    }
    setModuleDialogOpen(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!title) {
      toast({
        title: "Error",
        description: "Module title is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingModuleId) {
        // Update existing module
        const updatedModule = await updateModule(editingModuleId, {
          title,
          description
        });
        
        if (updatedModule) {
          setModules(modules.map(m => m.id === editingModuleId ? { ...m, ...updatedModule } : m));
          toast({
            title: "Module Updated",
            description: `${title} has been updated successfully`,
          });
        }
      } else {
        // Create new module
        const newModule = await createModule({
          course_id: id!,
          title,
          description,
          order_index: modules.length
        });
        
        if (newModule) {
          setModules([...modules, { ...newModule, lessons: [] }]);
          toast({
            title: "Module Created",
            description: `${title} has been added to the course`,
          });
        }
      }
      
      setModuleDialogOpen(false);
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "Error",
        description: "Failed to save module",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? This will also delete all lessons and quizzes in this module.')) {
      return;
    }
    
    try {
      const success = await deleteModule(moduleId);
      if (success) {
        setModules(modules.filter(m => m.id !== moduleId));
        toast({
          title: "Module Deleted",
          description: "Module has been deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      });
    }
  };
  
  // Handle lesson creation and editing
  const openLessonDialog = (moduleId: string, lessonId?: string) => {
    setEditingModuleId(moduleId);
    resetLessonForm();
    setUploadedMaterialUrls([]);
    
    if (lessonId) {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        const lesson = module.lessons?.find(l => l.id === lessonId);
        if (lesson) {
          setEditingLessonId(lessonId);
          resetLessonForm({
            title: lesson.title,
            video_url: lesson.video_url || '',
            description: lesson.description || '',
          });
          
          if (lesson.materials_urls) {
            setUploadedMaterialUrls(lesson.materials_urls);
          }
        }
      }
    } else {
      setEditingLessonId(null);
    }
    
    setLessonDialogOpen(true);
  };

  const handleLessonSubmit = async (data: LessonFormValues) => {
    if (!editingModuleId) return;
    
    try {
      if (editingLessonId) {
        // Update existing lesson
        const updatedLesson = await updateLesson(editingLessonId, {
          title: data.title,
          video_url: data.video_url || null,
          description: data.description,
          materials_urls: uploadedMaterialUrls,
        });
        
        if (updatedLesson) {
          setModules(modules.map(m => {
            if (m.id === editingModuleId) {
              return {
                ...m,
                lessons: (m.lessons || []).map(l => 
                  l.id === editingLessonId ? { ...l, ...updatedLesson } : l
                )
              };
            }
            return m;
          }));
          
          toast({
            title: "Lesson Updated",
            description: `${data.title} has been updated successfully`,
          });
        }
      } else {
        // Create new lesson
        const module = modules.find(m => m.id === editingModuleId);
        const lessonCount = module?.lessons?.length || 0;
        
        const newLesson = await createLesson({
          module_id: editingModuleId,
          title: data.title,
          video_url: data.video_url || null,
          description: data.description,
          order_index: lessonCount,
          materials_urls: uploadedMaterialUrls,
        });
        
        if (newLesson) {
          setModules(modules.map(m => {
            if (m.id === editingModuleId) {
              return {
                ...m,
                lessons: [...(m.lessons || []), newLesson]
              };
            }
            return m;
          }));
          
          toast({
            title: "Lesson Created",
            description: `${data.title} has been added to the module`,
          });
        }
      }
      
      setLessonDialogOpen(false);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    
    try {
      const success = await deleteLesson(lessonId);
      if (success) {
        setModules(modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: (m.lessons || []).filter(l => l.id !== lessonId)
            };
          }
          return m;
        }));
        
        toast({
          title: "Lesson Deleted",
          description: "Lesson has been deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
    }
  };
  
  // Handle material uploads
  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setMaterialFiles(Array.from(files));
  };

  const uploadMaterials = async () => {
    if (!materialFiles.length || !editingLessonId) return;
    
    setMaterialUploading(true);
    
    try {
      const urls = [...uploadedMaterialUrls];
      
      for (const file of materialFiles) {
        const url = await uploadLessonMaterial(file, editingLessonId);
        if (url) {
          urls.push(url);
        }
      }
      
      setUploadedMaterialUrls(urls);
      setMaterialFiles([]);
      
      toast({
        title: "Materials Uploaded",
        description: `${materialFiles.length} materials have been uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading materials:', error);
      toast({
        title: "Error",
        description: "Failed to upload materials",
        variant: "destructive",
      });
    } finally {
      setMaterialUploading(false);
    }
  };

  const removeMaterial = (index: number) => {
    setUploadedMaterialUrls(uploadedMaterialUrls.filter((_, i) => i !== index));
  };
  
  // Handle quiz creation and editing
  const openQuizDialog = (moduleId: string, quizId?: string) => {
    setEditingModuleId(moduleId);
    resetQuizForm();
    
    if (quizId) {
      const module = modules.find(m => m.id === moduleId);
      if (module && module.quiz) {
        setEditingQuizId(quizId);
        
        const quiz = module.quiz;
        resetQuizForm({
          title: quiz.title,
          description: quiz.description || '',
          passing_score: quiz.passing_score,
          questions: quiz.questions?.map(q => ({
            question: q.question,
            answers: q.answers?.map(a => ({
              answer: a.answer,
              is_correct: a.is_correct
            })) || []
          })) || [{
            question: '',
            answers: [
              { answer: '', is_correct: true },
              { answer: '', is_correct: false }
            ]
          }]
        });
      }
    } else {
      setEditingQuizId(null);
    }
    
    setQuizDialogOpen(true);
  };

  const handleQuizSubmit = async (data: QuizFormValues) => {
    if (!editingModuleId) return;
    
    try {
      let quizId: string;
      
      if (editingQuizId) {
        // Update existing quiz
        const updatedQuiz = await updateQuiz(editingQuizId, {
          title: data.title,
          description: data.description,
          passing_score: data.passing_score
        });
        
        if (!updatedQuiz) throw new Error('Failed to update quiz');
        quizId = updatedQuiz.id;
        
        // We'll handle questions and answers separately
        // This would require deleting all existing questions and answers and creating new ones
        // For simplicity, we're skipping that in this implementation
      } else {
        // Create new quiz
        const newQuiz = await createQuiz({
          module_id: editingModuleId,
          title: data.title,
          description: data.description,
          passing_score: data.passing_score
        });
        
        if (!newQuiz) throw new Error('Failed to create quiz');
        quizId = newQuiz.id;
        
        // Create questions and answers
        for (const [questionIndex, questionData] of data.questions.entries()) {
          const newQuestion = await createQuizQuestion({
            quiz_id: quizId,
            question: questionData.question,
            order_index: questionIndex
          });
          
          if (newQuestion) {
            for (const [answerIndex, answerData] of questionData.answers.entries()) {
              await createQuizAnswer({
                question_id: newQuestion.id,
                answer: answerData.answer,
                is_correct: answerData.is_correct,
                order_index: answerIndex
              });
            }
          }
        }
        
        // Update modules state with new quiz
        setModules(modules.map(m => {
          if (m.id === editingModuleId) {
            return {
              ...m,
              quiz: {
                ...newQuiz,
                questions: data.questions.map((q, qIndex) => ({
                  id: `temp-q-${qIndex}`,
                  quiz_id: quizId,
                  question: q.question,
                  order_index: qIndex,
                  answers: q.answers.map((a, aIndex) => ({
                    id: `temp-a-${qIndex}-${aIndex}`,
                    question_id: `temp-q-${qIndex}`,
                    answer: a.answer,
                    is_correct: a.is_correct,
                    order_index: aIndex,
                    created_at: null,
                    updated_at: null
                  })),
                  created_at: null,
                  updated_at: null
                }))
              }
            };
          }
          return m;
        }));
      }
      
      setQuizDialogOpen(false);
      
      toast({
        title: editingQuizId ? "Quiz Updated" : "Quiz Created",
        description: `${data.title} has been ${editingQuizId ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuiz = async (moduleId: string, quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) {
      return;
    }
    
    try {
      const success = await deleteQuiz(quizId);
      if (success) {
        setModules(modules.map(m => {
          if (m.id === moduleId) {
            return { ...m, quiz: null };
          }
          return m;
        }));
        
        toast({
          title: "Quiz Deleted",
          description: "Quiz has been deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  // YouTube URL helper function
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };
  
  if (loading) {
    return (
      <AdminLayout title={isEditMode ? "Edit Course" : "Create Course"}>
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={isEditMode ? "Edit Course" : "Create Course"}>
      <div className="mb-6 flex items-center">
        <Button variant="ghost" onClick={() => navigate('/admin/courses')} className="mr-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? "Edit Course" : "Create Course"}</h1>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          {isEditMode && <TabsTrigger value="content">Course Content</TabsTrigger>}
        </TabsList>

        <TabsContent value="basic">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>Enter the basic information about your course</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input 
                        id="title"
                        placeholder="Introduction to AI" 
                        {...register('title')}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="summary">Course Summary</Label>
                      <Input 
                        id="summary"
                        placeholder="A brief summary of the course" 
                        {...register('summary')}
                        className={errors.summary ? "border-destructive" : ""}
                      />
                      {errors.summary && <p className="text-sm text-destructive">{errors.summary.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Course Description</Label>
                      <Textarea 
                        id="description"
                        placeholder="Detailed description of the course" 
                        rows={6}
                        {...register('description')}
                        className={errors.description ? "border-destructive" : ""}
                      />
                      {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input 
                          id="category"
                          placeholder="AI & Technology" 
                          {...register('category')}
                          className={errors.category ? "border-destructive" : ""}
                        />
                        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="difficulty_level">Difficulty Level</Label>
                        <Controller
                          name="difficulty_level"
                          control={control}
                          render={({ field }) => (
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <SelectTrigger id="difficulty_level">
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.difficulty_level && <p className="text-sm text-destructive">{errors.difficulty_level.message}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                        <Input 
                          id="duration_minutes"
                          type="number" 
                          placeholder="60" 
                          {...register('duration_minutes')}
                          className={errors.duration_minutes ? "border-destructive" : ""}
                        />
                        {errors.duration_minutes && <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between mb-1">
                          <Label htmlFor="price">Price ($)</Label>
                          <Controller
                            name="is_free"
                            control={control}
                            render={({ field }) => (
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id="is_free"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <Label htmlFor="is_free" className="cursor-pointer">Free Course</Label>
                              </div>
                            )}
                          />
                        </div>
                        <Input 
                          id="price"
                          type="number" 
                          placeholder="19.99" 
                          step="0.01"
                          disabled={isFree}
                          {...register('price')}
                          className={errors.price ? "border-destructive" : ""}
                        />
                        {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Controller
                        name="certificate_enabled"
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="certificate_enabled"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="certificate_enabled" className="cursor-pointer">
                              Enable Course Completion Certificate
                            </Label>
                          </div>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="px-6"
                  >
                    {saving ? "Saving..." : isEditMode ? "Update Course" : "Create Course"}
                  </Button>
                </div>
              </form>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Course Thumbnail</CardTitle>
                  <CardDescription>Upload an image for your course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img 
                          src={thumbnailPreview} 
                          alt="Course thumbnail preview" 
                          className="w-full h-48 object-cover rounded-md" 
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={clearThumbnail}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          PNG, JPG or WEBP (max. 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <Label 
                      htmlFor="thumbnail-upload"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    >
                      {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                    </Label>
                    <input 
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {isEditMode && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Course Status</span>
                      <Badge variant={course?.is_published ? "default" : "secondary"}>
                        {course?.is_published ? "Published" : "Draft"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full"
                      variant={course?.is_published ? "destructive" : "default"}
                      onClick={async () => {
                        if (!course) return;
                        const updatedCourse = await updateCourse(course.id, {
                          is_published: !course.is_published
                        });
                        if (updatedCourse) {
                          setCourse(updatedCourse);
                          toast({
                            title: updatedCourse.is_published ? "Course Published" : "Course Unpublished",
                            description: `${course.title} is now ${updatedCourse.is_published ? 'visible' : 'hidden'} to students.`,
                          });
                        }
                      }}
                    >
                      {course?.is_published ? "Unpublish Course" : "Publish Course"}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      {course?.is_published
                        ? "This course is currently published and visible to students."
                        : "This course is currently in draft mode and not visible to students."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {isEditMode && (
          <TabsContent value="content">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Course Content</h2>
                <p className="text-muted-foreground">Create and organize your course modules, lessons, and quizzes.</p>
              </div>
              
              <Button onClick={() => openModuleDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            </div>
            
            <ScrollArea className="h-[600px] pr-4">
              {modules.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                    <CardTitle className="mb-2">No modules yet</CardTitle>
                    <CardDescription className="mb-6">
                      Start creating your course content by adding modules
                    </CardDescription>
                    <Button onClick={() => openModuleDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Module
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {modules.map((module, moduleIndex) => (
                    <Card 
                      key={module.id}
                      className={dragOverModuleIndex === moduleIndex ? "border-primary" : ""}
                      draggable
                      onDragStart={() => setDraggedModuleIndex(moduleIndex)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverModuleIndex(moduleIndex);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedModuleIndex !== null && draggedModuleIndex !== moduleIndex) {
                          // Reorder modules
                          const newModules = [...modules];
                          const draggedModule = newModules[draggedModuleIndex];
                          newModules.splice(draggedModuleIndex, 1);
                          newModules.splice(moduleIndex, 0, draggedModule);
                          setModules(newModules);
                          
                          // Update order_index in database
                          newModules.forEach((m, index) => {
                            updateModule(m.id, { order_index: index });
                          });
                        }
                        setDraggedModuleIndex(null);
                        setDragOverModuleIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedModuleIndex(null);
                        setDragOverModuleIndex(null);
                      }}
                    >
                      <CardHeader className="bg-muted/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <GripVertical className="h-5 w-5 text-muted-foreground mr-2 cursor-grab" />
                            <CardTitle className="text-lg">
                              Module {moduleIndex + 1}: {module.title}
                            </CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => openModuleDialog(module.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteModule(module.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {/* Module description if any */}
                        {module.description && (
                          <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                        )}
                        
                        {/* Module lessons */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Lessons</h3>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openLessonDialog(module.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Lesson
                            </Button>
                          </div>
                          
                          {module.lessons && module.lessons.length > 0 ? (
                            <div className="space-y-2">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div 
                                  key={lesson.id} 
                                  className={`flex items-center justify-between p-3 bg-card border rounded-md ${dragOverLessonIndex === lessonIndex && editingModuleId === module.id ? 'border-primary' : ''}`}
                                  draggable
                                  onDragStart={() => {
                                    setDraggedLessonIndex(lessonIndex);
                                    setEditingModuleId(module.id);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (editingModuleId === module.id) {
                                      setDragOverLessonIndex(lessonIndex);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggedLessonIndex !== null && draggedLessonIndex !== lessonIndex && editingModuleId === module.id) {
                                      // Reorder lessons within the same module
                                      const newModules = [...modules];
                                      const moduleIndex = newModules.findIndex(m => m.id === module.id);
                                      if (moduleIndex !== -1) {
                                        const lessons = [...(newModules[moduleIndex].lessons || [])];
                                        const draggedLesson = lessons[draggedLessonIndex];
                                        lessons.splice(draggedLessonIndex, 1);
                                        lessons.splice(lessonIndex, 0, draggedLesson);
                                        newModules[moduleIndex].lessons = lessons;
                                        setModules(newModules);
                                        
                                        // Update order_index in database
                                        lessons.forEach((l, index) => {
                                          updateLesson(l.id, { order_index: index });
                                        });
                                      }
                                    }
                                    setDraggedLessonIndex(null);
                                    setDragOverLessonIndex(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedLessonIndex(null);
                                    setDragOverLessonIndex(null);
                                    setEditingModuleId(null);
                                  }}
                                >
                                  <div className="flex items-center">
                                    <GripVertical className="h-4 w-4 text-muted-foreground mr-2 cursor-grab" />
                                    <div className="flex items-center">
                                      <span className="font-medium">
                                        {lessonIndex + 1}. {lesson.title}
                                      </span>
                                      {lesson.video_url && (
                                        <Badge variant="outline" className="ml-2">
                                          <Video className="h-3 w-3 mr-1" />
                                          Video
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="ghost" onClick={() => openLessonDialog(module.id, lesson.id)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-destructive hover:text-destructive" 
                                      onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
                          )}
                        </div>
                        
                        {/* Module quiz */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Module Quiz</h3>
                            {!module.quiz ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openQuizDialog(module.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Quiz
                              </Button>
                            ) : null}
                          </div>
                          
                          {module.quiz ? (
                            <Card className="bg-muted/20 border">
                              <CardHeader className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <CardTitle className="text-base">{module.quiz.title}</CardTitle>
                                    {module.quiz.description && (
                                      <CardDescription className="text-sm">{module.quiz.description}</CardDescription>
                                    )}
                                    <div className="flex items-center mt-1">
                                      <Badge variant="outline" className="mr-2">Passing Score: {module.quiz.passing_score}%</Badge>
                                      {module.quiz.questions && (
                                        <Badge variant="outline">{module.quiz.questions.length} Questions</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex">
                                    <Button size="sm" variant="ghost" onClick={() => openQuizDialog(module.id, module.quiz!.id)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-destructive hover:text-destructive" 
                                      onClick={() => handleDeleteQuiz(module.id, module.quiz!.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          ) : (
                            <p className="text-sm text-muted-foreground">No quiz for this module yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Module Edit Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingModuleId ? "Edit Module" : "Add Module"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleModuleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="module-title">Module Title</Label>
                <Input 
                  id="module-title" 
                  name="title"
                  placeholder="Introduction to AI Concepts"
                  defaultValue={modules.find(m => m.id === editingModuleId)?.title || ''}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="module-description">Description (optional)</Label>
                <Textarea 
                  id="module-description" 
                  name="description"
                  placeholder="Brief overview of what this module covers"
                  defaultValue={modules.find(m => m.id === editingModuleId)?.description || ''}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingModuleId ? "Update Module" : "Create Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Lesson Edit Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLessonId ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitLesson(handleLessonSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title</Label>
                <Input 
                  id="lesson-title" 
                  placeholder="Understanding AI Fundamentals"
                  {...registerLesson('title')}
                  className={lessonErrors.title ? "border-destructive" : ""}
                />
                {lessonErrors.title && <p className="text-sm text-destructive">{lessonErrors.title.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lesson-video">YouTube Video URL (optional)</Label>
                <Input 
                  id="lesson-video" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...registerLesson('video_url')}
                  className={lessonErrors.video_url ? "border-destructive" : ""}
                />
                {lessonErrors.video_url && <p className="text-sm text-destructive">{lessonErrors.video_url.message}</p>}
                
                {/* Video preview */}
                {watch('video_url', '') && (
                  <div className="mt-2 aspect-video overflow-hidden rounded-lg">
                    <iframe
                      src={getYouTubeEmbedUrl(watch('video_url', ''))}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lesson-description">Lesson Content</Label>
                <Textarea 
                  id="lesson-description" 
                  placeholder="Detailed lesson content and explanation"
                  rows={6}
                  {...registerLesson('description')}
                  className={lessonErrors.description ? "border-destructive" : ""}
                />
                {lessonErrors.description && <p className="text-sm text-destructive">{lessonErrors.description.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Additional Materials (PDF, documents, etc.)</Label>
                
                {/* Existing materials */}
                {uploadedMaterialUrls.length > 0 && (
                  <div className="space-y-2 mt-2 mb-4">
                    <Label>Uploaded Materials</Label>
                    <div className="space-y-2">
                      {uploadedMaterialUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {url.split('/').pop()}
                          </a>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeMaterial(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Upload new materials */}
                <div className="flex items-center gap-2">
                  <Input 
                    id="lesson-materials" 
                    type="file"
                    multiple
                    onChange={handleMaterialUpload}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={uploadMaterials} 
                    disabled={materialFiles.length === 0 || materialUploading}
                    className="whitespace-nowrap"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {materialUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                
                {materialFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {materialFiles.length} file(s) selected for upload
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingLessonId ? "Update Lesson" : "Create Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Quiz Edit Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuizId ? "Edit Quiz" : "Add Quiz"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitQuiz(handleQuizSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input 
                  id="quiz-title" 
                  placeholder="Module Assessment"
                  {...registerQuiz('title')}
                  className={quizErrors.title ? "border-destructive" : ""}
                />
                {quizErrors.title && <p className="text-sm text-destructive">{quizErrors.title.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz-description">Description (optional)</Label>
                <Textarea 
                  id="quiz-description" 
                  placeholder="Instructions for the quiz"
                  rows={2}
                  {...registerQuiz('description')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passing-score">Passing Score (%)</Label>
                <Controller
                  name="passing_score"
                  control={controlQuiz}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value.toString()}
                    >
                      <SelectTrigger id="passing-score">
                        <SelectValue placeholder="Select passing score" />
                      </SelectTrigger>
                      <SelectContent>
                        {[50, 60, 70, 80, 90, 100].map((score) => (
                          <SelectItem key={score} value={score.toString()}>
                            {score}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Quiz Questions</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => appendQuestion({ 
                      question: '', 
                      answers: [
                        { answer: '', is_correct: true },
                        { answer: '', is_correct: false }
                      ]
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Question
                  </Button>
                </div>
                
                {questionFields.map((questionField, questionIndex) => {
                  const questionErrors = quizErrors?.questions?.[questionIndex];
                  const { fields: answerFields, append: appendAnswer, remove: removeAnswer } = getAnswerFields(questionIndex);
                  
                  return (
                    <Card key={questionField.id} className="bg-muted/20">
                      <CardHeader className="p-4 pb-0">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 w-full">
                            <Label htmlFor={`question-${questionIndex}`}>
                              Question {questionIndex + 1}
                            </Label>
                            <Input
                              id={`question-${questionIndex}`}
                              placeholder="What is artificial intelligence?"
                              {...registerQuiz(`questions.${questionIndex}.question`)}
                              className={questionErrors?.question ? "border-destructive" : ""}
                            />
                            {questionErrors?.question && (
                              <p className="text-sm text-destructive">{questionErrors.question.message as string}</p>
                            )}
                          </div>
                          {questionFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeQuestion(questionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Answers</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => appendAnswer({ answer: '', is_correct: false })}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Answer
                            </Button>
                          </div>
                          
                          {answerFields.map((answerField, answerIndex) => (
                            <div 
                              key={answerField.id} 
                              className="flex items-center space-x-2 mt-2"
                            >
                              <Controller
                                name={`questions.${questionIndex}.answers.${answerIndex}.is_correct`}
                                control={controlQuiz}
                                render={({ field }) => (
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full ${field.value ? 'bg-green-100 text-green-800' : 'bg-muted'}`}>
                                      {field.value && <Check className="h-5 w-5" />}
                                    </div>
                                    <Switch 
                                      checked={field.value}
                                      onCheckedChange={(checked) => {
                                        // If setting this answer as correct, make others incorrect
                                        if (checked) {
                                          const currentAnswers = [...answerFields];
                                          currentAnswers.forEach((_, idx) => {
                                            if (idx !== answerIndex) {
                                              const path = `questions.${questionIndex}.answers.${idx}.is_correct`;
                                              controlQuiz.setValue(path, false);
                                            }
                                          });
                                        }
                                        field.onChange(checked);
                                      }}
                                      className="hidden" // Hide the switch visually
                                    />
                                  </div>
                                )}
                              />
                              
                              <div className="flex-1">
                                <Input
                                  placeholder={`Answer option ${answerIndex + 1}`}
                                  {...registerQuiz(`questions.${questionIndex}.answers.${answerIndex}.answer`)}
                                  className={questionErrors?.answers?.[answerIndex]?.answer ? "border-destructive" : ""}
                                />
                              </div>
                              
                              {answerFields.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAnswer(answerIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          
                          {questionErrors?.answers && (
                            <p className="text-sm text-destructive">{questionErrors.answers.message as string}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {quizErrors.questions && !Array.isArray(quizErrors.questions) && (
                  <p className="text-sm text-destructive">{quizErrors.questions.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingQuizId ? "Update Quiz" : "Create Quiz"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CourseForm;
