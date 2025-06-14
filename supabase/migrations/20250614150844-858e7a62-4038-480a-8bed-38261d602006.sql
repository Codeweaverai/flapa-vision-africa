
-- Add creator_id to payment_transactions if not exists
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id);

-- Add payout_eligible_date if not exists  
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS payout_eligible_date timestamptz;

-- Add creator earnings and platform fees if not exists
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS creator_earning numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(10,2) DEFAULT 0;

-- Update creator_payouts table to support both Stripe and PawaPay
ALTER TABLE creator_payouts 
ADD COLUMN IF NOT EXISTS payout_method varchar(20) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS mobile_money_details jsonb,
ADD COLUMN IF NOT EXISTS pawapay_deposit_id text;

-- Create function to calculate creator balance with pending/available split
CREATE OR REPLACE FUNCTION calculate_creator_earnings(creator_user_id uuid)
RETURNS TABLE(
  available_balance numeric,
  pending_balance numeric, 
  total_earnings numeric,
  total_platform_fees numeric,
  course_revenue numeric,
  event_revenue numeric
) 
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Available balance (completed payments past 7-day hold, minus completed payouts)
    COALESCE(SUM(CASE 
      WHEN pt.status = 'completed' AND pt.payout_eligible_date <= NOW() 
      THEN pt.creator_earning 
      ELSE 0 
    END), 0) - COALESCE(
      (SELECT SUM(amount) FROM creator_payouts WHERE creator_id = creator_user_id AND status = 'completed'), 0
    ) as available_balance,
    
    -- Pending balance (completed payments within 7-day hold period)
    COALESCE(SUM(CASE 
      WHEN pt.status = 'completed' AND pt.payout_eligible_date > NOW() 
      THEN pt.creator_earning 
      ELSE 0 
    END), 0) as pending_balance,
    
    -- Total earnings
    COALESCE(SUM(CASE 
      WHEN pt.status = 'completed' 
      THEN pt.creator_earning 
      ELSE 0 
    END), 0) as total_earnings,
    
    -- Total platform fees
    COALESCE(SUM(CASE 
      WHEN pt.status = 'completed' 
      THEN pt.platform_fee_amount 
      ELSE 0 
    END), 0) as total_platform_fees,
    
    -- Course revenue
    COALESCE(SUM(CASE 
      WHEN pt.status = 'completed' AND pt.reference_type = 'course'
      THEN pt.creator_earning 
      ELSE 0 
    END), 0) as course_revenue,
    
    -- Event revenue  
    COALESCE(SUM(CASE 
      WHEN pt.status = 'completed' AND pt.reference_type = 'event'
      THEN pt.creator_earning 
      ELSE 0 
    END), 0) as event_revenue
    
  FROM payment_transactions pt
  WHERE pt.creator_id = creator_user_id;
END;
$$;

-- Add RLS policies for creator payments
DROP POLICY IF EXISTS "Creators can view their payment transactions" ON payment_transactions;
CREATE POLICY "Creators can view their payment transactions" ON payment_transactions
FOR SELECT USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can view their payouts" ON creator_payouts;
CREATE POLICY "Creators can view their payouts" ON creator_payouts  
FOR SELECT USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can insert their payouts" ON creator_payouts;
CREATE POLICY "Creators can insert their payouts" ON creator_payouts
FOR INSERT WITH CHECK (creator_id = auth.uid());
