
-- Fix 1: Add missing RLS policies for tables that don't have them
-- Enable RLS on mobile_operators table
ALTER TABLE public.mobile_operators ENABLE ROW LEVEL SECURITY;

-- Create policy for mobile_operators (public read access since this is reference data)
CREATE POLICY "Anyone can view mobile operators" 
ON public.mobile_operators 
FOR SELECT 
USING (true);

-- Enable RLS on speaking_appearances table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speaking_appearances' AND table_schema = 'public') THEN
    ALTER TABLE public.speaking_appearances ENABLE ROW LEVEL SECURITY;
    
    -- Users can view their own speaking appearances
    CREATE POLICY "Users can view own speaking appearances" 
    ON public.speaking_appearances 
    FOR SELECT 
    USING (user_id = auth.uid());
    
    -- Users can create their own speaking appearances
    CREATE POLICY "Users can create own speaking appearances" 
    ON public.speaking_appearances 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());
    
    -- Users can update their own speaking appearances
    CREATE POLICY "Users can update own speaking appearances" 
    ON public.speaking_appearances 
    FOR UPDATE 
    USING (user_id = auth.uid());
    
    -- Users can delete their own speaking appearances
    CREATE POLICY "Users can delete own speaking appearances" 
    ON public.speaking_appearances 
    FOR DELETE 
    USING (user_id = auth.uid());
    
    -- Admins can manage all speaking appearances
    CREATE POLICY "Admins can manage all speaking appearances" 
    ON public.speaking_appearances 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ));
  END IF;
END $$;

-- Enable RLS on speaking_topics table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speaking_topics' AND table_schema = 'public') THEN
    ALTER TABLE public.speaking_topics ENABLE ROW LEVEL SECURITY;
    
    -- Anyone can view speaking topics (reference data)
    CREATE POLICY "Anyone can view speaking topics" 
    ON public.speaking_topics 
    FOR SELECT 
    USING (true);
    
    -- Only admins can manage speaking topics
    CREATE POLICY "Admins can manage speaking topics" 
    ON public.speaking_topics 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ));
  END IF;
END $$;

-- Fix 2: Secure database functions by adding search_path
-- Update existing security definer functions to include proper search_path

-- Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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

-- Fix the get_user_emails function
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix other security definer functions
CREATE OR REPLACE FUNCTION public.user_needs_otp_verification(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix the broadcast message function
CREATE OR REPLACE FUNCTION public.broadcast_message_to_all_users(p_admin_id uuid, p_subject text, p_content text, p_message_type text DEFAULT 'broadcast'::text, p_priority text DEFAULT 'normal'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
