
-- Enable RLS on event_tickets table if not already enabled
ALTER TABLE IF EXISTS public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to view event tickets (public information)
DROP POLICY IF EXISTS "Anyone can view event tickets" ON public.event_tickets;
CREATE POLICY "Anyone can view event tickets"
ON public.event_tickets
FOR SELECT
USING (true);

-- Policy for authenticated users to insert event tickets (creators)
DROP POLICY IF EXISTS "Authenticated users can create event tickets" ON public.event_tickets;
CREATE POLICY "Authenticated users can create event tickets"
ON public.event_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for users to update their own event tickets
DROP POLICY IF EXISTS "Users can update own event tickets" ON public.event_tickets;
CREATE POLICY "Users can update own event tickets"
ON public.event_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_tickets.event_id AND events.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_tickets.event_id AND events.creator_id = auth.uid()
  )
);

-- Policy for users to delete their own event tickets
DROP POLICY IF EXISTS "Users can delete own event tickets" ON public.event_tickets;
CREATE POLICY "Users can delete own event tickets"
ON public.event_tickets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_tickets.event_id AND events.creator_id = auth.uid()
  )
);

-- Admin policy to manage all event tickets
DROP POLICY IF EXISTS "Admins can manage all event tickets" ON public.event_tickets;
CREATE POLICY "Admins can manage all event tickets"
ON public.event_tickets
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
