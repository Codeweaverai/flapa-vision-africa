
-- Add ticket_number column to event_bookings table if it doesn't exist already
ALTER TABLE IF EXISTS public.event_bookings
ADD COLUMN IF NOT EXISTS ticket_number TEXT;

-- Enable Realtime for post_comments table
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Enable Realtime for community_messages table
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Enable Realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Update event_bookings table for realtime
ALTER TABLE public.event_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_bookings;
