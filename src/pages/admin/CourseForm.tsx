
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, X, Edit, GripVertical, ChevronLeft } from 'lucide-react';
import { Course, CourseModule, Lesson, fetchCourseWithModulesAndLessons, createCourse, updateCourse, createModule, createLesson, uploadCourseThumbnail } from '@/services/courseService';
import { useForm, Controller } from 'react-hook-form';
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
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
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
      
      {/* Module and Lesson Management - Only visible in edit mode */}
      {isEditMode && (
        <div className="mt-10">
          <Separator className="my-6" />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Course Content</h2>
            <Button
              onClick={async () => {
                try {
                  const result = window.prompt("Enter module title");
                  if (!result || !id) return;
                  
                  const newModule = await createModule({
                    course_id: id,
                    title: result,
                    order_index: modules.length,
                    description: ''
                  });
                  
                  if (newModule) {
                    setModules([...modules, { ...newModule, lessons: [] }]);
                    toast({
                      title: "Module Created",
                      description: `${result} has been added to the course.`,
                    });
                  }
                } catch (error) {
                  console.error('Error creating module:', error);
                  toast({
                    title: "Error",
                    description: "Failed to create module",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
          
          <ScrollArea className="h-[500px] pr-4">
            {modules.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                  <CardTitle className="mb-2">No modules yet</CardTitle>
                  <CardDescription className="mb-6">
                    Start creating your course content by adding modules
                  </CardDescription>
                  <Button
                    onClick={async () => {
                      try {
                        const result = window.prompt("Enter module title");
                        if (!result || !id) return;
                        
                        const newModule = await createModule({
                          course_id: id,
                          title: result,
                          order_index: 0,
                          description: ''
                        });
                        
                        if (newModule) {
                          setModules([{ ...newModule, lessons: [] }]);
                          toast({
                            title: "Module Created",
                            description: `${result} has been added to the course.`,
                          });
                        }
                      } catch (error) {
                        console.error('Error creating module:', error);
                        toast({
                          title: "Error",
                          description: "Failed to create module",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Module
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {modules.map((module, moduleIndex) => (
                  <Card key={module.id}>
                    <CardHeader className="bg-muted/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GripVertical className="h-5 w-5 text-muted-foreground mr-2 cursor-grab" />
                          <CardTitle className="text-lg">
                            Module {moduleIndex + 1}: {module.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {module.lessons && module.lessons.length > 0 ? (
                        <div className="space-y-3">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div 
                              key={lesson.id} 
                              className="flex items-center justify-between p-3 bg-card border rounded-md"
                            >
                              <div className="flex items-center">
                                <GripVertical className="h-5 w-5 text-muted-foreground mr-2 cursor-grab" />
                                <span>
                                  {lessonIndex + 1}. {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={async () => {
                          try {
                            const result = window.prompt("Enter lesson title");
                            if (!result) return;
                            
                            const newLesson = await createLesson({
                              module_id: module.id,
                              title: result,
                              order_index: module.lessons ? module.lessons.length : 0,
                              video_url: "",
                              description: "",
                              materials_urls: [],
                            });
                            
                            if (newLesson) {
                              const updatedModules = modules.map(m => 
                                m.id === module.id 
                                  ? { ...m, lessons: [...(m.lessons || []), newLesson] }
                                  : m
                              );
                              setModules(updatedModules);
                              toast({
                                title: "Lesson Created",
                                description: `${result} has been added to the module.`,
                              });
                            }
                          } catch (error) {
                            console.error('Error creating lesson:', error);
                            toast({
                              title: "Error",
                              description: "Failed to create lesson",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Lesson
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </AdminLayout>
  );
};

export default CourseForm;
