import React, { useState, useEffect, useLocation } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, X, ChevronUp, ChevronDown, Save, ArrowLeft } from 'lucide-react';
import { 
  Course, 
  CourseModule,
  Lesson,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  createCourse,
  updateCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  createQuizQuestion,
  createQuizAnswer,
  uploadCourseThumbnail,
  fetchCourseWithModulesAndLessons
} from '@/services/courseService';
import { toast } from '@/hooks/use-toast';

// Define the form types
type CourseFormValues = {
  title?: string;
  summary?: string;
  description?: string;
  category?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes?: number;
  is_free?: boolean;
  price?: number;
  certificate_enabled?: boolean;
};

type ModuleFormValues = {
  title?: string;
  description?: string;
};

type LessonFormValues = {
  title?: string;
  description?: string;
  video_url?: string;
};

type QuizFormValues = {
  title?: string;
  description?: string;
  passing_score?: number;
  questions?: {
    question?: string;
    answers?: {
      answer?: string;
      is_correct?: boolean;
    }[];
  }[];
};

const CourseForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = !!courseId;
  const location = useLocation();
  
  // Check if we need to navigate to content tab directly
  const initialTab = location.hash === '#content' ? 'content' : 'details';

  // Course form state
  const courseForm = useForm<CourseFormValues>({
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      category: '',
      difficulty_level: 'beginner',
      duration_minutes: 0,
      is_free: true,
      price: 0,
      certificate_enabled: false
    }
  });

  // Module state
  const [modules, setModules] = useState<(CourseModule & { expanded?: boolean; lessons?: Lesson[]; quiz?: Quiz | null })[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'details' | 'content'>(initialTab as 'details' | 'content');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Module form
  const moduleForm = useForm<ModuleFormValues>({
    defaultValues: {
      title: '',
      description: ''
    }
  });

  // Lesson form
  const lessonForm = useForm<LessonFormValues>({
    defaultValues: {
      title: '',
      description: '',
      video_url: ''
    }
  });

  // Quiz form
  const quizForm = useForm<QuizFormValues>({
    defaultValues: {
      title: '',
      description: '',
      passing_score: 70,
      questions: [
        {
          question: '',
          answers: [
            { answer: '', is_correct: false },
            { answer: '', is_correct: false },
            { answer: '', is_correct: false },
            { answer: '', is_correct: false }
          ]
        }
      ]
    }
  });
  
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: quizForm.control,
    name: 'questions'
  });

  // Function to handle answer fields for each question
  const getAnswerFields = (questionIndex: number) => {
    return useFieldArray({
      control: quizForm.control,
      name: `questions.${questionIndex}.answers`
    });
  };

  // Load course data if in edit mode
  useEffect(() => {
    if (courseId) {
      // Fetch course data
      const loadCourse = async () => {
        try {
          const course = await fetchCourseWithModulesAndLessons(courseId);
          if (course) {
            // Set course form values
            courseForm.reset({
              title: course.title,
              summary: course.summary,
              description: course.description,
              category: course.category,
              difficulty_level: course.difficulty_level,
              duration_minutes: course.duration_minutes,
              is_free: course.is_free ?? true,
              price: course.price ?? 0,
              certificate_enabled: course.certificate_enabled ?? false
            });

            // Set thumbnail preview if exists
            if (course.thumbnail_url) {
              setThumbnailPreview(course.thumbnail_url);
            }

            // Set modules with expanded state
            if (course.modules) {
              const formattedModules = course.modules.map(module => ({
                ...module,
                expanded: false
              }));
              
              setModules(formattedModules);
              
              // Set first module as active if exists
              if (formattedModules.length > 0) {
                setActiveModuleId(formattedModules[0].id);
              }
            }
            
            // If location hash is #content, switch to content tab
            if (location.hash === '#content') {
              setCurrentTab('content');
            }
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load course data',
            variant: 'destructive'
          });
          console.error('Error loading course:', error);
        }
      };

      loadCourse();
    }
  }, [courseId, location.hash]);

  // Handle thumbnail change
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  // Handle course form submission
  const handleCourseSubmit = async (data: CourseFormValues) => {
    try {
      setIsSubmitting(true);
      
      let courseData: Partial<Course> = {
        ...data,
        is_published: false // Default to unpublished when creating/saving
      };
      
      let savedCourse: Course | null;
      
      if (isEditMode && courseId) {
        // Update existing course
        savedCourse = await updateCourse(courseId, courseData);
      } else {
        // Create new course
        savedCourse = await createCourse(courseData);
      }
      
      if (!savedCourse) {
        throw new Error('Failed to save course');
      }
      
      // Upload thumbnail if selected
      if (thumbnailFile && savedCourse.id) {
        const thumbnailUrl = await uploadCourseThumbnail(thumbnailFile, savedCourse.id);
        if (thumbnailUrl) {
          // Update course with thumbnail URL
          await updateCourse(savedCourse.id, { thumbnail_url: thumbnailUrl });
        }
      }
      
      toast({
        title: 'Success',
        description: isEditMode ? 'Course updated successfully' : 'Course created successfully',
      });
      
      // If creating a new course, navigate to edit mode to add modules
      if (!isEditMode && savedCourse.id) {
        navigate(`/admin/courses/edit/${savedCourse.id}`);
      }
      
      setCurrentTab('content');
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle module form submission
  const handleAddModule = async (data: ModuleFormValues) => {
    try {
      if (!courseId) {
        toast({
          title: 'Error',
          description: 'Please save the course details first',
          variant: 'destructive',
        });
        return;
      }
      
      // Calculate the next order index
      const orderIndex = modules.length;
      
      const newModule = await createModule({
        course_id: courseId,
        title: data.title || '',
        description: data.description,
        order_index: orderIndex
      });
      
      if (newModule) {
        // Add to modules list with expanded state
        setModules(prev => [...prev, { ...newModule, expanded: true, lessons: [] }]);
        
        // Set as active module
        setActiveModuleId(newModule.id);
        
        // Reset module form
        moduleForm.reset();
        
        toast({
          title: 'Success',
          description: 'Module added successfully',
        });
      } else {
        // Show error toast if module creation failed
        toast({
          title: 'Error',
          description: 'Failed to create module. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding module:', error);
      toast({
        title: 'Error',
        description: 'Failed to add module',
        variant: 'destructive',
      });
    }
  };

  // Handle module update
  const handleUpdateModule = async (moduleId: string, data: ModuleFormValues) => {
    try {
      const updatedModule = await updateModule(moduleId, {
        title: data.title || '',
        description: data.description
      });
      
      if (updatedModule) {
        // Update modules list
        setModules(prev => prev.map(m => 
          m.id === moduleId ? { ...m, ...updatedModule } : m
        ));
        
        toast({
          title: 'Success',
          description: 'Module updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module',
        variant: 'destructive',
      });
    }
  };

  // Handle module delete
  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Are you sure you want to delete this module? This will also delete all lessons and quizzes within this module.')) {
      try {
        const success = await deleteModule(moduleId);
        
        if (success) {
          // Remove from modules list
          setModules(prev => prev.filter(m => m.id !== moduleId));
          
          // If active module is deleted, set next available module as active
          if (activeModuleId === moduleId) {
            const remainingModules = modules.filter(m => m.id !== moduleId);
            setActiveModuleId(remainingModules.length > 0 ? remainingModules[0].id : null);
          }
          
          toast({
            title: 'Success',
            description: 'Module deleted successfully',
          });
        }
      } catch (error) {
        console.error('Error deleting module:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete module',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle lesson form submission
  const handleAddLesson = async (data: LessonFormValues) => {
    try {
      if (!activeModuleId) {
        toast({
          title: 'Error',
          description: 'Please select a module first',
          variant: 'destructive',
        });
        return;
      }
      
      // Find active module
      const activeModule = modules.find(m => m.id === activeModuleId);
      
      if (!activeModule) {
        throw new Error('Selected module not found');
      }
      
      // Calculate order index
      const orderIndex = activeModule.lessons?.length || 0;
      
      const newLesson = await createLesson({
        module_id: activeModuleId,
        title: data.title || '',
        description: data.description,
        video_url: data.video_url,
        order_index: orderIndex
      });
      
      if (newLesson) {
        // Update modules with new lesson
        setModules(prev => prev.map(m => {
          if (m.id === activeModuleId) {
            const updatedLessons = [...(m.lessons || []), newLesson];
            return {
              ...m,
              lessons: updatedLessons
            };
          }
          return m;
        }));
        
        // Reset lesson form
        lessonForm.reset();
        
        toast({
          title: 'Success',
          description: 'Lesson added successfully',
        });
      }
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to add lesson',
        variant: 'destructive',
      });
    }
  };

  // Fix the issue with the lessonForm and video_url
  const handleLessonSubmit = (data: LessonFormValues) => {
    handleAddLesson(data);
  };

  // Handle lesson update
  const handleUpdateLesson = async (lessonId: string, data: LessonFormValues) => {
    try {
      const updatedLesson = await updateLesson(lessonId, {
        title: data.title || '',
        description: data.description,
        video_url: data.video_url
      });
      
      if (updatedLesson) {
        // Update modules with updated lesson
        setModules(prev => prev.map(m => {
          if (m.lessons && m.lessons.some(l => l.id === lessonId)) {
            const updatedLessons = m.lessons.map(l => 
              l.id === lessonId ? { ...l, ...updatedLesson } : l
            );
            return {
              ...m,
              lessons: updatedLessons
            };
          }
          return m;
        }));
        
        toast({
          title: 'Success',
          description: 'Lesson updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson',
        variant: 'destructive',
      });
    }
  };

  // Handle lesson delete
  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        const success = await deleteLesson(lessonId);
        
        if (success) {
          // Update modules by removing lesson
          setModules(prev => prev.map(m => {
            if (m.lessons && m.lessons.some(l => l.id === lessonId)) {
              const updatedLessons = m.lessons.filter(l => l.id !== lessonId);
              return {
                ...m,
                lessons: updatedLessons
              };
            }
            return m;
          }));
          
          toast({
            title: 'Success',
            description: 'Lesson deleted successfully',
          });
        }
      } catch (error) {
        console.error('Error deleting lesson:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete lesson',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle quiz form submission
  const handleAddQuiz = async (data: QuizFormValues) => {
    try {
      if (!activeModuleId) {
        toast({
          title: 'Error',
          description: 'Please select a module first',
          variant: 'destructive',
        });
        return;
      }
      
      // First create the quiz
      const newQuiz = await createQuiz({
        module_id: activeModuleId,
        title: data.title || '',
        description: data.description,
        passing_score: data.passing_score || 70
      });
      
      if (!newQuiz) {
        throw new Error('Failed to create quiz');
      }
      
      // Then create questions and answers
      if (data.questions && data.questions.length > 0) {
        for (const [qIndex, questionData] of data.questions.entries()) {
          if (questionData.question) {
            const newQuestion = await createQuizQuestion({
              quiz_id: newQuiz.id,
              question: questionData.question,
              order_index: qIndex
            });
            
            if (newQuestion && questionData.answers) {
              // Create answers for this question
              for (const [aIndex, answerData] of questionData.answers.entries()) {
                if (answerData.answer) {
                  await createQuizAnswer({
                    question_id: newQuestion.id,
                    answer: answerData.answer,
                    is_correct: answerData.is_correct || false,
                    order_index: aIndex
                  });
                }
              }
            }
          }
        }
      }
      
      // Update module with new quiz
      setModules(prev => prev.map(m => {
        if (m.id === activeModuleId) {
          return {
            ...m,
            quiz: newQuiz
          };
        }
        return m;
      }));
      
      // Reset quiz form
      quizForm.reset({
        title: '',
        description: '',
        passing_score: 70,
        questions: [
          {
            question: '',
            answers: [
              { answer: '', is_correct: false },
              { answer: '', is_correct: false },
              { answer: '', is_correct: false },
              { answer: '', is_correct: false }
            ]
          }
        ]
      });
      
      toast({
        title: 'Success',
        description: 'Quiz added successfully',
      });
    } catch (error) {
      console.error('Error adding quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to add quiz',
        variant: 'destructive',
      });
    }
  };

  // Handle quiz update
  const handleUpdateQuiz = async (quizId: string, data: QuizFormValues) => {
    try {
      // Update quiz basic info
      const updatedQuiz = await updateQuiz(quizId, {
        title: data.title || '',
        description: data.description,
        passing_score: data.passing_score || 70
      });
      
      if (updatedQuiz) {
        // For simplicity in this example, we're not updating questions/answers
        // In a real app, you'd need to handle updating/creating/deleting questions and answers
        
        // Update modules with updated quiz
        setModules(prev => prev.map(m => {
          if (m.quiz && m.quiz.id === quizId) {
            return {
              ...m,
              quiz: {
                ...m.quiz,
                ...updatedQuiz
              }
            };
          }
          return m;
        }));
        
        toast({
          title: 'Success',
          description: 'Quiz updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quiz',
        variant: 'destructive',
      });
    }
  };

  // Handle quiz delete
  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      try {
        const success = await deleteQuiz(quizId);
        
        if (success) {
          // Update modules by removing quiz
          setModules(prev => prev.map(m => {
            if (m.quiz && m.quiz.id === quizId) {
              return {
                ...m,
                quiz: null
              };
            }
            return m;
          }));
          
          toast({
            title: 'Success',
            description: 'Quiz deleted successfully',
          });
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete quiz',
          variant: 'destructive',
        });
      }
    }
  };

  // Add/remove answer field for a question
  const handleAddAnswer = (questionIndex: number) => {
    const answerFields = getAnswerFields(questionIndex);
    answerFields.append({ answer: '', is_correct: false });
  };

  const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
    const answerFields = getAnswerFields(questionIndex);
    answerFields.remove(answerIndex);
  };

  // Toggle module expansion
  const toggleModuleExpansion = (moduleId: string) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, expanded: !m.expanded } : m
    ));
  };

  // Set active module
  const handleModuleSelect = (moduleId: string) => {
    setActiveModuleId(moduleId);
  };

  // Handle module reordering
  const moveModuleUp = async (index: number) => {
    if (index === 0) return;
    
    try {
      const moduleToMove = modules[index];
      const moduleAbove = modules[index - 1];
      
      // Update order in backend
      await updateModule(moduleToMove.id, { order_index: index - 1 });
      await updateModule(moduleAbove.id, { order_index: index });
      
      // Update local state
      setModules(prev => {
        const newModules = [...prev];
        [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
        return newModules;
      });
    } catch (error) {
      console.error('Error moving module:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder modules',
        variant: 'destructive',
      });
    }
  };

  const moveModuleDown = async (index: number) => {
    if (index >= modules.length - 1) return;
    
    try {
      const moduleToMove = modules[index];
      const moduleBelow = modules[index + 1];
      
      // Update order in backend
      await updateModule(moduleToMove.id, { order_index: index + 1 });
      await updateModule(moduleBelow.id, { order_index: index });
      
      // Update local state
      setModules(prev => {
        const newModules = [...prev];
        [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
        return newModules;
      });
    } catch (error) {
      console.error('Error moving module:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder modules',
        variant: 'destructive',
      });
    }
  };

  // Publish course
  const handlePublishCourse = async () => {
    try {
      if (!courseId) {
        toast({
          title: 'Error',
          description: 'Please save the course details first',
          variant: 'destructive',
        });
        return;
      }
      
      await updateCourse(courseId, { is_published: true });
      
      toast({
        title: 'Success',
        description: 'Course published successfully',
      });
    } catch (error) {
      console.error('Error publishing course:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish course',
        variant: 'destructive',
      });
    }
  };

  // Find the active module
  const activeModule = activeModuleId 
    ? modules.find(m => m.id === activeModuleId) 
    : null;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/courses')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'details' | 'content')}>
        <TabsList className="mb-8">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="content" disabled={!isEditMode}>Course Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={courseForm.handleSubmit(handleCourseSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Course Title</Label>
                      <Input 
                        id="title"
                        type="text"
                        {...courseForm.register('title')}
                        placeholder="Enter course title"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="summary">Summary</Label>
                      <Textarea 
                        id="summary"
                        {...courseForm.register('summary')}
                        placeholder="Brief course summary"
                        className="min-h-[80px] mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input 
                        id="category"
                        type="text"
                        {...courseForm.register('category')}
                        placeholder="Course category"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Controller
                        control={courseForm.control}
                        name="difficulty_level"
                        render={({ field }) => (
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="mt-1">
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
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input 
                        id="duration"
                        type="number"
                        min="0"
                        {...courseForm.register('duration_minutes', { valueAsNumber: true })}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="description">Course Description</Label>
                      <Textarea 
                        id="description"
                        {...courseForm.register('description')}
                        placeholder="Detailed course description"
                        className="min-h-[200px] mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="thumbnail">Course Thumbnail</Label>
                      <div className="mt-2">
                        <Input 
                          id="thumbnail"
                          type="file"
                          onChange={handleThumbnailChange}
                          accept="image/*"
                          className="mt-1"
                        />
                      </div>
                      
                      {thumbnailPreview && (
                        <div className="mt-4">
                          <img 
                            src={thumbnailPreview} 
                            alt="Thumbnail preview" 
                            className="object-cover h-[200px] w-full rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Course Settings</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      control={courseForm.control}
                      name="is_free"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="is-free"
                        />
                      )}
                    />
                    <Label htmlFor="is-free">Free Course</Label>
                  </div>
                  
                  {!courseForm.watch('is_free') && (
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input 
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        {...courseForm.register('price', { valueAsNumber: true })}
                        placeholder="0.00"
                        className="mt-1 max-w-[200px]"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      control={courseForm.control}
                      name="certificate_enabled"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="cert-enabled"
                        />
                      )}
                    />
                    <Label htmlFor="cert-enabled">Enable Certificate</Label>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/admin/courses')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Course Details'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Course Structure</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <form 
                  onSubmit={moduleForm.handleSubmit(handleAddModule)} 
                  className="mb-6 px-2"
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="module-title">Module Title</Label>
                      <Input 
                        id="module-title"
                        {...moduleForm.register('title')}
                        placeholder="Module title"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="module-description">Description (optional)</Label>
                      <Textarea 
                        id="module-description"
                        {...moduleForm.register('description')}
                        placeholder="Brief description"
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </form>
                
                <Separator className="mb-6" />
                
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  {modules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No modules added yet
                    </div>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {modules.map((module, index) => (
                        <AccordionItem 
                          key={module.id} 
                          value={module.id}
                          className={`border rounded-md mb-2 ${activeModuleId === module.id ? 'border-primary' : ''}`}
                        >
                          <div className="flex items-center p-2">
                            <div className="flex-1 truncate">
                              <AccordionTrigger className={`hover:no-underline py-0 ${activeModuleId === module.id ? 'font-medium text-primary' : ''}`}>
                                {module.title}
                              </AccordionTrigger>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModuleSelect(module.id);
                                }}
                                className="h-8 w-8"
                              >
                                <span className="sr-only">Select module</span>
                                {activeModuleId === module.id ? (
                                  <div className="h-2 w-2 bg-primary rounded-full" />
                                ) : (
                                  <div className="h-2 w-2 border rounded-full" />
                                )}
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveModuleUp(index);
                                }}
                                className="h-8 w-8"
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                                <span className="sr-only">Move up</span>
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveModuleDown(index);
                                }}
                                className="h-8 w-8"
                                disabled={index === modules.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">Move down</span>
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModule(module.id);
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Delete module</span>
                              </Button>
                            </div>
                          </div>
                          
                          <AccordionContent className="px-4 pb-2">
                            {module.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {module.description}
                              </p>
                            )}
                            
                            <div className="text-xs text-muted-foreground">
                              <p>Lessons: {module.lessons?.length || 0}</p>
                              <p>Quiz: {module.quiz ? 'Yes' : 'No'}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
                
                <Separator className="my-6" />
                
                <div className="px-2">
                  <Button 
                    onClick={handlePublishCourse}
                    className="w-full"
                    disabled={!isEditMode || modules.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Publish Course
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {activeModule ? `${activeModule.title} Content` : 'Select a Module'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!activeModule ? (
                  <div className="text-center py-12 text-gray-500">
                    <h3 className="text-lg font-medium">No Module Selected</h3>
                    <p className="mt-2">Select a module from the sidebar or create a new one</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Lessons</h3>
                      
                      {(activeModule.lessons?.length || 0) > 0 ? (
                        <div className="space-y-4">
                          {activeModule.lessons?.map((lesson, idx) => (
                            <Card key={lesson.id} className="overflow-hidden">
                              <div className="bg-muted p-4">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">
                                    Lesson {idx + 1}: {lesson.title}
                                  </h4>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Delete lesson</span>
                                    </Button>
                                  </div>
                                </div>
                                
                                {lesson.description && (
                                  <p className="text-sm mt-2">{lesson.description}</p>
                                )}
                                
                                {lesson.video_url && (
                                  <div className="mt-4">
                                    <Label>Video URL:</Label>
                                    <p className="text-sm text-blue-600 truncate">
                                      {lesson.video_url}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border rounded-md">
                          <p className="text-muted-foreground">No lessons added yet</p>
                        </div>
                      )}
                      
                      <div className="mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Add Lesson</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={lessonForm.handleSubmit(handleLessonSubmit)} className="space-y-4">
                              <div>
                                <Label htmlFor="lesson-title">Title</Label>
                                <Input 
                                  id="lesson-title"
                                  {...lessonForm.register('title')}
                                  placeholder="Lesson title"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="lesson-description">Description (optional)</Label>
                                <Textarea 
                                  id="lesson-description"
                                  {...lessonForm.register('description')}
                                  placeholder="Lesson description"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="video-url">Video URL (optional)</Label>
                                <Input 
                                  id="video-url"
                                  {...lessonForm.register('video_url')}
                                  placeholder="YouTube or other video URL"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex justify-end">
                                <Button type="submit">
                                  Add Lesson
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Quiz</h3>
                      
                      {activeModule.quiz ? (
                        <Card>
                          <CardHeader className="bg-muted">
                            <div className="flex justify-between items-center">
                              <CardTitle>{activeModule.quiz.title}</CardTitle>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteQuiz(activeModule.quiz!.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Delete quiz</span>
                              </Button>
                            </div>
                            
                            {activeModule.quiz.description && (
                              <p className="text-sm">{activeModule.quiz.description}</p>
                            )}
                            
                            <p className="text-sm">Passing Score: {activeModule.quiz.passing_score}%</p>
                          </CardHeader>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle>Add Quiz</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={quizForm.handleSubmit(handleAddQuiz)} className="space-y-6">
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="quiz-title">Quiz Title</Label>
                                  <Input 
                                    id="quiz-title"
                                    {...quizForm.register('title')}
                                    placeholder="Quiz title"
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="quiz-description">Description (optional)</Label>
                                  <Textarea 
                                    id="quiz-description"
                                    {...quizForm.register('description')}
                                    placeholder="Quiz description"
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="passing-score">Passing Score (%)</Label>
                                  <Input 
                                    id="passing-score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    {...quizForm.register('passing_score', { valueAsNumber: true })}
                                    placeholder="70"
                                    className="mt-1 max-w-[100px]"
                                  />
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-medium">Questions</h4>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => appendQuestion({
                                      question: '',
                                      answers: [
                                        { answer: '', is_correct: false },
                                        { answer: '', is_correct: false },
                                        { answer: '', is_correct: false },
                                        { answer: '', is_correct: false }
                                      ]
                                    })}
                                    size="sm"
                                  >
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Question
                                  </Button>
                                </div>
                                
                                {questionFields.map((field, qIndex) => {
                                  const answerFields = getAnswerFields(qIndex);
                                  
                                  return (
                                    <div 
                                      key={field.id} 
                                      className="border rounded-md p-4 mb-4"
                                    >
                                      <div className="flex justify-between items-start">
                                        <h5 className="font-medium">Question {qIndex + 1}</h5>
                                        
                                        {questionFields.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                          >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove question</span>
                                          </Button>
                                        )}
                                      </div>
                                      
                                      <div className="mt-2">
                                        <Input 
                                          {...quizForm.register(`questions.${qIndex}.question`)}
                                          placeholder="Enter your question"
                                        />
                                      </div>
                                      
                                      <div className="mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <h6 className="text-sm font-medium">Answer Options</h6>
                                          
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleAddAnswer(qIndex)}
                                            className="h-7 text-xs"
                                          >
                                            Add Option
                                          </Button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          {answerFields.fields.map((answerField, aIndex) => (
                                            <div 
                                              key={answerField.id}
                                              className="flex items-center space-x-2"
                                            >
                                              <Controller
                                                control={quizForm.control}
                                                name={`questions.${qIndex}.answers.${aIndex}.is_correct`}
                                                render={({ field }) => (
                                                  <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="h-4 w-4 text-primary rounded focus:ring-primary"
                                                  />
                                                )}
                                              />
                                              
                                              <Input 
                                                {...quizForm.register(`questions.${qIndex}.answers.${aIndex}.answer`)}
                                                placeholder="Answer option"
                                                className="flex-1"
                                              />
                                              
                                              {answerFields.fields.length > 2 && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => handleRemoveAnswer(qIndex, aIndex)}
                                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                  <X className="h-4 w-4" />
                                                  <span className="sr-only">Remove answer</span>
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="flex justify-end">
                                <Button type="submit">
                                  Add Quiz
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full text-right text-sm text-muted-foreground">
                  {activeModule && (
                    <p>Module ID: {activeModule.id}</p>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseForm;
