import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// Define all necessary types
export interface Course {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  price?: number;
  is_free: boolean;
  currency?: string;
  image_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  duration?: number;
  duration_unit?: string;
  level?: string;
  category?: string;
  difficulty_level?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  published?: boolean;
  is_published?: boolean;
  certificate_enabled?: boolean;
  modules?: CourseModule[];
}

export interface CourseWithEnrollment extends Course {
  description: string;
  enrollment?: Enrollment;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  course_id: string;
  lessons?: Lesson[];
  created_at?: string;
  updated_at?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  module_id: string;
  video_url?: string;
  order_index: number;
  content_type?: string;
  content?: any;
  materials_urls?: string[];
  quizzes?: Quiz[];
  created_at?: string;
  updated_at?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lesson_id?: string;
  module_id?: string;
  passing_score: number;
  questions?: QuizQuestion[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
  answers?: QuizAnswer[];
  created_at?: string;
  updated_at?: string;
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

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  completion_date?: string;
  progress?: number;
  is_completed?: boolean;
  certificate_id?: string;
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  last_position_seconds: number;
  completion_date?: string;
}

// Interface for saving progress
export interface LessonProgressUpdate {
  is_completed?: boolean;
  last_position_seconds?: number;
}

export const VALID_DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels'
];

// Function to fetch courses for a specific user/student
export const fetchUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:course_id(*)
      `)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user courses:', error);
      toast.error('Failed to load your courses');
      return [];
    }
    
    // Extract the course data from the enrollments
    const courses = data?.map(enrollment => enrollment.course) || [];
    return courses;
  } catch (error) {
    console.error('Error in fetchUserCourses:', error);
    toast.error('Failed to load your courses');
    return [];
  }
};

// Function to fetch all published courses
export const fetchPublishedCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching published courses:', error);
      toast.error('Failed to load courses');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchPublishedCourses:', error);
    toast.error('Failed to load courses');
    return [];
  }
};

// Function to fetch all courses for admin
export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all courses:', error);
      toast.error('Failed to load courses');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllCourses:', error);
    toast.error('Failed to load courses');
    return [];
  }
};

// Function to fetch courses created by a specific creator
export const fetchCreatorCourses = async (creatorId: string): Promise<Course[]> => {
  try {
    if (!creatorId) {
      throw new Error('Creator ID is required');
    }
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator courses:', error);
      toast.error('Failed to load courses');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCreatorCourses:', error);
    toast.error('Failed to load courses');
    return [];
  }
};

// Function to delete a course
export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
      return false;
    }

    toast.success('Course deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    toast.error('Failed to delete course');
    return false;
  }
};

// Function to create a new course
export const createNewCourse = async (courseData: Partial<Course>, creatorId: string): Promise<Course | null> => {
  try {
    // Ensure all required fields are present
    if (!courseData.title || !courseData.description || !courseData.category || 
        !courseData.difficulty_level || courseData.duration_minutes === undefined) {
      console.error('Error creating course: Missing required fields');
      toast.error('Please fill in all required fields');
      return null;
    }
    
    // Create the complete course object with required fields
    const courseWithCreator = {
      title: courseData.title,
      description: courseData.description,
      summary: courseData.summary || courseData.title, // Provide a default summary if not provided
      category: courseData.category,
      difficulty_level: courseData.difficulty_level,
      duration_minutes: courseData.duration_minutes,
      creator_id: creatorId,
      is_published: courseData.is_published || false,
      published: courseData.is_published || false, // To handle both property names
      is_free: courseData.is_free !== undefined ? courseData.is_free : true,
      price: courseData.is_free ? 0 : (courseData.price || 0),
      currency: courseData.is_free ? null : (courseData.currency || 'USD'),
      thumbnail_url: courseData.thumbnail_url || null,
      tags: courseData.tags || [],
      certificate_enabled: courseData.certificate_enabled || false
    };

    // Log the course data for debugging
    console.log('Sending course data to Supabase:', courseWithCreator);

    const { data, error } = await supabase
      .from('courses')
      .insert(courseWithCreator)
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      toast.error(`Failed to create course: ${error.message}`);
      throw error;
    }

    toast.success('Course created successfully!');
    return data as Course;
  } catch (error: any) {
    console.error('Error in createNewCourse:', error);
    toast.error(`Failed to create course: ${error.message || 'Unknown error'}`);
    return null;
  }
};

// Function to create a course with a creator
export const createCourseWithCreator = async (courseData: Partial<Course>, creatorId: string): Promise<Course | null> => {
  return createNewCourse(courseData, creatorId);
};

// Function to update an existing course
export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course | null> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return null;
    }

    // Adjust price and currency based on is_free flag
    if (courseData.is_free) {
      courseData.price = null;
      courseData.currency = null;
    }

    // Make sure both naming conventions are updated
    if (courseData.is_published !== undefined) {
      courseData.published = courseData.is_published;
    }

    if (courseData.published !== undefined) {
      courseData.is_published = courseData.published;
    }

    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
      return null;
    }

    toast.success('Course updated successfully');
    return data;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    toast.error('Failed to update course');
    return null;
  }
};

// Function to fetch a single course by ID
export const fetchCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return null;
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchCourseById:', error);
    toast.error('Failed to load course');
    return null;
  }
};

// Function to fetch a course with its modules and lessons
export const fetchCourseWithModulesAndLessons = async (courseId: string): Promise<Course | null> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return null;
    }

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      toast.error('Failed to load course');
      return null;
    }

    if (!course) {
      toast.error('Course not found');
      return null;
    }

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      toast.error('Failed to load course modules');
      return course;
    }

    // Fetch lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('*, quizzes(*)')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });

        if (lessonsError) {
          console.error(`Error fetching lessons for module ${module.id}:`, lessonsError);
          return { ...module, lessons: [] };
        }

        return { ...module, lessons: lessons || [] };
      })
    );

    // Return course with modules and lessons
    return { ...course, modules: modulesWithLessons };
  } catch (error) {
    console.error('Error in fetchCourseWithModulesAndLessons:', error);
    toast.error('Failed to load course content');
    return null;
  }
};

// Function to enroll a user in a course
export const enrollInCourse = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    if (!courseId || !userId) {
      toast.error('Course ID and User ID are required');
      return false;
    }

    // Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking enrollment:', checkError);
      toast.error('Failed to check enrollment status');
      return false;
    }

    if (existingEnrollment) {
      toast.info('You are already enrolled in this course');
      return true;
    }

    // Create new enrollment
    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        user_id: userId,
        enrollment_date: new Date().toISOString(),
        progress: 0,
        is_completed: false,
        payment_status: 'pending' // Will be updated after payment
      });

    if (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
      return false;
    }

    toast.success('Successfully enrolled in course');
    return true;
  } catch (error) {
    console.error('Error in enrollInCourse:', error);
    toast.error('Failed to enroll in course');
    return false;
  }
};

// Check if a user is enrolled in a course
export const checkEnrollmentStatus = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    if (!courseId || !userId) {
      return false;
    }

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking enrollment status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkEnrollmentStatus:', error);
    return false;
  }
};

// Function to update course progress
export const updateCourseProgress = async (
  enrollmentId: string, 
  progress: number, 
  isCompleted: boolean = false
): Promise<boolean> => {
  try {
    if (!enrollmentId) {
      toast.error('Enrollment ID is required');
      return false;
    }

    const updates: any = { progress };
    
    if (isCompleted) {
      updates.is_completed = true;
      updates.completion_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('course_enrollments')
      .update(updates)
      .eq('id', enrollmentId);

    if (error) {
      console.error('Error updating course progress:', error);
      toast.error('Failed to update progress');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCourseProgress:', error);
    toast.error('Failed to update progress');
    return false;
  }
};

// Function to fetch all enrollments for a course
export const fetchCourseEnrollments = async (courseId: string): Promise<Enrollment[]> => {
  try {
    if (!courseId) {
      toast.error('Course ID is required');
      return [];
    }

    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        profiles:user_id(id, full_name, email)
      `)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching course enrollments:', error);
      toast.error('Failed to load enrollments');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCourseEnrollments:', error);
    toast.error('Failed to load enrollments');
    return [];
  }
};

// Module functions
export const createModule = async (moduleData: Partial<CourseModule>): Promise<CourseModule | null> => {
  try {
    if (!moduleData.course_id || !moduleData.title) {
      toast.error('Course ID and module title are required');
      return null;
    }

    // Ensure required fields exist
    const module = {
      course_id: moduleData.course_id,
      title: moduleData.title,
      order_index: moduleData.order_index || 0,
      description: moduleData.description
    };

    const { data, error } = await supabase
      .from('course_modules')
      .insert(module)
      .select()
      .single();

    if (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createModule:', error);
    toast.error('Failed to create module');
    return null;
  }
};

export const updateModule = async (moduleId: string, moduleData: Partial<CourseModule>): Promise<CourseModule | null> => {
  try {
    // Ensure we're not passing partial data that's missing required fields
    if (!moduleData.title || moduleData.order_index === undefined || !moduleData.course_id) {
      throw new Error('Missing required fields for module update');
    }

    const { data, error } = await supabase
      .from('course_modules')
      .update({
        title: moduleData.title,
        description: moduleData.description,
        order_index: moduleData.order_index,
        course_id: moduleData.course_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select()
      .single();

    if (error) throw error;
    return data as CourseModule;
  } catch (error) {
    console.error('Error updating module:', error);
    return null;
  }
};

export const deleteModule = async (moduleId: string): Promise<boolean> => {
  try {
    // Delete module lessons first to maintain referential integrity
    const { error: lessonsError } = await supabase
      .from('lessons')
      .delete()
      .eq('module_id', moduleId);

    if (lessonsError) {
      console.error('Error deleting module lessons:', lessonsError);
      toast.error('Failed to delete module lessons');
      return false;
    }

    // Delete the module
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteModule:', error);
    toast.error('Failed to delete module');
    return false;
  }
};

// Lesson functions
export const createLesson = async (lessonData: Partial<Lesson>): Promise<Lesson | null> => {
  try {
    // Validate required fields
    if (!lessonData.title || !lessonData.module_id || lessonData.order_index === undefined) {
      throw new Error('Missing required fields for lesson creation');
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        title: lessonData.title,
        description: lessonData.description || '',
        module_id: lessonData.module_id,
        order_index: lessonData.order_index,
        video_url: lessonData.video_url || null,
        content_type: lessonData.content_type || 'video',
        materials_urls: lessonData.materials_urls || [],
        content: lessonData.content || {}
      })
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
    if (!lessonId) {
      toast.error('Lesson ID is required');
      return null;
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateLesson:', error);
    toast.error('Failed to update lesson');
    return null;
  }
};

export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  try {
    // Delete lesson quizzes first to maintain referential integrity
    const { data: quizzes, error: quizzesQueryError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('lesson_id', lessonId);

    if (!quizzesQueryError && quizzes && quizzes.length > 0) {
      for (const quiz of quizzes) {
        // Delete quiz answers and questions
        await deleteQuiz(quiz.id);
      }
    }

    // Delete the lesson
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteLesson:', error);
    toast.error('Failed to delete lesson');
    return false;
  }
};

export const saveLessonProgress = async (
  enrollmentId: string,
  lessonId: string,
  progressData: { is_completed?: boolean; last_position_seconds?: number }
): Promise<boolean> => {
  try {
    const { data: existingProgress, error: fetchError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingProgress) {
      // Update existing progress
      const updateData: any = {};
      if (progressData.is_completed !== undefined) {
        updateData.is_completed = progressData.is_completed;
      }
      if (progressData.last_position_seconds !== undefined) {
        updateData.last_position_seconds = progressData.last_position_seconds;
      }
      
      const { error: updateError } = await supabase
        .from('lesson_progress')
        .update(updateData)
        .eq('id', existingProgress.id);

      if (updateError) throw updateError;
    } else {
      // Create new progress record
      const { error: insertError } = await supabase
        .from('lesson_progress')
        .insert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          is_completed: progressData.is_completed || false,
          last_position_seconds: progressData.last_position_seconds || 0
        });

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return false;
  }
};

// Quiz functions
export const createQuiz = async (quizData: Partial<Quiz>): Promise<Quiz | null> => {
  try {
    // Validate required fields
    if (!quizData.title) {
      throw new Error('Quiz title is required');
    }
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title: quizData.title,
        description: quizData.description || '',
        module_id: quizData.module_id || null,
        lesson_id: quizData.lesson_id || null,
        passing_score: quizData.passing_score || 70
      })
      .select()
      .single();

    if (error) throw error;
    return data as Quiz;
  } catch (error) {
    console.error('Error creating quiz:', error);
    return null;
  }
};

export const createQuizQuestion = async (questionData: Partial<QuizQuestion>): Promise<QuizQuestion | null> => {
  try {
    if (!questionData.quiz_id || !questionData.question) {
      toast.error('Quiz ID and question text are required');
      return null;
    }

    // Ensure required fields exist
    const question = {
      quiz_id: questionData.quiz_id,
      question: questionData.question,
      order_index: questionData.order_index || 0
    };

    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz question:', error);
      toast.error('Failed to create quiz question');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createQuizQuestion:', error);
    toast.error('Failed to create quiz question');
    return null;
  }
};

export const createQuizAnswer = async (answerData: Partial<QuizAnswer>): Promise<QuizAnswer | null> => {
  try {
    if (!answerData.question_id || !answerData.answer) {
      toast.error('Question ID and answer text are required');
      return null;
    }

    // Ensure required fields exist
    const answer = {
      question_id: answerData.question_id,
      answer: answerData.answer,
      is_correct: answerData.is_correct || false,
      order_index: answerData.order_index || 0
    };

    const { data, error } = await supabase
      .from('quiz_answers')
      .insert(answer)
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz answer:', error);
      toast.error('Failed to create quiz answer');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createQuizAnswer:', error);
    toast.error('Failed to create quiz answer');
    return null;
  }
};

export const deleteQuiz = async (quizId: string): Promise<boolean> => {
  try {
    // Get quiz questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', quizId);

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError);
      toast.error('Failed to delete quiz');
      return false;
    }

    // Delete answers for each question
    if (questions && questions.length > 0) {
      for (const question of questions) {
        const { error: answersError } = await supabase
          .from('quiz_answers')
          .delete()
          .eq('question_id', question.id);

        if (answersError) {
          console.error(`Error deleting answers for question ${question.id}:`, answersError);
        }
      }
    }

    // Delete questions
    const { error: deleteQuestionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', quizId);

    if (deleteQuestionsError) {
      console.error('Error deleting quiz questions:', deleteQuestionsError);
    }

    // Delete the quiz
    const { error: deleteQuizError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (deleteQuizError) {
      console.error('Error deleting quiz:', deleteQuizError);
      toast.error('Failed to delete quiz');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    toast.error('Failed to delete quiz');
    return false;
  }
};

// Helper alias types for backwards compatibility
export type Module = CourseModule;
