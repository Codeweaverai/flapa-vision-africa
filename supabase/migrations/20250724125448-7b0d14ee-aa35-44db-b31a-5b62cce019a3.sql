
-- First, create a security definer function to check if a creator owns content in an order
CREATE OR REPLACE FUNCTION public.creator_owns_order_content(order_uuid uuid, creator_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.order_items oi
    WHERE oi.order_id = order_uuid
    AND (
      (oi.item_type = 'course' AND EXISTS (
        SELECT 1 FROM public.courses c 
        WHERE c.id = oi.item_id AND c.creator_id = creator_uuid
      ))
      OR
      (oi.item_type = 'event_ticket' AND EXISTS (
        SELECT 1 FROM public.event_tickets et
        JOIN public.events e ON e.id = et.event_id
        WHERE et.id = oi.item_id AND e.creator_id = creator_uuid
      ))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a function to check if a creator owns a specific order item
CREATE OR REPLACE FUNCTION public.creator_owns_order_item(item_type_param text, item_id_param uuid, creator_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  IF item_type_param = 'course' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = item_id_param AND c.creator_id = creator_uuid
    );
  ELSIF item_type_param = 'event_ticket' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.event_tickets et
      JOIN public.events e ON e.id = et.event_id
      WHERE et.id = item_id_param AND e.creator_id = creator_uuid
    );
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Creators can view orders for their content" ON public.orders;
DROP POLICY IF EXISTS "Creators can view order items for their content" ON public.order_items;

-- Create new policies using the security definer functions
CREATE POLICY "Creators can view orders for their content" ON public.orders
FOR SELECT USING (
  creator_owns_order_content(orders.id, auth.uid())
);

CREATE POLICY "Creators can view order items for their content" ON public.order_items
FOR SELECT USING (
  creator_owns_order_item(order_items.item_type, order_items.item_id, auth.uid())
);

-- Also ensure users can still view their own orders
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);
