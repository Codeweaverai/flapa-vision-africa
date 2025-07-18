
-- Create a function to get user emails from auth
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function should only be callable by authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return user emails for the provided user IDs
  -- Note: This is a simplified version - in production you might want additional security checks
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;
