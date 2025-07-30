
import { supabase } from '@/integrations/supabase/client';

export interface CreatorEarnings {
  totalRevenue: number;
  courseRevenue: number;
  eventRevenue: number;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  platformFees: number;
  thisMonth: number;
  lastMonth: number;
  growthPercentage: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
  }>;
}

interface MobileMoneyDetails {
  country: string;
  phone_number: string;
  mobile_operator: string;
  original_usd_amount?: number;
}

export const fetchCreatorEarnings = async (creatorId: string): Promise<CreatorEarnings> => {
  try {
    // Fetch earnings calculation using the database function
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('calculate_creator_earnings', { creator_user_id: creatorId });

    if (balanceError) {
      console.error('Error calculating balance:', balanceError);
      throw balanceError;
    }

    const earnings = balanceData?.[0] || {
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_platform_fees: 0,
      course_revenue: 0,
      event_revenue: 0
    };

    // Fetch monthly revenue data for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('payment_transactions')
      .select('created_at, creator_earning')
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (monthlyError) {
      console.error('Error fetching monthly data:', monthlyError);
    }

    // Group by month
    const monthlyRevenue: { [key: string]: number } = {};
    monthlyData?.forEach(transaction => {
      const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + transaction.creator_earning;
    });

    const monthlyChartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));

    // Calculate this month vs last month
    const now = new Date();
    const thisMonthKey = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = lastMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    const thisMonthRevenue = monthlyRevenue[thisMonthKey] || 0;
    const lastMonthRevenue = monthlyRevenue[lastMonthKey] || 0;
    const growthPercentage = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      totalRevenue: earnings.total_earnings,
      courseRevenue: earnings.course_revenue,
      eventRevenue: earnings.event_revenue,
      availableBalance: earnings.available_balance,
      pendingBalance: earnings.pending_balance,
      totalEarnings: earnings.total_earnings,
      platformFees: earnings.total_platform_fees,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growthPercentage,
      monthlyData: monthlyChartData
    };

  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    throw error;
  }
};

export const initiateCreatorPayout = async (
  creatorId: string,
  amount: number,
  method: 'stripe' | 'mobile_money',
  destination: string,
  mobileMoneyDetails?: MobileMoneyDetails
): Promise<{ success: boolean; message: string; payoutId?: string }> => {
  try {
    // For mobile money payouts, we need to deduct the USD equivalent amount
    let actualWithdrawAmount = amount;
    
    if (method === 'mobile_money' && mobileMoneyDetails) {
      // Type assertion to handle the jsonb type from database
      const details = mobileMoneyDetails as MobileMoneyDetails;
      if (details.original_usd_amount) {
        actualWithdrawAmount = details.original_usd_amount;
      }
    }

    // First, check available balance
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('calculate_creator_balance', { creator_user_id: creatorId });

    if (balanceError) throw balanceError;

    const availableBalance = balanceData?.[0]?.available_balance || 0;
    
    if (actualWithdrawAmount > availableBalance) {
      return {
        success: false,
        message: 'Insufficient available balance for withdrawal'
      };
    }

    // Create payout record
    const { data: payoutData, error: payoutError } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount: actualWithdrawAmount,
        method,
        destination,
        status: 'pending',
        currency: 'usd',
        mobile_money_details: mobileMoneyDetails ? mobileMoneyDetails : null
      })
      .select('id')
      .single();

    if (payoutError) throw payoutError;

    // Initiate the actual payout based on method
    if (method === 'stripe') {
      // Call Stripe payout function
      const { data: stripeResult, error: stripeError } = await supabase.functions.invoke('stripe-payout', {
        body: {
          creatorId,
          amount: actualWithdrawAmount,
          payoutId: payoutData.id
        }
      });

      if (stripeError) {
        console.error('Stripe payout error:', stripeError);
        // Update payout status to failed
        await supabase
          .from('creator_payouts')
          .update({ status: 'failed' })
          .eq('id', payoutData.id);
        
        return {
          success: false,
          message: 'Failed to process Stripe payout'
        };
      }

      return {
        success: true,
        message: 'Stripe payout initiated successfully',
        payoutId: payoutData.id
      };

    } else if (method === 'mobile_money') {
      // Call PawaPay payout function
      const { data: pawaPayResult, error: pawaPayError } = await supabase.functions.invoke('pawapay-payout', {
        body: {
          creatorId,
          amount: actualWithdrawAmount,
          payoutId: payoutData.id,
          mobileMoneyDetails
        }
      });

      if (pawaPayError) {
        console.error('PawaPay payout error:', pawaPayError);
        // Update payout status to failed
        await supabase
          .from('creator_payouts')
          .update({ status: 'failed' })
          .eq('id', payoutData.id);
        
        return {
          success: false,
          message: 'Failed to process mobile money payout'
        };
      }

      return {
        success: true,
        message: 'Mobile money payout initiated successfully',
        payoutId: payoutData.id
      };
    }

    return {
      success: false,
      message: 'Invalid payout method'
    };

  } catch (error) {
    console.error('Error initiating payout:', error);
    return {
      success: false,
      message: 'Failed to initiate payout'
    };
  }
};

export const fetchCreatorPayoutHistory = async (creatorId: string) => {
  try {
    const { data, error } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching payout history:', error);
    throw error;
  }
};
