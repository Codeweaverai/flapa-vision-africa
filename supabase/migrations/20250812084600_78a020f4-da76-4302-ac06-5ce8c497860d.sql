
-- Create RLS policies for admin access to course_enrollments
CREATE POLICY "Admins can manage all course enrollments" 
  ON public.course_enrollments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for admin access to event_bookings
CREATE POLICY "Admins can manage all event bookings" 
  ON public.event_bookings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for admin access to creator_payouts
CREATE POLICY "Admins can view all creator payouts" 
  ON public.creator_payouts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all creator payouts" 
  ON public.creator_payouts 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for admin access to orders
CREATE POLICY "Admins can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for admin access to order_items  
CREATE POLICY "Admins can view all order items" 
  ON public.order_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update the get_user_emails function to allow admin access
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create a function to get all user emails for admins
CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE(id uuid, email text, full_name text, created_at timestamp with time zone, role text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can access all user emails';
  END IF;
  
  -- Return all user emails with profile data
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text as user_email,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    au.created_at as user_created_at,
    COALESCE(p.role::text, 'user') as role
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;
