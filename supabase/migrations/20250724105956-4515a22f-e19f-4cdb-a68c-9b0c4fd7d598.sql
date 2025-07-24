
-- Fix the get_user_emails function to return proper text type
DROP FUNCTION IF EXISTS public.get_user_emails(uuid[]);

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- This function should only be callable by authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return user emails for the provided user IDs
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$function$
