
-- Fix RLS so admins can view all payouts

-- 1) Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- 2) Remove the broken admin policy that relied on a JWT 'role' claim
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.creator_payouts;

-- 3) Add a correct admin policy using the existing helper function
--    public.is_admin() which checks profiles.role = 'admin'
CREATE POLICY "Admins can view all payouts (is_admin)"
ON public.creator_payouts
FOR SELECT
USING (is_admin());

-- NOTE:
-- We are not touching the existing creator self-view policies so creators
-- can still see their own payouts while admins can see all.
