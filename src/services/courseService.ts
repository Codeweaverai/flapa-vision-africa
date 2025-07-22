import { supabase } from "@/lib/supabaseClient";

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

export const createQuiz = async (quizData: {
  title: string;
  description?: string;
  lesson_id: string;
  module_id: string;
  passing_score: number;
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
