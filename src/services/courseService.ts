
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  difficulty_level: string;
  category: string;
  duration_minutes: number;
  is_free: boolean;
  price?: number;
  certificate_enabled: boolean;
  thumbnail_url?: string;
  is_published: boolean;
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const fetchCreatorCourses = async (creatorId: string): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching creator courses:', error);
    return [];
  }
};

export const createCourse = async (courseData: Partial<Course>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();
      
    if (error) throw error;
    toast.success('Course created successfully');
    return data;
  } catch (error) {
    console.error('Error creating course:', error);
    toast.error('Failed to create course');
    return null;
  }
};

export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    toast.success('Course updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating course:', error);
    toast.error('Failed to update course');
    return null;
  }
};

export const deleteCourse = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    toast.success('Course deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    toast.error('Failed to delete course');
    return false;
  }
};
