
-- Add last_accessed_lesson_id column to course_progress table
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS last_accessed_lesson_id UUID REFERENCES public.lessons(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_course_progress_last_accessed_lesson 
ON public.course_progress(last_accessed_lesson_id);
