-- Add RLS policies to tables that have RLS enabled but no policies

-- Policies for admin_audit_logs table
-- Only admins should be able to view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role to insert audit logs (for system operations)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to insert their own audit logs (for tracking their actions)
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies for ai_assistant_interactions table
-- Users can only view their own AI interactions
CREATE POLICY "Users can view own AI interactions"
ON public.ai_assistant_interactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own AI interactions
CREATE POLICY "Users can create own AI interactions"
ON public.ai_assistant_interactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all AI interactions for analytics
CREATE POLICY "Admins can view all AI interactions"
ON public.ai_assistant_interactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));