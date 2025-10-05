-- Create function to notify user when checked in
CREATE OR REPLACE FUNCTION notify_user_check_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attendee_id UUID;
  event_title TEXT;
  event_location TEXT;
  event_date TIMESTAMP WITH TIME ZONE;
  checker_name TEXT;
BEGIN
  -- Get attendee user_id from the ticket
  SELECT user_id INTO attendee_id
  FROM generated_tickets
  WHERE id = NEW.ticket_id;
  
  -- Get event details
  SELECT title, location, start_date INTO event_title, event_location, event_date
  FROM events
  WHERE id = NEW.event_id;
  
  -- Get checker name
  SELECT full_name INTO checker_name
  FROM profiles
  WHERE id = NEW.checked_in_by;
  
  -- Send inbox message to the attendee
  INSERT INTO inbox_messages (
    sender_id,
    recipient_id,
    subject,
    content,
    message_type,
    related_id
  ) VALUES (
    NULL, -- System message
    attendee_id,
    'Check-in Successful - ' || COALESCE(event_title, 'Event'),
    'You have been successfully checked in to "' || COALESCE(event_title, 'Unknown Event') || '".' || 
    E'\n\nEvent Details:' ||
    E'\n📍 Location: ' || COALESCE(event_location, 'Not specified') ||
    E'\n📅 Event Date: ' || TO_CHAR(event_date, 'YYYY-MM-DD HH24:MI') ||
    E'\n⏰ Check-in Time: ' || TO_CHAR(NEW.check_in_time, 'YYYY-MM-DD HH24:MI:SS') ||
    E'\n✅ Checked in by: ' || COALESCE(checker_name, 'Staff'),
    'system',
    NEW.event_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for check-in notifications
CREATE TRIGGER trigger_check_in_notification
AFTER INSERT ON check_ins
FOR EACH ROW
EXECUTE FUNCTION notify_user_check_in();