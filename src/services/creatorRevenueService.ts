
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
    console.log('Fetching creator revenue for:', creatorId);

    // Fetch orders with order items for creator's courses
    const { data: courseOrderItems, error: courseError } = await supabase
      .from('order_items')
      .select(`
        total_price,
        quantity,
        orders!inner(
          created_at,
          payment_status,
          user_id
        )
      `)
      .eq('item_type', 'course')
      .eq('orders.payment_status', 'completed')
      .in('item_id', 
        await supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creatorId)
          .then(({ data }) => data?.map(c => c.id) || [])
      );

    if (courseError) {
      console.error('Course order items error:', courseError);
      throw courseError;
    }

    // Fetch orders with order items for creator's events
    const { data: eventOrderItems, error: eventError } = await supabase
      .from('order_items')
      .select(`
        total_price,
        quantity,
        orders!inner(
          created_at,
          payment_status,
          user_id
        )
      `)
      .eq('item_type', 'event_ticket')
      .eq('orders.payment_status', 'completed')
      .in('item_id', 
        await supabase
          .from('event_tickets')
          .select(`
            id,
            events!inner(creator_id)
          `)
          .eq('events.creator_id', creatorId)
          .then(({ data }) => data?.map(et => et.id) || [])
      );

    if (eventError) {
      console.error('Event order items error:', eventError);
      throw eventError;
    }

    // Calculate revenue totals
    const courseRevenue = courseOrderItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;
    const eventRevenue = eventOrderItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;
    const totalRevenue = courseRevenue + eventRevenue;

    // Calculate monthly revenue
    const allOrderItems = [...(courseOrderItems || []), ...(eventOrderItems || [])];
    const monthlyRevenueMap = new Map<string, number>();
    
    allOrderItems.forEach(item => {
      const month = new Date(item.orders.created_at).toISOString().slice(0, 7);
      monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + Number(item.total_price));
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Fetch course enrollments for student count
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        enrollment_date,
        user_id
      `)
      .eq('payment_status', 'completed')
      .in('course_id', 
        await supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creatorId)
          .then(({ data }) => data?.map(c => c.id) || [])
      );

    if (enrollmentsError) throw enrollmentsError;

    // Fetch event bookings for student count
    const { data: eventBookings, error: bookingsError } = await supabase
      .from('event_bookings')
      .select(`
        booking_date,
        user_id
      `)
      .eq('payment_status', 'completed')
      .in('event_id', 
        await supabase
          .from('events')
          .select('id')
          .eq('creator_id', creatorId)
          .then(({ data }) => data?.map(e => e.id) || [])
      );

    if (bookingsError) throw bookingsError;

    const totalStudents = (enrollments?.length || 0) + (eventBookings?.length || 0);

    // Calculate monthly students
    const allStudents = [
      ...(enrollments || []).map(e => ({ created_at: e.enrollment_date, user_id: e.user_id })),
      ...(eventBookings || []).map(b => ({ created_at: b.booking_date, user_id: b.user_id }))
    ];
    
    const monthlyStudentsMap = new Map<string, Set<string>>();
    allStudents.forEach(student => {
      const month = new Date(student.created_at).toISOString().slice(0, 7);
      if (!monthlyStudentsMap.has(month)) {
        monthlyStudentsMap.set(month, new Set());
      }
      monthlyStudentsMap.get(month)?.add(student.user_id);
    });

    const monthlyStudents = Array.from(monthlyStudentsMap.entries())
      .map(([month, userSet]) => ({ month, students: userSet.size }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate available and pending balances using payment_transactions with 7-day hold
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
      const payoutEligibleDate = transaction.payout_eligible_date ? 
        new Date(transaction.payout_eligible_date) : 
        new Date(new Date(transaction.created_at).getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from creation
      
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
        rating
      `)
      .in('course_id', 
        await supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creatorId)
          .then(({ data }) => data?.map(c => c.id) || [])
      );

    if (courseReviewsError) throw courseReviewsError;

    // Fetch event reviews for average rating
    const { data: eventReviews, error: eventReviewsError } = await supabase
      .from('event_reviews')
      .select(`
        rating
      `)
      .in('event_id', 
        await supabase
          .from('events')
          .select('id')
          .eq('creator_id', creatorId)
          .then(({ data }) => data?.map(e => e.id) || [])
      );

    if (eventReviewsError) throw eventReviewsError;

    const allReviews = [...(courseReviews || []), ...(eventReviews || [])];
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;

    console.log('Creator revenue calculated:', {
      totalRevenue,
      courseRevenue,
      eventRevenue,
      availableBalance,
      pendingBalance,
      totalStudents,
      averageRating
    });

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
