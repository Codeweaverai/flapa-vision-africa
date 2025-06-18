
-- Add ticket types to event_tickets table if not already present
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS ticket_type text NOT NULL DEFAULT 'standard';

-- Update existing tickets to have proper ticket types
UPDATE event_tickets SET ticket_type = 'standard' WHERE ticket_type IS NULL OR ticket_type = '';

-- Add currency support to events table if not present
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Create booking codes for event_bookings if not present
ALTER TABLE event_bookings ADD COLUMN IF NOT EXISTS booking_code text;

-- Add index for booking codes for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_bookings_booking_code ON event_bookings(booking_code);

-- Update generated_tickets to reference booking directly
ALTER TABLE generated_tickets ADD COLUMN IF NOT EXISTS booking_code text;

-- Function to generate booking codes
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'SP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
END;
$$;

-- Trigger to auto-generate booking codes for new bookings
CREATE OR REPLACE FUNCTION auto_generate_booking_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_booking_code ON event_bookings;
CREATE TRIGGER trigger_auto_booking_code
  BEFORE INSERT ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_booking_code();
