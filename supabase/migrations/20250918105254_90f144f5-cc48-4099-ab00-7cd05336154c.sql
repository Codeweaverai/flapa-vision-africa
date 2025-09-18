-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('enrollment', 'booking', 'payment', 'review', 'content_published')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'event', 'order', 'review')),
  entity_id UUID NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_type ON public.activities(activity_type);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_activities_user_created ON public.activities(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own activities" 
ON public.activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities" 
ON public.activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" 
ON public.activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to create payment activity
CREATE OR REPLACE FUNCTION create_payment_activity()
RETURNS TRIGGER AS $$
DECLARE
  order_user_id UUID;
  order_amount NUMERIC;
  order_currency TEXT;
BEGIN
  -- Only create activity for completed payments
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Get order details
    SELECT user_id, total_amount, currency 
    INTO order_user_id, order_amount, order_currency
    FROM orders WHERE id = NEW.id;
    
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      order_user_id,
      'payment',
      'order', 
      NEW.id,
      'Payment completed for order #' || LEFT(NEW.id::text, 8),
      jsonb_build_object(
        'amount', order_amount,
        'currency', order_currency,
        'payment_method', NEW.payment_method,
        'order_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create enrollment activity
CREATE OR REPLACE FUNCTION create_enrollment_activity()
RETURNS TRIGGER AS $$
DECLARE
  course_title TEXT;
  course_creator_id UUID;
BEGIN
  -- Get course details
  SELECT title, creator_id INTO course_title, course_creator_id 
  FROM courses WHERE id = NEW.course_id;
  
  -- Create activity for the student who enrolled
  INSERT INTO public.activities (
    user_id, activity_type, entity_type, entity_id, message, metadata
  ) VALUES (
    NEW.user_id,
    'enrollment',
    'course',
    NEW.course_id,
    'Enrolled in "' || COALESCE(course_title, 'Unknown Course') || '"',
    jsonb_build_object(
      'course_id', NEW.course_id,
      'course_title', course_title,
      'enrollment_id', NEW.id
    )
  );
  
  -- Create activity for the course creator
  IF course_creator_id IS NOT NULL AND course_creator_id != NEW.user_id THEN
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      course_creator_id,
      'enrollment',
      'course',
      NEW.course_id,
      'New student enrolled in "' || COALESCE(course_title, 'Unknown Course') || '"',
      jsonb_build_object(
        'course_id', NEW.course_id,
        'course_title', course_title,
        'enrollment_id', NEW.id,
        'student_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create booking activity
CREATE OR REPLACE FUNCTION create_booking_activity()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_creator_id UUID;
BEGIN
  -- Get event details
  SELECT title, creator_id INTO event_title, event_creator_id 
  FROM events WHERE id = NEW.event_id;
  
  -- Create activity for the user who booked
  INSERT INTO public.activities (
    user_id, activity_type, entity_type, entity_id, message, metadata
  ) VALUES (
    NEW.user_id,
    'booking',
    'event',
    NEW.event_id,
    'Booked ticket for "' || COALESCE(event_title, 'Unknown Event') || '"',
    jsonb_build_object(
      'event_id', NEW.event_id,
      'event_title', event_title,
      'booking_id', NEW.id,
      'ticket_quantity', NEW.ticket_quantity
    )
  );
  
  -- Create activity for the event creator
  IF event_creator_id IS NOT NULL AND event_creator_id != NEW.user_id THEN
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      event_creator_id,
      'booking',
      'event',
      NEW.event_id,
      'New booking for "' || COALESCE(event_title, 'Unknown Event') || '"',
      jsonb_build_object(
        'event_id', NEW.event_id,
        'event_title', event_title,
        'booking_id', NEW.id,
        'attendee_id', NEW.user_id,
        'ticket_quantity', NEW.ticket_quantity
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create course review activity
CREATE OR REPLACE FUNCTION create_course_review_activity()
RETURNS TRIGGER AS $$
DECLARE
  course_title TEXT;
  course_creator_id UUID;
BEGIN
  -- Get course details
  SELECT title, creator_id INTO course_title, course_creator_id 
  FROM courses WHERE id = NEW.course_id;
  
  -- Create activity for the reviewer
  INSERT INTO public.activities (
    user_id, activity_type, entity_type, entity_id, message, metadata
  ) VALUES (
    NEW.user_id,
    'review',
    'course',
    NEW.course_id,
    'Reviewed "' || COALESCE(course_title, 'Unknown Course') || '"',
    jsonb_build_object(
      'course_id', NEW.course_id,
      'course_title', course_title,
      'review_id', NEW.id,
      'rating', NEW.rating
    )
  );
  
  -- Create activity for the course creator
  IF course_creator_id IS NOT NULL AND course_creator_id != NEW.user_id THEN
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      course_creator_id,
      'review',
      'course',
      NEW.course_id,
      'New review for "' || COALESCE(course_title, 'Unknown Course') || '"',
      jsonb_build_object(
        'course_id', NEW.course_id,
        'course_title', course_title,
        'review_id', NEW.id,
        'rating', NEW.rating,
        'reviewer_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create event review activity
CREATE OR REPLACE FUNCTION create_event_review_activity()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_creator_id UUID;
BEGIN
  -- Get event details
  SELECT title, creator_id INTO event_title, event_creator_id 
  FROM events WHERE id = NEW.event_id;
  
  -- Create activity for the reviewer
  INSERT INTO public.activities (
    user_id, activity_type, entity_type, entity_id, message, metadata
  ) VALUES (
    NEW.user_id,
    'review',
    'event',
    NEW.event_id,
    'Reviewed "' || COALESCE(event_title, 'Unknown Event') || '"',
    jsonb_build_object(
      'event_id', NEW.event_id,
      'event_title', event_title,
      'review_id', NEW.id,
      'rating', NEW.rating
    )
  );
  
  -- Create activity for the event creator
  IF event_creator_id IS NOT NULL AND event_creator_id != NEW.user_id THEN
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      event_creator_id,
      'review',
      'event',
      NEW.event_id,
      'New review for "' || COALESCE(event_title, 'Unknown Event') || '"',
      jsonb_build_object(
        'event_id', NEW.event_id,
        'event_title', event_title,
        'review_id', NEW.id,
        'rating', NEW.rating,
        'reviewer_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create content published activity
CREATE OR REPLACE FUNCTION create_course_published_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create activity when course is published for the first time
  IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      NEW.creator_id,
      'content_published',
      'course',
      NEW.id,
      'Published course "' || NEW.title || '"',
      jsonb_build_object(
        'course_id', NEW.id,
        'course_title', NEW.title,
        'category', NEW.category
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create event published activity
CREATE OR REPLACE FUNCTION create_event_published_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create activity when event is published for the first time
  IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
    INSERT INTO public.activities (
      user_id, activity_type, entity_type, entity_id, message, metadata
    ) VALUES (
      NEW.creator_id,
      'content_published',
      'event',
      NEW.id,
      'Published event "' || NEW.title || '"',
      jsonb_build_object(
        'event_id', NEW.id,
        'event_title', NEW.title,
        'event_type', NEW.event_type
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_payment_activity
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_activity();

CREATE TRIGGER trigger_enrollment_activity
    AFTER INSERT ON public.course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION create_enrollment_activity();

CREATE TRIGGER trigger_booking_activity
    AFTER INSERT ON public.event_bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_booking_activity();

CREATE TRIGGER trigger_course_review_activity
    AFTER INSERT ON public.course_reviews
    FOR EACH ROW
    EXECUTE FUNCTION create_course_review_activity();

CREATE TRIGGER trigger_event_review_activity
    AFTER INSERT ON public.event_reviews
    FOR EACH ROW
    EXECUTE FUNCTION create_event_review_activity();

CREATE TRIGGER trigger_course_published_activity
    AFTER UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION create_course_published_activity();

CREATE TRIGGER trigger_event_published_activity
    AFTER UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION create_event_published_activity();