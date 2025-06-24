
import { supabase } from '@/lib/supabaseClient';

export interface CreatorTransaction {
  id: string;
  created_at: string;
  customer_name?: string;
  item_name: string;
  item_type: string;
  total_amount: number;
  creator_earning: number;
  platform_fee: number;
  payment_status: string;
  payout_eligible_date?: string;
}

export interface CreatorEarnings {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
}

export async function calculateCreatorEarningsFromOrders(creatorId: string): Promise<CreatorEarnings> {
  try {
    // Get completed payouts to subtract from available balance
    const { data: completedPayouts, error: payoutsError } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    if (payoutsError) {
      console.error('Error fetching completed payouts:', payoutsError);
    }

    const totalPayouts = completedPayouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0;

    // Use the database function to calculate earnings
    const { data, error } = await supabase.rpc('calculate_creator_earnings', {
      creator_user_id: creatorId
    });

    if (error) {
      console.error('Error calculating creator earnings:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0
      };
    }

    const result = data[0];
    
    return {
      available_balance: Math.max(0, (result.available_balance || 0) - totalPayouts),
      pending_balance: result.pending_balance || 0,
      total_earnings: result.total_earnings || 0,
      total_platform_fees: result.total_platform_fees || 0,
      course_revenue: result.course_revenue || 0,
      event_revenue: result.event_revenue || 0
    };
  } catch (error) {
    console.error('Error in calculateCreatorEarningsFromOrders:', error);
    throw error;
  }
}

export async function fetchCreatorTransactions(creatorId: string): Promise<CreatorTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        created_at,
        amount,
        creator_earning,
        platform_fee_amount,
        status,
        reference_type,
        reference_id,
        payout_eligible_date
      `)
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator transactions:', error);
      throw error;
    }

    // Map the data to include item names and customer info
    const transactions = await Promise.all(
      (data || []).map(async (transaction) => {
        let itemName = 'Unknown Item';
        let customerName = 'Unknown Customer';

        // Fetch item details based on reference type
        if (transaction.reference_type === 'course') {
          const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', transaction.reference_id)
            .single();
          itemName = course?.title || 'Course';
        } else if (transaction.reference_type === 'event') {
          const { data: event } = await supabase
            .from('events')
            .select('title')
            .eq('id', transaction.reference_id)
            .single();
          itemName = event?.title || 'Event';
        }

        return {
          id: transaction.id,
          created_at: transaction.created_at,
          customer_name: customerName,
          item_name: itemName,
          item_type: transaction.reference_type,
          total_amount: transaction.amount,
          creator_earning: transaction.creator_earning,
          platform_fee: transaction.platform_fee_amount,
          payment_status: transaction.status,
          payout_eligible_date: transaction.payout_eligible_date
        };
      })
    );

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
      .select(`
        stripe_connect_account_id,
        stripe_onboarding_completed,
        mobile_money_operator,
        mobile_money_number,
        default_payout_method
      `)
      .eq('id', creatorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payout method:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCreatorPayoutMethod:', error);
    throw error;
  }
}
