
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type Course = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  thumbnail_url: string | null;
  tags: string[] | null;
  price: number | null;
  is_free: boolean | null;
  is_published: boolean | null;
  certificate_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string | null;
  updated_at: string | null;
  lessons?: Lesson[]; // Adding lessons as an optional property for UI convenience
  quiz?: Quiz; // Add quiz to module
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  description: string | null;
  order_index: number;
  materials_urls: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Quiz = {
  id: string;
  module_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  questions?: QuizQuestion[];
  created_at: string | null;
  updated_at: string | null;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
  answers?: QuizAnswer[];
  created_at: string | null;
  updated_at: string | null;
};

export type QuizAnswer = {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
  created_at: string | null;
  updated_at: string | null;
};

export type LessonProgress = {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  last_position_seconds: number;
  completion_date: string | null;
};

export type Certificate = {
  id: string;
  enrollment_id: string;
  verification_code: string;
  pdf_url: string | null;
  issue_date: string | null;
};

export type CourseWithModules = Course & {
  modules: (CourseModule & {
    lessons: Lesson[];
    quiz: Quiz | null;
  })[];
};

// Function to fetch all published courses
export async function fetchPublishedCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    
    return (data as Course[]) || [];
  } catch (error) {
    console.error('Error in fetchPublishedCourses:', error);
    toast({
      title: 'Error',
      description: 'Failed to load courses. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
}

// Function to fetch a course by ID with its modules, lessons, and quizzes
export async function fetchCourseWithModulesAndLessons(courseId: string): Promise<CourseWithModules | null> {
  try {
    // First, get the course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      console.error('Error fetching course:', courseError);
      throw courseError;
    }
    
    if (!course) {
      return null;
    }
    
    // Then, get the modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      throw modulesError;
    }
    
    // For each module, get its lessons and quiz
    const modulesWithLessonsAndQuizzes = await Promise.all(
      (modules || []).map(async (module) => {
        // Fetch lessons for this module
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });
        
        if (lessonsError) {
          console.error(`Error fetching lessons for module ${module.id}:`, lessonsError);
          return { ...module, lessons: [], quiz: null };
        }

        // Fetch quiz for this module
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('module_id', module.id)
          .maybeSingle();

        if (quizError) {
          console.error(`Error fetching quiz for module ${module.id}:`, quizError);
          return { ...module, lessons: lessons || [], quiz: null };
        }

        // If quiz exists, fetch its questions and answers
        let quizWithQuestionsAndAnswers = quiz;
        if (quiz) {
          const { data: questions, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quiz.id)
            .order('order_index', { ascending: true });

          if (questionsError) {
            console.error(`Error fetching questions for quiz ${quiz.id}:`, questionsError);
          } else if (questions && questions.length > 0) {
            // For each question, get its answers
            const questionsWithAnswers = await Promise.all(
              questions.map(async (question) => {
                const { data: answers, error: answersError } = await supabase
                  .from('quiz_answers')
                  .select('*')
                  .eq('question_id', question.id)
                  .order('order_index', { ascending: true });

                if (answersError) {
                  console.error(`Error fetching answers for question ${question.id}:`, answersError);
                  return { ...question, answers: [] };
                }

                return { ...question, answers: answers || [] };
              })
            );

            quizWithQuestionsAndAnswers = {
              ...quiz,
              questions: questionsWithAnswers,
            };
          }
        }
        
        return { 
          ...module, 
          lessons: lessons || [],
          quiz: quizWithQuestionsAndAnswers || null
        };
      })
    );
    
    // Type assertion to ensure correct return type
    return {
      ...(course as Course),
      modules: modulesWithLessonsAndQuizzes as CourseWithModules['modules'],
    };
  } catch (error) {
    console.error('Error in fetchCourseWithModulesAndLessons:', error);
    toast({
      title: 'Error',
      description: 'Failed to load course details. Please try again later.',
      variant: 'destructive',
    });
    return null;
  }
}

// Admin functions for course management
export async function createCourse(courseData: Partial<Course>): Promise<Course | null> {
  try {
    // Ensure required fields have default values and include all required fields
    const dataToInsert = {
      title: courseData.title || '',
      summary: courseData.summary || '',
      description: courseData.description || '',
      category: courseData.category || '',
      difficulty_level: courseData.difficulty_level || 'beginner',
      duration_minutes: courseData.duration_minutes || 0,
      is_published: courseData.is_published ?? false,
      tags: courseData.tags ?? [],
      thumbnail_url: courseData.thumbnail_url ?? null,
      price: courseData.price ?? 0,
      is_free: courseData.is_free ?? true,
      certificate_enabled: courseData.certificate_enabled ?? false
    };
    
    const { data, error } = await supabase
      .from('courses')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Course created successfully',
    });
    
    return data as Course;
  } catch (error) {
    console.error('Error in createCourse:', error);
    return null;
  }
}

export async function updateCourse(courseId: string, courseData: Partial<Course>): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Course updated successfully',
    });
    
    return data as Course;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    return null;
  }
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Course deleted successfully',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    return false;
  }
}

export async function createModule(moduleData: Partial<CourseModule>): Promise<CourseModule | null> {
  try {
    // Ensure all required fields are included
    const dataToInsert = {
      course_id: moduleData.course_id || '',
      title: moduleData.title || '',
      description: moduleData.description ?? null,
      order_index: moduleData.order_index || 0
    };
    
    const { data, error } = await supabase
      .from('course_modules')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating module:', error);
      toast({
        title: 'Error',
        description: 'Failed to create module. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as CourseModule;
  } catch (error) {
    console.error('Error in createModule:', error);
    return null;
  }
}

export async function updateModule(moduleId: string, moduleData: Partial<CourseModule>): Promise<CourseModule | null> {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(moduleData)
      .eq('id', moduleId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating module:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Module updated successfully',
    });
    
    return data as CourseModule;
  } catch (error) {
    console.error('Error in updateModule:', error);
    return null;
  }
}

export async function deleteModule(moduleId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);
    
    if (error) {
      console.error('Error deleting module:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete module. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Module deleted successfully',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteModule:', error);
    return false;
  }
}

export async function createLesson(lessonData: Partial<Lesson>): Promise<Lesson | null> {
  try {
    // Ensure all required fields are included
    const dataToInsert = {
      module_id: lessonData.module_id || '',
      title: lessonData.title || '',
      description: lessonData.description ?? null,
      video_url: lessonData.video_url ?? null,
      order_index: lessonData.order_index || 0,
      materials_urls: lessonData.materials_urls ?? []
    };
    
    const { data, error } = await supabase
      .from('lessons')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lesson. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as Lesson;
  } catch (error) {
    console.error('Error in createLesson:', error);
    return null;
  }
}

export async function updateLesson(lessonId: string, lessonData: Partial<Lesson>): Promise<Lesson | null> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Lesson updated successfully',
    });
    
    return data as Lesson;
  } catch (error) {
    console.error('Error in updateLesson:', error);
    return null;
  }
}

export async function deleteLesson(lessonId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lesson. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Lesson deleted successfully',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteLesson:', error);
    return false;
  }
}

// Quiz management functions
export async function createQuiz(quizData: Partial<Quiz>): Promise<Quiz | null> {
  try {
    const dataToInsert = {
      module_id: quizData.module_id || null,
      lesson_id: quizData.lesson_id || null,
      title: quizData.title || '',
      description: quizData.description || null,
      passing_score: quizData.passing_score || 70
    };
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as Quiz;
  } catch (error) {
    console.error('Error in createQuiz:', error);
    return null;
  }
}

export async function createQuizQuestion(questionData: Partial<QuizQuestion>): Promise<QuizQuestion | null> {
  try {
    const dataToInsert = {
      quiz_id: questionData.quiz_id || '',
      question: questionData.question || '',
      order_index: questionData.order_index || 0
    };
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating quiz question:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz question. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as QuizQuestion;
  } catch (error) {
    console.error('Error in createQuizQuestion:', error);
    return null;
  }
}

export async function createQuizAnswer(answerData: Partial<QuizAnswer>): Promise<QuizAnswer | null> {
  try {
    const dataToInsert = {
      question_id: answerData.question_id || '',
      answer: answerData.answer || '',
      is_correct: answerData.is_correct || false,
      order_index: answerData.order_index || 0
    };
    
    const { data, error } = await supabase
      .from('quiz_answers')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating quiz answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz answer. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    return data as QuizAnswer;
  } catch (error) {
    console.error('Error in createQuizAnswer:', error);
    return null;
  }
}

export async function updateQuiz(quizId: string, quizData: Partial<Quiz>): Promise<Quiz | null> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update(quizData)
      .eq('id', quizId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quiz. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Quiz updated successfully',
    });
    
    return data as Quiz;
  } catch (error) {
    console.error('Error in updateQuiz:', error);
    return null;
  }
}

export async function deleteQuiz(quizId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);
    
    if (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quiz. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
    
    toast({
      title: 'Success',
      description: 'Quiz deleted successfully',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    return false;
  }
}

// Function to track lesson progress
export async function saveLessonProgress(enrollmentId: string, lessonId: string, position: number, completed: boolean = false): Promise<LessonProgress | null> {
  try {
    // Check if a progress record exists
    const { data: existingProgress, error: fetchError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching lesson progress:', fetchError);
      throw fetchError;
    }

    let completionDate = null;
    if (completed) {
      completionDate = new Date().toISOString();
    }
    
    if (existingProgress) {
      // Update existing progress
      const { data: updatedProgress, error: updateError } = await supabase
        .from('lesson_progress')
        .update({
          last_position_seconds: position,
          is_completed: completed || existingProgress.is_completed,
          completion_date: completed ? completionDate : existingProgress.completion_date
        })
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating lesson progress:', updateError);
        throw updateError;
      }
      
      return updatedProgress as LessonProgress;
    } else {
      // Create new progress entry
      const { data: newProgress, error: insertError } = await supabase
        .from('lesson_progress')
        .insert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          last_position_seconds: position,
          is_completed: completed,
          completion_date: completed ? completionDate : null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating lesson progress:', insertError);
        throw insertError;
      }
      
      return newProgress as LessonProgress;
    }
  } catch (error) {
    console.error('Error in saveLessonProgress:', error);
    return null;
  }
}

// Function to check course completion and issue certificate
export async function checkCourseCompletion(courseId: string, enrollmentId: string): Promise<boolean> {
  try {
    // Get all lessons for the course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId);
    
    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      throw modulesError;
    }
    
    if (!modules || modules.length === 0) {
      return false;
    }
    
    const moduleIds = modules.map(m => m.id);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .in('module_id', moduleIds);
    
    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }
    
    if (!lessons || lessons.length === 0) {
      return false;
    }
    
    const lessonIds = lessons.map(l => l.id);
    
    // Get completed lessons for this enrollment
    const { data: completedLessons, error: completedError } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .eq('is_completed', true)
      .in('lesson_id', lessonIds);
    
    if (completedError) {
      console.error('Error fetching completed lessons:', completedError);
      throw completedError;
    }
    
    // Check if all lessons are completed
    const allLessonsCompleted = completedLessons && completedLessons.length === lessons.length;
    
    // Check if all quizzes are passed (if there are any)
    // This would require additional logic to check quiz attempts and scores
    
    return allLessonsCompleted;
  } catch (error) {
    console.error('Error in checkCourseCompletion:', error);
    return false;
  }
}

// Function to generate and issue certificate
export async function generateCertificate(enrollmentId: string): Promise<Certificate | null> {
  try {
    // Check if certificate already exists
    const { data: existingCert, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle();
    
    if (certError) {
      console.error('Error checking existing certificate:', certError);
      throw certError;
    }
    
    if (existingCert) {
      return existingCert as Certificate;
    }
    
    // Call the serverless function to generate certificate
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.user.aud === 'authenticated' ? (await supabase.auth.getSession()).data.session?.access_token : ''}`,
      },
      body: JSON.stringify({ enrollmentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from certificate function:', errorText);
      throw new Error(`Failed to generate certificate: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.certificate) {
      return result.certificate as Certificate;
    }
    
    throw new Error('Certificate generation failed');
  } catch (error) {
    console.error('Error in generateCertificate:', error);
    toast({
      title: 'Error',
      description: 'Failed to generate certificate. Please try again.',
      variant: 'destructive',
    });
    return null;
  }
}

// Function to verify a certificate by verification code
export async function verifyCertificate(code: string): Promise<{ valid: boolean; details?: any }> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        issue_date,
        course_enrollments!inner(
          courses!inner(title),
          profiles!inner(full_name)
        )
      `)
      .eq('verification_code', code)
      .single();
    
    if (error || !data) {
      console.error('Error verifying certificate:', error);
      return { valid: false };
    }
    
    return {
      valid: true,
      details: {
        studentName: data.course_enrollments?.profiles?.full_name || 'Student',
        courseName: data.course_enrollments?.courses?.title || 'Course',
        issueDate: data.issue_date ? new Date(data.issue_date).toLocaleDateString() : 'Unknown',
        verificationCode: code
      }
    };
  } catch (error) {
    console.error('Error in verifyCertificate:', error);
    return { valid: false };
  }
}

// Helper function to generate a random verification code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to create a certificate PDF
async function createCertificatePDF(
  studentName: string,
  courseName: string,
  verificationCode: string,
  issueDate: string
): Promise<string | null> {
  try {
    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add decorative border
    doc.setDrawColor(0, 0, 128);
    doc.setLineWidth(1);
    doc.rect(10, 10, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 30);
    
    // Add title
    doc.setFontSize(30);
    doc.setTextColor(0, 0, 128);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate of Completion', doc.internal.pageSize.width / 2, 40, { align: 'center' });
    
    // Add content
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('This certifies that', doc.internal.pageSize.width / 2, 70, { align: 'center' });
    
    // Add student name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, doc.internal.pageSize.width / 2, 85, { align: 'center' });
    
    // Add course info
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed the course', doc.internal.pageSize.width / 2, 105, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(courseName, doc.internal.pageSize.width / 2, 120, { align: 'center' });
    
    // Add date and verification code
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Issue Date: ${issueDate}`, doc.internal.pageSize.width / 2, 145, { align: 'center' });
    doc.text(`Verification Code: ${verificationCode}`, doc.internal.pageSize.width / 2, 155, { align: 'center' });
    
    // Add verification URL
    const verifyUrl = `${window.location.origin}/verify-certificate/${verificationCode}`;
    doc.setFontSize(10);
    doc.text(`Verify at: ${verifyUrl}`, doc.internal.pageSize.width / 2, 165, { align: 'center' });
    
    // Convert PDF to blob and upload to Supabase Storage
    const pdfBlob = doc.output('blob');
    const fileName = `certificates/${verificationCode}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading certificate PDF:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('course-materials')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error creating certificate PDF:', error);
    return null;
  }
}

// Function to upload course thumbnail
export async function uploadCourseThumbnail(file: File, courseId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      toast({
        title: 'Error',
        description: 'Failed to upload thumbnail. Please try again.',
        variant: 'destructive',
      });
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadCourseThumbnail:', error);
    return null;
  }
}

// Function to upload lesson materials
export async function uploadLessonMaterial(file: File, lessonId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${lessonId}_${Date.now()}.${fileExt}`;
    const filePath = `lessons/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Error uploading material:', uploadError);
      toast({
        title: 'Error',
        description: 'Failed to upload material. Please try again.',
        variant: 'destructive',
      });
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadLessonMaterial:', error);
    return null;
  }
}

// Function to enroll a user in a course
export async function enrollInCourse(courseId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to enroll in courses',
        variant: 'destructive',
      });
      return false;
    }
    
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('is_free, price')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      console.error('Error fetching course for enrollment:', courseError);
      throw courseError;
    }
    
    if (course.is_free) {
      // Free course - direct enrollment
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.user.id,
          course_id: courseId,
          payment_status: 'completed',
        });
      
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          toast({
            title: 'Already Enrolled',
            description: 'You are already enrolled in this course',
          });
          return true;
        }
        
        console.error('Error enrolling in course:', error);
        toast({
          title: 'Error',
          description: 'Failed to enroll in course. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'You have been enrolled in the course',
      });
      return true;
    } else {
      // Paid course - redirect to payment
      // This will need to be expanded to integrate with the payment system
      toast({
        title: 'Payment Required',
        description: 'This is a paid course. Payment functionality coming soon.',
        variant: 'default',
      });
      return false;
    }
  } catch (error) {
    console.error('Error in enrollInCourse:', error);
    return false;
  }
}

// Function to check if a user is enrolled in a course
export async function checkEnrollmentStatus(courseId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('course_id', courseId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking enrollment status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in checkEnrollmentStatus:', error);
    return false;
  }
}

// Function to get all courses for admin panel
export async function fetchAllCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
    
    return (data as Course[]) || [];
  } catch (error) {
    console.error('Error in fetchAllCourses:', error);
    toast({
      title: 'Error',
      description: 'Failed to load courses. Please try again later.',
      variant: 'destructive',
    });
    return [];
  }
}

// Function to create a storage bucket for course materials if it doesn't exist
export async function createCourseMaterialsBucket(): Promise<boolean> {
  try {
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    
    if (getBucketsError) {
      console.error('Error listing buckets:', getBucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'course-materials');
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket('course-materials', {
        public: true
      });
      
      if (createBucketError) {
        console.error('Error creating course-materials bucket:', createBucketError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in createCourseMaterialsBucket:', error);
    return false;
  }
}

// Call this function when the app initializes to ensure the bucket exists
createCourseMaterialsBucket();
