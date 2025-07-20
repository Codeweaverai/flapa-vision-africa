
-- Remove video_timestamp column from lesson_notes table
ALTER TABLE public.lesson_notes DROP COLUMN IF EXISTS video_timestamp;
ALTER TABLE public.lesson_notes DROP COLUMN IF EXISTS timestamp_seconds;
