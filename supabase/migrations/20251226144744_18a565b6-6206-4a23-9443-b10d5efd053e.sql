-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
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

-- Re-grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;