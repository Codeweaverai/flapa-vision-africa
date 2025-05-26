
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
  order_index: number;
  materials_urls?: string[];
  created_at?: string;
  updated_at?: string;
  quizzes?: Quiz[];
}

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

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  is_completed: boolean;
  completion_date?: string;
  payment_status: string;
  payment_id?: string;
}

export const VALID_DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

// Course functions
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

export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all courses:', error);
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
    console.error('Error fetching course by id:', error);
    return null;
  }
};

export const fetchCourseDetails = async (id: string): Promise<Course | null> => {
  return fetchCourseById(id);
};

export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<Course | null> => {
  try {
    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        *,
        lessons (
          *,
          quizzes (*)
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    // Sort lessons within each module
    const sortedModules = modules?.map(module => ({
      ...module,
      lessons: module.lessons?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    })) || [];

    return {
      ...course,
      modules: sortedModules
    };
  } catch (error) {
    console.error('Error fetching course with modules and lessons:', error);
    return null;
  }
};

export const createCourse = async (courseData: Partial<Course>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
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

export const createCourseWithCreator = async (
  courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>,
  creatorId: string
): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{ ...courseData, creator_id: creatorId }])
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

// Module functions
export const createModule = async (moduleData: Partial<CourseModule>): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([moduleData])
      .select()
      .single();
      
    if (error) throw error;
    return { ...data, lessons: [] };
  } catch (error) {
    console.error('Error creating module:', error);
    return null;
  }
};

export const updateModule = async (id: string, moduleData: Partial<CourseModule>): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(moduleData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return { ...data, lessons: [] };
  } catch (error) {
    console.error('Error updating module:', error);
    return null;
  }
};

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
    return false;
  }
};

export const updateModuleOrder = async (id: string, orderIndex: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('course_modules')
      .update({ order_index: orderIndex })
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating module order:', error);
    return false;
  }
};

// Lesson functions
export const createLesson = async (lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    // Get the next order index
    const { data: existingLessons, error: countError } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('module_id', lessonData.module_id)
      .order('order_index', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextOrderIndex = existingLessons && existingLessons.length > 0 
      ? existingLessons[0].order_index + 1 
      : 0;

    const { data, error } = await supabase
      .from('lessons')
      .insert([{ ...lessonData, order_index: nextOrderIndex }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating lesson:', error);
    return null;
  }
};

export const updateLesson = async (id: string, lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating lesson:', error);
    return null;
  }
};

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
    return false;
  }
};

export const fetchModuleLessons = async (moduleId: string): Promise<Lesson[]> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching module lessons:', error);
    return [];
  }
};

// Quiz functions
export const createQuiz = async (quizData: Partial<Quiz>): Promise<Quiz | null> => {
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
    return null;
  }
};

export const createQuizQuestion = async (questionData: Partial<QuizQuestion>): Promise<QuizQuestion | null> => {
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
    return null;
  }
};

export const createQuizAnswer = async (answerData: Partial<QuizAnswer>): Promise<QuizAnswer | null> => {
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
    return null;
  }
};

// Enrollment functions
export const checkEnrollmentStatus = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
};

export const enrollInCourse = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('course_enrollments')
      .insert([{
        course_id: courseId,
        user_id: userId,
        payment_status: 'completed'
      }]);
      
    if (error) throw error;
    toast.success('Successfully enrolled in course');
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    toast.error('Failed to enroll in course');
    return false;
  }
};

export const fetchCourseEnrollment = async (courseId: string, userId: string): Promise<CourseEnrollment | null> => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching course enrollment:', error);
    return null;
  }
};
