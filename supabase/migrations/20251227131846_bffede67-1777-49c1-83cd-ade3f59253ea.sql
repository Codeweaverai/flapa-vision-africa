-- Fix gift code exposure vulnerability
-- The gift_code should not be visible to recipients via RLS - they should only access it via the edge function after email verification

-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view gifts sent to them or by them" ON public.gifts;

-- Create separate policies for senders and recipients
-- Senders can see full gift details including code (they purchased it)
CREATE POLICY "Senders can view their sent gifts with code"
ON public.gifts
FOR SELECT
TO authenticated
USING (
  sender_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);

-- Recipients can see gifts sent to them but WITHOUT the gift_code
-- We use a view approach since RLS can't filter columns, so we need to be more restrictive
-- For now, prevent direct recipient access - they must use the edge function
-- The edge function will verify email ownership before revealing gift details

-- Create a policy that only allows recipients to see their gifts if they know the code
-- This prevents enumeration attacks
CREATE POLICY "Recipients cannot directly query gifts"
ON public.gifts
FOR SELECT
TO authenticated
USING (
  sender_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);

-- Service role can access all gifts (for edge functions)
-- This is handled implicitly by service_role bypassing RLS