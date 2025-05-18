
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Upload, X, Trash2, Edit, Save, Move } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Course, CourseModule, Lesson, Quiz, createCourse, updateCourse, fetchCourseWithModulesAndLessons, createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson, uploadCourseThumbnail, createQuiz, createQuizQuestion, createQuizAnswer, updateQuiz } from '@/services/courseService';

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_minutes: z.number().min(1, 'Duration is required'),
  is_free: z.boolean().optional(),
  certificate_enabled: z.boolean().optional(),
  price: z.number().optional(),
});

// Define schema for module forms
const moduleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  description: z.string().optional(),
});

// Define schema for lesson forms
const lessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().optional(),
  video_url: z.string().optional(),
});

// Quiz schema
const quizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().optional(),
  passing_score: z.number().min(0).max(100).default(70),
  questions: z.array(
    z.object({
      question: z.string().min(1, 'Question text is required'),
      answers: z.array(
        z.object({
          answer: z.string().min(1, 'Answer text is required'),
          is_correct: z.boolean().default(false),
        })
      ).min(2, 'At least two answer options are required'),
    })
  ).min(1, 'At least one question is required'),
});

type CourseFormData = z.infer<typeof courseSchema>;
type ModuleFormData = z.infer<typeof moduleSchema>;
type LessonFormData = z.infer<typeof lessonSchema>;
type QuizFormData = z.infer<typeof quizSchema>;

const CourseForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const isEditing = !!courseId;

  // State for course data and UI controls
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);

  // Course form setup
  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    setValue: setValueCourse,
    getValues: getValuesCourse,
    watch: watchCourse,
    reset: resetCourse,
    formState: { errors: courseErrors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      category: '',
      difficulty_level: 'beginner',
      duration_minutes: 60,
      is_free: true,
      price: 0,
      certificate_enabled: false,
    },
  });

  // Module form setup
  const {
    register: registerModule,
    handleSubmit: handleSubmitModule,
    reset: resetModule,
    formState: { errors: moduleErrors },
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
  });

  // Lesson form setup
  const {
    register: registerLesson,
    handleSubmit: handleSubmitLesson,
    setValue: setValueLesson,
    watch: watchLesson,
    reset: resetLesson,
    formState: { errors: lessonErrors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  });
  
  // Quiz form setup
  const {
    register: registerQuiz,
    control: quizControl,
    handleSubmit: handleSubmitQuiz,
    reset: resetQuiz,
    formState: { errors: quizErrors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      passing_score: 70,
      questions: [
        {
          question: '',
          answers: [
            { answer: '', is_correct: true },
            { answer: '', is_correct: false },
          ],
        },
      ],
    },
  });

  // Set up field arrays for quiz questions and answers
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = 
    useFieldArray({
      control: quizControl,
      name: "questions",
    });

  // Watch the isFree field to conditionally show/hide the price field
  const isFree = watchCourse('is_free');
  
  // Watch the video URL field for embedding preview
  const videoUrl = watchLesson('video_url');

  // Function to extract YouTube video ID
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Check if a URL is a valid YouTube URL
  const isYoutubeUrl = (url: string) => {
    if (!url) return false;
    return !!getYoutubeVideoId(url);
  };

  // Load course data if in edit mode
  useEffect(() => {
    const loadCourse = async () => {
      if (courseId) {
        setLoading(true);
        try {
          const courseData = await fetchCourseWithModulesAndLessons(courseId);
          if (courseData) {
            // Set course form values
            resetCourse({
              title: courseData.title,
              summary: courseData.summary,
              description: courseData.description,
              category: courseData.category,
              difficulty_level: courseData.difficulty_level,
              duration_minutes: courseData.duration_minutes,
              is_free: courseData.is_free ?? true,
              price: courseData.price ?? 0,
              certificate_enabled: courseData.certificate_enabled ?? false,
            });
            
            // Set thumbnail preview if available
            if (courseData.thumbnail_url) {
              setThumbnailPreview(courseData.thumbnail_url);
            }
            
            // Set modules
            setModules(courseData.modules || []);
            
            // If we have modules, automatically show the modules tab
            if (courseData.modules && courseData.modules.length > 0) {
              setActiveTab('modules');
            }
          }
        } catch (error) {
          console.error('Error loading course:', error);
          toast({
            title: 'Error',
            description: 'Failed to load course data. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadCourse();
  }, [courseId, resetCourse]);

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle course form submission
  const onCourseSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      let thumbnailUrl = thumbnailPreview;
      
      // Upload thumbnail if file is selected
      if (thumbnailFile && courseId) {
        const uploadedUrl = await uploadCourseThumbnail(thumbnailFile, courseId);
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }
      
      // Create or update course
      if (isEditing && courseId) {
        const updatedCourse = await updateCourse(courseId, {
          ...data,
          thumbnail_url: thumbnailUrl,
        });
        
        if (updatedCourse) {
          toast({
            title: 'Success',
            description: 'Course updated successfully',
          });
          
          // Automatically switch to modules tab after updating
          setActiveTab('modules');
        }
      } else {
        const newCourse = await createCourse({
          ...data,
          thumbnail_url: null, // We'll update this after creation
        });
        
        if (newCourse) {
          // Now that we have the course ID, upload the thumbnail if it exists
          let finalCourse = newCourse;
          
          if (thumbnailFile) {
            // Upload thumbnail now that we have the course ID
            const uploadedUrl = await uploadCourseThumbnail(thumbnailFile, newCourse.id);
            if (uploadedUrl) {
              finalCourse = await updateCourse(newCourse.id, { thumbnail_url: uploadedUrl });
            }
          }
          
          toast({
            title: 'Success',
            description: 'Course created successfully. You can now add modules and lessons.',
          });
          
          // Navigate to edit page and show modules tab
          navigate(`/admin/courses/edit/${finalCourse.id}`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle module form submission
  const onModuleSubmit = async (data: ModuleFormData) => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      if (editingModuleId) {
        // Update existing module
        const updatedModule = await updateModule(editingModuleId, {
          title: data.title,
          description: data.description,
        });
        
        if (updatedModule) {
          // Update local state
          setModules(prev => prev.map(mod => 
            mod.id === editingModuleId ? { ...mod, ...updatedModule } : mod
          ));
          
          toast({
            title: 'Success',
            description: 'Module updated successfully',
          });
        }
      } else {
        // Create new module
        const newModule = await createModule({
          course_id: courseId,
          title: data.title,
          description: data.description,
          order_index: modules.length,
        });
        
        if (newModule) {
          // Update local state
          setModules(prev => [...prev, newModule]);
          
          // Select the newly created module
          setSelectedModuleId(newModule.id);
          
          toast({
            title: 'Success',
            description: 'Module created successfully',
          });
        }
      }
      
      // Reset form and editing state
      resetModule();
      setEditingModuleId(null);
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: 'Error',
        description: 'Failed to save module. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle lesson form submission
  const onLessonSubmit = async (data: LessonFormData) => {
    if (!courseId || !selectedModuleId) return;
    
    setLoading(true);
    try {
      const moduleIndex = modules.findIndex(m => m.id === selectedModuleId);
      if (moduleIndex === -1) return;
      
      const currentModule = modules[moduleIndex];
      const lessons = currentModule.lessons || [];
      
      if (editingLessonId) {
        // Update existing lesson
        const updatedLesson = await updateLesson(editingLessonId, {
          title: data.title,
          description: data.description,
          video_url: data.video_url,
        });
        
        if (updatedLesson) {
          // Update local state
          const updatedLessons = lessons.map(lesson => 
            lesson.id === editingLessonId ? { ...lesson, ...updatedLesson } : lesson
          );
          
          const updatedModules = [...modules];
          updatedModules[moduleIndex] = {
            ...currentModule,
            lessons: updatedLessons,
          };
          
          setModules(updatedModules);
          
          toast({
            title: 'Success',
            description: 'Lesson updated successfully',
          });
        }
      } else {
        // Create new lesson
        const newLesson = await createLesson({
          module_id: selectedModuleId,
          title: data.title,
          description: data.description,
          video_url: data.video_url,
          order_index: lessons.length,
        });
        
        if (newLesson) {
          // Update local state
          const updatedLessons = [...(lessons || []), newLesson];
          
          const updatedModules = [...modules];
          updatedModules[moduleIndex] = {
            ...currentModule,
            lessons: updatedLessons,
          };
          
          setModules(updatedModules);
          
          toast({
            title: 'Success',
            description: 'Lesson created successfully',
          });
        }
      }
      
      // Reset form and editing state
      resetLesson();
      setEditingLessonId(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to save lesson. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle quiz form submission
  const onQuizSubmit = async (data: QuizFormData) => {
    if (!courseId || !selectedModuleId) return;
    
    setLoading(true);
    try {
      const moduleIndex = modules.findIndex(m => m.id === selectedModuleId);
      if (moduleIndex === -1) return;
      
      const currentModule = modules[moduleIndex];
      
      if (isEditingQuiz && currentModule.quiz) {
        // Update existing quiz
        const updatedQuiz = await updateQuiz(currentModule.quiz.id, {
          title: data.title,
          description: data.description,
          passing_score: data.passing_score,
        });
        
        if (updatedQuiz) {
          // Update local state
          const updatedModules = [...modules];
          updatedModules[moduleIndex] = {
            ...currentModule,
            quiz: {
              ...updatedQuiz,
              questions: currentModule.quiz.questions, // Preserve questions for now
            },
          };
          
          setModules(updatedModules);
          
          toast({
            title: 'Success',
            description: 'Quiz updated successfully',
          });
        }
      } else {
        // Create new quiz
        const newQuiz = await createQuiz({
          module_id: selectedModuleId,
          title: data.title,
          description: data.description,
          passing_score: data.passing_score,
        });
        
        if (newQuiz) {
          // Now add questions and answers
          for (const questionData of data.questions) {
            const newQuestion = await createQuizQuestion({
              quiz_id: newQuiz.id,
              question: questionData.question,
              order_index: data.questions.indexOf(questionData),
            });
            
            if (newQuestion) {
              // Add answers for this question
              for (const answerData of questionData.answers) {
                await createQuizAnswer({
                  question_id: newQuestion.id,
                  answer: answerData.answer,
                  is_correct: answerData.is_correct,
                  order_index: questionData.answers.indexOf(answerData),
                });
              }
            }
          }
          
          // Update local state - we would need to refresh to get all questions/answers
          // For now just add the basic quiz
          const updatedModules = [...modules];
          updatedModules[moduleIndex] = {
            ...currentModule,
            quiz: newQuiz,
          };
          
          setModules(updatedModules);
          setIsEditingQuiz(false);
          
          toast({
            title: 'Success',
            description: 'Quiz created successfully',
          });
        }
      }
      
      // Reset form and editing state
      resetQuiz();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle module deletion
  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? This will also delete all lessons and quizzes within it.')) {
      return;
    }
    
    setLoading(true);
    try {
      const success = await deleteModule(moduleId);
      
      if (success) {
        // Update local state
        setModules(prev => prev.filter(mod => mod.id !== moduleId));
        
        // If the deleted module was selected, clear the selection
        if (selectedModuleId === moduleId) {
          setSelectedModuleId(null);
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
        description: 'Failed to delete module. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle lesson deletion
  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    
    setLoading(true);
    try {
      const success = await deleteLesson(lessonId);
      
      if (success) {
        // Update local state
        const moduleIndex = modules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
          const updatedModules = [...modules];
          const currentModule = updatedModules[moduleIndex];
          
          updatedModules[moduleIndex] = {
            ...currentModule,
            lessons: (currentModule.lessons || []).filter(
              lesson => lesson.id !== lessonId
            ),
          };
          
          setModules(updatedModules);
        }
        
        toast({
          title: 'Success',
          description: 'Lesson deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lesson. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit module click
  const handleEditModule = (module: CourseModule) => {
    resetModule({
      title: module.title,
      description: module.description || '',
    });
    setEditingModuleId(module.id);
  };

  // Handle edit lesson click
  const handleEditLesson = (lesson: Lesson) => {
    resetLesson({
      title: lesson.title,
      description: lesson.description || '',
      video_url: lesson.video_url || '',
    });
    setEditingLessonId(lesson.id);
    setSelectedLessonId(lesson.id);
  };

  // Handle edit quiz click
  const handleEditQuiz = (quiz: Quiz) => {
    resetQuiz({
      title: quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passing_score,
      questions: quiz.questions?.map(q => ({
        question: q.question,
        answers: q.answers?.map(a => ({
          answer: a.answer,
          is_correct: a.is_correct,
        })) || [],
      })) || [],
    });
    setEditingQuizId(quiz.id);
    setIsEditingQuiz(true);
  };

  // Handle cancel edit module
  const handleCancelEditModule = () => {
    resetModule();
    setEditingModuleId(null);
  };

  // Handle cancel edit lesson
  const handleCancelEditLesson = () => {
    resetLesson();
    setEditingLessonId(null);
  };

  // Handle cancel edit quiz
  const handleCancelEditQuiz = () => {
    resetQuiz();
    setEditingQuizId(null);
    setIsEditingQuiz(false);
  };

  // Handle module selection
  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(null);
  };

  // Add a question to the quiz form
  const handleAddQuestion = () => {
    appendQuestion({
      question: '',
      answers: [
        { answer: '', is_correct: true },
        { answer: '', is_correct: false },
      ],
    });
  };

  // Add an answer to a question
  const handleAddAnswer = (questionIndex: number) => {
    const fieldName = `questions.${questionIndex}.answers` as const;
    const { append } = useFieldArray({
      control: quizControl,
      name: fieldName,
    });
    
    append({ answer: '', is_correct: false });
  };

  // Function to get the video ID and generate embed URL
  const getVideoEmbedUrl = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <div className="min-h-screen bg-light-purple">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Course' : 'Create Course'}
          </h1>
          <Button onClick={() => navigate('/admin/courses')} variant="outline">
            Back to Courses
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-8">
            <TabsTrigger value="details" className="flex-1">Course Details</TabsTrigger>
            {isEditing && (
              <>
                <TabsTrigger value="modules" className="flex-1">Modules & Lessons</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmitCourse(onCourseSubmit)}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Enter course title" 
                        {...registerCourse('title')}
                        className={courseErrors.title ? 'border-red-500' : ''}
                      />
                      {courseErrors.title && (
                        <p className="text-red-500 text-sm">{courseErrors.title.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input 
                        id="category" 
                        placeholder="Category (e.g. Programming, Design)" 
                        {...registerCourse('category')}
                        className={courseErrors.category ? 'border-red-500' : ''}
                      />
                      {courseErrors.category && (
                        <p className="text-red-500 text-sm">{courseErrors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Input
                      id="summary"
                      placeholder="Brief summary of the course"
                      {...registerCourse('summary')}
                      className={courseErrors.summary ? 'border-red-500' : ''}
                    />
                    {courseErrors.summary && (
                      <p className="text-red-500 text-sm">{courseErrors.summary.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Full course description"
                      rows={6}
                      {...registerCourse('description')}
                      className={courseErrors.description ? 'border-red-500' : ''}
                    />
                    {courseErrors.description && (
                      <p className="text-red-500 text-sm">{courseErrors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty_level">Difficulty Level</Label>
                      <Select 
                        defaultValue={getValuesCourse('difficulty_level')}
                        onValueChange={(value) => setValueCourse('difficulty_level', value as 'beginner' | 'intermediate' | 'advanced')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                      <Input 
                        id="duration_minutes" 
                        type="number" 
                        min="1"
                        placeholder="Course duration in minutes"
                        {...registerCourse('duration_minutes', { valueAsNumber: true })}
                        className={courseErrors.duration_minutes ? 'border-red-500' : ''}
                      />
                      {courseErrors.duration_minutes && (
                        <p className="text-red-500 text-sm">{courseErrors.duration_minutes.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="is_free"
                        checked={isFree}
                        onCheckedChange={(checked) => {
                          setValueCourse('is_free', checked);
                          if (checked) {
                            setValueCourse('price', 0);
                          }
                        }}
                      />
                      <Label htmlFor="is_free">Free Course</Label>
                    </div>
                    
                    {!isFree && (
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input 
                          id="price" 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Course price"
                          {...registerCourse('price', { valueAsNumber: true })}
                          className={courseErrors.price ? 'border-red-500' : ''}
                        />
                        {courseErrors.price && (
                          <p className="text-red-500 text-sm">{courseErrors.price.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="certificate_enabled"
                      {...registerCourse('certificate_enabled')}
                    />
                    <Label htmlFor="certificate_enabled">Enable Course Completion Certificate</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Course Thumbnail</Label>
                    <div className="flex flex-col space-y-4">
                      {thumbnailPreview && (
                        <div className="relative w-full max-w-md">
                          <img 
                            src={thumbnailPreview} 
                            alt="Thumbnail preview" 
                            className="rounded-lg shadow-sm object-cover w-full h-48"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setThumbnailPreview(null);
                              setThumbnailFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {!thumbnailPreview && (
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="thumbnail-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 text-gray-500" />
                              <p className="mt-2 text-sm text-gray-500">
                                Click to upload thumbnail
                              </p>
                            </div>
                            <input
                              id="thumbnail-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleThumbnailChange}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => navigate('/admin/courses')} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          {isEditing && (
            <TabsContent value="modules">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left sidebar - Module list */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Modules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {modules.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No modules yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {modules.map((module) => (
                            <li key={module.id}>
                              <Button
                                variant={selectedModuleId === module.id ? "default" : "outline"}
                                className="w-full justify-between flex items-center"
                                onClick={() => handleSelectModule(module.id)}
                              >
                                <span className="truncate text-left">{module.title}</span>
                                <div className="flex items-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditModule(module);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteModule(module.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Module form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingModuleId ? 'Edit Module' : 'Add Module'}</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleSubmitModule(onModuleSubmit)}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="module-title">Title</Label>
                          <Input 
                            id="module-title" 
                            placeholder="Module title" 
                            {...registerModule('title')}
                            className={moduleErrors.title ? 'border-red-500' : ''}
                          />
                          {moduleErrors.title && (
                            <p className="text-red-500 text-sm">{moduleErrors.title.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="module-description">Description (optional)</Label>
                          <Textarea 
                            id="module-description" 
                            placeholder="Module description" 
                            rows={3}
                            {...registerModule('description')}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        {editingModuleId ? (
                          <>
                            <Button type="button" variant="outline" onClick={handleCancelEditModule}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? 'Saving...' : 'Update Module'}
                            </Button>
                          </>
                        ) : (
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Module'}
                          </Button>
                        )}
                      </CardFooter>
                    </form>
                  </Card>
                </div>
                
                {/* Right panel - Module content (lessons or quiz) */}
                <div className="md:col-span-2 space-y-6">
                  {selectedModuleId ? (
                    <>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Lessons</CardTitle>
                          <div>
                            {modules.find(m => m.id === selectedModuleId)?.lessons?.length || 0} Lessons
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {modules.find(m => m.id === selectedModuleId)?.lessons?.length === 0 ? (
                              <p className="text-gray-500 text-center py-4">No lessons yet</p>
                            ) : (
                              <div className="space-y-2">
                                {modules.find(m => m.id === selectedModuleId)?.lessons?.map((lesson) => (
                                  <div 
                                    key={lesson.id}
                                    className="p-4 border rounded-md flex justify-between items-center"
                                  >
                                    <div className="flex-1">
                                      <h4 className="font-medium">{lesson.title}</h4>
                                      {lesson.video_url && (
                                        <span className="text-sm text-gray-500">
                                          Has video
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditLesson(lesson)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteLesson(lesson.id, selectedModuleId)}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Lesson form */}
                      <Card>
                        <CardHeader>
                          <CardTitle>{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmitLesson(onLessonSubmit)}>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="lesson-title">Title</Label>
                              <Input 
                                id="lesson-title" 
                                placeholder="Lesson title" 
                                {...registerLesson('title')}
                                className={lessonErrors.title ? 'border-red-500' : ''}
                              />
                              {lessonErrors.title && (
                                <p className="text-red-500 text-sm">{lessonErrors.title.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="lesson-description">Description (optional)</Label>
                              <Textarea 
                                id="lesson-description" 
                                placeholder="Lesson description" 
                                rows={3}
                                {...registerLesson('description')}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="video_url">Video URL (YouTube)</Label>
                              <Input 
                                id="video_url" 
                                placeholder="YouTube video URL" 
                                {...registerLesson('video_url')}
                              />
                              
                              {videoUrl && isYoutubeUrl(videoUrl) && (
                                <div className="mt-4">
                                  <Label className="mb-2 block">Video Preview</Label>
                                  <div className="relative pt-[56.25%] w-full">
                                    <iframe 
                                      className="absolute top-0 left-0 w-full h-full rounded-md"
                                      src={getVideoEmbedUrl(videoUrl) || ''}
                                      title="Video preview"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                </div>
                              )}
                              
                              {videoUrl && !isYoutubeUrl(videoUrl) && videoUrl.length > 0 && (
                                <p className="text-red-500 text-sm mt-1">
                                  Please enter a valid YouTube URL
                                </p>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            {editingLessonId ? (
                              <>
                                <Button type="button" variant="outline" onClick={handleCancelEditLesson}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                  {loading ? 'Saving...' : 'Update Lesson'}
                                </Button>
                              </>
                            ) : (
                              <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Adding...' : 'Add Lesson'}
                              </Button>
                            )}
                          </CardFooter>
                        </form>
                      </Card>
                      
                      {/* Quiz section */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Module Quiz</CardTitle>
                          {modules.find(m => m.id === selectedModuleId)?.quiz && (
                            <Badge variant="secondary">
                              Quiz Added
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          {modules.find(m => m.id === selectedModuleId)?.quiz ? (
                            <div className="p-4 border rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">
                                    {modules.find(m => m.id === selectedModuleId)?.quiz?.title}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Passing score: {modules.find(m => m.id === selectedModuleId)?.quiz?.passing_score}%
                                  </p>
                                  {modules.find(m => m.id === selectedModuleId)?.quiz?.questions?.length && (
                                    <p className="text-sm text-gray-500">
                                      {modules.find(m => m.id === selectedModuleId)?.quiz?.questions?.length} questions
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    const quiz = modules.find(m => m.id === selectedModuleId)?.quiz;
                                    if (quiz) handleEditQuiz(quiz);
                                  }}
                                >
                                  Edit Quiz
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {!isEditingQuiz ? (
                                <div className="text-center py-8">
                                  <p className="text-gray-500 mb-4">No quiz added to this module yet</p>
                                  <Button onClick={() => setIsEditingQuiz(true)}>
                                    Add Quiz
                                  </Button>
                                </div>
                              ) : (
                                <form onSubmit={handleSubmitQuiz(onQuizSubmit)} className="space-y-6">
                                  <div className="space-y-2">
                                    <Label htmlFor="quiz-title">Quiz Title</Label>
                                    <Input 
                                      id="quiz-title" 
                                      placeholder="Quiz title" 
                                      {...registerQuiz('title')}
                                      className={quizErrors.title ? 'border-red-500' : ''}
                                    />
                                    {quizErrors.title && (
                                      <p className="text-red-500 text-sm">{quizErrors.title.message}</p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="quiz-description">Description (optional)</Label>
                                    <Textarea 
                                      id="quiz-description" 
                                      placeholder="Quiz description" 
                                      rows={2}
                                      {...registerQuiz('description')}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                                    <Input 
                                      id="passing_score" 
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="70"
                                      {...registerQuiz('passing_score', { valueAsNumber: true })}
                                    />
                                  </div>
                                  
                                  <Separator />
                                  
                                  <div>
                                    <h3 className="text-lg font-medium mb-4">Questions</h3>
                                    
                                    {questionFields.map((field, questionIndex) => (
                                      <div key={field.id} className="border rounded-md p-4 mb-6">
                                        <div className="flex justify-between items-center mb-4">
                                          <h4 className="font-medium">Question {questionIndex + 1}</h4>
                                          {questionIndex > 0 && (
                                            <Button 
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeQuestion(questionIndex)}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          )}
                                        </div>
                                        
                                        <div className="space-y-4">
                                          <div>
                                            <Label htmlFor={`question-${questionIndex}`}>Question Text</Label>
                                            <Input 
                                              id={`question-${questionIndex}`}
                                              placeholder="Enter question"
                                              {...registerQuiz(`questions.${questionIndex}.question`)}
                                            />
                                            {quizErrors.questions?.[questionIndex]?.question && (
                                              <p className="text-red-500 text-sm">
                                                {quizErrors.questions[questionIndex]?.question?.message}
                                              </p>
                                            )}
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label>Answer Options</Label>
                                            
                                            <div className="space-y-3">
                                              {/* Use Controller to map through answer fields */}
                                              <Controller
                                                control={quizControl}
                                                name={`questions.${questionIndex}.answers`}
                                                render={({ field }) => (
                                                  <>
                                                    {field.value?.map((answer, answerIndex) => (
                                                      <div 
                                                        key={answerIndex}
                                                        className="flex items-center gap-2"
                                                      >
                                                        <Controller
                                                          control={quizControl}
                                                          name={`questions.${questionIndex}.answers.${answerIndex}.is_correct`}
                                                          render={({ field: isCorrectField }) => (
                                                            <Switch
                                                              checked={isCorrectField.value}
                                                              onCheckedChange={isCorrectField.onChange}
                                                            />
                                                          )}
                                                        />
                                                        
                                                        <Input
                                                          placeholder="Answer text"
                                                          {...registerQuiz(`questions.${questionIndex}.answers.${answerIndex}.answer`)}
                                                          className="flex-1"
                                                        />
                                                        
                                                        {answerIndex > 1 && (
                                                          <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                              const newAnswers = [...field.value];
                                                              newAnswers.splice(answerIndex, 1);
                                                              field.onChange(newAnswers);
                                                            }}
                                                          >
                                                            <X className="h-4 w-4" />
                                                          </Button>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </>
                                                )}
                                              />
                                            </div>
                                            
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleAddAnswer(questionIndex)}
                                              className="mt-2"
                                            >
                                              <Plus className="h-4 w-4 mr-2" /> Add Answer
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleAddQuestion}
                                      className="w-full mt-4"
                                    >
                                      <Plus className="h-4 w-4 mr-2" /> Add Question
                                    </Button>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <Button 
                                      type="button" 
                                      variant="outline"
                                      onClick={handleCancelEditQuiz}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit">
                                      {editingQuizId ? 'Update Quiz' : 'Create Quiz'}
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <p className="text-gray-500">Select a module to view or add content</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
          
          {isEditing && (
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Course Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {thumbnailPreview && (
                      <div className="w-full max-w-2xl mx-auto">
                        <img 
                          src={thumbnailPreview} 
                          alt={getValuesCourse('title')} 
                          className="rounded-lg shadow-sm object-cover w-full h-64"
                        />
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-2xl font-bold">{getValuesCourse('title')}</h2>
                      <p className="text-gray-500 mt-1">{getValuesCourse('summary')}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary">{getValuesCourse('difficulty_level')}</Badge>
                        <Badge variant="outline">{getValuesCourse('category')}</Badge>
                        <Badge variant="outline">{getValuesCourse('duration_minutes')} minutes</Badge>
                        {getValuesCourse('certificate_enabled') && (
                          <Badge variant="secondary">Certificate</Badge>
                        )}
                        {getValuesCourse('is_free') ? (
                          <Badge className="bg-green-500">Free</Badge>
                        ) : (
                          <Badge>${getValuesCourse('price')}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-2">About This Course</h3>
                      <p className="whitespace-pre-wrap">{getValuesCourse('description')}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-4">Course Content</h3>
                      {modules.length === 0 ? (
                        <p className="text-gray-500">No course content yet</p>
                      ) : (
                        <div className="space-y-4">
                          {modules.map((module, index) => (
                            <div key={module.id} className="border rounded-md p-4">
                              <h4 className="font-medium">Module {index + 1}: {module.title}</h4>
                              {module.description && (
                                <p className="text-gray-500 text-sm mt-1">{module.description}</p>
                              )}
                              
                              {module.lessons && module.lessons.length > 0 && (
                                <div className="ml-4 mt-2">
                                  <p className="text-sm font-medium mb-1">Lessons:</p>
                                  <ul className="list-disc list-inside text-sm text-gray-600">
                                    {module.lessons.map((lesson) => (
                                      <li key={lesson.id}>{lesson.title}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {module.quiz && (
                                <div className="ml-4 mt-2">
                                  <p className="text-sm font-medium">
                                    <Badge variant="outline" className="ml-1">Quiz: {module.quiz.title}</Badge>
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default CourseForm;
