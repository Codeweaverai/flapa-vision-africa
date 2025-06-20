
-- Add missing columns to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS item_type TEXT,
ADD COLUMN IF NOT EXISTS item_id UUID;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_creator_id ON public.promo_codes(creator_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_item ON public.promo_codes(item_type, item_id);
