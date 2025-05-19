
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

// Add stub for enrollInCourse function
export const enrollInCourse = async (courseId: string, user: any): Promise<boolean> => {
  try {
    // Implement enrollment logic here
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return false;
  }
};

// Add stub for checkEnrollmentStatus function
export const checkEnrollmentStatus = async (courseId: string, user: User): Promise<boolean> => {
  try {
    // Implement enrollment check logic here
    return false;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
};

// Add stub for fetchCourseById function
export const fetchCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    // Implement course fetching logic here
    return null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

// Add stub for fetchCourseWithModulesAndLessons function
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<Course | null> => {
  try {
    // Implement course fetching logic with modules and lessons
    return null;
  } catch (error) {
    console.error('Error fetching course with modules and lessons:', error);
    return null;
  }
};

// Add stubs for module-related functions
export const createModule = async (moduleData: Partial<Module>): Promise<Module | null> => {
  try {
    // Implement module creation logic
    return null;
  } catch (error) {
    console.error('Error creating module:', error);
    return null;
  }
};

export const updateModule = async (moduleId: string, moduleData: Partial<Module>): Promise<Module | null> => {
  try {
    // Implement module update logic
    return null;
  } catch (error) {
    console.error('Error updating module:', error);
    return null;
  }
};

export const deleteModule = async (moduleId: string): Promise<boolean> => {
  try {
    // Implement module deletion logic
    return true;
  } catch (error) {
    console.error('Error deleting module:', error);
    return false;
  }
};

// Add stubs for lesson-related functions
export const createLesson = async (lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    // Implement lesson creation logic
    return null;
  } catch (error) {
    console.error('Error creating lesson:', error);
    return null;
  }
};

export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    // Implement lesson update logic
    return null;
  } catch (error) {
    console.error('Error updating lesson:', error);
    return null;
  }
};

export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  try {
    // Implement lesson deletion logic
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
};

// Add stubs for quiz-related functions
export const createQuiz = async (quizData: any): Promise<any> => {
  try {
    // Implement quiz creation logic
    return null;
  } catch (error) {
    console.error('Error creating quiz:', error);
    return null;
  }
};

export const createQuizQuestion = async (questionData: any): Promise<any> => {
  try {
    // Implement quiz question creation logic
    return null;
  } catch (error) {
    console.error('Error creating quiz question:', error);
    return null;
  }
};

export const createQuizAnswer = async (answerData: any): Promise<any> => {
  try {
    // Implement quiz answer creation logic
    return null;
  } catch (error) {
    console.error('Error creating quiz answer:', error);
    return null;
  }
};

// Add stubs for course-related functions
export const fetchPublishedCourses = async (): Promise<Course[]> => {
  try {
    // Implement published courses fetching logic
    return [];
  } catch (error) {
    console.error('Error fetching published courses:', error);
    return [];
  }
};

export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    // Implement all courses fetching logic
    return [];
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
};

export const createCourseWithCreator = async (courseData: Partial<Course>, creatorId: string): Promise<Course | null> => {
  try {
    // Implement course creation logic
    return null;
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course | null> => {
  try {
    // Implement course update logic
    return null;
  } catch (error) {
    console.error('Error updating course:', error);
    return null;
  }
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    // Implement course deletion logic
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    return false;
  }
};

// Add stub for saveLessonProgress function
export const saveLessonProgress = async (lessonId: string, enrollmentId: string, progress: any): Promise<boolean> => {
  try {
    // Implement lesson progress saving logic
    return true;
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return false;
  }
};
