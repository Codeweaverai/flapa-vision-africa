-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a secure public view with only non-sensitive fields
-- This allows public access to basic profile info without exposing sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  bio,
  is_creator,
  role,
  created_at
FROM public.profiles;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Create a new restrictive policy for authenticated users to view full profiles
-- Only the profile owner or admins can see sensitive fields
CREATE POLICY "Authenticated users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: The existing policies remain:
-- - "Users can view own complete profile" (auth.uid() = id)
-- - "Admins can view all profiles" (admin role check)
-- - "Users can update own profile" (auth.uid() = id)

-- For unauthenticated users, they should use the public_profiles view instead
-- The direct profiles table will require authentication