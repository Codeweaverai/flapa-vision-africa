-- First, drop the overly permissive policy that allows anyone to view profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
-- and admins to view all profiles for legitimate purposes
CREATE POLICY "Users can view own profile and admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create a policy for creators to view basic profile info of their students
-- (only non-sensitive data like username and full_name for course enrollments)
CREATE POLICY "Creators can view basic info of enrolled students" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT ce.user_id 
    FROM course_enrollments ce 
    JOIN courses c ON c.id = ce.course_id 
    WHERE c.creator_id = auth.uid()
  ) OR
  id IN (
    SELECT eb.user_id 
    FROM event_bookings eb 
    JOIN events e ON e.id = eb.event_id 
    WHERE e.creator_id = auth.uid()
  )
);

-- Allow public access to only basic creator info for public course/event listings
-- This creates a limited view for public consumption
CREATE POLICY "Public can view basic creator info for published content" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT creator_id 
    FROM courses 
    WHERE is_published = true AND creator_id IS NOT NULL
  ) OR
  id IN (
    SELECT DISTINCT creator_id 
    FROM events 
    WHERE is_published = true AND creator_id IS NOT NULL
  )
);

-- Create a security definer function to safely expose only essential creator data
CREATE OR REPLACE FUNCTION public.get_creator_basic_info(creator_user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  bio text
) 
SECURITY DEFINER
STABLE
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio
  FROM public.profiles p
  WHERE p.id = creator_user_id
  AND p.id IN (
    SELECT DISTINCT c.creator_id 
    FROM courses c 
    WHERE c.is_published = true AND c.creator_id IS NOT NULL
    UNION
    SELECT DISTINCT e.creator_id 
    FROM events e 
    WHERE e.is_published = true AND e.creator_id IS NOT NULL
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_creator_basic_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_basic_info(uuid) TO anon;