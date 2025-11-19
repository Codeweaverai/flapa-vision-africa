import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { 
  calculateCreatorEarningsFromOrders, 
  fetchCreatorTransactions,
  CreatorTransaction
} from './creatorEarningsService';

// Currency conversion rates (static - same as other pages)
const exchangeRates: { [key: string]: number } = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  ZMW: 0.044,
  NGN: 0.0012,
  GHS: 0.082,
  KES: 0.0078,
  UGX: 0.00027,
  TZS: 0.00043,
  RWF: 0.0010,
  XOF: 0.0016,
  XAF: 0.0016,
  CDF: 0.00049,
  MZN: 0.015,
  MWK: 0.0009,
  LSL: 0.054,
  SLL: 0.000048
};

// Currency conversion function - matching fundraising page implementation
const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  const usdAmount = amount * fromRate;
  const targetAmount = usdAmount / toRate;
  
  return Number(targetAmount.toFixed(2));
};

export interface CreatorEarnings {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
  fundraising_revenue: number;
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

// Platform fee rates
const PLATFORM_FEE_RATE = 0.08; // 8% for courses/events
const FUNDRAISING_TRANSACTION_FEE_RATE = 0.05; // 5% for fundraising

// Calculate fundraising revenue with proper currency conversion
async function calculateFundraisingRevenue(creatorId: string): Promise<{
  totalNetAmount: number;
  totalFees: number;
  availableAmount: number;
}> {
  try {
    // Get creator's fundraising campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, currency')
      .eq('creator_id', creatorId)
      .in('status', ['active', 'completed']);

    if (campaignsError) throw campaignsError;
    if (!campaigns || campaigns.length === 0) {
      return { totalNetAmount: 0, totalFees: 0, availableAmount: 0 };
    }

    const campaignIds = campaigns.map(campaign => campaign.id);
    
    // Get all completed contributions for these campaigns
    const { data: contributions, error: contributionsError } = await supabase
      .from('campaign_contributions')
      .select('id, amount, net_amount, currency, transaction_fee, status, created_at')
      .in('campaign_id', campaignIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (contributionsError) throw contributionsError;
    if (!contributions) {
      return { totalNetAmount: 0, totalFees: 0, availableAmount: 0 };
    }

    let totalNetAmountUSD = 0;
    let totalFeesUSD = 0;

    // Process each contribution with proper currency conversion
    for (const contribution of contributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalNetAmount = Number(contribution.net_amount || contribution.amount || 0);
      const originalTransactionFee = Number(contribution.transaction_fee || 0);

      let netAmountInUSD = originalNetAmount;
      let feeInUSD = originalTransactionFee;

      // Convert to USD if different currency
      if (contributionCurrency !== 'USD') {
        try {
          netAmountInUSD = await convertCurrency(originalNetAmount, contributionCurrency, 'USD');
          feeInUSD = await convertCurrency(originalTransactionFee, contributionCurrency, 'USD');
        } catch (error) {
          console.warn(`Currency conversion failed for contribution ${contribution.id}:`, error);
          // Use original amounts if conversion fails
        }
      }

      totalNetAmountUSD += netAmountInUSD;
      totalFeesUSD += feeInUSD;
    }

    // Apply platform fee for fundraising (5%)
    const platformFee = totalNetAmountUSD * FUNDRAISING_TRANSACTION_FEE_RATE;
    const creatorEarning = totalNetAmountUSD - platformFee;

    return {
      totalNetAmount: creatorEarning,
      totalFees: totalFeesUSD + platformFee,
      availableAmount: creatorEarning // Fundraising amounts are typically available immediately
    };
  } catch (error) {
    console.error('Error calculating fundraising revenue:', error);
    return { totalNetAmount: 0, totalFees: 0, availableAmount: 0 };
  }
}

export async function fetchCreatorEarnings(creatorId: string): Promise<CreatorEarnings> {
  try {
    console.log('Fetching creator earnings for:', creatorId);
    
    // Get base earnings calculation from courses and events
    const earnings = await calculateCreatorEarningsFromOrders(creatorId);
    
    // Calculate fundraising revenue separately with proper conversion
    const fundraisingRevenue = await calculateFundraisingRevenue(creatorId);
    
    // Update earnings with properly converted fundraising revenue
    const updatedEarnings = {
      ...earnings,
      fundraising_revenue: fundraisingRevenue.totalNetAmount,
      total_earnings: earnings.total_earnings + fundraisingRevenue.totalNetAmount,
      available_balance: earnings.available_balance + fundraisingRevenue.availableAmount,
      total_platform_fees: earnings.total_platform_fees + fundraisingRevenue.totalFees
    };
    
    console.log('Creator earnings calculated with proper conversion:', updatedEarnings);
    return updatedEarnings;
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

export async function fetchCreatorPayouts(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ payouts: any[], total: number }> {
  try {
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('creator_payouts')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    if (countError) throw countError;

    // Separate the queries to avoid foreign key relationship issues
    const { data: payoutsData, error: payoutsError } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (payoutsError) throw payoutsError;

    // Get profile information separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', creatorId)
      .single();

    if (profileError) {
      console.warn('Error fetching profile data:', profileError);
    }

    // Combine the data manually
    const payoutsWithProfile = payoutsData?.map(payout => ({
      ...payout,
      profiles: profileData || null
    })) || [];

    return { 
      payouts: payoutsWithProfile, 
      total: totalCount || 0 
    };
  } catch (error) {
    console.error('Error fetching creator payouts:', error);
    throw error;
  }
}

// Updated fundraising transactions with proper conversion
export async function fetchFundraisingTransactions(campaignIds: string[]) {
  try {
    const { data, error } = await supabase
      .from('campaign_contributions')
      .select(`
        id,
        campaign_id,
        amount,
        net_amount,
        currency,
        status,
        created_at,
        transaction_fee,
        payment_method,
        payment_provider,
        is_anonymous,
        message_to_creator,
        supporter_id,
        fundraising_campaigns!inner (
          id,
          title,
          creator_id,
          end_date,
          status,
          currency as campaign_currency
        ),
        profiles!campaign_contributions_supporter_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'completed')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert all amounts to USD using the same pattern as fundraising page
    const transactionsWithConvertedAmounts = await Promise.all(
      (data || []).map(async (transaction) => {
        const contributionCurrency = transaction.currency || 'USD';
        const originalAmount = Number(transaction.amount || 0);
        const originalNetAmount = Number(transaction.net_amount || transaction.amount || 0);
        const originalTransactionFee = Number(transaction.transaction_fee || 0);

        let amountInUSD = originalAmount;
        let netAmountInUSD = originalNetAmount;
        let feeInUSD = originalTransactionFee;

        // Convert to USD if different currency
        if (contributionCurrency !== 'USD') {
          try {
            amountInUSD = await convertCurrency(originalAmount, contributionCurrency, 'USD');
            netAmountInUSD = await convertCurrency(originalNetAmount, contributionCurrency, 'USD');
            feeInUSD = await convertCurrency(originalTransactionFee, contributionCurrency, 'USD');
          } catch (error) {
            console.warn(`Currency conversion failed for transaction ${transaction.id}:`, error);
          }
        }

        return {
          ...transaction,
          converted_amount: netAmountInUSD, // Use net amount for calculations
          original_currency: contributionCurrency,
          original_amount: originalAmount,
          original_net_amount: originalNetAmount,
          converted_gross_amount: amountInUSD,
          converted_fee: feeInUSD,
          // Add platform fee calculation for consistency
          platform_fee: netAmountInUSD * FUNDRAISING_TRANSACTION_FEE_RATE,
          creator_earning: netAmountInUSD * (1 - FUNDRAISING_TRANSACTION_FEE_RATE)
        };
      })
    );
    
    return transactionsWithConvertedAmounts;
  } catch (error) {
    console.error('Error fetching fundraising transactions:', error);
    throw error;
  }
}

// Get fundraising stats for creator dashboard
export async function getCreatorFundraisingStats(creatorId: string) {
  try {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, title, currency, goal_amount, status, created_at')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    const campaignIds = campaigns?.map(camp => camp.id) || [];
    
    if (campaignIds.length === 0) {
      return {
        total_campaigns: 0,
        active_campaigns: 0,
        completed_campaigns: 0,
        total_raised: 0,
        total_net_amount: 0,
        total_fees: 0,
        total_contributions: 0,
        campaigns: []
      };
    }

    const { data: contributions, error: contributionsError } = await supabase
      .from('campaign_contributions')
      .select('id, amount, net_amount, currency, transaction_fee, status, campaign_id, created_at')
      .in('campaign_id', campaignIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (contributionsError) throw contributionsError;

    let totalRaisedUSD = 0;
    let totalNetAmountUSD = 0;
    let totalFeesUSD = 0;

    // Use same conversion logic as fundraising page
    for (const contribution of contributions || []) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalAmount = Number(contribution.amount || 0);
      const originalNetAmount = Number(contribution.net_amount || contribution.amount || 0);
      const originalFee = Number(contribution.transaction_fee || 0);

      let amountInUSD = originalAmount;
      let netAmountInUSD = originalNetAmount;
      let feeInUSD = originalFee;

      if (contributionCurrency !== 'USD') {
        try {
          amountInUSD = await convertCurrency(originalAmount, contributionCurrency, 'USD');
          netAmountInUSD = await convertCurrency(originalNetAmount, contributionCurrency, 'USD');
          feeInUSD = await convertCurrency(originalFee, contributionCurrency, 'USD');
        } catch (error) {
          console.warn(`Currency conversion failed for contribution ${contribution.id}:`, error);
        }
      }

      totalRaisedUSD += amountInUSD;
      totalNetAmountUSD += netAmountInUSD;
      totalFeesUSD += feeInUSD;
    }

    const activeCampaigns = campaigns?.filter(camp => camp.status === 'active').length || 0;
    const completedCampaigns = campaigns?.filter(camp => camp.status === 'completed').length || 0;

    // Calculate campaign-specific stats
    const campaignsWithStats = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        const campaignContributions = contributions?.filter(c => c.campaign_id === campaign.id) || [];
        
        let campaignRaisedUSD = 0;
        let campaignNetAmountUSD = 0;
        let campaignFeesUSD = 0;

        for (const contribution of campaignContributions) {
          const contributionCurrency = contribution.currency || 'USD';
          const originalAmount = Number(contribution.amount || 0);
          const originalNetAmount = Number(contribution.net_amount || contribution.amount || 0);
          const originalFee = Number(contribution.transaction_fee || 0);

          let amountInUSD = originalAmount;
          let netAmountInUSD = originalNetAmount;
          let feeInUSD = originalFee;

          if (contributionCurrency !== 'USD') {
            try {
              amountInUSD = await convertCurrency(originalAmount, contributionCurrency, 'USD');
              netAmountInUSD = await convertCurrency(originalNetAmount, contributionCurrency, 'USD');
              feeInUSD = await convertCurrency(originalFee, contributionCurrency, 'USD');
            } catch (error) {
              console.warn(`Currency conversion failed for campaign ${campaign.id}:`, error);
            }
          }

          campaignRaisedUSD += amountInUSD;
          campaignNetAmountUSD += netAmountInUSD;
          campaignFeesUSD += feeInUSD;
        }

        return {
          ...campaign,
          total_raised: campaignRaisedUSD,
          total_net_amount: campaignNetAmountUSD,
          total_fees: campaignFeesUSD,
          contributions_count: campaignContributions.length,
          progress: campaign.goal_amount > 0 ? (campaignRaisedUSD / campaign.goal_amount) * 100 : 0
        };
      })
    );

    return {
      total_campaigns: campaigns?.length || 0,
      active_campaigns: activeCampaigns,
      completed_campaigns: completedCampaigns,
      total_raised: totalRaisedUSD,
      total_net_amount: totalNetAmountUSD,
      total_fees: totalFeesUSD,
      total_contributions: contributions?.length || 0,
      campaigns: campaignsWithStats
    };
  } catch (error) {
    console.error('Error fetching creator fundraising stats:', error);
    throw error;
  }
}

// Debug function to identify contribution calculation issues
export async function debugContributionCalculation(contributionId: string) {
  try {
    const { data: contribution, error } = await supabase
      .from('campaign_contributions')
      .select(`
        *,
        fundraising_campaigns!inner (
          id,
          title,
          creator_id,
          currency
        )
      `)
      .eq('id', contributionId)
      .single();

    if (error) throw error;

    console.log('=== Contribution Debug ===');
    console.log('Contribution ID:', contribution.id);
    console.log('Gross amount:', contribution.amount);
    console.log('Currency:', contribution.currency);
    console.log('Net amount:', contribution.net_amount);
    console.log('Transaction fee:', contribution.transaction_fee);
    console.log('Status:', contribution.status);
    console.log('Campaign currency:', contribution.fundraising_campaigns.currency);
    
    const convertedNetAmount = await convertCurrency(
      contribution.net_amount || contribution.amount,
      contribution.currency || 'USD',
      'USD'
    );
    
    console.log('Converted to USD:', convertedNetAmount);
    
    // Calculate what the amount should be after platform fee
    const platformFee = convertedNetAmount * FUNDRAISING_TRANSACTION_FEE_RATE;
    const creatorEarning = convertedNetAmount - platformFee;
    
    console.log('Platform fee (5%):', platformFee);
    console.log('Creator earning:', creatorEarning);
    console.log('====================');
    
    return {
      gross_amount: contribution.amount,
      net_amount: contribution.net_amount,
      currency: contribution.currency,
      converted_usd: convertedNetAmount,
      platform_fee: platformFee,
      creator_earning: creatorEarning
    };
  } catch (error) {
    console.error('Debug contribution calculation error:', error);
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

export interface CreatorEarningsData {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_platform_fees: number;
  course_revenue: number;
  event_revenue: number;
  fundraising_revenue: number;
}

export interface CreatorTransaction {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name?: string;
  item_type: 'course' | 'event_ticket' | 'fundraising_contribution';
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
