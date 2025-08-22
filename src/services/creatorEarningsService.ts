import { supabase } from '@/lib/supabaseClient';

export interface CreatorEarningsData {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
  consultation_revenue: number;
}

export interface CreatorTransaction {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name?: string;
  item_type: 'course' | 'event_ticket' | 'consultation';
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

// Helper function to get all content IDs for a creator
async function getCreatorContentIds(creatorId: string) {
  // Get creator's course IDs
  const { data: creatorCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('creator_id', creatorId);

  if (coursesError) {
    console.error('Error fetching creator courses:', coursesError);
  }

  const courseIds = creatorCourses?.map(c => c.id) || [];
  const courseMap = new Map(creatorCourses?.map(c => [c.id, c.title]) || []);

  // Get creator's event IDs
  const { data: creatorEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, title')
    .eq('creator_id', creatorId);

  if (eventsError) {
    console.error('Error fetching creator events:', eventsError);
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
      console.error('Error fetching event tickets:', ticketsError);
    } else {
      eventTicketIds = eventTickets?.map(t => t.id) || [];
      ticketToEventMap = new Map(eventTickets?.map(t => [t.id, t.event_id]) || []);
    }
  }

  // Get creator's consultation IDs
  const { data: creatorConsultations, error: consultationsError } = await supabase
    .from('consultations')
    .select('id, title')
    .eq('creator_id', creatorId);

  if (consultationsError) {
    console.error('Error fetching creator consultations:', consultationsError);
  }

  const consultationIds = creatorConsultations?.map(c => c.id) || [];
  const consultationMap = new Map(creatorConsultations?.map(c => [c.id, c.title]) || []);

  return {
    courseIds,
    courseMap,
    eventIds,
    eventMap,
    eventTicketIds,
    ticketToEventMap,
    consultationIds,
    consultationMap
  };
}

export async function calculateCreatorEarningsFromOrders(creatorId: string): Promise<CreatorEarningsData> {
  try {
    const {
      courseIds,
      eventTicketIds,
      consultationIds
    } = await getCreatorContentIds(creatorId);

    if (courseIds.length === 0 && eventTicketIds.length === 0 && consultationIds.length === 0) {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0,
        consultation_revenue: 0
      };
    }

    // Build queries for each content type
    const queries = [];

    // Course orders
    if (courseIds.length > 0) {
      queries.push(
        supabase
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
              updated_at,
              tax_amount,
              stripe_payment_intent_id
            )
          `)
          .eq('orders.payment_status', 'completed')
          .eq('item_type', 'course')
          .in('item_id', courseIds)
      );
    }

    // Event ticket orders
    if (eventTicketIds.length > 0) {
      queries.push(
        supabase
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
              updated_at,
              tax_amount,
              stripe_payment_intent_id
            )
          `)
          .eq('orders.payment_status', 'completed')
          .eq('item_type', 'event_ticket')
          .in('item_id', eventTicketIds)
      );
    }

    // Consultation orders
    if (consultationIds.length > 0) {
      queries.push(
        supabase
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
              updated_at,
              tax_amount,
              stripe_payment_intent_id
            )
          `)
          .eq('orders.payment_status', 'completed')
          .eq('item_type', 'consultation')
          .in('item_id', consultationIds)
      );
    }

    // Execute all queries
    const results = await Promise.all(queries);
    
    // Combine all order items
    const allOrderItems = results.flatMap(result => result.data || []);

    if (allOrderItems.length === 0) {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0,
        consultation_revenue: 0
      };
    }

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let courseRevenue = 0;
    let eventRevenue = 0;
    let consultationRevenue = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    const now = new Date();

    allOrderItems.forEach(item => {
      const itemTotal = Number(item.total_price);
      const orderTotal = Number(item.orders.total_amount);
      const orderTax = Number(item.orders.tax_amount) || 0;
      
      // Calculate proportional tax allocation for this item
      const itemTaxAllocation = orderTotal > 0 ? (itemTotal / orderTotal) * orderTax : 0;
      
      // Calculate platform fee and creator earning with tax consideration
      const platformFee = itemTotal * PLATFORM_FEE_RATE;
      const creatorEarning = Math.max(0, itemTotal - platformFee - itemTaxAllocation);
      
      totalEarnings += creatorEarning;
      totalPlatformFees += platformFee;

      // Categorize revenue
      if (item.item_type === 'course') {
        courseRevenue += creatorEarning;
      } else if (item.item_type === 'event_ticket') {
        eventRevenue += creatorEarning;
      } else if (item.item_type === 'consultation') {
        consultationRevenue += creatorEarning;
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

    // Get completed payouts and subtract from available balance
    const { data: completedPayouts } = await supabase
      .from('creator_payouts')
      .select('amount, method, mobile_money_details, currency')
      .eq('creator_id', creatorId)
      .in('status', ['completed', 'processing']);

    let totalPayouts = 0;
    
    if (completedPayouts) {
      completedPayouts.forEach(payout => {
        if (payout.method === 'mobile_money' && payout.mobile_money_details) {
          const mobileMoneyDetails = payout.mobile_money_details as any;
          if (mobileMoneyDetails && typeof mobileMoneyDetails === 'object' && mobileMoneyDetails.original_usd_amount) {
            totalPayouts += Number(mobileMoneyDetails.original_usd_amount);
          } else {
            totalPayouts += Number(payout.amount);
          }
        } else {
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
      event_revenue: eventRevenue,
      consultation_revenue: consultationRevenue
    };
  } catch (error) {
    console.error('Error calculating creator earnings:', error);
    return {
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_platform_fees: 0,
      course_revenue: 0,
      event_revenue: 0,
      consultation_revenue: 0
    };
  }
}

export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    const {
      courseIds,
      courseMap,
      eventTicketIds,
      eventMap,
      ticketToEventMap,
      consultationIds,
      consultationMap
    } = await getCreatorContentIds(creatorId);

    if (courseIds.length === 0 && eventTicketIds.length === 0 && consultationIds.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Build queries for each content type
    const queries = [];

    // Course orders
    if (courseIds.length > 0) {
      queries.push(
        supabase
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
              updated_at,
              tax_amount,
              stripe_payment_intent_id
            )
          `, { count: 'exact' })
          .eq('orders.payment_status', 'completed')
          .eq('item_type', 'course')
          .in('item_id', courseIds)
          .order('orders.created_at', { ascending: false })
      );
    }

    // Event ticket orders
    if (eventTicketIds.length > 0) {
      queries.push(
        supabase
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
              updated_at,
              tax_amount,
              stripe_payment_intent_id
            )
          `, { count: 'exact' })
          .eq('orders.payment_status', 'completed')
          .eq('item_type', 'event_ticket')
          .in('item_id', eventTicketIds)
          .order('orders.created_at', { ascending: false })
      );
    }

    // Consultation orders
    if (consultationIds.length > 0) {
      queries.push(
        supabase
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
              updated_at,
              tax_amount,
              stripe_payment_intent_id
            )
          `, { count: 'exact' })
          .eq('orders.payment_status', 'completed')
          .eq('item_type', 'consultation')
          .in('item_id', consultationIds)
          .order('orders.created_at', { ascending: false })
      );
    }

    // Execute all queries
    const results = await Promise.all(queries);
    
    // Combine all order items and sort by date
    const allOrderItems = results.flatMap(result => result.data || []);
    allOrderItems.sort((a, b) => 
      new Date(b.orders.created_at).getTime() - new Date(a.orders.created_at).getTime()
    );

    const totalCount = allOrderItems.length;
    const paginatedItems = allOrderItems.slice(offset, offset + limit);

    if (paginatedItems.length === 0) {
      return { transactions: [], total: totalCount };
    }

    // Get user profiles for customer names
    const userIds = [...new Set(paginatedItems.map(item => item.orders.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    // Process transactions
    const creatorTransactions: CreatorTransaction[] = [];
    
    for (const item of paginatedItems) {
      const profile = profiles?.find(p => p.id === item.orders.user_id);
      const itemTotal = Number(item.total_price);
      const orderTotal = Number(item.orders.total_amount);
      const orderTax = Number(item.orders.tax_amount) || 0;
      
      // Calculate proportional tax allocation for this item
      const itemTaxAllocation = orderTotal > 0 ? (itemTotal / orderTotal) * orderTax : 0;
      
      // Calculate platform fee (8% of item total)
      const platformFee = itemTotal * PLATFORM_FEE_RATE;
      
      // Calculate creator earning: item total - platform fee - proportional tax
      const creatorEarning = itemTotal - platformFee - itemTaxAllocation;
      
      let itemName = 'Unknown Item';
      
      if (item.item_type === 'course') {
        itemName = courseMap.get(item.item_id) || 'Unknown Course';
      } else if (item.item_type === 'event_ticket') {
        const eventId = ticketToEventMap.get(item.item_id);
        itemName = eventId ? eventMap.get(eventId) || 'Unknown Event' : 'Unknown Event';
      } else if (item.item_type === 'consultation') {
        itemName = consultationMap.get(item.item_id) || 'Unknown Consultation';
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
        item_type: item.item_type,
        item_name: itemName,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_amount: itemTotal,
        creator_earning: Math.max(0, creatorEarning),
        platform_fee: platformFee,
        payment_status: item.orders.payment_status,
        created_at: item.orders.created_at,
        order_total: orderTotal,
        payout_eligible_date: payoutEligibleDate.toISOString(),
        payment_method: item.orders.payment_method || 'Unknown'
      });
    }

    return { transactions: creatorTransactions, total: totalCount };
  } catch (error) {
    console.error('Error fetching creator transactions:', error);
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
