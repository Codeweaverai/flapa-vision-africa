
-- Create lesson_notes table
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id UUID NOT NULL,
  content TEXT NOT NULL,
  video_timestamp NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_discussions table
CREATE TABLE IF NOT EXISTS public.lesson_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.lesson_discussions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_transcripts table
CREATE TABLE IF NOT EXISTS public.lesson_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  transcript_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_quizzes table
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  quiz_id UUID REFERENCES public.lesson_quizzes(id) NOT NULL,
  lesson_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for lesson_notes
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lesson notes" 
  ON public.lesson_notes 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Add RLS policies for lesson_discussions
ALTER TABLE public.lesson_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all lesson discussions" 
  ON public.lesson_discussions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own discussions" 
  ON public.lesson_discussions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussions" 
  ON public.lesson_discussions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions" 
  ON public.lesson_discussions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for lesson_transcripts
ALTER TABLE public.lesson_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transcripts" 
  ON public.lesson_transcripts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage transcripts" 
  ON public.lesson_transcripts 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Add RLS policies for lesson_quizzes
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes" 
  ON public.lesson_quizzes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage quizzes" 
  ON public.lesson_quizzes 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Add RLS policies for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz attempts" 
  ON public.quiz_attempts 
  FOR ALL 
  USING (auth.uid() = user_id);
