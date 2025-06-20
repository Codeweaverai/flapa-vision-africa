
import { supabase } from '@/lib/supabaseClient';

export interface CreatorRevenue {
  totalRevenue: number;
  courseRevenue: number;
  eventRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  totalStudents: number;
  monthlyStudents: { month: string; students: number }[];
  availableBalance: number;
  pendingBalance: number;
  averageRating: number;
  totalReviews: number;
}

export async function fetchCreatorRevenue(creatorId: string): Promise<CreatorRevenue> {
  try {
    // Fetch course revenue from orders and order_items for creator's courses
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

    // Fetch event revenue from orders and order_items for creator's events
    const { data: eventOrders, error: eventError } = await supabase
      .from('orders')
      .select(`
        total_amount,
        created_at,
        order_items!inner(
          item_type,
          item_id,
          event_tickets!inner(
            event_id,
            events!inner(creator_id)
          )
        )
      `)
      .eq('payment_status', 'completed')
      .eq('order_items.item_type', 'event_ticket')
      .eq('order_items.event_tickets.events.creator_id', creatorId);

    if (eventError) throw eventError;

    // Calculate revenue totals
    const courseRevenue = courseOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const eventRevenue = eventOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const totalRevenue = courseRevenue + eventRevenue;

    // Calculate monthly revenue
    const allOrders = [...(courseOrders || []), ...(eventOrders || [])];
    const monthlyRevenueMap = new Map<string, number>();
    
    allOrders.forEach(order => {
      const month = new Date(order.created_at).toISOString().slice(0, 7);
      monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + Number(order.total_amount));
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Fetch course enrollments for student count
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        enrollment_date,
        courses!inner(creator_id)
      `)
      .eq('courses.creator_id', creatorId)
      .eq('payment_status', 'completed');

    if (enrollmentsError) throw enrollmentsError;

    // Fetch event bookings for student count
    const { data: eventBookings, error: bookingsError } = await supabase
      .from('event_bookings')
      .select(`
        booking_date,
        events!inner(creator_id)
      `)
      .eq('events.creator_id', creatorId)
      .eq('payment_status', 'completed');

    if (bookingsError) throw bookingsError;

    const totalStudents = (enrollments?.length || 0) + (eventBookings?.length || 0);

    // Calculate monthly students
    const allStudents = [
      ...(enrollments || []).map(e => ({ created_at: e.enrollment_date })),
      ...(eventBookings || []).map(b => ({ created_at: b.booking_date }))
    ];
    
    const monthlyStudentsMap = new Map<string, number>();
    allStudents.forEach(student => {
      const month = new Date(student.created_at).toISOString().slice(0, 7);
      monthlyStudentsMap.set(month, (monthlyStudentsMap.get(month) || 0) + 1);
    });

    const monthlyStudents = Array.from(monthlyStudentsMap.entries())
      .map(([month, students]) => ({ month, students }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate available balance using payment_transactions with 7-day hold
    const { data: transactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    if (transactionsError) throw transactionsError;

    // Fetch completed payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    if (payoutsError) throw payoutsError;

    const totalPayouts = payouts?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;
    
    // Calculate available and pending balances with 7-day hold
    const now = new Date();
    let availableBalance = 0;
    let pendingBalance = 0;

    transactions?.forEach(transaction => {
      const earningAmount = Number(transaction.creator_earning || 0);
      const payoutEligibleDate = new Date(transaction.payout_eligible_date);
      
      if (payoutEligibleDate <= now) {
        availableBalance += earningAmount;
      } else {
        pendingBalance += earningAmount;
      }
    });

    availableBalance = Math.max(0, availableBalance - totalPayouts);

    // Fetch course reviews for average rating
    const { data: courseReviews, error: courseReviewsError } = await supabase
      .from('course_reviews')
      .select(`
        rating,
        courses!inner(creator_id)
      `)
      .eq('courses.creator_id', creatorId);

    if (courseReviewsError) throw courseReviewsError;

    // Fetch event reviews for average rating
    const { data: eventReviews, error: eventReviewsError } = await supabase
      .from('event_reviews')
      .select(`
        rating,
        events!inner(creator_id)
      `)
      .eq('events.creator_id', creatorId);

    if (eventReviewsError) throw eventReviewsError;

    const allReviews = [...(courseReviews || []), ...(eventReviews || [])];
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;

    return {
      totalRevenue,
      courseRevenue,
      eventRevenue,
      monthlyRevenue,
      totalStudents,
      monthlyStudents,
      availableBalance,
      pendingBalance,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: allReviews.length
    };
  } catch (error) {
    console.error('Error fetching creator revenue:', error);
    throw error;
  }
}
