
-- Add missing payout-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_money_operator TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mobile_money_number TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS default_payout_method TEXT DEFAULT 'stripe';

-- Update existing migration columns if they exist with different names
UPDATE public.profiles 
SET default_payout_method = COALESCE(payout_method, 'stripe')
WHERE default_payout_method IS NULL;
