
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
}

// Calculate platform fee (8% by default)
const PLATFORM_FEE_RATE = 0.08;

export async function calculateCreatorEarningsFromOrders(creatorId: string): Promise<CreatorEarningsData> {
  try {
    // Get all orders with items related to this creator's courses and events
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(
          id,
          user_id,
          email,
          payment_status,
          total_amount,
          created_at
        ),
        courses(id, title, creator_id),
        events(id, title, creator_id)
      `)
      .or(`courses.creator_id.eq.${creatorId},events.creator_id.eq.${creatorId}`)
      .eq('orders.payment_status', 'completed');

    if (error) throw error;

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let courseRevenue = 0;
    let eventRevenue = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    orderItems?.forEach(item => {
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

      // Check if payment is eligible for withdrawal (7-day hold period)
      const orderDate = new Date(item.orders.created_at);
      if (orderDate <= sevenDaysAgo) {
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
      .eq('status', 'completed');

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
    console.error('Error calculating creator earnings:', error);
    throw error;
  }
}

export async function fetchCreatorTransactions(creatorId: string): Promise<CreatorTransaction[]> {
  try {
    // First, get course transactions
    const { data: courseItems, error: courseError } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(
          id,
          user_id,
          email,
          payment_status,
          total_amount,
          created_at
        ),
        courses!inner(id, title, creator_id)
      `)
      .eq('courses.creator_id', creatorId)
      .eq('orders.payment_status', 'completed')
      .eq('item_type', 'course')
      .order('created_at', { ascending: false });

    // Then, get event transactions
    const { data: eventItems, error: eventError } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(
          id,
          user_id,
          email,
          payment_status,
          total_amount,
          created_at
        ),
        events!inner(id, title, creator_id)
      `)
      .eq('events.creator_id', creatorId)
      .eq('orders.payment_status', 'completed')
      .eq('item_type', 'event_ticket')
      .order('created_at', { ascending: false });

    if (courseError && eventError) {
      throw courseError || eventError;
    }

    const allItems = [...(courseItems || []), ...(eventItems || [])];

    if (!allItems || allItems.length === 0) {
      return [];
    }

    // Get user profiles for customer names
    const userIds = [...new Set(allItems.map(item => item.orders.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    const transactions: CreatorTransaction[] = allItems?.map(item => {
      const itemTotal = Number(item.total_price);
      const platformFee = itemTotal * PLATFORM_FEE_RATE;
      const creatorEarning = itemTotal - platformFee;

      // Find the profile for this user
      const profile = profiles?.find(p => p.id === item.orders.user_id);

      // Get item name from courses or events
      let itemName = item.item_name;
      if (item.courses && item.courses.length > 0) {
        itemName = item.courses[0].title;
      } else if (item.events && item.events.length > 0) {
        itemName = item.events[0].title;
      }

      return {
        id: item.id,
        order_id: item.orders.id,
        customer_email: item.orders.email,
        customer_name: profile?.username || profile?.full_name || 'Unknown Customer',
        item_type: item.item_type as 'course' | 'event_ticket',
        item_name: itemName,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_amount: itemTotal,
        creator_earning: creatorEarning,
        platform_fee: platformFee,
        payment_status: item.orders.payment_status,
        created_at: item.orders.created_at,
        order_total: Number(item.orders.total_amount)
      };
    }) || [];

    // Sort by created_at descending
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return transactions;
  } catch (error) {
    console.error('Error fetching creator transactions:', error);
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
