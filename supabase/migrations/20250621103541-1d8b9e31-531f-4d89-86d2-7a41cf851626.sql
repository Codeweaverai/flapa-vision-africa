
-- Add missing updated_at column to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to have the updated_at timestamp
UPDATE public.promo_codes 
SET updated_at = created_at 
WHERE updated_at IS NULL;
