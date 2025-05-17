
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type Course = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  thumbnail_url: string | null;
  tags: string[] | null;
  price: number | null;
  is_free: boolean | null;
  is_published: boolean | null;
  certificate_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string | null;
  updated_at: string | null;
  lessons?: Lesson[]; // Adding lessons as an optional property for UI convenience
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  description: string | null;
  order_index: number;
  materials_urls: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CourseWithModules = Course & {
  modules: (CourseModule & {
    lessons: Lesson[];
  })[];
};

// Function to fetch all published courses
export async function fetchPublishedCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    
    return data as Course[] || [];
  } catch (error) {
    console.error('Error in fetchPublishedCourses:', error);
    toast({
      title: 'Error',
      description: 'Failed to load courses. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
}

// Function to fetch a course by ID with its modules and lessons
export async function fetchCourseWithModulesAndLessons(courseId: string): Promise<CourseWithModules | null> {
  try {
    // First, get the course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      console.error('Error fetching course:', courseError);
      throw courseError;
    }
    
    if (!course) {
      return null;
    }
    
    // Then, get the modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      throw modulesError;
    }
    
    // For each module, get its lessons
    const modulesWithLessons = await Promise.all(
      (modules || []).map(async (module) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });
        
        if (lessonsError) {
          console.error(`Error fetching lessons for module ${module.id}:`, lessonsError);
          return { ...module, lessons: [] };
        }
        
        return { ...module, lessons: lessons || [] };
      })
    );
    
    return {
      ...(course as Course),
      modules: modulesWithLessons as CourseWithModules['modules'],
    };
  } catch (error) {
    console.error('Error in fetchCourseWithModulesAndLessons:', error);
    toast({
      title: 'Error',
      description: 'Failed to load course details. Please try again later.',
      variant: 'destructive',
    });
    return null;
  }
}

// Admin functions for course management
export async function createCourse(courseData: Partial<Course>): Promise<Course | null> {
  try {
    // Ensure required fields have default values
    const dataToInsert = {
      ...courseData,
      is_published: courseData.is_published ?? false,
      tags: courseData.tags ?? [],
      thumbnail_url: courseData.thumbnail_url ?? null
    };
    
    const { data, error } = await supabase
      .from('courses')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Course created successfully',
    });
    
    return data as Course;
  } catch (error) {
    console.error('Error in createCourse:', error);
    return null;
  }
}

export async function updateCourse(courseId: string, courseData: Partial<Course>): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Course updated successfully',
    });
    
    return data as Course;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    return null;
  }
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Course deleted successfully',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    return false;
  }
}

export async function createModule(moduleData: Partial<CourseModule>): Promise<CourseModule | null> {
  try {
    // Ensure description is included
    const dataToInsert = {
      ...moduleData,
      description: moduleData.description ?? null
    };
    
    const { data, error } = await supabase
      .from('course_modules')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating module:', error);
      toast({
        title: 'Error',
        description: 'Failed to create module. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as CourseModule;
  } catch (error) {
    console.error('Error in createModule:', error);
    return null;
  }
}

export async function createLesson(lessonData: Partial<Lesson>): Promise<Lesson | null> {
  try {
    // Ensure description is included
    const dataToInsert = {
      ...lessonData,
      description: lessonData.description ?? null
    };
    
    const { data, error } = await supabase
      .from('lessons')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lesson. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as Lesson;
  } catch (error) {
    console.error('Error in createLesson:', error);
    return null;
  }
}

// Function to upload course thumbnail
export async function uploadCourseThumbnail(file: File, courseId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      toast({
        title: 'Error',
        description: 'Failed to upload thumbnail. Please try again.',
        variant: 'destructive',
      });
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadCourseThumbnail:', error);
    return null;
  }
}

// Function to upload lesson materials
export async function uploadLessonMaterial(file: File, lessonId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${lessonId}_${Date.now()}.${fileExt}`;
    const filePath = `lessons/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Error uploading material:', uploadError);
      toast({
        title: 'Error',
        description: 'Failed to upload material. Please try again.',
        variant: 'destructive',
      });
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadLessonMaterial:', error);
    return null;
  }
}

// Function to enroll a user in a course
export async function enrollInCourse(courseId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to enroll in courses',
        variant: 'destructive',
      });
      return false;
    }
    
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('is_free, price')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      console.error('Error fetching course for enrollment:', courseError);
      throw courseError;
    }
    
    if (course.is_free) {
      // Free course - direct enrollment
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.user.id,
          course_id: courseId,
          payment_status: 'completed',
        });
      
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          toast({
            title: 'Already Enrolled',
            description: 'You are already enrolled in this course',
          });
          return true;
        }
        
        console.error('Error enrolling in course:', error);
        toast({
          title: 'Error',
          description: 'Failed to enroll in course. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'You have been enrolled in the course',
      });
      return true;
    } else {
      // Paid course - redirect to payment
      // This will need to be expanded to integrate with the payment system
      toast({
        title: 'Payment Required',
        description: 'This is a paid course. Payment functionality coming soon.',
        variant: 'default',
      });
      return false;
    }
  } catch (error) {
    console.error('Error in enrollInCourse:', error);
    return false;
  }
}

// Function to check if a user is enrolled in a course
export async function checkEnrollmentStatus(courseId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('course_id', courseId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking enrollment status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in checkEnrollmentStatus:', error);
    return false;
  }
}

// Function to get all courses for admin panel
export async function fetchAllCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
    
    return data as Course[] || [];
  } catch (error) {
    console.error('Error in fetchAllCourses:', error);
    toast({
      title: 'Error',
      description: 'Failed to load courses. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
}
