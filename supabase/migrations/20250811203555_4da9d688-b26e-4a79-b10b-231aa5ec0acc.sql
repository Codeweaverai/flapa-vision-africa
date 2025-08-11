
-- Rollback SQL to remove the security fixes that were implemented

-- Remove RLS policies that were added for mobile_operators
DROP POLICY IF EXISTS "Anyone can view mobile operators" ON public.mobile_operators;
ALTER TABLE public.mobile_operators DISABLE ROW LEVEL SECURITY;

-- Remove RLS policies for speaking_appearances if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speaking_appearances' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can view own speaking appearances" ON public.speaking_appearances;
    DROP POLICY IF EXISTS "Users can create own speaking appearances" ON public.speaking_appearances;
    DROP POLICY IF EXISTS "Users can update own speaking appearances" ON public.speaking_appearances;
    DROP POLICY IF EXISTS "Users can delete own speaking appearances" ON public.speaking_appearances;
    DROP POLICY IF EXISTS "Admins can manage all speaking appearances" ON public.speaking_appearances;
    ALTER TABLE public.speaking_appearances DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Remove RLS policies for speaking_topics if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speaking_topics' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Anyone can view speaking topics" ON public.speaking_topics;
    DROP POLICY IF EXISTS "Admins can manage speaking topics" ON public.speaking_topics;
    ALTER TABLE public.speaking_topics DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Revert the profile policies to the original permissive state
DROP POLICY IF EXISTS "Users can view own profile and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Creators can view basic info of enrolled students" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic creator info for published content" ON public.profiles;

-- Restore the original permissive policy for profiles
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Remove the get_creator_basic_info function
DROP FUNCTION IF EXISTS public.get_creator_basic_info(uuid);

-- Revert the handle_new_user function to its original state (without search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username', 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Revert the get_user_emails function to its original state
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
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied: Only admins can access user emails';
    END IF;
  END IF;
  
  -- Return user emails for the provided user IDs with fully qualified column names
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text as user_email,
    au.created_at as user_created_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$function$;

-- Revert the user_needs_otp_verification function to its original state
CREATE OR REPLACE FUNCTION public.user_needs_otp_verification(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  profile_record RECORD;
  days_inactive INTEGER;
BEGIN
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN TRUE; -- New user, needs OTP
  END IF;
  
  -- Check if user has never been OTP verified
  IF profile_record.otp_verified = FALSE THEN
    RETURN TRUE;
  END IF;
  
  -- Check for inactivity (10+ days)
  IF profile_record.last_activity IS NOT NULL THEN
    days_inactive := EXTRACT(DAY FROM NOW() - profile_record.last_activity);
    IF days_inactive >= 10 THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Revert the broadcast_message_to_all_users function to its original state
CREATE OR REPLACE FUNCTION public.broadcast_message_to_all_users(p_admin_id uuid, p_subject text, p_content text, p_message_type text DEFAULT 'broadcast'::text, p_priority text DEFAULT 'normal'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  broadcast_id UUID;
  user_count INTEGER;
  user_record RECORD;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can broadcast messages';
  END IF;

  -- Create the broadcast record
  INSERT INTO public.broadcast_messages (
    admin_id, subject, content, message_type, priority
  ) VALUES (
    p_admin_id, p_subject, p_content, p_message_type, p_priority
  ) RETURNING id INTO broadcast_id;

  -- Get count of active users
  SELECT COUNT(*) INTO user_count 
  FROM public.profiles 
  WHERE id IS NOT NULL;

  -- Insert message for each user
  FOR user_record IN 
    SELECT id FROM public.profiles WHERE id IS NOT NULL
  LOOP
    INSERT INTO public.inbox_messages (
      sender_id,
      recipient_id,
      subject,
      content,
      message_type,
      related_id
    ) VALUES (
      NULL, -- System message (no sender)
      user_record.id,
      '[BROADCAST] ' || p_subject,
      p_content,
      p_message_type,
      broadcast_id
    );
  END LOOP;

  -- Update broadcast record with recipient count
  UPDATE public.broadcast_messages 
  SET total_recipients = user_count,
      status = 'delivered'
  WHERE id = broadcast_id;

  RETURN broadcast_id;
END;
$function$;
