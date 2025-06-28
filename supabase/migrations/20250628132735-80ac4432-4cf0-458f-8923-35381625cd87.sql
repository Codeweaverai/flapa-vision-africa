
-- Create RPC function for safe ticket inventory updates
CREATE OR REPLACE FUNCTION update_ticket_inventory(
  p_ticket_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT quantity_available INTO current_available
  FROM event_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;
  
  -- Check if we have enough tickets
  IF current_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient ticket inventory. Available: %, Requested: %', current_available, p_quantity;
  END IF;
  
  -- Update the inventory
  UPDATE event_tickets
  SET 
    quantity_available = quantity_available - p_quantity,
    quantity_sold = quantity_sold + p_quantity,
    updated_at = NOW()
  WHERE id = p_ticket_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Improve the process_payment_success function to handle ticket inventory better
CREATE OR REPLACE FUNCTION process_payment_success(p_order_id uuid, p_payment_intent_id text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  order_item RECORD;
  booking_id UUID;
  enrollment_id UUID;
  ticket_code TEXT;
  qr_data TEXT;
  event_record RECORD;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Update order status
  UPDATE public.orders 
  SET 
    payment_status = 'completed',
    updated_at = now(),
    stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
    receipt_generated_at = now()
  WHERE id = p_order_id;

  -- Process each order item
  FOR order_item IN 
    SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF order_item.item_type = 'course' THEN
      -- Create course enrollment
      INSERT INTO public.course_enrollments (
        user_id, course_id, payment_status, order_id, enrollment_date
      ) VALUES (
        order_record.user_id, order_item.item_id, 'completed', p_order_id, now()
      );
      
    ELSIF order_item.item_type = 'event_ticket' THEN
      -- Get event details from ticket
      SELECT e.* INTO event_record
      FROM public.events e
      JOIN public.event_tickets et ON e.id = et.event_id
      WHERE et.id = order_item.item_id;

      -- Update ticket inventory safely
      PERFORM update_ticket_inventory(order_item.item_id, order_item.quantity);

      -- Create event booking
      INSERT INTO public.event_bookings (
        user_id, event_id, event_ticket_id, status, payment_status, 
        payment_amount, payment_currency, ticket_quantity, order_id, booking_date,
        booking_code
      ) VALUES (
        order_record.user_id, 
        event_record.id,
        order_item.item_id,
        'confirmed',
        'completed',
        order_item.total_price,
        order_record.currency,
        order_item.quantity,
        p_order_id,
        now(),
        generate_booking_code()
      ) RETURNING id INTO booking_id;

      -- Generate individual tickets for each quantity
      FOR i IN 1..order_item.quantity LOOP
        ticket_code := 'TCK-' || order_record.user_id || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 8));
        
        qr_data := jsonb_build_object(
          'ticket_code', ticket_code,
          'booking_id', booking_id,
          'event_id', event_record.id,
          'order_id', p_order_id,
          'user_id', order_record.user_id,
          'generated_at', now()
        )::text;

        INSERT INTO public.generated_tickets (
          booking_id, event_id, order_id, user_id, ticket_holder_name, 
          ticket_code, qr_code_data, ticket_status
        ) VALUES (
          booking_id,
          event_record.id,
          p_order_id,
          order_record.user_id,
          COALESCE(
            (SELECT full_name FROM profiles WHERE id = order_record.user_id),
            'Ticket Holder ' || i
          ),
          ticket_code,
          qr_data,
          'active'
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE NOTICE 'Error processing payment success for order %: %', p_order_id, SQLERRM;
    RAISE;
END;
$$;

-- Create function to generate ticket codes
CREATE OR REPLACE FUNCTION generate_unique_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'TCK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    
    SELECT EXISTS(SELECT 1 FROM generated_tickets WHERE ticket_code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;
