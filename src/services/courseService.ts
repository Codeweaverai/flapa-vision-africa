
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  currency?: string;
  is_free: boolean;
  is_published: boolean;
  certificate_enabled: boolean;
  thumbnail_url?: string;
  creator_id?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: string;
  video_url?: string;
  content?: any;
  materials_urls?: string[];
  order_index: number;
  created_at?: string;
  updated_at?: string;
  is_completed?: boolean;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: string;
  lesson_id?: string;
  module_id?: string;
  title: string;
  description?: string;
  passing_score: number;
  created_at?: string;
  updated_at?: string;
}

export const VALID_CATEGORIES = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Health & Fitness',
  'Language Learning',
  'Music',
  'Photography',
  'Other'
];

export const VALID_DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

// Create course with proper type handling
export const createCourse = async (courseData: {
  title: string;
  description: string;
  summary: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  currency?: string;
  is_free: boolean;
  certificate_enabled: boolean;
  thumbnail_url?: string;
  tags?: string[];
}): Promise<Course | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        ...courseData,
        creator_id: user.user.id,
        is_published: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating course:', error);
    toast.error('Failed to create course');
    return null;
  }
};

// Update course
export const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating course:', error);
    toast.error('Failed to update course');
    return null;
  }
};

// Fetch all courses
export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

// Fetch published courses
export const fetchPublishedCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching published courses:', error);
    return [];
  }
};

// Delete course
export const deleteCourse = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    toast.error('Failed to delete course');
    return false;
  }
};

// Fetch course by ID
export const fetchCourseById = async (id: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

// Create module
export const createModule = async (moduleData: {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
}): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([moduleData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating module:', error);
    toast.error('Failed to create module');
    return null;
  }
};

// Update module
export const updateModule = async (id: string, updates: Partial<CourseModule>): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating module:', error);
    toast.error('Failed to update module');
    return null;
  }
};

// Delete module
export const deleteModule = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting module:', error);
    toast.error('Failed to delete module');
    return false;
  }
};

// Create lesson
export const createLesson = async (lessonData: {
  module_id: string;
  title: string;
  description?: string;
  content_type: string;
  video_url?: string;
  content?: any;
  order_index: number;
}): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert([lessonData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating lesson:', error);
    toast.error('Failed to create lesson');
    return null;
  }
};

// Update lesson
export const updateLesson = async (id: string, updates: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating lesson:', error);
    toast.error('Failed to update lesson');
    return null;
  }
};

// Delete lesson
export const deleteLesson = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    toast.error('Failed to delete lesson');
    return false;
  }
};

// Fetch course with modules and lessons
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<Course | null> => {
  try {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        *,
        lessons (*)
      `)
      .eq('course_id', courseId)
      .order('order_index');

    if (modulesError) throw modulesError;

    return {
      ...course,
      modules: modules || []
    };
  } catch (error) {
    console.error('Error fetching course with modules:', error);
    return null;
  }
};

// Create quiz
export const createQuiz = async (quizData: {
  lesson_id?: string;
  module_id?: string;
  title: string;
  description?: string;
  passing_score: number;
}): Promise<Quiz | null> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quizData])
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

// Create quiz question
export const createQuizQuestion = async (questionData: {
  quiz_id: string;
  question: string;
  order_index: number;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert([questionData])
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

// Create quiz answer
export const createQuizAnswer = async (answerData: {
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('quiz_answers')
      .insert([answerData])
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

// Check enrollment status
export const checkEnrollmentStatus = async (courseId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
};

// Enroll in course
export const enrollInCourse = async (courseId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('course_enrollments')
      .insert([{
        course_id: courseId,
        user_id: user.user.id,
        payment_status: 'completed'
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    toast.error('Failed to enroll in course');
    return false;
  }
};
