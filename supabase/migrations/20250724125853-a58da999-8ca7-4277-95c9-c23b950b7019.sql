
-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Creators can view orders for their content" ON public.orders;
DROP POLICY IF EXISTS "Creators can view order items for their content" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

-- Drop the existing functions
DROP FUNCTION IF EXISTS public.creator_owns_order_content(uuid, uuid);
DROP FUNCTION IF EXISTS public.creator_owns_order_item(text, uuid, uuid);

-- Create a more efficient security definer function that checks creator ownership directly
CREATE OR REPLACE FUNCTION public.is_creator_content_owner(creator_uuid uuid, item_type_param text, item_id_param uuid)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN := FALSE;
BEGIN
  IF item_type_param = 'course' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = item_id_param AND creator_id = creator_uuid
    ) INTO result;
  ELSIF item_type_param = 'event_ticket' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.event_tickets et
      JOIN public.events e ON e.id = et.event_id
      WHERE et.id = item_id_param AND e.creator_id = creator_uuid
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simpler policies that don't reference the same table
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- For order_items, use a direct approach without referencing orders table
CREATE POLICY "Users can view order items from their orders" ON public.order_items
FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

CREATE POLICY "Creators can view order items for their content" ON public.order_items
FOR SELECT USING (
  is_creator_content_owner(auth.uid(), item_type, item_id)
);

CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
