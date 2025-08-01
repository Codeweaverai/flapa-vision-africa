
-- Create the creator_workplace_invitations table
CREATE TABLE public.creator_workplace_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workplace_id UUID NOT NULL REFERENCES public.creator_workplaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for creator_workplace_invitations
ALTER TABLE public.creator_workplace_invitations ENABLE ROW LEVEL SECURITY;

-- Workplace owners can view invitations for their workplaces
CREATE POLICY "Workplace owners can view invitations for their workplaces"
ON public.creator_workplace_invitations
FOR SELECT
USING (
  workplace_id IN (
    SELECT id FROM public.creator_workplaces 
    WHERE owner_id = auth.uid()
  )
);

-- Workplace owners can create invitations for their workplaces
CREATE POLICY "Workplace owners can create invitations for their workplaces"
ON public.creator_workplace_invitations
FOR INSERT
WITH CHECK (
  workplace_id IN (
    SELECT id FROM public.creator_workplaces 
    WHERE owner_id = auth.uid()
  )
);

-- Workplace owners can update invitations for their workplaces
CREATE POLICY "Workplace owners can update invitations for their workplaces"
ON public.creator_workplace_invitations
FOR UPDATE
USING (
  workplace_id IN (
    SELECT id FROM public.creator_workplaces 
    WHERE owner_id = auth.uid()
  )
);

-- Anyone can view invitations by token (for accepting invites)
CREATE POLICY "Anyone can view invitations by token"
ON public.creator_workplace_invitations
FOR SELECT
USING (true);

-- Anyone can update invitation status by token (for accepting/declining)
CREATE POLICY "Anyone can update invitation status by token"
ON public.creator_workplace_invitations
FOR UPDATE
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_creator_workplace_invitations_workplace_id ON public.creator_workplace_invitations(workplace_id);
CREATE INDEX idx_creator_workplace_invitations_token ON public.creator_workplace_invitations(invitation_token);
CREATE INDEX idx_creator_workplace_invitations_email ON public.creator_workplace_invitations(invited_email);
CREATE INDEX idx_creator_workplace_invitations_status ON public.creator_workplace_invitations(status);
