-- Drop existing policies on card_transactions to recreate with proper security
DROP POLICY IF EXISTS "Users can view own transactions" ON public.card_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.card_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.card_transactions;

-- Create strict owner-only SELECT policy
CREATE POLICY "Users can view own transactions"
ON public.card_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create strict owner-only INSERT policy
CREATE POLICY "Users can insert own transactions"
ON public.card_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create strict owner-only UPDATE policy  
CREATE POLICY "Users can update own transactions"
ON public.card_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all transactions for support/compliance purposes
CREATE POLICY "Admins can view all transactions"
ON public.card_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role full access for payment processing
CREATE POLICY "Service role full access"
ON public.card_transactions
FOR ALL
TO authenticated
USING (auth.role() = 'service_role');