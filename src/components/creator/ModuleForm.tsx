
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface ModuleFormProps {
  courseId: string;
  moduleId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Define form schema
const moduleSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  order_index: z.coerce.number().int().min(0),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

const ModuleForm: React.FC<ModuleFormProps> = ({ courseId, moduleId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  
  // Initialize form
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      order_index: 0,
    },
  });

  // Load module data if editing
  useEffect(() => {
    if (moduleId) {
      const fetchModule = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('course_modules')
            .select('*')
            .eq('id', moduleId)
            .single();
            
          if (error) throw error;
          
          form.reset({
            title: data.title,
            description: data.description || "",
            order_index: data.order_index,
          });
        } catch (error) {
          console.error('Error fetching module:', error);
          toast.error('Failed to load module data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchModule();
    } else {
      // For new modules, get the next order index
      const getNextOrderIndex = async () => {
        try {
          const { data, error } = await supabase
            .from('course_modules')
            .select('order_index')
            .eq('course_id', courseId)
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
  }, [courseId, moduleId, form]);

  const onSubmit = async (values: ModuleFormValues) => {
    setLoading(true);
    try {
      if (moduleId) {
        // Update existing module
        const { error } = await supabase
          .from('course_modules')
          .update({
            title: values.title,
            description: values.description,
            order_index: values.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', moduleId);
          
        if (error) throw error;
        toast.success('Module updated successfully');
      } else {
        // Create new module
        const { error } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            title: values.title,
            description: values.description,
            order_index: values.order_index,
          });
          
        if (error) throw error;
        toast.success('Module created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter module title" {...field} />
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
                  placeholder="Brief description of this module" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
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
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {moduleId ? 'Update Module' : 'Create Module'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ModuleForm;
