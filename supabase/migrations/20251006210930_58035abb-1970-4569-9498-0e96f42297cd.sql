-- Create trigger to send booking confirmation inbox message and email
CREATE OR REPLACE FUNCTION notify_event_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_title TEXT;
  event_creator_id UUID;
  event_date TIMESTAMP WITH TIME ZONE;
  event_time TEXT;
  event_location TEXT;
  attendee_name TEXT;
  attendee_email TEXT;
  organizer_name TEXT;
BEGIN
  -- Only notify on confirmed bookings
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    -- Get event details
    SELECT title, creator_id, start_time, location 
    INTO event_title, event_creator_id, event_date, event_location
    FROM events
    WHERE id = NEW.event_id;
    
    -- Extract time from start_time
    event_time := TO_CHAR(event_date, 'HH24:MI');
    
    -- Get attendee details
    SELECT full_name INTO attendee_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Get attendee email
    SELECT email INTO attendee_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Get organizer name
    SELECT full_name INTO organizer_name
    FROM profiles
    WHERE id = event_creator_id;
    
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
      NEW.user_id,
      '🎟️ Booking Confirmed - ' || COALESCE(event_title, 'Event'),
      'Your booking for "' || COALESCE(event_title, 'Unknown Event') || '" has been confirmed!' || 
      E'\n\n📅 Event Details:' ||
      E'\n• Event: ' || COALESCE(event_title, 'Not specified') ||
      E'\n• Date & Time: ' || TO_CHAR(event_date, 'YYYY-MM-DD') || ' at ' || event_time ||
      E'\n• Location: ' || COALESCE(event_location, 'Not specified') ||
      E'\n• Organizer: ' || COALESCE(organizer_name, 'Event Host') ||
      E'\n• Booking Code: ' || COALESCE(NEW.booking_code, 'N/A') ||
      E'\n• Tickets: ' || NEW.ticket_quantity || 
      E'\n\n📋 Next Steps:' ||
      E'\n• Save your booking code: ' || COALESCE(NEW.booking_code, 'N/A') ||
      E'\n• Check your email for your ticket details' ||
      E'\n• Arrive 15 minutes early for check-in' ||
      E'\n\nSee you at the event! 🎉',
      'system',
      NEW.event_id
    );
    
    -- Send inbox message to the event creator
    IF event_creator_id IS NOT NULL AND event_creator_id != NEW.user_id THEN
      INSERT INTO inbox_messages (
        sender_id,
        recipient_id,
        subject,
        content,
        message_type,
        related_id
      ) VALUES (
        NULL, -- System message
        event_creator_id,
        '🎫 New Booking - ' || COALESCE(event_title, 'Event'),
        COALESCE(attendee_name, 'Someone') || ' has booked ' || NEW.ticket_quantity || ' ticket(s) for your event "' || COALESCE(event_title, 'Unknown Event') || '".' ||
        E'\n\n📊 Booking Details:' ||
        E'\n• Attendee: ' || COALESCE(attendee_name, 'Guest') ||
        E'\n• Tickets: ' || NEW.ticket_quantity ||
        E'\n• Booking Code: ' || COALESCE(NEW.booking_code, 'N/A') ||
        E'\n• Payment: ' || UPPER(COALESCE(NEW.payment_status, 'pending')) ||
        E'\n• Booking Date: ' || TO_CHAR(NEW.booking_date, 'YYYY-MM-DD HH24:MI'),
        'system',
        NEW.event_id
      );
    END IF;
    
    -- Trigger email notification via edge function
    -- This will be called by the edge function automatically
    PERFORM
      net.http_post(
        url := 'https://rxqoczksnddbxcdwobnw.supabase.co/functions/v1/send-event-confirmation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'email', attendee_email,
          'attendeeName', COALESCE(attendee_name, 'Guest'),
          'eventTitle', COALESCE(event_title, 'Event'),
          'eventId', NEW.event_id::text,
          'eventDate', event_date::text,
          'eventTime', event_time,
          'location', COALESCE(event_location, 'TBA'),
          'ticketCode', COALESCE(NEW.booking_code, 'N/A'),
          'qrCodeData', NEW.booking_code::text,
          'organizerName', COALESCE(organizer_name, 'Event Host')
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for event bookings
DROP TRIGGER IF EXISTS event_booking_notification_trigger ON event_bookings;
CREATE TRIGGER event_booking_notification_trigger
  AFTER INSERT OR UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_booking();