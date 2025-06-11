
-- First, let's ensure we have a storage bucket for receipts and tickets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for receipts bucket
CREATE POLICY "Users can view their own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage receipts" ON storage.objects
FOR ALL USING (bucket_id = 'receipts');

-- Create RLS policies for tickets bucket  
CREATE POLICY "Users can view their own tickets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tickets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage tickets" ON storage.objects
FOR ALL USING (bucket_id = 'tickets');

-- Update generated_tickets table to include more fields for better tracking
ALTER TABLE generated_tickets 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ticket_holder_email text,
ADD COLUMN IF NOT EXISTS generated_at timestamptz DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_generated_tickets_order_id ON generated_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_generated_tickets_user_id ON generated_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_payment_status ON orders(user_id, payment_status);
