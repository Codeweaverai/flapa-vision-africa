
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { 
  Course, 
  VALID_DIFFICULTY_LEVELS, 
  createCourseWithCreator, 
  updateCourse, 
  fetchCourseById 
} from '@/services/courseService';

// Define the form schema
const courseSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  summary: z.string().optional(),
  category: z.string().min(1, { message: 'Category is required' }),
  difficulty_level: z.string().min(1, { message: 'Difficulty level is required' }),
  duration_minutes: z.number().int().positive({ message: 'Duration must be a positive number' }),
  is_free: z.boolean().default(false),
  price: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  is_published: z.boolean().default(false),
  certificate_enabled: z.boolean().default(false),
  thumbnail_url: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const COURSE_CATEGORIES = [
  'Programming',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Finance',
  'Health & Fitness',
  'Music',
  'Photography',
  'Other'
];

const AdminCourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialCourse, setInitialCourse] = useState<Course | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Initialize form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      summary: '',
      category: '',
      difficulty_level: 'Beginner',
      duration_minutes: 60,
      is_free: true,
      price: 0,
      currency: 'USD',
      is_published: false,
      certificate_enabled: false,
      thumbnail_url: '',
      tags: [],
    },
  });

  const { watch, setValue } = form;
  const isFree = watch('is_free');
  const tags = watch('tags') || [];

  // Fetch course data if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadCourse = async () => {
        setLoading(true);
        try {
          const course = await fetchCourseById(id);
          if (course) {
            setInitialCourse(course);
            
            // Set form values
            Object.entries(course).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                setValue(key as any, value);
              }
            });
          } else {
            toast.error('Course not found');
            navigate('/admin/courses');
          }
        } catch (error) {
          console.error('Error loading course:', error);
          toast.error('Failed to load course data');
        } finally {
          setLoading(false);
        }
      };
      
      loadCourse();
    }
  }, [id, isEditing, setValue, navigate]);

  const onSubmit = async (values: CourseFormValues) => {
    setSaving(true);
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create a course');
        return;
      }
      
      const courseData = {
        ...values,
        price: values.is_free ? null : values.price,
        currency: values.is_free ? null : values.currency,
      };

      if (isEditing && id) {
        // Update existing course
        const result = await updateCourse(id, courseData);
        
        if (!result) {
          throw new Error('Failed to update course');
        }
        
        toast.success('Course updated successfully');
        
        // Navigate to course content page if course was created successfully
        navigate(`/admin/courses/content/${id}`);
      } else {
        // Create new course
        const result = await createCourseWithCreator(courseData, user.id);
        
        if (!result) {
          throw new Error('Failed to create course');
        }
        
        toast.success('Course created successfully');
        
        // Navigate to course content page if course was created successfully
        navigate(`/admin/courses/content/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} course`);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const currentTags = form.getValues('tags') || [];
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue('tags', [...currentTags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue(
      'tags',
      currentTags.filter(t => t !== tag)
    );
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Course' : 'Create Course'}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Edit Course' : 'Create Course'}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your course details below' 
              : 'Enter the details for your new course'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter course title" {...field} />
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
                    <FormLabel>Description*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description of your course" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
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
                    <FormLabel>Summary (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief summary of your course" 
                        className="min-h-[80px]" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      A short summary that will appear in course cards and listings
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
                      <FormLabel>Category*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
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
                      <FormLabel>Difficulty Level*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VALID_DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
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
                    <FormLabel>Duration (minutes)*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Course duration in minutes" 
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(!isNaN(value) ? value : 0);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Estimated time to complete the course in minutes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thumbnail_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Course thumbnail image URL" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_free"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Free Course</FormLabel>
                        <FormDescription>
                          Toggle if this is a free course or requires payment
                        </FormDescription>
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
                
                {!isFree && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="Course price" 
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(!isNaN(value) ? value : 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value || 'USD'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags (optional)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tags"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag}>Add</Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <div key={tag} className="bg-muted px-2 py-1 rounded-md text-sm flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="certificate_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Completion Certificate</FormLabel>
                        <FormDescription>
                          Allow students to receive a certificate upon course completion
                        </FormDescription>
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
                
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Course</FormLabel>
                        <FormDescription>
                          Make this course visible to students
                        </FormDescription>
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
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/courses')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCourseForm;
