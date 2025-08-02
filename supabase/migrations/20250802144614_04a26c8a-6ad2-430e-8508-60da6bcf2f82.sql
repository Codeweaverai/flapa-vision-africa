
-- Add RLS policy to allow users to accept workplace invitations
CREATE POLICY "Users can accept workplace invitations" 
ON public.creator_workplace_members
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.creator_workplace_invitations 
    WHERE workplace_id = creator_workplace_members.workplace_id
    AND invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    AND status = 'pending'
    AND expires_at > NOW()
  )
);
