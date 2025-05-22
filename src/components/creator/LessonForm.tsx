
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import VideoUpload from "@/components/creator/VideoUpload";

interface LessonFormProps {
  moduleId: string;
  lessonId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Define form schema
const lessonSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  content_type: z.string().default("video"),
  order_index: z.coerce.number().int().min(0),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

const LessonForm: React.FC<LessonFormProps> = ({ moduleId, lessonId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPath, setVideoPath] = useState("");
  
  // Initialize form
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content_type: "video",
      order_index: 0,
    },
  });

  // Load lesson data if editing
  useEffect(() => {
    if (lessonId) {
      const fetchLesson = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();
            
          if (error) throw error;
          
          form.reset({
            title: data.title,
            description: data.description || "",
            content_type: data.content_type || "video",
            order_index: data.order_index,
          });
          
          if (data.video_url) {
            setVideoUrl(data.video_url);
          }
        } catch (error) {
          console.error('Error fetching lesson:', error);
          toast.error('Failed to load lesson data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchLesson();
    } else {
      // For new lessons, get the next order index
      const getNextOrderIndex = async () => {
        try {
          const { data, error } = await supabase
            .from('lessons')
            .select('order_index')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: false })
            .limit(1);
            
          if (error) throw error;
          
          const nextIndex = data && data.length > 0 ? data[0].order_index + 1 : 0;
          form.setValue('order_index', nextIndex);
        } catch (error) {
          console.error('Error getting next order index:', error);
        }
      };
      
      getNextOrderIndex();
    }
  }, [moduleId, lessonId, form]);

  const onSubmit = async (values: LessonFormValues) => {
    setLoading(true);
    try {
      const lessonData = {
        title: values.title,
        description: values.description,
        content_type: values.content_type,
        order_index: values.order_index,
        video_url: videoUrl || null,
        updated_at: new Date().toISOString(),
      };
      
      if (lessonId) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lessonId);
          
        if (error) throw error;
        toast.success('Lesson updated successfully');
      } else {
        // Create new lesson
        const { error } = await supabase
          .from('lessons')
          .insert({
            ...lessonData,
            module_id: moduleId,
          });
          
        if (error) throw error;
        toast.success('Lesson created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVideoUpload = (videoData: { url: string; path: string; }) => {
    setVideoUrl(videoData.url);
    setVideoPath(videoData.path);
  };

  const contentType = form.watch("content_type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lesson Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter lesson title" {...field} />
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
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of this lesson" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="content_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="order_index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {contentType === "video" && (
          <div className="space-y-4">
            <FormLabel>Video Content</FormLabel>
            <VideoUpload
              lessonId={lessonId || "temp"}
              currentVideoUrl={videoUrl}
              onUploadComplete={handleVideoUpload}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lessonId ? 'Update Lesson' : 'Create Lesson'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LessonForm;
