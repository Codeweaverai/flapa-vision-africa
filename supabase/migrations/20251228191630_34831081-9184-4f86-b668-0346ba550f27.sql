-- Fix card_transactions security - ensure only owners and admins can access sensitive payment data
-- This addresses PCI-DSS compliance concerns

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.card_transactions;
DROP POLICY IF EXISTS "Service role full access" ON public.card_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.card_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.card_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.card_transactions;

-- Ensure RLS is enabled
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (extra security for sensitive payment data)
ALTER TABLE public.card_transactions FORCE ROW LEVEL SECURITY;

-- Create strict policies

-- 1. Users can only view their own transactions (must be authenticated)
CREATE POLICY "Owners can view their card transactions"
ON public.card_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can only insert transactions for themselves
CREATE POLICY "Owners can insert their card transactions"
ON public.card_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can only update their own transactions
CREATE POLICY "Owners can update their card transactions"
ON public.card_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Admins can view all transactions for administrative purposes
CREATE POLICY "Admins can view all card transactions"
ON public.card_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Service role has full access (for edge functions processing payments)
CREATE POLICY "Service role full access to card transactions"
ON public.card_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Prevent deletion by regular users (only service role can delete if needed)
-- No DELETE policy for authenticated users means they cannot delete