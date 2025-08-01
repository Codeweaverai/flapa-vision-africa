
-- Fix 1: Update get_user_emails function to avoid ambiguous column references
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

-- Fix 2: Create security definer functions to avoid infinite recursion in RLS
CREATE OR REPLACE FUNCTION public.is_workspace_owner(workspace_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_workplaces
    WHERE id = workspace_uuid AND owner_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_workspace_member_func(workspace_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_workplace_members
    WHERE workplace_id = workspace_uuid 
    AND user_id = auth.uid() 
    AND status = 'active'
  );
$function$;

-- Fix 3: Drop existing problematic RLS policies on creator_workplaces
DROP POLICY IF EXISTS "Workplace members can view workplaces they belong to" ON public.creator_workplaces;
DROP POLICY IF EXISTS "Workplace owners can manage their workplaces" ON public.creator_workplaces;

-- Create new RLS policies using security definer functions
CREATE POLICY "Workspace owners can manage their workspaces"
ON public.creator_workplaces
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace members can view member workspaces"
ON public.creator_workplaces
FOR SELECT
USING (is_workspace_member_func(id));

-- Fix 4: Update creator_workplace_members RLS policies to avoid recursion
DROP POLICY IF EXISTS "Members can view their own workplace memberships" ON public.creator_workplace_members;
DROP POLICY IF EXISTS "Workplace owners can manage members" ON public.creator_workplace_members;

CREATE POLICY "Members can view their own memberships"
ON public.creator_workplace_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Workspace owners can manage members"
ON public.creator_workplace_members
FOR ALL
USING (is_workspace_owner(workplace_id))
WITH CHECK (is_workspace_owner(workplace_id));

CREATE POLICY "Users can view memberships for workspaces they belong to"
ON public.creator_workplace_members
FOR SELECT
USING (is_workspace_member_func(workplace_id));
