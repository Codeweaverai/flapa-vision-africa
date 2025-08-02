
-- Fix invitation token issue and create OTP verification system

-- First, let's create the OTP verification table
CREATE TABLE public.user_otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code VARCHAR(6) NOT NULL,
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('login', 'registration', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5
);

-- Add last activity tracking to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- Add OTP verification status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_required BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_otp_user_id ON public.user_otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otp_code ON public.user_otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_user_otp_expires_at ON public.user_otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.user_otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OTP verifications
CREATE POLICY "Users can view their own OTP verifications" ON public.user_otp_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OTP verifications" ON public.user_otp_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OTP verifications" ON public.user_otp_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_otp_verifications
  WHERE expires_at < NOW() AND verified_at IS NULL;
END;
$$;

-- Function to check if user needs OTP verification
CREATE OR REPLACE FUNCTION public.user_needs_otp_verification(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  days_inactive INTEGER;
BEGIN
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN TRUE; -- New user, needs OTP
  END IF;
  
  -- Check if user has never been OTP verified
  IF profile_record.otp_verified = FALSE THEN
    RETURN TRUE;
  END IF;
  
  -- Check for inactivity (10+ days)
  IF profile_record.last_activity IS NOT NULL THEN
    days_inactive := EXTRACT(DAY FROM NOW() - profile_record.last_activity);
    IF days_inactive >= 10 THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;
