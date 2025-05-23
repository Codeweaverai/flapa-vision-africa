
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  summary: z.string().min(1, "Summary is required"),
  category: z.string().min(1, "Category is required"),
  difficulty_level: z.string().min(1, "Difficulty level is required"),
  duration_minutes: z.number().min(1, "Duration is required"),
  is_free: z.boolean(),
  price: z.number().nullable(),
  certificate_enabled: z.boolean(),
  is_published: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const CreatorCourseForm = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      summary: "",
      category: "",
      difficulty_level: "beginner",
      duration_minutes: 60,
      is_free: true,
      price: null,
      certificate_enabled: false,
      is_published: false,
    },
  });

  useEffect(() => {
    if (id) {
      loadCourse(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const { data: course, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("creator_id", user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (course) {
        form.reset({
          title: course.title,
          description: course.description,
          summary: course.summary,
          category: course.category,
          difficulty_level: course.difficulty_level,
          duration_minutes: course.duration_minutes,
          is_free: course.is_free,
          price: course.price,
          certificate_enabled: course.certificate_enabled,
          is_published: course.is_published,
        });

        if (course.thumbnail_url) {
          setThumbnailPreview(course.thumbnail_url);
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to create a course");
      return;
    }

    try {
      setLoading(true);
      
      let thumbnailUrl = thumbnailPreview;
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `course-thumbnails/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('course_images')
          .upload(filePath, thumbnailFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicURL } = supabase
          .storage
          .from('course_images')
          .getPublicUrl(filePath);
          
        thumbnailUrl = publicURL.publicUrl;
      }
      
      // Save course data
      const courseData = {
        ...values,
        creator_id: user.id,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString(),
      };
      
      if (id) {
        // Update existing course
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", id)
          .eq("creator_id", user.id);
          
        if (error) throw error;
        
        toast.success("Course updated successfully");
      } else {
        // Create new course
        const { data, error } = await supabase
          .from("courses")
          .insert({
            ...courseData,
            created_at: new Date().toISOString(),
          })
          .select();
          
        if (error) throw error;
        
        toast.success("Course created successfully");
        
        // Navigate to course content page to add modules and lessons
        navigate(`/creator/courses/${data[0].id}/content`);
      }
      
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Layout>
      <div className="section-container">
        <h1 className="text-2xl font-bold mb-6">{id ? "Edit Course" : "Create New Course"}</h1>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter course title" {...field} />
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
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief summary of the course" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detailed description of what students will learn" {...field} rows={6} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Programming, Design, Business" {...field} />
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
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                          </FormControl>
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
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Thumbnail Image</FormLabel>
                      <div className="mt-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                        />
                      </div>
                      {thumbnailPreview && (
                        <div className="mt-2 aspect-video rounded-md bg-muted overflow-hidden">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="is_free"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Free Course</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Make this course available for free
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue('price', null);
                              } else {
                                form.setValue('price', 0);
                              }
                            }}
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
                              min="0" 
                              step="0.01"
                              placeholder="e.g., 29.99" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                            />
                          </FormControl>
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
                          <div className="text-sm text-muted-foreground">
                            Students can receive a certificate upon completion
                          </div>
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
                          <div className="text-sm text-muted-foreground">
                            Make this course visible to students
                          </div>
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
                
                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/creator/courses')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : id ? "Update Course" : "Create Course"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreatorCourseForm;
