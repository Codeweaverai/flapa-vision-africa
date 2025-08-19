
-- Create gifts table for course/event gifting
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('course', 'event')),
  item_id UUID NOT NULL,
  gift_code TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create gift_cards table for monetary gift cards
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  gift_card_code TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_amount NUMERIC NOT NULL DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create gift_redemptions table to track gift card usage
CREATE TABLE public.gift_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  amount_used NUMERIC NOT NULL CHECK (amount_used > 0),
  redeemed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add gift-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS applied_gift_card_id UUID REFERENCES public.gift_cards(id),
ADD COLUMN IF NOT EXISTS gift_card_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_gift_purchase BOOLEAN DEFAULT FALSE;

-- Enable RLS on new tables
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gifts table
CREATE POLICY "Users can view gifts sent to them or by them" ON public.gifts
  FOR SELECT USING (
    sender_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can claim gifts with valid code" ON public.gifts
  FOR UPDATE USING (status = 'pending' AND expires_at > NOW());

CREATE POLICY "System can insert gifts" ON public.gifts
  FOR INSERT WITH CHECK (true);

-- RLS Policies for gift_cards table
CREATE POLICY "Users can view gift cards sent to them or by them" ON public.gift_cards
  FOR SELECT USING (
    sender_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can view active gift cards for redemption" ON public.gift_cards
  FOR SELECT USING (status = 'active' AND expires_at > NOW());

CREATE POLICY "System can manage gift cards" ON public.gift_cards
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for gift_redemptions table
CREATE POLICY "Users can view their own redemptions" ON public.gift_redemptions
  FOR SELECT USING (redeemed_by = auth.uid());

CREATE POLICY "System can insert redemptions" ON public.gift_redemptions
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_gifts_code ON public.gifts(gift_code);
CREATE INDEX idx_gifts_recipient ON public.gifts(recipient_email);
CREATE INDEX idx_gifts_status ON public.gifts(status);
CREATE INDEX idx_gift_cards_code ON public.gift_cards(gift_card_code);
CREATE INDEX idx_gift_cards_recipient ON public.gift_cards(recipient_email);
CREATE INDEX idx_gift_cards_status ON public.gift_cards(status);

-- Function to generate unique gift codes
CREATE OR REPLACE FUNCTION generate_gift_code() RETURNS TEXT AS $$
BEGIN
  RETURN 'GIFT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique gift card codes
CREATE OR REPLACE FUNCTION generate_gift_card_code() RETURNS TEXT AS $$
BEGIN
  RETURN 'GC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())), 1, 10));
END;
$$ LANGUAGE plpgsql;
