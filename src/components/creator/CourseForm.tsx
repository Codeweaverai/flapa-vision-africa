
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import FileUpload from "@/components/common/FileUpload";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

// Define course form schema
const courseSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  summary: z.string().min(10, { message: "Summary must be at least 10 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  difficulty_level: z.string().min(1, { message: "Difficulty level is required" }),
  duration_minutes: z.coerce.number().min(1, { message: "Duration must be at least 1 minute" }),
  is_free: z.boolean().default(true),
  price: z.coerce.number().optional(),
  is_published: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  isCreator?: boolean;
  creatorId?: string;
}

const CATEGORIES = ["Programming", "Design", "Business", "Marketing", "Personal Development", "Other"];
const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const CourseForm = ({ isCreator = false, creatorId }: CourseFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [thumbnailPath, setThumbnailPath] = useState<string>("");

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      category: "",
      difficulty_level: "",
      duration_minutes: 60,
      is_free: true,
      price: 0,
      is_published: false,
    },
  });

  // Load course data if editing
  useEffect(() => {
    if (id) {
      const loadCourse = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            // Populate form with existing data
            form.reset({
              title: data.title,
              summary: data.summary || "",
              description: data.description || "",
              category: data.category || "",
              difficulty_level: data.difficulty_level || "",
              duration_minutes: data.duration_minutes || 60,
              is_free: data.is_free !== undefined ? data.is_free : true,
              price: data.price || 0,
              is_published: data.is_published || false,
            });
            
            if (data.thumbnail_url) {
              setThumbnailUrl(data.thumbnail_url);
            }
          }
        } catch (error) {
          console.error('Error loading course:', error);
          toast.error("Failed to load course data");
        } finally {
          setLoading(false);
        }
      };

      loadCourse();
    }
  }, [id, form]);

  const onSubmit = async (values: CourseFormValues) => {
    setLoading(true);
    try {
      // If it's free, set price to 0
      if (values.is_free) {
        values.price = 0;
      }

      const courseData = {
        ...values,
        thumbnail_url: thumbnailUrl,
        creator_id: isCreator ? creatorId : null,
      };

      let result;

      if (id) {
        // Update existing course
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success("Course updated successfully");
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success("Course created successfully");
      }

      // Redirect after success
      if (isCreator) {
        navigate('/creator/courses');
      } else {
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error("Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = (url: string, path: string) => {
    setThumbnailUrl(url);
    setThumbnailPath(path);
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
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
                    <Textarea 
                      placeholder="Detailed description of the course" 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(category => (
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
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map(level => (
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

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <FormLabel>Course Thumbnail</FormLabel>
              <FileUpload
                bucket="course_materials"
                path="thumbnails"
                accept="image/*"
                maxSize={2}
                onUploadComplete={handleThumbnailUpload}
                existingUrl={thumbnailUrl}
                label="Upload Thumbnail"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="is_free"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Free Course</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Set this course as free for all students
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
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
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish Course</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this course available to students
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(isCreator ? '/creator/courses' : '/admin/courses')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {id ? 'Update Course' : 'Create Course'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default CourseForm;
