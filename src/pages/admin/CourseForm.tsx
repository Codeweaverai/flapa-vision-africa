import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Course, createCourse, fetchCourseById, updateCourse, uploadCourseThumbnail, createCourseWithCreator } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  summary: z.string().min(10, { message: 'Summary must be at least 10 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  category: z.string().min(2, { message: 'Category is required.' }),
  difficulty_level: z.string().min(1, { message: 'Difficulty level is required.' }),
  duration_minutes: z.coerce.number().min(1, { message: 'Duration must be at least 1 minute.' }),
  is_free: z.boolean().default(true),
  price: z.coerce.number().min(0, { message: 'Price cannot be negative.' }),
  certificate_enabled: z.boolean().default(false),
  is_published: z.boolean().default(false), // Added missing is_published property
});

type FormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  isCreator?: boolean;
}

const CourseForm = ({ isCreator = false }: CourseFormProps) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
      is_published: false, // Added default value for is_published
    },
  });

  useEffect(() => {
    if (courseId) {
      const loadCourse = async () => {
        setLoading(true);
        const courseData = await fetchCourseById(courseId);
        if (courseData) {
          setCourse(courseData);
          form.reset({
            title: courseData.title,
            summary: courseData.summary,
            description: courseData.description,
            category: courseData.category,
            difficulty_level: courseData.difficulty_level,
            duration_minutes: courseData.duration_minutes,
            is_free: courseData.is_free,
            price: courseData.price,
            certificate_enabled: courseData.certificate_enabled,
            is_published: courseData.is_published || false, // Added is_published
          });
          
          if (courseData.thumbnail_url) {
            setThumbnailPreview(courseData.thumbnail_url);
          }
        }
        setLoading(false);
      };
      
      loadCourse();
    }
  }, [courseId, form]);

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create or edit courses');
      return;
    }
    
    setLoading(true);
    try {
      let courseResult: Course | null = null;
      
      // Make sure all required fields are present
      const courseData = {
        title: data.title,
        description: data.description, 
        summary: data.summary,
        category: data.category,
        difficulty_level: data.difficulty_level,
        duration_minutes: data.duration_minutes,
        is_free: data.is_free,
        price: data.price,
        certificate_enabled: data.certificate_enabled,
        is_published: data.is_published,
      };
      
      if (courseId) {
        // Update existing course
        courseResult = await updateCourse(courseId, courseData);
        if (courseResult) {
          toast.success('Course updated successfully!');
        }
      } else {
        // Create new course
        if (isCreator) {
          courseResult = await createCourseWithCreator(courseData, user.id);
          if (courseResult) {
            toast.success('Course created successfully!');
          }
        } else {
          courseResult = await createCourse(courseData);
          if (courseResult) {
            toast.success('Course created successfully!');
          }
        }
      }
      
      if (courseResult && thumbnail) {
        setUploadingThumbnail(true);
        const thumbnailUrl = await uploadCourseThumbnail(courseResult.id, thumbnail);
        if (thumbnailUrl) {
          await updateCourse(courseResult.id, { thumbnail_url: thumbnailUrl });
        }
        setUploadingThumbnail(false);
      }
      
      if (courseResult) {
        if (isCreator) {
          navigate('/creator/courses/content/' + courseResult.id);
        } else {
          navigate('/admin/courses/content/' + courseResult.id);
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setThumbnail(file);
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all_levels', label: 'All Levels' },
  ];

  const categories = [
    'Technology', 
    'Business', 
    'Design', 
    'Marketing', 
    'Personal Development',
    'Health & Fitness',
    'Education',
    'Arts & Crafts',
    'Music',
    'Other'
  ];

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(isCreator ? '/creator/courses' : '/admin/courses')} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{courseId ? 'Edit Course' : 'Create New Course'}</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Introduction to Web Development" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="A brief summary of the course (1-2 sentences)" 
                                {...field}
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Detailed Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed description of the course content, learning objectives, etc." 
                                {...field}
                                rows={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category.toLowerCase()}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="difficulty_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty Level</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {difficultyLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="duration_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="is_free"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Free Course</FormLabel>
                              <FormMessage />
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {!form.watch('is_free') && (
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (USD)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="certificate_enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Certificate</FormLabel>
                              <FormMessage />
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Course Thumbnail</h3>
                        <div className="border rounded-md aspect-video bg-muted flex items-center justify-center overflow-hidden">
                          {thumbnailPreview ? (
                            <img 
                              src={thumbnailPreview} 
                              alt="Course thumbnail preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">Upload thumbnail image</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor="thumbnail">Upload Image</Label>
                          <Input
                            id="thumbnail"
                            type="file"
                            className="mt-1"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended size: 1280x720px (16:9)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || uploadingThumbnail}
                    >
                      {(loading || uploadingThumbnail) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {courseId ? 'Update Course' : 'Create Course'}
                    </Button>
                    
                    {courseId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(isCreator ? `/creator/courses/content/${courseId}` : `/admin/courses/content/${courseId}`)}
                      >
                        Manage Course Content
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default CourseForm;
