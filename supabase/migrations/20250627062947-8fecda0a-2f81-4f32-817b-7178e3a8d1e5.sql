
-- Create storage bucket for inbox files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'inbox-files', 'inbox-files', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'inbox-files');

-- Create storage policies for inbox files
CREATE POLICY "Allow public read access on inbox files" ON storage.objects
  FOR SELECT USING (bucket_id = 'inbox-files');

CREATE POLICY "Allow authenticated upload to inbox files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'inbox-files' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own inbox files" ON storage.objects
  FOR DELETE USING (bucket_id = 'inbox-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file_url column to inbox_messages table for file attachments
ALTER TABLE public.inbox_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;
