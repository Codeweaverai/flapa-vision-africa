
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { CourseWithEnrollment } from '@/types/eventTypes';

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
  content_type: string;
  content?: any;
  created_at?: string;
  updated_at?: string;
  quizzes?: any[]; // Add this for ModuleAccordion component
}

// Alias CourseModule to Module for compatibility with existing code
export type CourseModule = Module;

// Add the missing fetchUserCourses function
export const fetchUserCourses = async (): Promise<CourseWithEnrollment[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }
    
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id, 
        enrollment_date, 
        completion_date, 
        is_completed,
        course_id
      `)
      .eq('user_id', user.user.id);
    
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
        } : undefined,
        image_url: course.thumbnail_url // Map thumbnail_url to image_url
      };
    });
    
    return coursesWithEnrollment;
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return [];
  }
};

// Implement enrollInCourse function
export const enrollInCourse = async (courseId: string, user: User): Promise<boolean> => {
  try {
    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();
    
    if (existingEnrollment) {
      // Already enrolled
      return true;
    }
    
    // Get course details to check if it's free
    const { data: course } = await supabase
      .from('courses')
      .select('is_free, price')
      .eq('id', courseId)
      .single();
    
    const enrollment = {
      course_id: courseId,
      user_id: user.id,
      payment_status: course?.is_free ? 'free' : 'pending',
      is_completed: false
    };
    
    const { error } = await supabase
      .from('course_enrollments')
      .insert(enrollment);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    toast.error('Failed to enroll in course');
    return false;
  }
};

// Implement checkEnrollmentStatus function
export const checkEnrollmentStatus = async (courseId: string, user: User): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      // No enrollment found, not an error
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
};

// Implement fetchCourseById function
export const fetchCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (error) throw error;
    return data as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    toast.error('Failed to fetch course details');
    return null;
  }
};

// Implement fetchCourseWithModulesAndLessons function
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<Course | null> => {
  try {
    // Fetch the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError) throw courseError;
    
    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
      
    if (modulesError) throw modulesError;
    
    // Fetch lessons for all modules
    const moduleIds = modules.map(module => module.id);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true });
      
    if (lessonsError) throw lessonsError;
    
    // Organize lessons by module
    const modulesWithLessons = modules.map(module => ({
      ...module,
      lessons: lessons.filter(lesson => lesson.module_id === module.id)
    }));
    
    // Return the complete course data
    return {
      ...course,
      modules: modulesWithLessons
    } as Course;
  } catch (error) {
    console.error('Error fetching course with modules and lessons:', error);
    toast.error('Failed to load course content');
    return null;
  }
};

// Implement module-related functions
export const createModule = async (moduleData: Partial<Module>): Promise<Module | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert(moduleData)
      .select()
      .single();
      
    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error('Error creating module:', error);
    toast.error('Failed to create module');
    return null;
  }
};

export const updateModule = async (moduleId: string, moduleData: Partial<Module>): Promise<Module | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(moduleData)
      .eq('id', moduleId)
      .select()
      .single();
      
    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error('Error updating module:', error);
    toast.error('Failed to update module');
    return null;
  }
};

export const deleteModule = async (moduleId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting module:', error);
    toast.error('Failed to delete module');
    return false;
  }
};

// Implement lesson-related functions
export const createLesson = async (lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();
      
    if (error) throw error;
    return data as Lesson;
  } catch (error) {
    console.error('Error creating lesson:', error);
    toast.error('Failed to create lesson');
    return null;
  }
};

export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)
      .select()
      .single();
      
    if (error) throw error;
    return data as Lesson;
  } catch (error) {
    console.error('Error updating lesson:', error);
    toast.error('Failed to update lesson');
    return null;
  }
};

export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    toast.error('Failed to delete lesson');
    return false;
  }
};

// Add stubs for quiz-related functions
export const createQuiz = async (quizData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quizData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quiz:', error);
    toast.error('Failed to create quiz');
    return null;
  }
};

export const createQuizQuestion = async (questionData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(questionData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quiz question:', error);
    toast.error('Failed to create quiz question');
    return null;
  }
};

export const createQuizAnswer = async (answerData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('quiz_answers')
      .insert(answerData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quiz answer:', error);
    toast.error('Failed to create quiz answer');
    return null;
  }
};

// Implement course-related functions
export const fetchPublishedCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Course[];
  } catch (error) {
    console.error('Error fetching published courses:', error);
    return [];
  }
};

export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Course[];
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
};

export const createCourseWithCreator = async (courseData: Partial<Course>, creatorId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        creator_id: creatorId
      })
      .select()
      .single();
      
    if (error) throw error;
    return data as Course;
  } catch (error) {
    console.error('Error creating course:', error);
    toast.error('Failed to create course');
    return null;
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();
      
    if (error) throw error;
    return data as Course;
  } catch (error) {
    console.error('Error updating course:', error);
    toast.error('Failed to update course');
    return null;
  }
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    // First delete all related lessons and modules
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId);
      
    if (modules && modules.length > 0) {
      const moduleIds = modules.map(module => module.id);
      
      // Delete lessons for these modules
      await supabase
        .from('lessons')
        .delete()
        .in('module_id', moduleIds);
        
      // Delete modules
      await supabase
        .from('course_modules')
        .delete()
        .eq('course_id', courseId);
    }
    
    // Delete enrollments
    await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId);
    
    // Delete course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    toast.error('Failed to delete course');
    return false;
  }
};

// Implement saveLessonProgress function
export const saveLessonProgress = async (lessonId: string, enrollmentId: string, progress: any): Promise<boolean> => {
  try {
    // Check if progress record exists
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('enrollment_id', enrollmentId)
      .single();
      
    if (existing) {
      // Update existing progress
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          last_position_seconds: progress.position || 0,
          is_completed: progress.completed || false,
          completion_date: progress.completed ? new Date().toISOString() : null
        })
        .eq('id', existing.id);
        
      if (error) throw error;
    } else {
      // Create new progress record
      const { error } = await supabase
        .from('lesson_progress')
        .insert({
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          last_position_seconds: progress.position || 0,
          is_completed: progress.completed || false,
          completion_date: progress.completed ? new Date().toISOString() : null
        });
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return false;
  }
};
