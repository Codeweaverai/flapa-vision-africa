
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

    if (coursesError) throw coursesError;

    const courseIds = creatorCourses?.map(c => c.id) || [];

    // Get creator's event IDs
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

    // Build the filter condition dynamically
    let filterCondition = '';
    if (courseIds.length > 0 && eventTicketIds.length > 0) {
      filterCondition = `and(item_type.eq.course,item_id.in.(${courseIds.join(',')})),and(item_type.eq.event_ticket,item_id.in.(${eventTicketIds.join(',')}))`;
    } else if (courseIds.length > 0) {
      filterCondition = `and(item_type.eq.course,item_id.in.(${courseIds.join(',')}))`;
    } else if (eventTicketIds.length > 0) {
      filterCondition = `and(item_type.eq.event_ticket,item_id.in.(${eventTicketIds.join(',')}))`;
    } else {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0
      };
    }

    // Get all completed orders with order items for this creator's content
    const { data: orderItems, error } = await supabase
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
      .or(filterCondition);

    if (error) throw error;

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

    // Subtract completed payouts from available balance
    const { data: completedPayouts } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .in('status', ['completed', 'processing']);

    const totalPayouts = completedPayouts?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;
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
    throw error;
  }
}

export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    // Get creator's course IDs and titles
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (coursesError) throw coursesError;

    const courseIds = creatorCourses?.map(c => c.id) || [];
    const courseMap = new Map(creatorCourses?.map(c => [c.id, c.title]) || []);

    // Get creator's event IDs and titles
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (eventsError) throw eventsError;

    const eventIds = creatorEvents?.map(e => e.id) || [];
    const eventMap = new Map(creatorEvents?.map(e => [e.id, e.title]) || []);

    // Get event ticket IDs for creator's events
    const { data: eventTickets, error: ticketsError } = await supabase
      .from('event_tickets')
      .select('id, event_id')
      .in('event_id', eventIds);

    if (ticketsError) throw ticketsError;

    const eventTicketIds = eventTickets?.map(t => t.id) || [];
    const ticketToEventMap = new Map(eventTickets?.map(t => [t.id, t.event_id]) || []);

    if (courseIds.length === 0 && eventTicketIds.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Fetch order items directly for creator's content
    const { data: orderItems, error } = await supabase
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
      .or(
        courseIds.length > 0 && eventTicketIds.length > 0
          ? `and(item_type.eq.course,item_id.in.(${courseIds.join(',')})),and(item_type.eq.event_ticket,item_id.in.(${eventTicketIds.join(',')}))`
          : courseIds.length > 0
          ? `and(item_type.eq.course,item_id.in.(${courseIds.join(',')}))`
          : `and(item_type.eq.event_ticket,item_id.in.(${eventTicketIds.join(',')}))`
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }

    if (!orderItems || orderItems.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Get total count for pagination by doing a separate count query
    const { count: totalCount, error: countError } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('orders.payment_status', 'completed')
      .or(
        courseIds.length > 0 && eventTicketIds.length > 0
          ? `and(item_type.eq.course,item_id.in.(${courseIds.join(',')})),and(item_type.eq.event_ticket,item_id.in.(${eventTicketIds.join(',')}))`
          : courseIds.length > 0
          ? `and(item_type.eq.course,item_id.in.(${courseIds.join(',')}))`
          : `and(item_type.eq.event_ticket,item_id.in.(${eventTicketIds.join(',')}))`
      );

    if (countError) {
      console.error('Error counting order items:', countError);
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

    return { transactions: creatorTransactions, total: totalCount || 0 };
  } catch (error) {
    console.error('Error fetching creator transactions from orders:', error);
    throw error;
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
