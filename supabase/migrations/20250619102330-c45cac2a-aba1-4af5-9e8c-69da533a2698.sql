
-- Add missing columns to generated_tickets table if they don't exist
ALTER TABLE generated_tickets ADD COLUMN IF NOT EXISTS ticket_number text;
ALTER TABLE generated_tickets ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Add index for faster ticket lookups
CREATE INDEX IF NOT EXISTS idx_generated_tickets_ticket_code ON generated_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_generated_tickets_booking_id ON generated_tickets(booking_id);

-- Add function to calculate available tickets
CREATE OR REPLACE FUNCTION get_available_tickets(ticket_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT quantity_available - quantity_sold
  FROM event_tickets
  WHERE id = ticket_id;
$$;

-- Update the booking code generation to be more unique
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'EVT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())), 1, 8));
END;
$$;

-- Add ticket number generation function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_sequence')::text, 6, '0');
END;
$$;

-- Create sequence for ticket numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

-- Update generated_tickets table to auto-generate ticket numbers
ALTER TABLE generated_tickets ALTER COLUMN ticket_code SET DEFAULT generate_ticket_code();

-- Ensure booking codes are unique and properly formatted
UPDATE event_bookings SET booking_code = generate_booking_code() WHERE booking_code IS NULL;

-- Add constraint to ensure booking codes are unique
ALTER TABLE event_bookings ADD CONSTRAINT unique_booking_code UNIQUE (booking_code);
