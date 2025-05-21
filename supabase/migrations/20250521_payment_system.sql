
-- Create the payment transactions table to store all payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_type VARCHAR(50) NOT NULL, -- 'course', 'event', 'consultation'
  reference_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
  provider_transaction_id TEXT,
  payment_method VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payouts table for creators to withdraw their earnings
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  method VARCHAR(50) NOT NULL, -- 'stripe', 'mobile_money', 'bank_transfer'
  destination TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add stripe_connect_id field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS mobile_money_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_details JSONB;

-- Create RLS policies for payment_transactions table
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON public.payment_transactions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Creators can view payments for their content"
  ON public.payment_transactions
  FOR SELECT
  USING (creator_id = auth.uid());

-- Create RLS policies for creator_payouts table
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own payouts"
  ON public.creator_payouts
  FOR SELECT
  USING (creator_id = auth.uid());

-- Create realtime subscription for payment_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_payouts;
