
-- Course favorites table to track which courses users have marked as favorite
CREATE TABLE IF NOT EXISTS public.course_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Add Row Level Security
ALTER TABLE public.course_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own favorites
CREATE POLICY "Users can view their own favorites" 
  ON public.course_favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own favorites
CREATE POLICY "Users can add their own favorites" 
  ON public.course_favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
  ON public.course_favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);
