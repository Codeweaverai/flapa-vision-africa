
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export interface CreatorEarnings {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
}

export interface CreatorPaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference_type: string;
  reference_id: string;
  creator_earning: number;
  platform_fee_amount: number;
  created_at: string;
  user_id: string;
  provider: string;
  payout_eligible_date: string;
  // UI-specific fields
  customer_name?: string;
  item_name?: string;
}

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
    const { data, error } = await supabase.rpc('calculate_creator_earnings', {
      creator_user_id: creatorId
    });

    if (error) throw error;

    return data[0] || {
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_platform_fees: 0,
      course_revenue: 0,
      event_revenue: 0
    };
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    throw error;
  }
}

export async function fetchCreatorPaymentTransactions(creatorId: string): Promise<CreatorPaymentTransaction[]> {
  try {
    // First get payment transactions for this creator
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Get user profiles for customer names
    const userIds = [...new Set(transactions.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    // Get course titles
    const courseIds = transactions
      .filter(t => t.reference_type === 'course')
      .map(t => t.reference_id);
    
    let courses: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);
      courses = courseData || [];
    }

    // Get event titles
    const eventIds = transactions
      .filter(t => t.reference_type === 'event')
      .map(t => t.reference_id);
    
    let events: any[] = [];
    if (eventIds.length > 0) {
      const { data: eventData } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      events = eventData || [];
    }

    // Format the data with customer and item names
    const formattedData: CreatorPaymentTransaction[] = transactions.map(transaction => {
      const profile = profiles?.find(p => p.id === transaction.user_id);
      const course = courses.find(c => c.id === transaction.reference_id);
      const event = events.find(e => e.id === transaction.reference_id);

      return {
        ...transaction,
        customer_name: profile?.username || profile?.full_name || 'Unknown Customer',
        item_name: transaction.reference_type === 'course' 
          ? course?.title 
          : event?.title || 'Unknown Item'
      };
    });

    return formattedData;
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
        description: "Requested amount exceeds available balance",
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
          : 'Mobile Money',
        mobile_money_details: payoutRequest.mobile_money_details,
        status: 'pending',
        minimum_threshold_met: true
      })
      .select();

    if (error) throw error;

    // If it's a mobile money payout, call PawaPay service
    if (payoutRequest.payout_method === 'mobile_money' && payoutRequest.mobile_money_details) {
      try {
        const { data: pawapayResult, error: pawapayError } = await supabase.functions.invoke('pawapay-payout', {
          body: {
            amount: payoutRequest.amount,
            phone_number: payoutRequest.mobile_money_details.phone_number,
            operator: payoutRequest.mobile_money_details.operator,
            country: payoutRequest.mobile_money_details.country,
            payout_id: data[0].id
          }
        });

        if (pawapayError) {
          // Update payout status to failed
          await supabase
            .from('creator_payouts')
            .update({ status: 'failed' })
            .eq('id', data[0].id);
          
          throw pawapayError;
        }

        // Update with PawaPay deposit ID
        await supabase
          .from('creator_payouts')
          .update({ 
            pawapay_deposit_id: pawapayResult.depositId,
            status: 'processing'
          })
          .eq('id', data[0].id);
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

    toast({
      title: "Payout Requested",
      description: `Your payout of $${payoutRequest.amount.toFixed(2)} has been requested via ${payoutRequest.payout_method === 'stripe' ? 'Stripe' : 'Mobile Money'}`,
    });

    return true;
  } catch (error) {
    console.error('Error requesting creator payout:', error);
    toast({
      title: "Payout Error",
      description: "Failed to process your payout request",
      variant: "destructive"
    });
    return false;
  }
}

export async function fetchCreatorPayouts(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching creator payouts:', error);
    throw error;
  }
}
