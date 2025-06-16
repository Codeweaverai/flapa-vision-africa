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
  item_type: 'course' | 'event';
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
      .eq('orders.payment_status', 'completed');

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

    // Filter items that belong to this creator
    const creatorItems = [];
    
    for (const item of orderItems) {
      let isCreatorItem = false;
      
      if (item.item_type === 'course') {
        const { data: course } = await supabase
          .from('courses')
          .select('creator_id')
          .eq('id', item.item_id)
          .single();
        
        if (course && course.creator_id === creatorId) {
          isCreatorItem = true;
        }
      } else if (item.item_type === 'event_ticket') {
        // Get event from ticket
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('event_id')
          .eq('id', item.item_id)
          .single();
        
        if (ticket) {
          const { data: event } = await supabase
            .from('events')
            .select('creator_id')
            .eq('id', ticket.event_id)
            .single();
          
          if (event && event.creator_id === creatorId) {
            isCreatorItem = true;
          }
        }
      }
      
      if (isCreatorItem) {
        creatorItems.push(item);
      }
    }

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let courseRevenue = 0;
    let eventRevenue = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    const now = new Date();

    creatorItems.forEach(item => {
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
    console.error('Error calculating creator earnings from orders:', error);
    throw error;
  }
}

export async function fetchCreatorTransactions(creatorId: string): Promise<CreatorTransaction[]> {
  try {
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
          created_at,
          updated_at
        )
      `)
      .eq('orders.payment_status', 'completed')
      .order('orders.created_at', { ascending: false });

    if (error) throw error;

    if (!orderItems || orderItems.length === 0) {
      return [];
    }

    // Filter and process items that belong to this creator
    const creatorTransactions: CreatorTransaction[] = [];
    
    // Get user profiles for customer names
    const userIds = [...new Set(orderItems.map(item => item.orders.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    for (const item of orderItems) {
      let isCreatorItem = false;
      let itemName = 'Unknown Item';
      let itemType: 'course' | 'event' = 'course';
      
      if (item.item_type === 'course') {
        const { data: course } = await supabase
          .from('courses')
          .select('creator_id, title')
          .eq('id', item.item_id)
          .single();
        
        if (course && course.creator_id === creatorId) {
          isCreatorItem = true;
          itemName = course.title;
          itemType = 'course';
        }
      } else if (item.item_type === 'event_ticket') {
        // Get event from ticket
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('event_id')
          .eq('id', item.item_id)
          .single();
        
        if (ticket) {
          const { data: event } = await supabase
            .from('events')
            .select('creator_id, title')
            .eq('id', ticket.event_id)
            .single();
          
          if (event && event.creator_id === creatorId) {
            isCreatorItem = true;
            itemName = event.title;
            itemType = 'event';
          }
        }
      }
      
      if (isCreatorItem) {
        const profile = profiles?.find(p => p.id === item.orders.user_id);
        const itemTotal = Number(item.total_price);
        const platformFee = itemTotal * PLATFORM_FEE_RATE;
        const creatorEarning = itemTotal - platformFee;
        
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
    }

    return creatorTransactions;
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
