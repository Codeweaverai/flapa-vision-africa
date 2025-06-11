
-- Fix RLS policies for certificates table
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can create their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON public.certificates;

-- Create proper RLS policies for certificates
CREATE POLICY "Users can view their own certificates" ON public.certificates
  FOR SELECT USING (
    user_id = auth.uid() OR 
    enrollment_id IN (
      SELECT id FROM public.course_enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create certificates" ON public.certificates
  FOR INSERT WITH CHECK (
    enrollment_id IN (
      SELECT id FROM public.course_enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own certificates" ON public.certificates
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    enrollment_id IN (
      SELECT id FROM public.course_enrollments WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for course thumbnails if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Only create storage policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Anyone can view course thumbnails'
  ) THEN
    CREATE POLICY "Anyone can view course thumbnails" ON storage.objects
      FOR SELECT USING (bucket_id = 'course-thumbnails');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload course thumbnails'
  ) THEN
    CREATE POLICY "Authenticated users can upload course thumbnails" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can update their course thumbnails'
  ) THEN
    CREATE POLICY "Users can update their course thumbnails" ON storage.objects
      FOR UPDATE USING (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can delete their course thumbnails'
  ) THEN
    CREATE POLICY "Users can delete their course thumbnails" ON storage.objects
      FOR DELETE USING (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated');
  END IF;
END $$;
