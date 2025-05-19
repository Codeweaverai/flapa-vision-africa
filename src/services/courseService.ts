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

export interface CourseWithModules extends Course {
  modules: (CourseModule & {
    lessons: (Lesson & {
      quizzes?: Quiz[];
    })[];
    quiz?: Quiz; // Added quiz property for module level quizzes
  })[];
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
  quiz?: Quiz; // Added quiz property for module level quizzes
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

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  completion_date?: string;
  last_position_seconds: number;
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

// Add a function to create a course with creator_id
export const createCourseWithCreator = async (courseData: Partial<Course>, creatorId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{ ...courseData, creator_id: creatorId }])
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

// Function to fetch all courses
export const fetchAllCourses = async (creatorId?: string): Promise<Course[]> => {
  try {
    let query = supabase.from('courses').select('*');
    
    // If creatorId is provided, filter by it
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }

    return data as Course[];
  } catch (error) {
    console.error('Error in fetchAllCourses:', error);
    return [];
  }
};

// Function to fetch published courses
export const fetchPublishedCourses = async (): Promise<Course[]> => {
  try {
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
  } catch (error) {
    console.error('Error fetching published courses:', error);
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
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<CourseWithModules | null> => {
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
      
      // Check if the module has a quiz
      const { data: moduleQuizzes, error: moduleQuizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', module.id);
      
      if (moduleQuizzesError) throw moduleQuizzesError;
      
      return {
        ...module,
        lessons: lessonsWithQuizzes || [],
        quiz: moduleQuizzes && moduleQuizzes.length > 0 ? moduleQuizzes[0] : undefined
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

// Update an existing quiz
export const updateQuiz = async (
  quizId: string,
  quizData: Partial<Quiz>
): Promise<Quiz | null> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update(quizData)
      .eq('id', quizId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quiz:', error);
    return null;
  }
};

// Delete a quiz
export const deleteQuiz = async (quizId: string): Promise<boolean> => {
  try {
    // First delete all questions associated with this quiz
    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', quizId);
    
    if (questionsError) throw questionsError;
    
    // Then delete the quiz
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return false;
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

// User enrollment related functions
export const enrollInCourse = async (courseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('course_enrollments')
      .insert([{
        course_id: courseId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        payment_status: 'completed'
      }]);
    
    if (error) {
      console.error('Error enrolling in course:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return false;
  }
};

export const checkEnrollmentStatus = async (courseId: string): Promise<boolean> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();
    
    if (error) return false;
    
    return !!data;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
};

// Lesson progress tracking functions
export const saveLessonProgress = async (
  enrollmentId: string,
  lessonId: string,
  positionSeconds: number,
  isCompleted: boolean = false
): Promise<LessonProgress | null> => {
  try {
    // Check if progress record exists
    const { data: existingProgress, error: fetchError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw fetchError;
    }
    
    if (existingProgress) {
      // Update existing progress
      const updateData: any = { last_position_seconds: positionSeconds };
      if (isCompleted && !existingProgress.is_completed) {
        updateData.is_completed = true;
        updateData.completion_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .update(updateData)
        .eq('id', existingProgress.id)
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    } else {
      // Create new progress record
      const newProgressData = {
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        last_position_seconds: positionSeconds,
        is_completed: isCompleted,
        completion_date: isCompleted ? new Date().toISOString() : null
      };
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .insert([newProgressData])
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return null;
  }
};

// Function to upload course thumbnail
export const uploadCourseThumbnail = async (courseId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}-thumbnail.${fileExt}`;
    const filePath = `courses/${courseId}/${fileName}`;
    
    const { error } = await supabase
      .storage
      .from('course_materials')
      .upload(filePath, file, {
        upsert: true
      });
    
    if (error) throw error;
    
    const { data } = supabase
      .storage
      .from('course_materials')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading course thumbnail:', error);
    return null;
  }
};
