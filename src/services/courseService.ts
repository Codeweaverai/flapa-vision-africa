
import { supabase } from '@/lib/supabaseClient';

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
  creator_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lesson_id?: string;
  module_id?: string;
  passing_score: number;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
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

// Course operations
export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCourseWithModulesAndLessons(courseId: string): Promise<Course | null> {
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError) throw courseError;
  if (!courseData) return null;

  const { data: modulesData, error: modulesError } = await supabase
    .from('course_modules')
    .select(`
      *,
      lessons (
        *,
        quizzes (
          id,
          title,
          description,
          passing_score,
          created_at,
          updated_at
        )
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modulesError) throw modulesError;

  // Sort lessons within each module
  const sortedModules = (modulesData || []).map(module => ({
    ...module,
    lessons: (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
  }));

  return {
    ...courseData,
    modules: sortedModules
  };
}

export async function createCourse(courseData: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Module operations
export async function createModule(moduleData: Partial<CourseModule>): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('course_modules')
    .insert(moduleData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateModule(id: string, moduleData: Partial<CourseModule>): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('course_modules')
    .update(moduleData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModule(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function updateModuleOrder(id: string, orderIndex: number): Promise<boolean> {
  const { error } = await supabase
    .from('course_modules')
    .update({ order_index: orderIndex })
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Lesson operations
export async function createLesson(lessonData: Partial<Lesson>): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lessonData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLesson(id: string, lessonData: Partial<Lesson>): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .update(lessonData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Quiz operations
export async function createQuiz(quizData: Partial<Quiz>): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchQuizWithQuestions(quizId: string): Promise<Quiz | null> {
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
}
