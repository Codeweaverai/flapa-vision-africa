
-- Add missing columns to profiles table for payout methods
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_money_details JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'stripe';

-- Update the profiles table to include stripe_connect_id if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT DEFAULT NULL;
