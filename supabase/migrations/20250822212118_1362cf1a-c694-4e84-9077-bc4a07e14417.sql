
-- Create a security definer function to check if a creator owns content in an order
CREATE OR REPLACE FUNCTION public.creator_owns_order_content(order_uuid uuid, creator_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if the order contains any items that belong to the creator
  RETURN EXISTS (
    SELECT 1 
    FROM order_items oi
    WHERE oi.order_id = order_uuid
    AND (
      -- Check if it's a course owned by the creator
      (oi.item_type = 'course' AND EXISTS (
        SELECT 1 FROM courses c 
        WHERE c.id = oi.item_id AND c.creator_id = creator_uuid
      ))
      OR
      -- Check if it's an event ticket for an event owned by the creator
      (oi.item_type = 'event_ticket' AND EXISTS (
        SELECT 1 FROM event_tickets et
        JOIN events e ON e.id = et.event_id
        WHERE et.id = oi.item_id AND e.creator_id = creator_uuid
      ))
    )
  );
END;
$$;

-- Add RLS policy for creators to view orders containing their content
CREATE POLICY "Creators can view orders for their content"
ON public.orders
FOR SELECT
USING (creator_owns_order_content(id, auth.uid()));
