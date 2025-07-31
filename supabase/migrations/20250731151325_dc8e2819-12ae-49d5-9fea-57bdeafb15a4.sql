
-- Update the get_user_emails function to work with service role context
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if this is being called by service role or an authenticated admin
  IF auth.uid() IS NULL THEN
    -- This is likely a service role call from an edge function
    -- We'll allow it but add logging for security
    RAISE NOTICE 'get_user_emails called with service role context for % users', array_length(user_ids, 1);
  ELSE
    -- This is a regular authenticated call, check if user is admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied: Only admins can access user emails';
    END IF;
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
