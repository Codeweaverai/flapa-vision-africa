
import { supabase } from '@/lib/supabaseClient';

export interface CreatorRevenue {
  totalRevenue: number;
  courseRevenue: number;
  eventRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  totalStudents: number;
  monthlyStudents: { month: string; students: number }[];
}

export async function fetchCreatorRevenue(creatorId: string): Promise<CreatorRevenue> {
  try {
    // Fetch course revenue from orders
    const { data: courseOrders, error: courseError } = await supabase
      .from('orders')
      .select(`
        total_amount,
        created_at,
        order_items!inner(
          item_type,
          item_id,
          courses!inner(creator_id)
        )
      `)
      .eq('payment_status', 'completed')
      .eq('order_items.item_type', 'course')
      .eq('order_items.courses.creator_id', creatorId);

    if (courseError) throw courseError;

    // Fetch event revenue from orders
    const { data: eventOrders, error: eventError } = await supabase
      .from('orders')
      .select(`
        total_amount,
        created_at,
        order_items!inner(
          item_type,
          item_id,
          event_tickets!inner(
            events!inner(creator_id)
          )
        )
      `)
      .eq('payment_status', 'completed')
      .eq('order_items.item_type', 'event_ticket')
      .eq('order_items.event_tickets.events.creator_id', creatorId);

    if (eventError) throw eventError;

    // Calculate totals
    const courseRevenue = courseOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const eventRevenue = eventOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const totalRevenue = courseRevenue + eventRevenue;

    // Calculate monthly revenue
    const allOrders = [...(courseOrders || []), ...(eventOrders || [])];
    const monthlyRevenueMap = new Map<string, number>();
    
    allOrders.forEach(order => {
      const month = new Date(order.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + Number(order.total_amount));
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Fetch total students
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        created_at,
        courses!inner(creator_id)
      `)
      .eq('courses.creator_id', creatorId)
      .eq('payment_status', 'completed');

    if (enrollmentsError) throw enrollmentsError;

    const { data: eventBookings, error: bookingsError } = await supabase
      .from('event_bookings')
      .select(`
        created_at,
        events!inner(creator_id)
      `)
      .eq('events.creator_id', creatorId)
      .eq('payment_status', 'completed');

    if (bookingsError) throw bookingsError;

    const totalStudents = (enrollments?.length || 0) + (eventBookings?.length || 0);

    // Calculate monthly students
    const allStudents = [...(enrollments || []), ...(eventBookings || [])];
    const monthlyStudentsMap = new Map<string, number>();
    
    allStudents.forEach(student => {
      const month = new Date(student.created_at).toISOString().slice(0, 7);
      monthlyStudentsMap.set(month, (monthlyStudentsMap.get(month) || 0) + 1);
    });

    const monthlyStudents = Array.from(monthlyStudentsMap.entries())
      .map(([month, students]) => ({ month, students }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      courseRevenue,
      eventRevenue,
      monthlyRevenue,
      totalStudents,
      monthlyStudents
    };
  } catch (error) {
    console.error('Error fetching creator revenue:', error);
    throw error;
  }
}
