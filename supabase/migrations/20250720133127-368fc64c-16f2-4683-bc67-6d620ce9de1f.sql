
-- Check the current structure of lesson_transcripts table and recreate if needed
DROP TABLE IF EXISTS public.lesson_transcripts CASCADE;

-- Recreate lesson_transcripts table with correct schema
CREATE TABLE public.lesson_transcripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
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
CREATE INDEX IF NOT EXISTS idx_lesson_transcripts_lesson ON public.lesson_transcripts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_transcripts_time ON public.lesson_transcripts(lesson_id, start_time);
