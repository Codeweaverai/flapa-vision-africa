import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
  is_free: boolean;
  currency?: string;
  image_url?: string;
  duration?: number;
  duration_unit?: string;
  level?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  published?: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  completion_date?: string;
  progress?: number;
  is_completed?: boolean;
  certificate_id?: string;
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
}

// Function to fetch courses for a specific user/student
export const fetchUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:course_id(*)
      `)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user courses:', error);
      toast.error('Failed to load your courses');
      return [];
    }
    
    // Extract the course data from the enrollments
    const courses = data?.map(enrollment => enrollment.course) || [];
    return courses;
  } catch (error) {
    console.error('Error in fetchUserCourses:', error);
    toast.error('Failed to load your courses');
    return [];
  }
};

// Function to fetch courses created by a specific creator
export const fetchCreatorCourses = async (creatorId: string): Promise<Course[]> => {
  try {
    if (!creatorId) {
      throw new Error('Creator ID is required');
    }
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator courses:', error);
      toast.error('Failed to load courses');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCreatorCourses:', error);
    toast.error('Failed to load courses');
    return [];
  }
};

// Function to delete a course
export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
      return false;
    }

    toast.success('Course deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    toast.error('Failed to delete course');
    return false;
  }
};

// Function to create a new course
export const createCourse = async (courseData: Partial<Course>, creatorId: string): Promise<Course | null> => {
  try {
    if (!courseData.title) {
      toast.error('Course title is required');
      return null;
    }

    const newCourse = {
      ...courseData,
      creator_id: creatorId,
      published: courseData.published || false,
      is_free: courseData.is_free || false,
      price: courseData.is_free ? null : courseData.price,
      currency: courseData.is_free ? null : (courseData.currency || 'USD'),
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(newCourse)
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
      return null;
    }

    toast.success('Course created successfully');
    return data;
  } catch (error) {
    console.error('Error in createCourse:', error);
    toast.error('Failed to create course');
    return null;
  }
};

// Function to update an existing course
export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course | null> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return null;
    }

    // Adjust price and currency based on is_free flag
    if (courseData.is_free) {
      courseData.price = null;
      courseData.currency = null;
    }

    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
      return null;
    }

    toast.success('Course updated successfully');
    return data;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    toast.error('Failed to update course');
    return null;
  }
};

// Function to fetch a single course by ID
export const fetchCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return null;
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchCourseById:', error);
    toast.error('Failed to load course');
    return null;
  }
};

// Function to enroll a user in a course
export const enrollInCourse = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    if (!courseId || !userId) {
      toast.error('Course ID and User ID are required');
      return false;
    }

    // Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking enrollment:', checkError);
      toast.error('Failed to check enrollment status');
      return false;
    }

    if (existingEnrollment) {
      toast.info('You are already enrolled in this course');
      return true;
    }

    // Create new enrollment
    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        user_id: userId,
        enrollment_date: new Date().toISOString(),
        progress: 0,
        is_completed: false,
        payment_status: 'pending' // Will be updated after payment
      });

    if (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
      return false;
    }

    toast.success('Successfully enrolled in course');
    return true;
  } catch (error) {
    console.error('Error in enrollInCourse:', error);
    toast.error('Failed to enroll in course');
    return false;
  }
};

// Function to update course progress
export const updateCourseProgress = async (
  enrollmentId: string, 
  progress: number, 
  isCompleted: boolean = false
): Promise<boolean> => {
  try {
    if (!enrollmentId) {
      toast.error('Enrollment ID is required');
      return false;
    }

    const updates: any = { progress };
    
    if (isCompleted) {
      updates.is_completed = true;
      updates.completion_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('course_enrollments')
      .update(updates)
      .eq('id', enrollmentId);

    if (error) {
      console.error('Error updating course progress:', error);
      toast.error('Failed to update progress');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCourseProgress:', error);
    toast.error('Failed to update progress');
    return false;
  }
};

// Function to fetch all enrollments for a course
export const fetchCourseEnrollments = async (courseId: string): Promise<Enrollment[]> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return [];
    }

    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        profiles:user_id(id, full_name, email)
      `)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching course enrollments:', error);
      toast.error('Failed to load enrollments');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCourseEnrollments:', error);
    toast.error('Failed to load enrollments');
    return [];
  }
};
