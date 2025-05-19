
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Course, createCourseWithCreator, fetchCourseById, updateCourse } from '@/services/courseService';

interface CourseFormProps {
  isCreator?: boolean;
}

const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  difficulty_level: z.string().min(1, "Difficulty level is required"),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  is_free: z.boolean().default(true),
  price: z.number().optional().nullable(),
  certificate_enabled: z.boolean().default(false),
  is_published: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const CourseForm: React.FC<CourseFormProps> = ({ isCreator = false }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      summary: '',
      category: '',
      difficulty_level: 'beginner',
      duration_minutes: 60,
      is_free: true,
      price: 0,
      certificate_enabled: false,
      is_published: false,
    },
  });
  
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setIsEditMode(true);
      setLoading(true);
      
      try {
        const course = await fetchCourseById(courseId);
        
        if (course) {
          form.reset({
            title: course.title,
            description: course.description,
            summary: course.summary,
            category: course.category,
            difficulty_level: course.difficulty_level,
            duration_minutes: course.duration_minutes,
            is_free: course.is_free,
            price: course.price || 0,
            certificate_enabled: course.certificate_enabled,
            is_published: course.is_published,
          });
        }
      } catch (error) {
        console.error("Error loading course:", error);
        toast.error("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, form]);
  
  const onSubmit = async (values: CourseFormValues) => {
    if (!user) {
      toast.error("You must be logged in to create or edit a course");
      return;
    }
    
    setLoading(true);
    try {
      if (isEditMode && courseId) {
        // Update existing course
        const updated = await updateCourse(courseId, values);
        
        if (updated) {
          toast.success("Course updated successfully");
          
          // Navigate to the course content page or back to courses list
          if (isCreator) {
            navigate(`/creator/courses`);
          } else {
            navigate(`/admin/courses/${courseId}/content`);
          }
        } else {
          toast.error("Failed to update course");
        }
      } else {
        // Create new course
        const course = await createCourseWithCreator(values, user.id);
        
        if (course) {
          toast.success("Course created successfully");
          
          // Navigate to the course content page or back to courses list
          if (isCreator) {
            navigate(`/creator/courses`);
          } else {
            navigate(`/admin/courses/${course.id}/content`);
          }
        } else {
          toast.error("Failed to create course");
        }
      }
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("An error occurred while saving the course");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(isCreator ? '/creator/courses' : '/admin/courses')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course title" {...field} disabled={loading} />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive title for your course.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="leadership">Leadership</SelectItem>
                            <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                            <SelectItem value="communication">Communication</SelectItem>
                            <SelectItem value="career">Career Development</SelectItem>
                            <SelectItem value="personal-growth">Personal Growth</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Category for your course.
                        </FormDescription>
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
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The difficulty level of your course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief summary of the course" 
                          className="resize-none" 
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        A short overview displayed on course cards (max 150 characters recommended).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed course description" 
                          className="resize-none min-h-[150px]" 
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        A detailed description of what students will learn.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Approximate time to complete the course in minutes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="is_free"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Free Course</FormLabel>
                          <FormDescription>
                            Make this course freely available to all users.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={loading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {!form.watch("is_free") && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={loading || form.watch("is_free")}
                            />
                          </FormControl>
                          <FormDescription>
                            Price in USD for the course.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="certificate_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Certificate</FormLabel>
                          <FormDescription>
                            Allow students to earn a certificate upon completion.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={loading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publish Course</FormLabel>
                          <FormDescription>
                            Make this course visible to all users.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={loading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(isCreator ? '/creator/courses' : '/admin/courses')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CourseForm;
