
-- Step 1: Create Security Definer Functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.is_workplace_member(workplace_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_workplace_members
    WHERE workplace_id = workplace_uuid 
    AND user_id = auth.uid() 
    AND status = 'active'
  );
$$;

-- Function to get user's workplace IDs
CREATE OR REPLACE FUNCTION public.get_user_workplace_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY_AGG(workplace_id)
  FROM public.creator_workplace_members
  WHERE user_id = auth.uid() AND status = 'active';
$$;

-- Function to check if user can edit workplace content
CREATE OR REPLACE FUNCTION public.can_edit_workplace_content(workplace_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_workplace_members
    WHERE workplace_id = workplace_uuid 
    AND user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('owner', 'editor')
  );
$$;

-- Step 2: Fix creator_workplace_members RLS policies to use security definer functions
DROP POLICY IF EXISTS "Members can view their own workplace memberships" ON creator_workplace_members;
CREATE POLICY "Members can view their own workplace memberships" ON creator_workplace_members
FOR SELECT USING (
  user_id = auth.uid() OR 
  workplace_id = ANY(get_user_workplace_ids())
);

-- Step 3: Update courses table workplace policies
DROP POLICY IF EXISTS "Workplace editors can manage workplace courses" ON courses;
DROP POLICY IF EXISTS "Workplace members can view workplace courses" ON courses;

CREATE POLICY "Workplace editors can manage workplace courses" ON courses
FOR ALL USING (
  workplace_id IS NULL OR can_edit_workplace_content(workplace_id)
);

CREATE POLICY "Workplace members can view workplace courses" ON courses
FOR SELECT USING (
  workplace_id IS NULL OR is_workplace_member(workplace_id)
);

-- Step 4: Update events table workplace policies  
DROP POLICY IF EXISTS "Workplace editors can manage workplace events" ON events;
DROP POLICY IF EXISTS "Workplace members can view workplace events" ON events;

CREATE POLICY "Workplace editors can manage workplace events" ON events
FOR ALL USING (
  workplace_id IS NULL OR can_edit_workplace_content(workplace_id)
);

CREATE POLICY "Workplace members can view workplace events" ON events
FOR SELECT USING (
  workplace_id IS NULL OR is_workplace_member(workplace_id)
);
