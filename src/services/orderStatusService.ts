
import { supabase } from '@/lib/supabaseClient';

export interface OrderStatus {
  orderId: string;
  paymentStatus: string;
  fulfillmentStatus: 'pending' | 'completed' | 'partial' | 'failed';
  enrollments: Array<{
    courseId: string;
    status: string;
  }>;
  bookings: Array<{
    eventId: string;
    status: string;
  }>;
}

export async function checkOrderStatus(orderId: string): Promise<OrderStatus | null> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        payment_status,
        order_items (
          id,
          item_id,
          item_type,
          quantity
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return null;
    }

    // Check course enrollments
    const courseItems = order.order_items.filter((item: any) => item.item_type === 'course');
    const enrollments = [];
    
    for (const item of courseItems) {
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('payment_status')
        .eq('course_id', item.item_id)
        .eq('order_id', orderId)
        .single();

      enrollments.push({
        courseId: item.item_id,
        status: enrollment?.payment_status || 'pending'
      });
    }

    // Check event bookings
    const eventItems = order.order_items.filter((item: any) => item.item_type === 'event_ticket');
    const bookings = [];
    
    for (const item of eventItems) {
      // Get event from ticket
      const { data: ticket } = await supabase
        .from('event_tickets')
        .select('event_id')
        .eq('id', item.item_id)
        .single();

      if (ticket) {
        const { data: booking } = await supabase
          .from('event_bookings')
          .select('status, payment_status')
          .eq('event_id', ticket.event_id)
          .eq('order_id', orderId)
          .single();

        bookings.push({
          eventId: ticket.event_id,
          status: booking?.status || 'pending'
        });
      }
    }

    // Determine overall fulfillment status
    let fulfillmentStatus: 'pending' | 'completed' | 'partial' | 'failed' = 'pending';
    const totalItems = enrollments.length + bookings.length;
    const completedItems = enrollments.filter(e => e.status === 'completed').length + 
                          bookings.filter(b => b.status === 'confirmed').length;

    if (completedItems === totalItems && totalItems > 0) {
      fulfillmentStatus = 'completed';
    } else if (completedItems > 0) {
      fulfillmentStatus = 'partial';
    } else if (order.payment_status === 'completed' && totalItems > 0) {
      fulfillmentStatus = 'failed';
    }

    return {
      orderId: order.id,
      paymentStatus: order.payment_status,
      fulfillmentStatus,
      enrollments,
      bookings
    };

  } catch (error) {
    console.error('Error checking order status:', error);
    return null;
  }
}

export async function retryOrderFulfillment(orderId: string): Promise<boolean> {
  try {
    // Call the verify-payment function to retry fulfillment
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        orderId,
        retry: true
      }
    });

    if (error) {
      console.error('Error retrying fulfillment:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error in retry fulfillment:', error);
    return false;
  }
}
