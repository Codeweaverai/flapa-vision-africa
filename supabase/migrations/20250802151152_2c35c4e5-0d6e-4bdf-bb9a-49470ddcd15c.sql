
-- Create security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can accept workplace invitations" ON public.creator_workplace_members;

-- Create new policy using the security definer function
CREATE POLICY "Users can accept workplace invitations" 
ON public.creator_workplace_members
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.creator_workplace_invitations 
    WHERE workplace_id = creator_workplace_members.workplace_id
    AND invited_email = get_current_user_email()
    AND status = 'pending'
    AND expires_at > NOW()
  )
);
