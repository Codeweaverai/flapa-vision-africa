
-- Check the current constraint on media_posts table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.media_posts'::regclass 
AND contype = 'c';

-- Drop the existing check constraint if it exists
ALTER TABLE public.media_posts DROP CONSTRAINT IF EXISTS media_posts_post_type_check;

-- Add a new check constraint that matches the values used in the form
ALTER TABLE public.media_posts ADD CONSTRAINT media_posts_post_type_check 
CHECK (post_type IN ('article', 'video', 'podcast', 'infographic', 'news', 'resource'));
