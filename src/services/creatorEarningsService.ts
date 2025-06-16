
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
}

export async function calculateCreatorEarningsFromPaymentTransactions(creatorId: string): Promise<CreatorEarningsData> {
  try {
    // Get all payment transactions for this creator
    const { data: paymentTransactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    if (error) throw error;

    if (!paymentTransactions || paymentTransactions.length === 0) {
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

    paymentTransactions.forEach(tx => {
      const creatorEarning = Number(tx.creator_earning || 0);
      const platformFee = Number(tx.platform_fee_amount || 0);
      
      totalEarnings += creatorEarning;
      totalPlatformFees += platformFee;

      // Check if this is a course or event
      if (tx.reference_type === 'course') {
        courseRevenue += creatorEarning;
      } else if (tx.reference_type === 'event') {
        eventRevenue += creatorEarning;
      }

      // Check if payment is eligible for withdrawal based on payout_eligible_date
      const payoutEligibleDate = new Date(tx.payout_eligible_date || tx.created_at);
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
    console.error('Error calculating creator earnings:', error);
    throw error;
  }
}

export async function fetchCreatorTransactions(creatorId: string): Promise<CreatorTransaction[]> {
  try {
    // Get all payment transactions for this creator
    const { data: paymentTransactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!paymentTransactions || paymentTransactions.length === 0) {
      return [];
    }

    // Get user profiles for customer names
    const userIds = [...new Set(paymentTransactions.map(tx => tx.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    // Get course and event titles
    const courseIds = paymentTransactions
      .filter(tx => tx.reference_type === 'course')
      .map(tx => tx.reference_id);
    
    let courses: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);
      courses = courseData || [];
    }

    const eventIds = paymentTransactions
      .filter(tx => tx.reference_type === 'event')
      .map(tx => tx.reference_id);
    
    let events: any[] = [];
    if (eventIds.length > 0) {
      const { data: eventData } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      events = eventData || [];
    }

    // Format the data
    const creatorTransactions: CreatorTransaction[] = paymentTransactions.map(tx => {
      const profile = profiles?.find(p => p.id === tx.user_id);
      const course = courses.find(c => c.id === tx.reference_id);
      const event = events.find(e => e.id === tx.reference_id);

      let itemName = 'Unknown Item';
      if (tx.reference_type === 'course' && course) {
        itemName = course.title;
      } else if (tx.reference_type === 'event' && event) {
        itemName = event.title;
      } else if (tx.metadata?.item_name) {
        itemName = tx.metadata.item_name;
      }

      return {
        id: tx.id,
        order_id: tx.metadata?.order_id || 'N/A',
        customer_email: 'N/A', // Will get from order if needed
        customer_name: profile?.username || profile?.full_name || 'Unknown Customer',
        item_type: tx.reference_type === 'course' ? 'course' : 'event',
        item_name: itemName,
        item_id: tx.reference_id,
        quantity: tx.metadata?.quantity || 1,
        unit_price: Number(tx.amount),
        total_amount: Number(tx.amount),
        creator_earning: Number(tx.creator_earning || 0),
        platform_fee: Number(tx.platform_fee_amount || 0),
        payment_status: tx.status,
        created_at: tx.created_at,
        order_total: Number(tx.amount),
        payout_eligible_date: tx.payout_eligible_date || tx.created_at
      };
    });

    return creatorTransactions;
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
