
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

    // Get creator's course IDs
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .eq('creator_id', creatorId);

    if (coursesError) throw coursesError;

    const courseIds = creatorCourses?.map(c => c.id) || [];

    // Get creator's event IDs through event_tickets
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('creator_id', creatorId);

    if (eventsError) throw eventsError;

    const eventIds = creatorEvents?.map(e => e.id) || [];

    // Get event ticket IDs for creator's events
    const { data: eventTickets, error: ticketsError } = await supabase
      .from('event_tickets')
      .select('id')
      .in('event_id', eventIds);

    if (ticketsError) throw ticketsError;

    const eventTicketIds = eventTickets?.map(t => t.id) || [];

    // Fetch course order items
    let courseOrderItems: any[] = [];
    if (courseIds.length > 0) {
      const { data, error } = await supabase
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
        .in('item_id', courseIds);

      if (error) throw error;
      courseOrderItems = data || [];
    }

    // Fetch event order items
    let eventOrderItems: any[] = [];
    if (eventTicketIds.length > 0) {
      const { data, error } = await supabase
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
        .in('item_id', eventTicketIds);

      if (error) throw error;
      eventOrderItems = data || [];
    }

    // Calculate revenue totals
    const courseRevenue = courseOrderItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const eventRevenue = eventOrderItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalRevenue = courseRevenue + eventRevenue;

    // Calculate monthly revenue
    const allOrderItems = [...courseOrderItems, ...eventOrderItems];
    const monthlyRevenueMap = new Map<string, number>();
    
    allOrderItems.forEach(item => {
      const month = new Date(item.orders.created_at).toISOString().slice(0, 7);
      monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + Number(item.total_price));
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Fetch course enrollments for student count
    let enrollments: any[] = [];
    if (courseIds.length > 0) {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          enrollment_date,
          user_id
        `)
        .eq('payment_status', 'completed')
        .in('course_id', courseIds);

      if (error) throw error;
      enrollments = data || [];
    }

    // Fetch event bookings for student count
    let eventBookings: any[] = [];
    if (eventIds.length > 0) {
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          booking_date,
          user_id
        `)
        .eq('payment_status', 'completed')
        .in('event_id', eventIds);

      if (error) throw error;
      eventBookings = data || [];
    }

    const totalStudents = enrollments.length + eventBookings.length;

    // Calculate monthly students
    const allStudents = [
      ...enrollments.map(e => ({ created_at: e.enrollment_date, user_id: e.user_id })),
      ...eventBookings.map(b => ({ created_at: b.booking_date, user_id: b.user_id }))
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

    // Calculate available and pending balances using payment_transactions with proper 7-day logic
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
    
    // Calculate available and pending balances with proper 7-day hold logic
    const now = new Date();
    let availableBalance = 0;
    let pendingBalance = 0;

    console.log('Calculating balances for transactions:', transactions?.length);

    transactions?.forEach(transaction => {
      const earningAmount = Number(transaction.creator_earning || 0);
      
      // Use payout_eligible_date if available, otherwise calculate 7 days from creation
      let eligibleDate: Date;
      if (transaction.payout_eligible_date) {
        eligibleDate = new Date(transaction.payout_eligible_date);
      } else {
        // Calculate 7 days from transaction creation at 00:00 of the 7th day
        const transactionDate = new Date(transaction.created_at);
        eligibleDate = new Date(transactionDate);
        eligibleDate.setDate(transactionDate.getDate() + 7);
        eligibleDate.setHours(0, 0, 0, 0); // Set to 00:00 of the 7th day
      }
      
      console.log(`Transaction ${transaction.id}: created ${transaction.created_at}, eligible ${eligibleDate.toISOString()}, now ${now.toISOString()}, amount ${earningAmount}`);
      
      // Check if 7 days have passed (including the 7th day at 00:00)
      if (now >= eligibleDate) {
        availableBalance += earningAmount;
        console.log(`Added ${earningAmount} to available balance`);
      } else {
        pendingBalance += earningAmount;
        console.log(`Added ${earningAmount} to pending balance`);
      }
    });

    // Subtract completed payouts from available balance
    availableBalance = Math.max(0, availableBalance - totalPayouts);

    console.log('Final balances:', { availableBalance, pendingBalance, totalPayouts });

    // Fetch course reviews for average rating
    let courseReviews: any[] = [];
    if (courseIds.length > 0) {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('rating')
        .in('course_id', courseIds);

      if (error) throw error;
      courseReviews = data || [];
    }

    // Fetch event reviews for average rating
    let eventReviews: any[] = [];
    if (eventIds.length > 0) {
      const { data, error } = await supabase
        .from('event_reviews')
        .select('rating')
        .in('event_id', eventIds);

      if (error) throw error;
      eventReviews = data || [];
    }

    const allReviews = [...courseReviews, ...eventReviews];
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
