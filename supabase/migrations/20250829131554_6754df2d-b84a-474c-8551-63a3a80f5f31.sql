
-- Add RLS policy so admins can view all payment transactions for balance calculations
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
USING (is_admin());
