
-- Add is_creator column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false;

-- Add creator_id column to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);

-- Add creator_id column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);

-- Create indexes for faster creator-based queries
CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON public.courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON public.events(creator_id);
