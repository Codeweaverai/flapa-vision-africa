import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { 
  calculateCreatorEarningsFromOrders, 
  fetchCreatorTransactions,
  CreatorTransaction
} from './creatorEarningsService';

export interface CreatorEarnings {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
  fundraising_revenue: number; // ✅ ADDED FUNDRAISING REVENUE
}

export interface CreatorPaymentTransaction extends CreatorTransaction {}

export interface PayoutRequest {
  amount: number;
  payout_method: 'stripe' | 'mobile_money';
  mobile_money_details?: {
    phone_number: string;
    operator: string;
    country: string;
  };
}

export async function fetchCreatorEarnings(creatorId: string): Promise<CreatorEarnings> {
  try {
    console.log('Fetching creator earnings for:', creatorId);
    const earnings = await calculateCreatorEarningsFromOrders(creatorId);
    console.log('Creator earnings calculated:', earnings);
    return earnings;
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    throw error;
  }
}

export async function fetchCreatorPaymentTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorPaymentTransaction[], total: number }> {
  try {
    console.log('Fetching creator payment transactions for:', creatorId, 'limit:', limit, 'offset:', offset);
    const result = await fetchCreatorTransactions(creatorId, limit, offset);
    console.log('Creator transactions fetched:', result.transactions.length, 'total:', result.total);
    return result;
  } catch (error) {
    console.error('Error fetching creator payment transactions:', error);
    throw error;
  }
}

export async function requestCreatorPayout(
  creatorId: string, 
  payoutRequest: PayoutRequest
): Promise<boolean> {
  try {
    // Check available balance first
    const earnings = await fetchCreatorEarnings(creatorId);
    
    if (payoutRequest.amount > earnings.available_balance) {
      toast({
        title: "Insufficient Balance",
        description: `Requested amount ($${payoutRequest.amount.toFixed(2)}) exceeds available balance ($${earnings.available_balance.toFixed(2)})`,
        variant: "destructive"
      });
      return false;
    }

    if (payoutRequest.amount < 5) {
      toast({
        title: "Minimum Amount Required",
        description: "Minimum payout amount is $5.00",
        variant: "destructive"
      });
      return false;
    }

    // Check if user has the required payout method set up
    if (payoutRequest.payout_method === 'stripe') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_connect_id')
        .eq('id', creatorId)
        .single();

      if (!profile?.stripe_connect_id) {
        toast({
          title: "Stripe Not Connected",
          description: "Please connect your Stripe account first",
          variant: "destructive"
        });
        return false;
      }
    }

    // Validate mobile money details if mobile money payout
    if (payoutRequest.payout_method === 'mobile_money') {
      if (!payoutRequest.mobile_money_details) {
        toast({
          title: "Mobile Money Details Required",
          description: "Please provide mobile money details for payout",
          variant: "destructive"
        });
        return false;
      }

      const { phone_number, operator, country } = payoutRequest.mobile_money_details;
      if (!phone_number || !operator || !country) {
        toast({
          title: "Invalid Mobile Money Details",
          description: "Please provide valid phone number, operator, and country",
          variant: "destructive"
        });
        return false;
      }
    }

    const { data, error } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount: payoutRequest.amount,
        currency: 'usd',
        payout_method: payoutRequest.payout_method,
        method: payoutRequest.payout_method,
        destination: payoutRequest.payout_method === 'stripe' 
          ? 'Stripe Connect Account' 
          : `Mobile Money (${payoutRequest.mobile_money_details?.operator})`,
        mobile_money_details: payoutRequest.mobile_money_details,
        status: 'pending',
        minimum_threshold_met: true
      })
      .select();

    if (error) throw error;

    const payoutId = data[0].id;

    // If it's a mobile money payout, call PawaPay service
    if (payoutRequest.payout_method === 'mobile_money' && payoutRequest.mobile_money_details) {
      try {
        const { data: pawapayResult, error: pawapayError } = await supabase.functions.invoke('pawapay-payout', {
          body: {
            amount: payoutRequest.amount,
            phone_number: payoutRequest.mobile_money_details.phone_number,
            operator: payoutRequest.mobile_money_details.operator,
            country: payoutRequest.mobile_money_details.country,
            payout_id: payoutId
          }
        });

        if (pawapayError) {
          // Update payout status to failed
          await supabase
            .from('creator_payouts')
            .update({ 
              status: 'failed',
              failure_reason: pawapayError.message || 'PawaPay API error'
            })
            .eq('id', payoutId);
          
          throw pawapayError;
        }

        // Update with PawaPay deposit ID and mark as processing
        await supabase
          .from('creator_payouts')
          .update({ 
            pawapay_deposit_id: pawapayResult.payoutId,
            status: 'processing',
            processed_at: new Date().toISOString()
          })
          .eq('id', payoutId);

      } catch (pawapayError) {
        console.error('PawaPay payout error:', pawapayError);
        toast({
          title: "Mobile Money Payout Failed",
          description: "Failed to process mobile money payout. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    }

    // If it's a Stripe payout, we'll handle it differently
    if (payoutRequest.payout_method === 'stripe') {
      // For Stripe Connect, the payout will be processed by Stripe automatically
      // We just mark it as processing since Stripe handles the actual transfer
      await supabase
        .from('creator_payouts')
        .update({ 
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', payoutId);
    }

    toast({
      title: "Payout Requested Successfully",
      description: `Your payout of $${payoutRequest.amount.toFixed(2)} has been requested via ${payoutRequest.payout_method === 'stripe' ? 'Stripe Connect' : 'Mobile Money'}. It may take 1-3 business days to process.`,
    });

    return true;
  } catch (error) {
    console.error('Error requesting creator payout:', error);
    toast({
      title: "Payout Request Failed",
      description: "Failed to process your payout request. Please try again.",
      variant: "destructive"
    });
    return false;
  }
}

export async function fetchCreatorPayouts(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ payouts: any[], total: number }> {
  try {
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('creator_payouts')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    if (countError) throw countError;

    // Get paginated payouts with detailed information
    const { data, error } = await supabase
      .from('creator_payouts')
      .select(`
        *,
        profiles!creator_payouts_creator_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    return { 
      payouts: data || [], 
      total: totalCount || 0 
    };
  } catch (error) {
    console.error('Error fetching creator payouts:', error);
    throw error;
  }
}

export async function getPayoutStatus(payoutId: string) {
  try {
    const { data, error } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching payout status:', error);
    throw error;
  }
}

export async function cancelPayoutRequest(payoutId: string, creatorId: string): Promise<boolean> {
  try {
    // Check if payout can be cancelled (only pending payouts can be cancelled)
    const { data: payout } = await supabase
      .from('creator_payouts')
      .select('status')
      .eq('id', payoutId)
      .eq('creator_id', creatorId)
      .single();

    if (!payout) {
      toast({
        title: "Payout Not Found",
        description: "Payout request not found",
        variant: "destructive"
      });
      return false;
    }

    if (payout.status !== 'pending') {
      toast({
        title: "Cannot Cancel Payout",
        description: "Only pending payouts can be cancelled",
        variant: "destructive"
      });
      return false;
    }

    const { error } = await supabase
      .from('creator_payouts')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', payoutId)
      .eq('creator_id', creatorId);

    if (error) throw error;

    toast({
      title: "Payout Cancelled",
      description: "Your payout request has been cancelled successfully",
    });

    return true;
  } catch (error) {
    console.error('Error cancelling payout:', error);
    toast({
      title: "Cancellation Failed",
      description: "Failed to cancel payout request",
      variant: "destructive"
    });
    return false;
  }
}

// Helper function to format earnings for display
export function formatEarningsBreakdown(earnings: CreatorEarnings) {
  return {
    available: `$${earnings.available_balance.toFixed(2)}`,
    pending: `$${earnings.pending_balance.toFixed(2)}`,
    total: `$${earnings.total_earnings.toFixed(2)}`,
    breakdown: {
      courses: `$${earnings.course_revenue.toFixed(2)}`,
      events: `$${earnings.event_revenue.toFixed(2)}`,
      fundraising: `$${earnings.fundraising_revenue.toFixed(2)}`
    }
  };
}
