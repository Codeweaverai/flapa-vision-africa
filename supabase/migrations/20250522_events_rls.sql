
-- Enable RLS on events table if not already enabled
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;

-- Policy for users to read events
CREATE POLICY IF NOT EXISTS "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

-- Policy for authenticated users to insert their own events
CREATE POLICY IF NOT EXISTS "Authenticated users can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for users to update their own events
CREATE POLICY IF NOT EXISTS "Users can update own events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy for users to delete their own events
CREATE POLICY IF NOT EXISTS "Users can delete own events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Admin policy to manage all events
CREATE POLICY IF NOT EXISTS "Admins can manage all events"
ON public.events
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
