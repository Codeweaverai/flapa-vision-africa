
-- Update RLS policies for orders table to allow creators to see orders for their content
DROP POLICY IF EXISTS "Creators can view orders for their content" ON public.orders;
CREATE POLICY "Creators can view orders for their content" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    WHERE oi.order_id = orders.id
    AND (
      (oi.item_type = 'course' AND EXISTS (
        SELECT 1 FROM public.courses c 
        WHERE c.id = oi.item_id AND c.creator_id = auth.uid()
      ))
      OR
      (oi.item_type = 'event_ticket' AND EXISTS (
        SELECT 1 FROM public.event_tickets et
        JOIN public.events e ON e.id = et.event_id
        WHERE et.id = oi.item_id AND e.creator_id = auth.uid()
      ))
    )
  )
);

-- Update RLS policies for order_items table to allow creators to see items for their content
DROP POLICY IF EXISTS "Creators can view order items for their content" ON public.order_items;
CREATE POLICY "Creators can view order items for their content" ON public.order_items
FOR SELECT USING (
  (item_type = 'course' AND EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = order_items.item_id AND c.creator_id = auth.uid()
  ))
  OR
  (item_type = 'event_ticket' AND EXISTS (
    SELECT 1 FROM public.event_tickets et
    JOIN public.events e ON e.id = et.event_id
    WHERE et.id = order_items.item_id AND e.creator_id = auth.uid()
  ))
);

-- Update RLS policies for course_enrollments to allow creators to see enrollments for their courses
DROP POLICY IF EXISTS "Course creators can view enrollments for their courses" ON public.course_enrollments;
CREATE POLICY "Course creators can view enrollments for their courses" ON public.course_enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_enrollments.course_id AND c.creator_id = auth.uid()
  )
);

-- Update RLS policies for event_bookings to allow creators to see bookings for their events  
DROP POLICY IF EXISTS "Event creators can view bookings for their events" ON public.event_bookings;
CREATE POLICY "Event creators can view bookings for their events" ON public.event_bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_bookings.event_id AND e.creator_id = auth.uid()
  )
);
