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
  is_completed?: boolean;
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

export interface CoursePreview {
  id: string;
  course_id: string;
  preview_video_url?: string;
  preview_video_path?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningOutcome {
  id: string;
  course_id: string;
  outcome: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

// Constants
export const VALID_CATEGORIES = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Health',
  'Fitness',
  'Music',
  'Education',
  'Language',
  'Other'
];

export const VALID_DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

// Course operations
export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchPublishedCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAllCourses(): Promise<Course[]> {
  return fetchCourses();
}

export async function fetchCreatorCourses(creatorId?: string): Promise<Course[]> {
  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      query = query.eq('creator_id', user.id);
    }
  }

  const { data, error } = await query;

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

export async function fetchCourseDetails(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_previews (*),
      course_learning_outcomes (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCourseWithModulesAndLessons(courseId: string): Promise<Course | null> {
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select(`
      *,
      course_previews (*),
      course_learning_outcomes (*)
    `)
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

export async function fetchCourseEnrollment(courseId: string, userId: string): Promise<any> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function fetchModuleLessons(courseId: string, userId: string): Promise<CourseModule[]> {
  const { data: modulesData, error: modulesError } = await supabase
    .from('course_modules')
    .select(`
      *,
      lessons (*)
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modulesError) throw modulesError;

  // Sort lessons within each module and add completion status
  const sortedModules = (modulesData || []).map(module => ({
    ...module,
    lessons: (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => ({
      ...lesson,
      is_completed: false // This would be fetched from lesson_progress table in real implementation
    }))
  }));

  return sortedModules;
}

export async function checkEnrollmentStatus(courseId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function enrollInCourse(courseId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      course_id: courseId,
      user_id: user.id,
      payment_status: 'completed',
      enrollment_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return !!data;
}

export async function createCourse(courseData: {
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
  tags?: string[];
}): Promise<Course> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...courseData,
      creator_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData as any)
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
export async function createModule(moduleData: {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
}): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('course_modules')
    .insert(moduleData)
    .select()
    .single();

  if (error) throw error;
  return { ...data, lessons: [] };
}

export async function updateModule(id: string, moduleData: Partial<CourseModule>): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('course_modules')
    .update(moduleData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, lessons: [] };
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
export async function createLesson(lessonData: {
  module_id: string;
  title: string;
  description?: string;
  content_type?: string;
  video_url?: string;
  content?: any;
  materials_urls?: string[];
  order_index: number;
}): Promise<Lesson> {
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
    .update(lessonData as any)
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
export async function createQuiz(quizData: {
  title: string;
  description?: string;
  lesson_id?: string;
  module_id?: string;
  passing_score?: number;
}): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createQuizQuestion(questionData: {
  quiz_id: string;
  question: string;
  order_index: number;
}): Promise<QuizQuestion> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert(questionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createQuizAnswer(answerData: {
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}): Promise<QuizAnswer> {
  const { data, error } = await supabase
    .from('quiz_answers')
    .insert(answerData)
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

export async function fetchCourseReviews(courseId: string): Promise<CourseReview[]> {
  const { data, error } = await supabase
    .from('course_reviews')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        username
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCourseReview(reviewData: {
  course_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
}): Promise<CourseReview> {
  const { data, error } = await supabase
    .from('course_reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourseReview(reviewId: string, reviewData: {
  rating: number;
  review_text?: string;
}): Promise<CourseReview> {
  const { data, error } = await supabase
    .from('course_reviews')
    .update(reviewData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourseReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase
    .from('course_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
  return true;
}
