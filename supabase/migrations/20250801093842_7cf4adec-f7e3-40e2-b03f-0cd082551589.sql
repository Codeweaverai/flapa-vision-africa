
-- Create enum for workplace member roles
CREATE TYPE public.workplace_role AS ENUM ('owner', 'editor', 'viewer');

-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create creator_workplaces table
CREATE TABLE public.creator_workplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create creator_workplace_members table
CREATE TABLE public.creator_workplace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID REFERENCES public.creator_workplaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role workplace_role NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workplace_id, user_id)
);

-- Create workplace_invitations table
CREATE TABLE public.workplace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID REFERENCES public.creator_workplaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role workplace_role NOT NULL DEFAULT 'viewer',
  status invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add workplace_id to courses table to support collaborative editing
ALTER TABLE public.courses ADD COLUMN workplace_id UUID REFERENCES public.creator_workplaces(id) ON DELETE SET NULL;

-- Add workplace_id to events table to support collaborative editing
ALTER TABLE public.events ADD COLUMN workplace_id UUID REFERENCES public.creator_workplaces(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.creator_workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_workplace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplace_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_workplaces
CREATE POLICY "Workplace owners can manage their workplaces" ON public.creator_workplaces
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Workplace members can view workplaces they belong to" ON public.creator_workplaces
  FOR SELECT USING (
    id IN (
      SELECT workplace_id FROM public.creator_workplace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS policies for creator_workplace_members
CREATE POLICY "Workplace owners can manage members" ON public.creator_workplace_members
  FOR ALL USING (
    workplace_id IN (
      SELECT id FROM public.creator_workplaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view their own workplace memberships" ON public.creator_workplace_members
  FOR SELECT USING (user_id = auth.uid() OR workplace_id IN (
    SELECT workplace_id FROM public.creator_workplace_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- RLS policies for workplace_invitations
CREATE POLICY "Workplace owners can manage invitations" ON public.workplace_invitations
  FOR ALL USING (
    workplace_id IN (
      SELECT id FROM public.creator_workplaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON public.workplace_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update courses RLS to support workplace access
CREATE POLICY "Workplace members can view workplace courses" ON public.courses
  FOR SELECT USING (
    workplace_id IN (
      SELECT workplace_id FROM public.creator_workplace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Workplace editors can manage workplace courses" ON public.courses
  FOR ALL USING (
    workplace_id IN (
      SELECT workplace_id FROM public.creator_workplace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'editor')
    )
  );

-- Update events RLS to support workplace access
CREATE POLICY "Workplace members can view workplace events" ON public.events
  FOR SELECT USING (
    workplace_id IN (
      SELECT workplace_id FROM public.creator_workplace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Workplace editors can manage workplace events" ON public.events
  FOR ALL USING (
    workplace_id IN (
      SELECT workplace_id FROM public.creator_workplace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'editor')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_creator_workplaces_owner_id ON public.creator_workplaces(owner_id);
CREATE INDEX idx_creator_workplace_members_workplace_id ON public.creator_workplace_members(workplace_id);
CREATE INDEX idx_creator_workplace_members_user_id ON public.creator_workplace_members(user_id);
CREATE INDEX idx_workplace_invitations_token ON public.workplace_invitations(token);
CREATE INDEX idx_workplace_invitations_email ON public.workplace_invitations(email);
CREATE INDEX idx_courses_workplace_id ON public.courses(workplace_id);
CREATE INDEX idx_events_workplace_id ON public.events(workplace_id);
