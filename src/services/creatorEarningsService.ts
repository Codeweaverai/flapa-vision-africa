import { supabase } from '@/lib/supabaseClient';

export interface CreatorEarningsData {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
}

export interface CreatorTransaction {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name?: string;
  item_type: 'course' | 'event_ticket';
  item_name: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  creator_earning: number;
  platform_fee: number;
  payment_status: string;
  created_at: string;
  order_total: number;
  payout_eligible_date: string;
  payment_method: string;
}

// Platform fee rate (8%)
const PLATFORM_FEE_RATE = 0.08;

export async function calculateCreatorEarningsFromOrders(creatorId: string): Promise<CreatorEarningsData> {
  try {
    // Get creator's course IDs
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .eq('creator_id', creatorId);

    if (coursesError) {
      console.log('Error fetching creator courses:', coursesError);
      // Return zero earnings if we can't fetch courses
    }

    const courseIds = creatorCourses?.map(c => c.id) || [];

    // Get creator's event IDs
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('creator_id', creatorId);

    if (eventsError) {
      console.log('Error fetching creator events:', eventsError);
      // Continue with empty array if events fetch fails
    }

    const eventIds = creatorEvents?.map(e => e.id) || [];

    // Get event ticket IDs for creator's events
    let eventTicketIds: string[] = [];
    if (eventIds.length > 0) {
      const { data: eventTickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('id')
        .in('event_id', eventIds);

      if (ticketsError) {
        console.log('Error fetching event tickets:', ticketsError);
      } else {
        eventTicketIds = eventTickets?.map(t => t.id) || [];
      }
    }

    if (courseIds.length === 0 && eventTicketIds.length === 0) {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0
      };
    }

    // Fetch order items for courses separately
    let courseOrderItems: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseItems, error: courseError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            email,
            total_amount,
            currency,
            payment_status,
            payment_method,
            created_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'course')
        .in('item_id', courseIds);

      if (courseError) {
        console.error('Error fetching course order items:', courseError);
      } else {
        courseOrderItems = courseItems || [];
      }
    }

    // Fetch order items for event tickets separately
    let eventOrderItems: any[] = [];
    if (eventTicketIds.length > 0) {
      const { data: eventItems, error: eventError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            email,
            total_amount,
            currency,
            payment_status,
            payment_method,
            created_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'event_ticket')
        .in('item_id', eventTicketIds);

      if (eventError) {
        console.error('Error fetching event order items:', eventError);
      } else {
        eventOrderItems = eventItems || [];
      }
    }

    // Combine all order items
    const orderItems = [...courseOrderItems, ...eventOrderItems];

    if (!orderItems || orderItems.length === 0) {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0
      };
    }

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let courseRevenue = 0;
    let eventRevenue = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    const now = new Date();

    orderItems.forEach(item => {
      const itemTotal = Number(item.total_price);
      const platformFee = itemTotal * PLATFORM_FEE_RATE;
      const creatorEarning = itemTotal - platformFee;
      
      totalEarnings += creatorEarning;
      totalPlatformFees += platformFee;

      // Check if this is a course or event
      if (item.item_type === 'course') {
        courseRevenue += creatorEarning;
      } else if (item.item_type === 'event_ticket') {
        eventRevenue += creatorEarning;
      }

      // Set payout eligible date (7 days from order creation)
      const orderDate = new Date(item.orders.created_at);
      const payoutEligibleDate = new Date(orderDate);
      payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

      // Check if payment is eligible for withdrawal based on 7-day hold
      if (payoutEligibleDate <= now) {
        availableBalance += creatorEarning;
      } else {
        pendingBalance += creatorEarning;
      }
    });

    // Get completed payouts and subtract the correct amounts from available balance
    const { data: completedPayouts } = await supabase
      .from('creator_payouts')
      .select('amount, method, mobile_money_details, currency')
      .eq('creator_id', creatorId)
      .in('status', ['completed', 'processing']);

    let totalPayouts = 0;
    
    if (completedPayouts) {
      completedPayouts.forEach(payout => {
        // For mobile money payouts, use the original USD amount if available
        if (payout.method === 'mobile_money' && payout.mobile_money_details) {
          // Type assertion with proper checking
          const mobileMoneyDetails = payout.mobile_money_details as any;
          if (mobileMoneyDetails && typeof mobileMoneyDetails === 'object' && mobileMoneyDetails.original_usd_amount) {
            totalPayouts += Number(mobileMoneyDetails.original_usd_amount);
          } else {
            // Fallback to the amount field if original_usd_amount is not available
            totalPayouts += Number(payout.amount);
          }
        } else {
          // For Stripe payouts or mobile money payouts without original USD amount, use the amount directly
          totalPayouts += Number(payout.amount);
        }
      });
    }

    availableBalance = Math.max(0, availableBalance - totalPayouts);

    return {
      available_balance: availableBalance,
      pending_balance: pendingBalance,
      total_earnings: totalEarnings,
      total_platform_fees: totalPlatformFees,
      course_revenue: courseRevenue,
      event_revenue: eventRevenue
    };
  } catch (error) {
    console.error('Error calculating creator earnings from orders:', error);
    // Return zero earnings on error instead of throwing
    return {
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_platform_fees: 0,
      course_revenue: 0,
      event_revenue: 0
    };
  }
}

export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    // Get creator's course IDs and titles
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (coursesError) {
      console.error('Error fetching courses for transactions:', coursesError);
      return { transactions: [], total: 0 };
    }

    const courseIds = creatorCourses?.map(c => c.id) || [];
    const courseMap = new Map(creatorCourses?.map(c => [c.id, c.title]) || []);

    // Get creator's event IDs and titles
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (eventsError) {
      console.error('Error fetching events for transactions:', eventsError);
      return { transactions: [], total: 0 };
    }

    const eventIds = creatorEvents?.map(e => e.id) || [];
    const eventMap = new Map(creatorEvents?.map(e => [e.id, e.title]) || []);

    // Get event ticket IDs for creator's events
    let eventTicketIds: string[] = [];
    let ticketToEventMap = new Map();
    
    if (eventIds.length > 0) {
      const { data: eventTickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('id, event_id')
        .in('event_id', eventIds);

      if (ticketsError) {
        console.error('Error fetching tickets for transactions:', ticketsError);
      } else {
        eventTicketIds = eventTickets?.map(t => t.id) || [];
        ticketToEventMap = new Map(eventTickets?.map(t => [t.id, t.event_id]) || []);
      }
    }

    if (courseIds.length === 0 && eventTicketIds.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Fetch course order items
    let courseOrderItems: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseItems, error: courseError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            email,
            total_amount,
            currency,
            payment_status,
            payment_method,
            created_at,
            updated_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'course')
        .in('item_id', courseIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (courseError) {
        console.error('Error fetching course transactions:', courseError);
      } else {
        courseOrderItems = courseItems || [];
      }
    }

    // Fetch event order items
    let eventOrderItems: any[] = [];
    if (eventTicketIds.length > 0) {
      const { data: eventItems, error: eventError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            email,
            total_amount,
            currency,
            payment_status,
            payment_method,
            created_at,
            updated_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'event_ticket')
        .in('item_id', eventTicketIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (eventError) {
        console.error('Error fetching event transactions:', eventError);
      } else {
        eventOrderItems = eventItems || [];
      }
    }

    // Combine and sort by date
    const orderItems = [...courseOrderItems, ...eventOrderItems]
      .sort((a, b) => new Date(b.orders.created_at).getTime() - new Date(a.orders.created_at).getTime())
      .slice(0, limit);

    if (!orderItems || orderItems.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Get user profiles for customer names
    const userIds = [...new Set(orderItems.map(item => item.orders.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    // Process transactions
    const creatorTransactions: CreatorTransaction[] = [];
    
    for (const item of orderItems) {
      const profile = profiles?.find(p => p.id === item.orders.user_id);
      const itemTotal = Number(item.total_price);
      const platformFee = itemTotal * PLATFORM_FEE_RATE;
      const creatorEarning = itemTotal - platformFee;
      
      let itemName = 'Unknown Item';
      let itemType: 'course' | 'event_ticket' = 'course';
      
      if (item.item_type === 'course') {
        itemName = courseMap.get(item.item_id) || 'Unknown Course';
        itemType = 'course';
      } else if (item.item_type === 'event_ticket') {
        const eventId = ticketToEventMap.get(item.item_id);
        itemName = eventId ? eventMap.get(eventId) || 'Unknown Event' : 'Unknown Event';
        itemType = 'event_ticket';
      }
      
      // Set payout eligible date (7 days from order creation)
      const orderDate = new Date(item.orders.created_at);
      const payoutEligibleDate = new Date(orderDate);
      payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

      creatorTransactions.push({
        id: item.id,
        order_id: item.orders.id,
        customer_email: item.orders.email,
        customer_name: profile?.username || profile?.full_name || 'Unknown Customer',
        item_type: itemType,
        item_name: itemName,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_amount: itemTotal,
        creator_earning: creatorEarning,
        platform_fee: platformFee,
        payment_status: item.orders.payment_status,
        created_at: item.orders.created_at,
        order_total: Number(item.orders.total_amount),
        payout_eligible_date: payoutEligibleDate.toISOString(),
        payment_method: item.orders.payment_method || 'Unknown'
      });
    }

    return { transactions: creatorTransactions, total: creatorTransactions.length };
  } catch (error) {
    console.error('Error fetching creator transactions from orders:', error);
    return { transactions: [], total: 0 };
  }
}

export async function getCreatorPayoutMethod(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('payout_method, mobile_money_details, stripe_connect_id')
      .eq('id', creatorId)
      .single();

    if (error) throw error;

    return {
      payout_method: data?.payout_method || null,
      mobile_money_details: data?.mobile_money_details || null,
      stripe_connect_id: data?.stripe_connect_id || null,
      has_payout_method: !!(data?.payout_method)
    };
  } catch (error) {
    console.error('Error fetching payout method:', error);
    throw error;
  }
}
