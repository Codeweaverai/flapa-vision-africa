import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export interface CreatorEarnings {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
  fundraising_revenue: number;
}

export interface CreatorPaymentTransaction {
  id: string;
  creator_id: string;
  item_type: string;
  item_name: string;
  total_amount: number;
  creator_earning: number;
  platform_fee: number;
  payment_status: string;
  customer_name: string;
  order_id: string;
  payout_eligible_date: string;
  created_at: string;
}

export interface PayoutRequest {
  amount: number;
  payout_method: 'stripe' | 'mobile_money' | 'bank';
  mobile_money_details?: {
    phone_number: string;
    operator: string;
    country: string;
  };
  bank_transfer_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}

export interface CreatorPayout {
  id: string;
  creator_id: string;
  amount: number;
  currency: string;
  payout_method: string;
  status: string;
  destination: string;
  mobile_money_details: any;
  bank_transfer_details: any;
  external_reference: string;
  failure_reason: string;
  created_at: string;
  processed_at: string;
  completed_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

// Separate query functions
async function fetchPayoutsData(creatorId: string, limit: number = 10, offset: number = 0) {
  const { data, error, count } = await supabase
    .from('creator_payouts')
    .select('*', { count: 'exact' })
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

async function fetchProfilesData(creatorIds: string[]) {
  if (creatorIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', creatorIds);

  if (error) {
    console.warn('Error fetching profiles data:', error);
    return [];
  }
  return data || [];
}

// Manual join function
function joinPayoutsWithProfiles(payouts: any[], profiles: any[]) {
  const profileMap = new Map();
  profiles.forEach(profile => {
    profileMap.set(profile.id, profile);
  });

  return payouts.map(payout => ({
    ...payout,
    profiles: profileMap.get(payout.creator_id) || null
  }));
}

export async function fetchCreatorEarnings(creatorId: string): Promise<CreatorEarnings> {
  try {
    console.log('Fetching creator earnings for:', creatorId);
    
    // Get all completed payment transactions
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('payment_status', 'completed');

    if (error) throw error;

    let available_balance = 0;
    let pending_balance = 0;
    let total_earnings = 0;
    let total_platform_fees = 0;
    let course_revenue = 0;
    let event_revenue = 0;
    let fundraising_revenue = 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    transactions?.forEach(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const isAvailable = transactionDate < sevenDaysAgo;
      const creatorEarning = transaction.creator_earning || 0;
      const platformFee = transaction.platform_fee || 0;
      
      if (isAvailable) {
        available_balance += creatorEarning;
      } else {
        pending_balance += creatorEarning;
      }
      
      total_earnings += creatorEarning;
      total_platform_fees += platformFee;

      // Categorize by item_type
      switch (transaction.item_type) {
        case 'course':
          course_revenue += creatorEarning;
          break;
        case 'event_ticket':
          event_revenue += creatorEarning;
          break;
        case 'fundraising_contribution':
          fundraising_revenue += creatorEarning;
          break;
        case 'consultation':
          course_revenue += creatorEarning;
          break;
        default:
          course_revenue += creatorEarning;
      }
    });

    const earnings = {
      available_balance,
      pending_balance,
      total_earnings,
      total_platform_fees,
      course_revenue,
      event_revenue,
      fundraising_revenue
    };

    console.log('Creator earnings calculated:', earnings);
    return earnings;
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    throw error;
  }
}

export async function fetchCreatorPaymentTransactions(
  creatorId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ transactions: CreatorPaymentTransaction[], total: number }> {
  try {
    console.log('Fetching creator payment transactions for:', creatorId, 'limit:', limit, 'offset:', offset);
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .eq('payment_status', 'completed');

    if (countError) throw countError;

    // Get paginated transactions
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = {
      transactions: data || [],
      total: totalCount || 0
    };

    console.log('Creator transactions fetched:', result.transactions.length, 'total:', result.total);
    return result;
  } catch (error) {
    console.error('Error fetching creator payment transactions:', error);
    throw error;
  }
}

export async function fetchCreatorPayouts(
  creatorId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ payouts: CreatorPayout[], total: number }> {
  try {
    console.log('Fetching creator payouts for:', creatorId, 'limit:', limit, 'offset:', offset);
    
    // Separate query 1: Get payouts data
    const { data: payoutsData, count } = await fetchPayoutsData(creatorId, limit, offset);
    
    if (!payoutsData || payoutsData.length === 0) {
      return { payouts: [], total: count || 0 };
    }

    // Separate query 2: Get profiles data for the creator IDs
    const creatorIds = [...new Set(payoutsData.map(payout => payout.creator_id))];
    const profilesData = await fetchProfilesData(creatorIds);

    // Manual join: Combine the data
    const payoutsWithProfiles = joinPayoutsWithProfiles(payoutsData, profilesData);

    console.log('Payouts fetched successfully:', payoutsWithProfiles.length);
    
    return { 
      payouts: payoutsWithProfiles, 
      total: count || 0 
    };
  } catch (error) {
    console.error('Error fetching creator payouts:', error);
    
    // Fallback: Return payouts without profile data
    if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
      console.warn('Database relationship issue - returning payouts without profile data');
      try {
        const { data: payoutsData, count } = await fetchPayoutsData(creatorId, limit, offset);
        return { 
          payouts: payoutsData || [], 
          total: count || 0 
        };
      } catch (fallbackError) {
        return { payouts: [], total: 0 };
      }
    }
    
    throw error;
  }
}

export async function getCreatorPayoutMethod(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_onboarding_completed, mobile_money_operator, mobile_money_number, default_payout_method, bank_account_details')
      .eq('id', creatorId)
      .single();

    if (error) {
      console.error('Error fetching payout method:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCreatorPayoutMethod:', error);
    return null;
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

    // Validate payout method setup
    const payoutMethod = await getCreatorPayoutMethod(creatorId);
    
    if (payoutRequest.payout_method === 'stripe') {
      if (!payoutMethod?.stripe_connect_account_id || !payoutMethod?.stripe_onboarding_completed) {
        toast({
          title: "Stripe Not Connected",
          description: "Please connect your Stripe account first",
          variant: "destructive"
        });
        return false;
      }
    }

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

    if (payoutRequest.payout_method === 'bank') {
      if (!payoutRequest.bank_transfer_details) {
        toast({
          title: "Bank Details Required",
          description: "Please provide bank transfer details for payout",
          variant: "destructive"
        });
        return false;
      }

      const { bank_name, account_number, account_name } = payoutRequest.bank_transfer_details;
      if (!bank_name || !account_number || !account_name) {
        toast({
          title: "Invalid Bank Details",
          description: "Please provide valid bank name, account number, and account name",
          variant: "destructive"
        });
        return false;
      }
    }

    // Create payout record
    const { data, error } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount: payoutRequest.amount,
        currency: 'usd',
        payout_method: payoutRequest.payout_method,
        method: payoutRequest.payout_method,
        destination: getPayoutDestination(payoutRequest),
        mobile_money_details: payoutRequest.mobile_money_details,
        bank_transfer_details: payoutRequest.bank_transfer_details,
        status: 'pending',
        minimum_threshold_met: true
      })
      .select();

    if (error) throw error;

    const payoutId = data[0].id;

    // Process based on payout method
    await processPayoutByMethod(payoutId, payoutRequest);

    toast({
      title: "Payout Requested Successfully",
      description: `Your payout of $${payoutRequest.amount.toFixed(2)} has been requested via ${getPayoutMethodLabel(payoutRequest.payout_method)}.`,
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

// Helper functions
function getPayoutDestination(payoutRequest: PayoutRequest): string {
  switch (payoutRequest.payout_method) {
    case 'stripe':
      return 'Stripe Connect Account';
    case 'mobile_money':
      return `Mobile Money (${payoutRequest.mobile_money_details?.operator})`;
    case 'bank':
      return `Bank Transfer (${payoutRequest.bank_transfer_details?.bank_name})`;
    default:
      return 'Unknown';
  }
}

function getPayoutMethodLabel(method: string): string {
  switch (method) {
    case 'stripe':
      return 'Stripe Connect';
    case 'mobile_money':
      return 'Mobile Money';
    case 'bank':
      return 'Bank Transfer';
    default:
      return method;
  }
}

async function processPayoutByMethod(payoutId: string, payoutRequest: PayoutRequest) {
  const updateData: any = {
    status: 'processing',
    processed_at: new Date().toISOString()
  };

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

      if (pawapayError) throw pawapayError;

      updateData.pawapay_deposit_id = pawapayResult.payoutId;
    } catch (pawapayError) {
      console.error('PawaPay payout error:', pawapayError);
      updateData.status = 'failed';
      updateData.failure_reason = pawapayError.message || 'PawaPay API error';
    }
  }

  // Update payout record
  await supabase
    .from('creator_payouts')
    .update(updateData)
    .eq('id', payoutId);
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
