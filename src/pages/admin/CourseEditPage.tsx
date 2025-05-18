
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Save,
  ArrowLeft
} from 'lucide-react';

import AdminLayout from '@/components/admin/AdminLayout';
import CourseModuleEditor from '@/components/admin/CourseModuleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Import the course service functions
import { Course, fetchCourseById, updateCourse } from '@/services/courseService';

// Define schema for course form with proper difficulty level enum
const courseSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  summary: z.string().min(1, "Short description is required"),
  description: z.string().min(1, "Full description is required"),
  category: z.string().min(1, "Category is required"),
  thumbnail_url: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  is_free: z.boolean().default(false),
  video_playlist_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  difficulty_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  tags: z.string().optional(),
  provides_certificate: z.boolean().default(false),
  is_published: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const CourseEditPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Set up the form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      category: "",
      thumbnail_url: "",
      price: 0,
      is_free: false,
      video_playlist_url: "",
      difficulty_level: "Beginner",
      duration_minutes: 60,
      tags: "",
      provides_certificate: false,
      is_published: false,
    },
  });
  
  // Load course data
  useEffect(() => {
    async function loadCourse() {
      if (!courseId) return;
      
      try {
        const courseData = await fetchCourseById(courseId);
        if (courseData) {
          setCourse(courseData);
          
          // Populate the form with course data
          form.reset({
            title: courseData.title,
            summary: courseData.summary,
            description: courseData.description || "",
            category: courseData.category || "",
            thumbnail_url: courseData.thumbnail_url || "",
            price: courseData.price || 0,
            is_free: courseData.price === 0,
            video_playlist_url: courseData.video_playlist_url || "",
            difficulty_level: courseData.difficulty_level || "Beginner",
            duration_minutes: courseData.duration_minutes || 60,
            tags: courseData.tags?.join(", ") || "",
            provides_certificate: courseData.provides_certificate || false,
            is_published: courseData.is_published || false,
          });
        }
      } catch (error) {
        console.error("Error loading course:", error);
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadCourse();
  }, [courseId, form]);
  
  // Handle form submission
  const onSubmit = async (values: CourseFormValues) => {
    if (!courseId) return;
    
    setIsSaving(true);
    
    try {
      // Convert form values to course update format
      const courseUpdate = {
        ...values,
        price: values.is_free ? 0 : values.price,
        tags: values.tags ? values.tags.split(",").map(tag => tag.trim()) : [],
      };
      
      // Update the course
      const updatedCourse = await updateCourse(courseId, courseUpdate);
      
      if (updatedCourse) {
        setCourse(updatedCourse);
        toast({
          title: "Course Updated",
          description: "Your course has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "Failed to update course details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to your server/cloud storage
      // For now, we'll just create a local object URL as a placeholder
      const imageUrl = URL.createObjectURL(file);
      form.setValue("thumbnail_url", imageUrl);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title="Edit Course">
        <div className="min-h-screen bg-light-purple">
          <div className="container mx-auto py-8">
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!course) {
    return (
      <AdminLayout title="Edit Course">
        <div className="min-h-screen bg-light-purple">
          <div className="container mx-auto py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
              <p className="mb-4">The course you're trying to edit doesn't exist</p>
              <Button onClick={() => navigate("/admin/courses")}>
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={`Edit Course: ${course?.title || ""}`}>
      <div className="min-h-screen bg-light-purple">
        <div className="container mx-auto py-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Button variant="link" className="p-0" onClick={() => navigate("/admin")}>
                    Dashboard
                  </Button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Button variant="link" className="p-0" onClick={() => navigate("/admin/courses")}>
                    Courses
                  </Button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Course: {course?.title || ""}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="mb-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/courses")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
            </Button>
            
            <Button
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="modules">Modules & Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6 col-span-full md:col-span-1">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>Short Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Brief summary of the course" 
                                  rows={2}
                                />
                              </FormControl>
                              <FormDescription>
                                A short summary that will be displayed in course cards (100-150 characters)
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
                                  {...field} 
                                  placeholder="Detailed description of the course" 
                                  rows={6}
                                />
                              </FormControl>
                              <FormDescription>
                                Detailed information about what the course covers
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-6 col-span-full md:col-span-1">
                        <div>
                          <FormLabel>Course Thumbnail</FormLabel>
                          <div className="mt-2 flex flex-col items-center">
                            {form.watch("thumbnail_url") ? (
                              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                                <img 
                                  src={form.watch("thumbnail_url")} 
                                  alt="Course thumbnail" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-48 mb-4 bg-gray-100 flex items-center justify-center rounded-lg">
                                <span className="text-gray-500">No thumbnail</span>
                              </div>
                            )}
                            <Input 
                              id="thumbnail" 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <Button
                              type="button" 
                              variant="outline" 
                              onClick={() => document.getElementById("thumbnail")?.click()}
                            >
                              {form.watch("thumbnail_url") ? "Change Thumbnail" : "Upload Thumbnail"}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                                      <SelectItem value="AI">AI</SelectItem>
                                      <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                                      <SelectItem value="Programming">Programming</SelectItem>
                                      <SelectItem value="Design">Design</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
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
                                <FormControl>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Beginner">Beginner</SelectItem>
                                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                                      <SelectItem value="Advanced">Advanced</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
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
                              <FormLabel>Estimated Time to Complete (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="React, Development, Web, etc."
                                />
                              </FormControl>
                              <FormDescription>
                                Comma separated list of tags
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="is_free"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch 
                                    checked={field.value} 
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      if (checked) {
                                        form.setValue("price", 0);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer">Free Course</FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          {!form.watch("is_free") && (
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="provides_certificate"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Provides Certificate</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="video_playlist_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>YouTube Playlist URL (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="https://youtube.com/playlist?list=..."
                                />
                              </FormControl>
                              <FormDescription>
                                Link to a YouTube playlist for this course
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="is_published"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Publish Course</FormLabel>
                              <FormDescription className="ml-2">
                                {field.value ? 
                                  "Course is visible to students" : 
                                  "Course is in draft mode"
                                }
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            </TabsContent>
            
            <TabsContent value="modules" className="mt-4">
              <CourseModuleEditor 
                courseId={courseId || ""} 
                existingModules={course?.modules || []}
                onSaveComplete={() => {
                  toast({
                    title: "Modules Saved",
                    description: "Your course modules have been updated successfully",
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CourseEditPage;
