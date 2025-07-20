
-- Create lesson_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL,
  content text NOT NULL,
  video_timestamp numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create lesson_transcripts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lesson_transcripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for lesson_notes
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_notes
CREATE POLICY "Users can view their own lesson notes" 
  ON public.lesson_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson notes" 
  ON public.lesson_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson notes" 
  ON public.lesson_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson notes" 
  ON public.lesson_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS for lesson_transcripts
ALTER TABLE public.lesson_transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_transcripts (readable by all authenticated users)
CREATE POLICY "Authenticated users can view lesson transcripts" 
  ON public.lesson_transcripts 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Only admins/creators can manage transcripts
CREATE POLICY "Admins can manage lesson transcripts" 
  ON public.lesson_transcripts 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_notes_user_lesson ON public.lesson_notes(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_transcripts_lesson ON public.lesson_transcripts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_transcripts_time ON public.lesson_transcripts(lesson_id, start_time);
