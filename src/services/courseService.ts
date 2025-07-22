import { supabase } from "@/lib/supabaseClient";

// Type definitions
export interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  currency?: string;
  is_free: boolean;
  is_published: boolean;
  certificate_enabled: boolean;
  thumbnail_url: string | null;
  creator_id: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: string;
  video_url: string | null;
  content: any;
  materials_urls: string[] | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: string;
  lesson_id: string;
  module_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
  explanation: string | null;
  created_at: string;
  updated_at: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Constants
export const VALID_CATEGORIES = [
  'Technology',
  'Business',
  'Marketing',
  'Design',
  'Health',
  'Finance',
  'Education',
  'Arts',
  'Science',
  'Languages'
];

export const VALID_DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
];

// Course functions
export const getCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
};

export const getCourse = async (id: string) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const fetchCourseById = async (id: string): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return data;
};

export const fetchAllCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return data || [];
};

export const fetchPublishedCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published courses:', error);
    return [];
  }

  return data || [];
};

export const createCourse = async (courseData: Partial<Course>): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteCourse = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    return false;
  }

  return true;
};

export const fetchCourseWithModulesAndLessons = async (courseId: string) => {
  // First get the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError) {
    console.error('Error fetching course:', courseError);
    return null;
  }

  // Then get modules with lessons
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

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return { ...course, modules: [] };
  }

  return { ...course, modules: modules || [] };
};

// Module functions
export const getCourseModules = async (courseId: string) => {
  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

export const createModule = async (moduleData: {
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}): Promise<CourseModule | null> => {
  const { data, error } = await supabase
    .from('course_modules')
    .insert(moduleData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateModule = async (id: string, moduleData: Partial<CourseModule>): Promise<CourseModule | null> => {
  const { data, error } = await supabase
    .from('course_modules')
    .update(moduleData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteModule = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting module:', error);
    return false;
  }

  return true;
};

export const updateModuleOrder = async (moduleId: string, newOrder: number): Promise<boolean> => {
  const { error } = await supabase
    .from('course_modules')
    .update({ order_index: newOrder })
    .eq('id', moduleId);

  if (error) {
    console.error('Error updating module order:', error);
    return false;
  }

  return true;
};

// Lesson functions
export const getLessonsByModuleId = async (moduleId: string) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

export const getLesson = async (id: string) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createLesson = async (lessonData: {
  module_id: string;
  title: string;
  description?: string | null;
  content_type: string;
  video_url?: string | null;
  content?: any;
  materials_urls?: string[] | null;
  order_index: number;
}): Promise<Lesson | null> => {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lessonData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateLesson = async (id: string, lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  const { data, error } = await supabase
    .from('lessons')
    .update(lessonData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteLesson = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }

  return true;
};

// Quiz functions
export const createQuiz = async (quizData: {
  title: string;
  description?: string;
  lesson_id: string;
  module_id: string;
  passing_score: number;
  time_limit_minutes?: number;
}) => {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createQuizQuestion = async (questionData: {
  quiz_id: string;
  question: string;
  order_index: number;
  explanation?: string;
}) => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert(questionData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createQuizAnswer = async (answerData: {
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}) => {
  const { data, error } = await supabase
    .from('quiz_answers')
    .insert(answerData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getQuizWithQuestions = async (quizId: string) => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions (
        *,
        quiz_answers (*)
      )
    `)
    .eq('id', quizId)
    .single();

  if (error) throw error;
  return data;
};

export const getLessonNotes = async (lessonId: string, userId: string) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data;
};

export const createLessonNote = async (lessonId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .insert([{ lesson_id: lessonId, user_id: userId, content: content }])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateLessonNote = async (id: string, content: string) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .update({ content: content })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteLessonNote = async (id: string) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return data;
};

export const getCourseEnrollment = async (courseId: string, userId: string) => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();

  if (error) {
    // Check if the error is because no record was found
    if (error.code === 'PGRST116') {
      return null; // Return null to indicate no enrollment found
    }
    throw error; // Throw other errors
  }

  return data;
};

export const enrollInCourse = async (courseId: string, userId: string) => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .insert([{ course_id: courseId, user_id: userId }])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getCompletedLessons = async (courseId: string, userId: string) => {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('course_id', courseId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data ? data.map(item => item.lesson_id) : [];
};

export const markLessonComplete = async (courseId: string, lessonId: string, userId: string) => {
  // First, check if the lesson is already marked as complete
  const { data: existingProgress, error: selectError } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .eq('user_id', userId);

  if (selectError) {
    throw selectError;
  }

  if (existingProgress && existingProgress.length > 0) {
    // Lesson already marked as complete, return existing record
    return existingProgress[0];
  } else {
    // Lesson not yet marked as complete, insert new record
    const { data, error } = await supabase
      .from('lesson_progress')
      .insert([{ course_id: courseId, lesson_id: lessonId, user_id: userId }])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
};

export const getFinalExam = async (courseId: string) => {
  const { data, error } = await supabase
    .from('final_exams')
    .select('*')
    .eq('course_id', courseId)
    .single();

  if (error) {
    // Check if the error is because no record was found
    if (error.code === 'PGRST116') {
      return null; // Return null to indicate no exam found
    }
    throw error; // Throw other errors
  }

  return data;
};

export const getFinalExamResult = async (examId: string, userId: string) => {
  const { data, error } = await supabase
    .from('final_exam_results')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .single();

  if (error) {
    // Check if the error is because no record was found
    if (error.code === 'PGRST116') {
      return null; // Return null to indicate no result found
    }
    throw error; // Throw other errors
  }

  return data;
};
