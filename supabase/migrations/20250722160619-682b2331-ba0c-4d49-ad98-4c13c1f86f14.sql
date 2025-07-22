
-- Create quizzes table if it doesn't exist and fix RLS policies
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  module_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all quiz tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Course creators can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can view quizzes for enrolled courses" ON public.quizzes;
DROP POLICY IF EXISTS "Course creators can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Users can view quiz questions for enrolled courses" ON public.quiz_questions;
DROP POLICY IF EXISTS "Course creators can manage quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Users can view quiz answers for enrolled courses" ON public.quiz_answers;

-- Create RLS policies for quizzes
CREATE POLICY "Course creators can manage quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons l 
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN courses c ON cm.course_id = c.id 
      WHERE l.id = quizzes.lesson_id AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l 
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN courses c ON cm.course_id = c.id 
      WHERE l.id = quizzes.lesson_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view quizzes for enrolled courses" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l 
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN course_enrollments ce ON cm.course_id = ce.course_id 
      WHERE l.id = quizzes.lesson_id AND ce.user_id = auth.uid()
    )
  );

-- Create RLS policies for quiz_questions
CREATE POLICY "Course creators can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN courses c ON cm.course_id = c.id 
      WHERE q.id = quiz_questions.quiz_id AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN courses c ON cm.course_id = c.id 
      WHERE q.id = quiz_questions.quiz_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view quiz questions for enrolled courses" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN course_enrollments ce ON cm.course_id = ce.course_id 
      WHERE q.id = quiz_questions.quiz_id AND ce.user_id = auth.uid()
    )
  );

-- Create RLS policies for quiz_answers
CREATE POLICY "Course creators can manage quiz answers" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN lessons l ON q.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN courses c ON cm.course_id = c.id 
      WHERE qq.id = quiz_answers.question_id AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN lessons l ON q.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN courses c ON cm.course_id = c.id 
      WHERE qq.id = quiz_answers.question_id AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view quiz answers for enrolled courses" ON public.quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN lessons l ON q.lesson_id = l.id
      JOIN course_modules cm ON l.module_id = cm.id 
      JOIN course_enrollments ce ON cm.course_id = ce.course_id 
      WHERE qq.id = quiz_answers.question_id AND ce.user_id = auth.uid()
    )
  );
