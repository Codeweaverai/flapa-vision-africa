import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

// Define Course type
export interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  is_free: boolean;
  price?: number;
  certificate_enabled: boolean;
  is_published: boolean;
  thumbnail_url?: string;
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  modules?: CourseModule[]; // Add modules property
}

// Define Lesson type
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  module_id: string;
  order_index: number;
  content_type?: 'video' | 'quiz'; // Make this optional for backward compatibility
  content?: any; // Make this optional for backward compatibility
  materials_urls?: string[];
  created_at?: string;
  updated_at?: string;
  is_completed?: boolean;
  quizzes?: Quiz[]; // Add quizzes property
}

// Define Quiz type
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lesson_id?: string;
  module_id?: string;
  passing_score: number;
  created_at?: string;
  updated_at?: string;
  questions?: QuizQuestion[];
}

// Define QuizQuestion type
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  answers?: QuizAnswer[];
}

// Define QuizAnswer type
export interface QuizAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

// Define CourseModule type
export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  lessons?: Lesson[];
}

// Define CourseWithModules type for fetching a course with its modules and lessons
export interface CourseWithModules extends Course {
  modules: CourseModule[];
}

// Add a function to create a course with creator_id
export const createCourseWithCreator = async (
  courseData: Omit<Course, "id" | "created_at" | "updated_at">, 
  creatorId: string
): Promise<Course | null> => {
  try {
    // Ensure required fields are present
    if (!courseData.title || !courseData.description || !courseData.summary || 
        !courseData.category || !courseData.difficulty_level || 
        courseData.duration_minutes === undefined) {
      console.error('Error creating course: Missing required fields');
      toast.error('Please fill in all required fields');
      return null;
    }
    
    // Create the complete course object with required fields
    const courseWithCreator = {
      title: courseData.title,
      description: courseData.description,
      summary: courseData.summary,
      category: courseData.category,
      difficulty_level: courseData.difficulty_level,
      duration_minutes: courseData.duration_minutes,
      is_free: courseData.is_free !== undefined ? courseData.is_free : true,
      price: courseData.price !== undefined ? courseData.price : 0,
      certificate_enabled: courseData.certificate_enabled !== undefined ? courseData.certificate_enabled : false,
      is_published: courseData.is_published !== undefined ? courseData.is_published : false,
      creator_id: creatorId,
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(courseWithCreator)
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw error;
    }

    return data as Course;
  } catch (error) {
    console.error('Error in createCourseWithCreator:', error);
    return null;
  }
};

// Function to fetch all courses (for admin)
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

// Function to fetch published courses (for public view)
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

// Function to fetch a course by ID
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
    console.error(`Error fetching course with ID ${courseId}:`, error);
    return null;
  }
};

// Function to fetch a course with its modules and lessons
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<CourseWithModules | null> => {
  try {
    // Fetch the course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError) throw courseError;
    
    // Fetch modules for the course
    const { data: modulesData, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (modulesError) throw modulesError;
    
    // For each module, fetch its lessons
    const modulesWithLessons = await Promise.all(
      (modulesData || []).map(async (module) => {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });
        
        if (lessonsError) throw lessonsError;
        
        return {
          ...module,
          lessons: lessonsData || []
        };
      })
    );
    
    return {
      ...courseData,
      modules: modulesWithLessons
    } as CourseWithModules;
  } catch (error) {
    console.error(`Error fetching course with modules and lessons for course ID ${courseId}:`, error);
    return null;
  }
};

// Function to update a course
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
    console.error(`Error updating course with ID ${courseId}:`, error);
    return null;
  }
};

// Function to delete a course
export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting course with ID ${courseId}:`, error);
    return false;
  }
};

// Function to enroll in a course
export const enrollInCourse = async (courseId: string, user: User): Promise<boolean> => {
  try {
    // Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();
    
    if (existingEnrollment) {
      toast.info('You are already enrolled in this course');
      return true;
    }
    
    // Create new enrollment
    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        user_id: user.id,
        enrollment_date: new Date().toISOString(),
        payment_status: 'completed', // For simplicity, assuming enrollment is successful
        is_completed: false
      });
    
    if (error) throw error;
    toast.success('Successfully enrolled in the course');
    return true;
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error);
    toast.error('Failed to enroll in the course');
    return false;
  }
};

// Function to check if user is enrolled in a course
export const checkEnrollmentStatus = async (courseId: string, user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();
    
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error(`Error checking enrollment status for course ${courseId}:`, error);
    return false;
  }
};

// Function to save lesson progress
export const saveLessonProgress = async (
  lessonId: string, 
  enrollmentId: string,
  isCompleted: boolean = true,
  lastPositionSeconds: number = 0
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lesson_progress')
      .insert({
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        is_completed: isCompleted,
        last_position_seconds: lastPositionSeconds,
        completion_date: isCompleted ? new Date().toISOString() : null
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error saving lesson progress for lesson ${lessonId}:`, error);
    return false;
  }
};

// Functions for course module management
export const createModule = async (moduleData: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert(moduleData)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseModule;
  } catch (error) {
    console.error('Error creating module:', error);
    return null;
  }
};

export const updateModule = async (moduleId: string, moduleData: Partial<CourseModule>): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(moduleData)
      .eq('id', moduleId)
      .select()
      .single();
    
    if (error) throw error;
    return data as CourseModule;
  } catch (error) {
    console.error(`Error updating module with ID ${moduleId}:`, error);
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
    console.error(`Error deleting module with ID ${moduleId}:`, error);
    return false;
  }
};

// Functions for lesson management
export const createLesson = async (lessonData: Omit<Lesson, "id" | "created_at" | "updated_at">): Promise<Lesson | null> => {
  try {
    // Set default values for content_type if not provided
    const lessonWithDefaults = {
      ...lessonData,
      content_type: lessonData.content_type || 'video',
      content: lessonData.content || {}
    };
    
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonWithDefaults)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lesson;
  } catch (error) {
    console.error('Error creating lesson:', error);
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
    console.error(`Error updating lesson with ID ${lessonId}:`, error);
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
    console.error(`Error deleting lesson with ID ${lessonId}:`, error);
    return false;
  }
};

// Functions for quiz management
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
    return null;
  }
};
