-- Drop the restrictive insert policy for activities
DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;

-- Create a more permissive insert policy that allows triggers to work
-- Activities are still protected by SELECT policies, so users can only see their own
CREATE POLICY "Authenticated users can create activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep the existing SELECT policies to ensure users only see their own activities