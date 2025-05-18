import { supabase } from "@/lib/supabaseClient";

// Course Type Interfaces
export interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  difficulty_level: string;
  category: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  is_published: boolean;
  certificate_enabled: boolean;
  thumbnail_url?: string;
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
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  video_url?: string;
  materials_urls?: string[];
  order_index: number;
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

// Function to create a new course
export const createCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};

// Function to fetch all courses
export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

// Function to fetch a single course by ID
export const fetchCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    return null;
  }
};

// Function to update an existing course
export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating course:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating course:', error);
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

    if (error) {
      console.error('Error deleting course:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    return false;
  }
};

// Function to fetch a course with all its modules and lessons
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<Course | null> => {
  try {
    // First fetch the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;
    
    // Then fetch modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (modulesError) throw modulesError;
    
    // For each module, fetch its lessons
    const modulesWithLessons = await Promise.all(modules.map(async (module) => {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index', { ascending: true });
      
      if (lessonsError) throw lessonsError;
      
      // For each lesson, check if it has a quiz
      const lessonsWithQuizzes = await Promise.all(lessons.map(async (lesson) => {
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('lesson_id', lesson.id);
        
        if (quizzesError) throw quizzesError;
        
        return {
          ...lesson,
          quizzes: quizzes || []
        };
      }));
      
      return {
        ...module,
        lessons: lessonsWithQuizzes || []
      };
    }));
    
    return {
      ...course,
      modules: modulesWithLessons
    };
  } catch (error) {
    console.error('Error fetching course with modules and lessons:', error);
    return null;
  }
};

// Create a new module
export const createModule = async (moduleData: {
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([moduleData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating module:', error);
    return null;
  }
};

// Update an existing module
export const updateModule = async (
  moduleId: string, 
  moduleData: { 
    title?: string;
    description?: string | null;
    order_index?: number;
  }
): Promise<CourseModule | null> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(moduleData)
      .eq('id', moduleId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating module:', error);
    return null;
  }
};

// Delete a module
export const deleteModule = async (moduleId: string): Promise<boolean> => {
  try {
    // First delete all lessons associated with this module
    const { error: lessonsError } = await supabase
      .from('lessons')
      .delete()
      .eq('module_id', moduleId);
    
    if (lessonsError) throw lessonsError;
    
    // Then delete the module
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting module:', error);
    return false;
  }
};

// Create a new lesson
export const createLesson = async (lessonData: {
  module_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  materials_urls?: string[];
  order_index: number;
}): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert([lessonData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating lesson:', error);
    return null;
  }
};

// Update an existing lesson
export const updateLesson = async (
  lessonId: string, 
  lessonData: { 
    title?: string;
    description?: string | null;
    video_url?: string | null;
    materials_urls?: string[];
    order_index?: number;
  }
): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating lesson:', error);
    return null;
  }
};

// Delete a lesson
export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  try {
    // Delete the lesson
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
};

// Create a new quiz
export const createQuiz = async (quizData: {
  title: string;
  description?: string;
  lesson_id?: string;
  module_id?: string;
  passing_score: number;
}): Promise<Quiz | null> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quizData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quiz:', error);
    return null;
  }
};

// Create a new quiz question
export const createQuizQuestion = async (questionData: {
  quiz_id: string;
  question: string;
  order_index: number;
}): Promise<QuizQuestion | null> => {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert([questionData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quiz question:', error);
    return null;
  }
};

// Create a new quiz answer
export const createQuizAnswer = async (answerData: {
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}): Promise<QuizAnswer | null> => {
  try {
    const { data, error } = await supabase
      .from('quiz_answers')
      .insert([answerData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quiz answer:', error);
    return null;
  }
};
