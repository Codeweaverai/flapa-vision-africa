import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

// Update Course Interface
export interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  duration_minutes: number;
  is_free: boolean;
  price: number;
  certificate_enabled: boolean;
  is_published: boolean;
  thumbnail_url?: string;
  category: string;
  difficulty_level: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
  lessons?: Lesson[];
  created_at?: string;
  updated_at?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  materials_urls?: string[];
  module_id: string;
  order_index: number;
  content_type?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

// Add the missing fetchUserCourses function
export const fetchUserCourses = async (): Promise<CourseWithEnrollment[]> => {
  try {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id, 
        enrollment_date, 
        completion_date, 
        is_completed,
        course_id
      `);
    
    if (enrollmentsError) throw enrollmentsError;
    
    if (!enrollments || enrollments.length === 0) {
      return [];
    }
    
    const courseIds = enrollments.map(enrollment => enrollment.course_id);
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);
    
    if (coursesError) throw coursesError;
    
    // Combine courses with enrollment data
    const coursesWithEnrollment = courses.map(course => {
      const enrollment = enrollments.find(e => e.course_id === course.id);
      return {
        ...course,
        enrollment: enrollment ? {
          id: enrollment.id,
          enrollment_date: enrollment.enrollment_date,
          completion_date: enrollment.completion_date,
          is_completed: enrollment.is_completed
        } : undefined
      };
    });
    
    return coursesWithEnrollment as CourseWithEnrollment[];
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return [];
  }
};

export const enrollInCourse = async (courseId: string, user: any): Promise<boolean> => {
  // Implement this function based on your application needs
  try {
    // Add course enrollment logic
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return false;
  }
};
