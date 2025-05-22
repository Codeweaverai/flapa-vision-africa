
-- Create storage buckets for profile pictures and course videos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile_pictures', 'Profile Pictures', true),
  ('course_videos', 'Course Videos', true);

-- Create RLS policies for profile pictures bucket
CREATE POLICY "Public Access to Profile Pictures"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile_pictures');

CREATE POLICY "Users can upload their own profile pictures" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile_pictures' 
    AND (auth.uid() = owner OR owner IS NULL)
    AND CASE
      WHEN RIGHT(name, 4) = '.jpg' THEN TRUE
      WHEN RIGHT(name, 5) = '.jpeg' THEN TRUE
      WHEN RIGHT(name, 4) = '.png' THEN TRUE
      WHEN RIGHT(name, 4) = '.gif' THEN TRUE
      WHEN RIGHT(name, 5) = '.webp' THEN TRUE
      ELSE FALSE
    END
  );

CREATE POLICY "Users can update their own profile pictures" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'profile_pictures' 
    AND auth.uid() = owner
  );

CREATE POLICY "Users can delete their own profile pictures" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'profile_pictures' 
    AND auth.uid() = owner
  );

-- Create RLS policies for course videos bucket
CREATE POLICY "Public Access to Course Videos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'course_videos');

CREATE POLICY "Creators can upload their own course videos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'course_videos' 
    AND (auth.uid() = owner OR owner IS NULL)
    AND (
      -- Video file types
      RIGHT(name, 4) = '.mp4' OR 
      RIGHT(name, 4) = '.webm' OR 
      RIGHT(name, 4) = '.avi' OR 
      RIGHT(name, 4) = '.mov' OR
      RIGHT(name, 5) = '.mpeg'
    )
  );

CREATE POLICY "Creators can update their own course videos" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'course_videos' 
    AND auth.uid() = owner
  );

CREATE POLICY "Creators can delete their own course videos" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'course_videos' 
    AND auth.uid() = owner
  );

-- Add necessary columns to the profiles table for tracking avatar uploads
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN;
