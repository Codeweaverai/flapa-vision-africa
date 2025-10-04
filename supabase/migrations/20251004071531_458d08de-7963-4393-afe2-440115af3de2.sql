-- Create triggers for automated inbox messages

-- 1. Course Enrollment Notifications
-- Trigger when a user enrolls in a course
CREATE OR REPLACE FUNCTION notify_course_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  course_title TEXT;
  course_creator_id UUID;
  student_name TEXT;
BEGIN
  -- Get course details
  SELECT title, creator_id INTO course_title, course_creator_id
  FROM courses WHERE id = NEW.course_id;
  
  -- Get student name
  SELECT full_name INTO student_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify the student
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
    'Course Enrollment Confirmed',
    'You have successfully enrolled in "' || COALESCE(course_title, 'Unknown Course') || '". Start learning now!',
    'system',
    NEW.course_id
  );
  
  -- Notify the course creator
  IF course_creator_id IS NOT NULL AND course_creator_id != NEW.user_id THEN
    INSERT INTO inbox_messages (
      sender_id,
      recipient_id,
      subject,
      content,
      message_type,
      related_id
    ) VALUES (
      NULL, -- System message
      course_creator_id,
      'New Student Enrolled',
      COALESCE(student_name, 'A student') || ' has enrolled in your course "' || COALESCE(course_title, 'Unknown Course') || '".',
      'system',
      NEW.course_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_course_enrollment_notification
AFTER INSERT ON course_enrollments
FOR EACH ROW
EXECUTE FUNCTION notify_course_enrollment();

-- 2. Payment Success Notifications
-- Trigger when an order payment is completed
CREATE OR REPLACE FUNCTION notify_payment_success()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_user_id UUID;
  order_amount NUMERIC;
  order_currency TEXT;
BEGIN
  -- Only notify on payment completion
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Get order details
    SELECT user_id, total_amount, currency 
    INTO order_user_id, order_amount, order_currency
    FROM orders WHERE id = NEW.id;
    
    -- Notify the user
    INSERT INTO inbox_messages (
      sender_id,
      recipient_id,
      subject,
      content,
      message_type,
      related_id
    ) VALUES (
      NULL, -- System message
      order_user_id,
      'Payment Successful',
      'Your payment of ' || order_amount || ' ' || order_currency || ' has been processed successfully. Order ID: ' || LEFT(NEW.id::text, 8),
      'system',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_payment_success_notification
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_payment_success();

-- 3. Course Publishing Notifications
-- Trigger when a course is published
CREATE OR REPLACE FUNCTION notify_course_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify when course is published for the first time
  IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
    INSERT INTO inbox_messages (
      sender_id,
      recipient_id,
      subject,
      content,
      message_type,
      related_id
    ) VALUES (
      NULL, -- System message
      NEW.creator_id,
      'Course Published Successfully',
      'Your course "' || NEW.title || '" has been published and is now live! Students can now enroll.',
      'system',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_course_published_notification
AFTER UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION notify_course_published();

-- 4. Course Review Notifications
-- Trigger when a course receives a review
CREATE OR REPLACE FUNCTION notify_course_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  course_title TEXT;
  course_creator_id UUID;
  reviewer_name TEXT;
BEGIN
  -- Get course details
  SELECT title, creator_id INTO course_title, course_creator_id
  FROM courses WHERE id = NEW.course_id;
  
  -- Get reviewer name
  SELECT full_name INTO reviewer_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify the reviewer
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
    'Review Submitted',
    'Thank you for reviewing "' || COALESCE(course_title, 'Unknown Course') || '". Your feedback helps improve the learning experience!',
    'system',
    NEW.course_id
  );
  
  -- Notify the course creator
  IF course_creator_id IS NOT NULL AND course_creator_id != NEW.user_id THEN
    INSERT INTO inbox_messages (
      sender_id,
      recipient_id,
      subject,
      content,
      message_type,
      related_id
    ) VALUES (
      NULL, -- System message
      course_creator_id,
      'New Course Review',
      COALESCE(reviewer_name, 'A student') || ' gave your course "' || COALESCE(course_title, 'Unknown Course') || '" a ' || NEW.rating || '-star review.',
      'system',
      NEW.course_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_course_review_notification
AFTER INSERT ON course_reviews
FOR EACH ROW
EXECUTE FUNCTION notify_course_review();

-- 5. Event Review Notifications
-- Trigger when an event receives a review
CREATE OR REPLACE FUNCTION notify_event_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_title TEXT;
  event_creator_id UUID;
  reviewer_name TEXT;
BEGIN
  -- Get event details
  SELECT title, creator_id INTO event_title, event_creator_id
  FROM events WHERE id = NEW.event_id;
  
  -- Get reviewer name
  SELECT full_name INTO reviewer_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify the reviewer
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
    'Review Submitted',
    'Thank you for reviewing "' || COALESCE(event_title, 'Unknown Event') || '". Your feedback is valuable!',
    'system',
    NEW.event_id
  );
  
  -- Notify the event creator
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
      'New Event Review',
      COALESCE(reviewer_name, 'An attendee') || ' gave your event "' || COALESCE(event_title, 'Unknown Event') || '" a ' || NEW.rating || '-star review.',
      'system',
      NEW.event_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_event_review_notification
AFTER INSERT ON event_reviews
FOR EACH ROW
EXECUTE FUNCTION notify_event_review();

-- 6. Event Booking Notifications
-- Trigger when a user books an event
CREATE OR REPLACE FUNCTION notify_event_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_title TEXT;
  event_creator_id UUID;
  attendee_name TEXT;
BEGIN
  -- Get event details
  SELECT title, creator_id INTO event_title, event_creator_id
  FROM events WHERE id = NEW.event_id;
  
  -- Get attendee name
  SELECT full_name INTO attendee_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify the attendee
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
    'Event Booking Confirmed',
    'Your booking for "' || COALESCE(event_title, 'Unknown Event') || '" has been confirmed. Booking code: ' || COALESCE(NEW.booking_code, 'N/A'),
    'system',
    NEW.event_id
  );
  
  -- Notify the event creator
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
      'New Event Booking',
      COALESCE(attendee_name, 'Someone') || ' has booked ' || NEW.ticket_quantity || ' ticket(s) for your event "' || COALESCE(event_title, 'Unknown Event') || '".',
      'system',
      NEW.event_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_event_booking_notification
AFTER INSERT ON event_bookings
FOR EACH ROW
EXECUTE FUNCTION notify_event_booking();