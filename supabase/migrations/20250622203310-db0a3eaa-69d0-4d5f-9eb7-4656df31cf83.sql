
-- Create RLS policies for promo_codes table
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy for creators to view their own promo codes
CREATE POLICY "Creators can view their own promo codes" 
  ON public.promo_codes 
  FOR SELECT 
  USING (auth.uid() = creator_id);

-- Policy for creators to create their own promo codes
CREATE POLICY "Creators can create their own promo codes" 
  ON public.promo_codes 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

-- Policy for creators to update their own promo codes
CREATE POLICY "Creators can update their own promo codes" 
  ON public.promo_codes 
  FOR UPDATE 
  USING (auth.uid() = creator_id);

-- Policy for creators to delete their own promo codes
CREATE POLICY "Creators can delete their own promo codes" 
  ON public.promo_codes 
  FOR DELETE 
  USING (auth.uid() = creator_id);

-- Add missing columns to profiles for better payout method tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
