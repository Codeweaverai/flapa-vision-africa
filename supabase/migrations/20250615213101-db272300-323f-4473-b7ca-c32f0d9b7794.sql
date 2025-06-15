
-- Create storage buckets for podcast media (only if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'podcast-covers', 'podcast-covers', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'podcast-covers');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'podcast-videos', 'podcast-videos', true, 1073741824, ARRAY['video/mp4', 'video/webm', 'video/quicktime']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'podcast-videos');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'podcast-audio', 'podcast-audio', true, 524288000, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'podcast-audio');

-- Create storage policies for podcast buckets (drop existing ones first)
DROP POLICY IF EXISTS "Allow public read access on podcast covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to podcast covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access on podcast videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to podcast videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access on podcast audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to podcast audio" ON storage.objects;

CREATE POLICY "Allow public read access on podcast covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'podcast-covers');

CREATE POLICY "Allow authenticated upload to podcast covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'podcast-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read access on podcast videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'podcast-videos');

CREATE POLICY "Allow authenticated upload to podcast videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'podcast-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read access on podcast audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'podcast-audio');

CREATE POLICY "Allow authenticated upload to podcast audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'podcast-audio' AND auth.role() = 'authenticated');

-- Update media_posts table to better handle podcast data
ALTER TABLE public.media_posts 
ADD COLUMN IF NOT EXISTS guest_names TEXT,
ADD COLUMN IF NOT EXISTS recording_date DATE,
ADD COLUMN IF NOT EXISTS episode_number TEXT,
ADD COLUMN IF NOT EXISTS series_name TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'external_url',
ADD COLUMN IF NOT EXISTS file_storage_path TEXT,
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for media_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_posts_media_type_check') THEN
        ALTER TABLE public.media_posts ADD CONSTRAINT media_posts_media_type_check 
        CHECK (media_type IN ('external_url', 'uploaded_file'));
    END IF;
END $$;

-- Create index for better performance on podcast queries
CREATE INDEX IF NOT EXISTS idx_media_posts_post_type_category ON public.media_posts(post_type, category);
CREATE INDEX IF NOT EXISTS idx_media_posts_published ON public.media_posts(is_published, published_at);

-- Update the existing post_type constraint to include our new types
ALTER TABLE public.media_posts DROP CONSTRAINT IF EXISTS media_posts_post_type_check;
ALTER TABLE public.media_posts ADD CONSTRAINT media_posts_post_type_check 
  CHECK (post_type IN ('article', 'video', 'podcast', 'news', 'resource'));
