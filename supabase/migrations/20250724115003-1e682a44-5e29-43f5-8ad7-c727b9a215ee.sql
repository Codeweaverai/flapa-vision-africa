
-- Update RLS policies for course_enrollments to allow creators to see all enrollments for their courses
DROP POLICY IF EXISTS "Course creators can view enrollments for their courses" ON course_enrollments;
CREATE POLICY "Course creators can view enrollments for their courses"
ON course_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_enrollments.course_id 
    AND courses.creator_id = auth.uid()
  )
);

-- Update RLS policies for event_bookings to allow creators to see all bookings for their events
DROP POLICY IF EXISTS "Event creators can view bookings for their events" ON event_bookings;
CREATE POLICY "Event creators can view bookings for their events"
ON event_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_bookings.event_id 
    AND events.creator_id = auth.uid()
  )
);

-- Update RLS policies for generated_tickets to allow creators to see all tickets for their events
DROP POLICY IF EXISTS "Event creators can view tickets for their events" ON generated_tickets;
CREATE POLICY "Event creators can view tickets for their events"
ON generated_tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = generated_tickets.event_id 
    AND events.creator_id = auth.uid()
  )
);

-- Ensure admins can still view all data
DROP POLICY IF EXISTS "Admins can view all course enrollments" ON course_enrollments;
CREATE POLICY "Admins can view all course enrollments"
ON course_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

DROP POLICY IF EXISTS "Admins can view all event bookings" ON event_bookings;
CREATE POLICY "Admins can view all event bookings"
ON event_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

DROP POLICY IF EXISTS "Admins can view all generated tickets" ON generated_tickets;
CREATE POLICY "Admins can view all generated tickets"
ON generated_tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);
