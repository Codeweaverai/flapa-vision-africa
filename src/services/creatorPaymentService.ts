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

// Currency conversion function
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

export async function fetchCreatorPayouts(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ payouts: any[], total: number }> {
  try {
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('creator_payouts')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    if (countError) throw countError;

    // FIXED: Separate the queries to avoid foreign key relationship issues
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

// Alternative method if you need to fetch fundraising transactions
export async function fetchFundraisingTransactions(campaignIds: string[]) {
  try {
    // FIXED: Clean select parameter without comments
    const { data, error } = await supabase
      .from('campaign_contributions')
      .select(`
        *,
        fundraising_campaigns!inner (
          id,
          title,
          creator_id,
          end_date,
          status
        ),
        profiles!campaign_contributions_supporter_id_fkey (
          id,
          username,
          full_name
        )
      `)
      .eq('status', 'completed')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching fundraising transactions:', error);
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

export async function calculateCreatorEarningsFromOrders(creatorId: string): Promise<CreatorEarningsData> {
  try {
    // Get creator's course IDs
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .eq('creator_id', creatorId);

    if (coursesError) {
      console.error('Error fetching creator courses:', coursesError);
    }

    const courseIds = creatorCourses?.map(c => c.id) || [];

    // Get creator's event IDs
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('creator_id', creatorId);

    if (eventsError) {
      console.error('Error fetching creator events:', eventsError);
    }

    const eventIds = creatorEvents?.map(e => e.id) || [];

    // Get creator's fundraising campaigns with currency information
    const { data: creatorCampaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, end_date, status, currency, goal_amount')
      .eq('creator_id', creatorId);

    if (campaignsError) {
      console.error('Error fetching creator campaigns:', campaignsError);
    }

    const campaignIds = creatorCampaigns?.map(c => c.id) || [];
    const campaignEndDateMap = new Map(creatorCampaigns?.map(c => [c.id, c.end_date]) || []);
    const campaignStatusMap = new Map(creatorCampaigns?.map(c => [c.id, c.status]) || []);
    const campaignCurrencyMap = new Map(creatorCampaigns?.map(c => [c.id, c.currency || 'USD']) || []);

    // Get event ticket IDs for creator's events
    let eventTicketIds: string[] = [];
    if (eventIds.length > 0) {
      const { data: eventTickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('id')
        .in('event_id', eventIds);

      if (ticketsError) {
        console.error('Error fetching event tickets:', ticketsError);
      } else {
        eventTicketIds = eventTickets?.map(t => t.id) || [];
      }
    }

    if (courseIds.length === 0 && eventTicketIds.length === 0 && campaignIds.length === 0) {
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        total_platform_fees: 0,
        course_revenue: 0,
        event_revenue: 0,
        fundraising_revenue: 0
      };
    }

    // Fetch order items for courses
    let courseOrderItems: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseItems, error: courseError } = await supabase
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
            tax_amount
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'course')
        .in('item_id', courseIds);

      if (courseError) {
        console.error('Error fetching course order items:', courseError);
      } else {
        courseOrderItems = courseItems || [];
      }
    }

    // Fetch order items for event tickets
    let eventOrderItems: any[] = [];
    if (eventTicketIds.length > 0) {
      const { data: eventItems, error: eventError } = await supabase
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
            tax_amount
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'event_ticket')
        .in('item_id', eventTicketIds);

      if (eventError) {
        console.error('Error fetching event order items:', eventError);
      } else {
        eventOrderItems = eventItems || [];
      }
    }

    // Fetch fundraising contributions with campaign data
    let fundraisingContributions: any[] = [];
    if (campaignIds.length > 0) {
      const { data: contributions, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select(`
          *,
          fundraising_campaigns!inner(
            id,
            title,
            creator_id,
            end_date,
            status,
            currency
          )
        `)
        .eq('status', 'completed')
        .in('campaign_id', campaignIds);

      if (contributionsError) {
        console.error('Error fetching fundraising contributions:', contributionsError);
      } else {
        fundraisingContributions = contributions || [];
      }
    }

    // Combine all order items and contributions
    const allItems = [...courseOrderItems, ...eventOrderItems];

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let courseRevenue = 0;
    let eventRevenue = 0;
    let fundraisingRevenue = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    const now = new Date();

    // Process course and event sales (already in USD)
    allItems.forEach(item => {
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

    // Process fundraising contributions with proper currency conversion
    for (const contribution of fundraisingContributions) {
      const originalAmount = Number(contribution.amount);
      const contributionCurrency = contribution.currency || 'USD';
      const campaignId = contribution.campaign_id;
      const campaignBaseCurrency = campaignCurrencyMap.get(campaignId) || 'USD';
      
      let amountInUSD = originalAmount;

      // Convert to USD if contribution is in different currency
      if (contributionCurrency !== 'USD') {
        try {
          amountInUSD = await convertCurrency(originalAmount, contributionCurrency, 'USD');
          console.log(`Converted ${originalAmount} ${contributionCurrency} to ${amountInUSD} USD for contribution ${contribution.id}`);
        } catch (error) {
          console.warn(`Currency conversion failed for contribution ${contribution.id}:`, error);
          // Fallback to original amount if conversion fails
          amountInUSD = originalAmount;
        }
      }

      // Calculate transaction fee (5% of original amount in USD)
      const transactionFee = amountInUSD * FUNDRAISING_TRANSACTION_FEE_RATE;
      
      // Creator gets 95% of the converted USD amount
      const creatorEarning = amountInUSD - transactionFee;

      fundraisingRevenue += creatorEarning;
      totalPlatformFees += transactionFee;
      totalEarnings += creatorEarning;

      const campaignEndDate = contribution.fundraising_campaigns?.end_date;
      const campaignStatus = contribution.fundraising_campaigns?.status;

      // Check if campaign has ended
      if (campaignEndDate && new Date(campaignEndDate) <= now) {
        // Campaign has ended - money is available
        availableBalance += creatorEarning;
      } else if (campaignStatus === 'completed') {
        // Campaign marked as completed - money is available
        availableBalance += creatorEarning;
      } else {
        // Campaign is still active - money is pending
        pendingBalance += creatorEarning;
      }

      console.log(`Fundraising contribution ${contribution.id}: ${originalAmount} ${contributionCurrency} = ${amountInUSD} USD, Fee: ${transactionFee} USD, Creator: ${creatorEarning} USD`);
    }

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

    const result = {
      available_balance: Number(availableBalance.toFixed(2)),
      pending_balance: Number(pendingBalance.toFixed(2)),
      total_earnings: Number(totalEarnings.toFixed(2)),
      total_platform_fees: Number(totalPlatformFees.toFixed(2)),
      course_revenue: Number(courseRevenue.toFixed(2)),
      event_revenue: Number(eventRevenue.toFixed(2)),
      fundraising_revenue: Number(fundraisingRevenue.toFixed(2))
    };

    console.log('Final earnings calculation:', result);
    return result;
  } catch (error) {
    console.error('Error calculating creator earnings from orders:', error);
    return {
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_platform_fees: 0,
      course_revenue: 0,
      event_revenue: 0,
      fundraising_revenue: 0
    };
  }
}

export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    // Get creator's course IDs and titles
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (coursesError) {
      console.error('Error fetching courses for transactions:', coursesError);
      return { transactions: [], total: 0 };
    }

    const courseIds = creatorCourses?.map(c => c.id) || [];
    const courseMap = new Map(creatorCourses?.map(c => [c.id, c.title]) || []);

    // Get creator's event IDs and titles
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (eventsError) {
      console.error('Error fetching events for transactions:', eventsError);
      return { transactions: [], total: 0 };
    }

    const eventIds = creatorEvents?.map(e => e.id) || [];
    const eventMap = new Map(creatorEvents?.map(e => [e.id, e.title]) || []);

    // Get creator's fundraising campaigns with end dates and currency
    const { data: creatorCampaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, title, end_date, status, currency')
      .eq('creator_id', creatorId);

    if (campaignsError) {
      console.error('Error fetching campaigns for transactions:', campaignsError);
    }

    const campaignIds = creatorCampaigns?.map(c => c.id) || [];
    const campaignMap = new Map(creatorCampaigns?.map(c => [c.id, c.title]) || []);
    const campaignEndDateMap = new Map(creatorCampaigns?.map(c => [c.id, c.end_date]) || []);
    const campaignStatusMap = new Map(creatorCampaigns?.map(c => [c.id, c.status]) || []);
    const campaignCurrencyMap = new Map(creatorCampaigns?.map(c => [c.id, c.currency || 'USD']) || []);

    // Get event ticket IDs for creator's events
    let eventTicketIds: string[] = [];
    let ticketToEventMap = new Map();
    
    if (eventIds.length > 0) {
      const { data: eventTickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('id, event_id')
        .in('event_id', eventIds);

      if (ticketsError) {
        console.error('Error fetching tickets for transactions:', ticketsError);
      } else {
        eventTicketIds = eventTickets?.map(t => t.id) || [];
        ticketToEventMap = new Map(eventTickets?.map(t => [t.id, t.event_id]) || []);
      }
    }

    if (courseIds.length === 0 && eventTicketIds.length === 0 && campaignIds.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Fetch course order items with detailed order information
    let courseOrderItems: any[] = [];
    if (courseIds.length > 0) {
      const { data: courseItems, error: courseError } = await supabase
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
        .order('created_at', { ascending: false });

      if (courseError) {
        console.error('Error fetching course transactions:', courseError);
      } else {
        courseOrderItems = courseItems || [];
      }
    }

    // Fetch event order items with detailed order information
    let eventOrderItems: any[] = [];
    if (eventTicketIds.length > 0) {
      const { data: eventItems, error: eventError } = await supabase
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
        .order('created_at', { ascending: false });

      if (eventError) {
        console.error('Error fetching event transactions:', eventError);
      } else {
        eventOrderItems = eventItems || [];
      }
    }

    // ✅ FIXED: Fetch fundraising contributions WITHOUT the comment that was causing the 400 error
    let fundraisingContributions: any[] = [];
    if (campaignIds.length > 0) {
      const { data: contributions, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select(`
          *,
          fundraising_campaigns!inner(
            id,
            title,
            creator_id,
            end_date,
            status,
            currency
          ),
          profiles!campaign_contributions_supporter_id_fkey(
            id,
            username,
            full_name
          )
        `)
        .eq('status', 'completed')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false });

      if (contributionsError) {
        console.error('Error fetching fundraising transactions:', contributionsError);
      } else {
        fundraisingContributions = contributions || [];
      }
    }

    // Combine all transactions and sort by date
    const allTransactions = [
      ...courseOrderItems.map(item => ({ ...item, source: 'course' })),
      ...eventOrderItems.map(item => ({ ...item, source: 'event' })),
      ...fundraisingContributions.map(contribution => ({ ...contribution, source: 'fundraising' }))
    ].sort((a, b) => {
      const dateA = a.source === 'fundraising' ? a.created_at : a.orders?.created_at;
      const dateB = b.source === 'fundraising' ? b.created_at : b.orders?.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const totalCount = allTransactions.length;
    const paginatedItems = allTransactions.slice(offset, offset + limit);

    if (!paginatedItems || paginatedItems.length === 0) {
      return { transactions: [], total: totalCount };
    }

    // Get user profiles for customer names (for course/event transactions)
    const userIds = [...new Set(paginatedItems
      .filter(item => item.source !== 'fundraising')
      .map(item => item.orders.user_id)
    )];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    // Process transactions
    const creatorTransactions: CreatorTransaction[] = [];
    const now = new Date();

    for (const item of paginatedItems) {
      if (item.source === 'fundraising') {
        // Process fundraising contribution with currency conversion
        const originalAmount = Number(item.amount);
        const contributionCurrency = item.currency || 'USD';
        const campaignId = item.campaign_id;
        const campaignBaseCurrency = campaignCurrencyMap.get(campaignId) || 'USD';
        
        let amountInUSD = originalAmount;

        // Convert to USD if contribution is in different currency
        if (contributionCurrency !== 'USD') {
          try {
            amountInUSD = await convertCurrency(originalAmount, contributionCurrency, 'USD');
          } catch (error) {
            console.warn(`Currency conversion failed for contribution ${item.id}:`, error);
            amountInUSD = originalAmount;
          }
        }

        // Calculate transaction fee (5% of converted USD amount)
        const transactionFee = amountInUSD * FUNDRAISING_TRANSACTION_FEE_RATE;
        
        // Creator gets 95% of the converted USD amount
        const creatorEarning = amountInUSD - transactionFee;

        const campaignEndDate = item.fundraising_campaigns?.end_date;
        const campaignStatus = item.fundraising_campaigns?.status;

        // Determine payout eligible date - campaign end date or creation date if no end date
        let payoutEligibleDate = item.created_at;
        if (campaignEndDate) {
          payoutEligibleDate = campaignEndDate;
        } else if (campaignStatus === 'completed') {
          // If campaign is marked completed, use creation date
          payoutEligibleDate = item.created_at;
        }

        // ✅ FIXED: Use placeholder email since profiles table doesn't have email
        const customerName = item.is_anonymous 
          ? 'Anonymous Supporter' 
          : (item.profiles?.username || item.profiles?.full_name || 'Unknown Supporter');

        creatorTransactions.push({
          id: item.id,
          order_id: item.id,
          customer_email: 'campaign@supporter.com', // ✅ PLACEHOLDER EMAIL
          customer_name: customerName,
          item_type: 'fundraising_contribution',
          item_name: `Campaign: ${item.fundraising_campaigns?.title}`,
          item_id: item.campaign_id,
          quantity: 1,
          unit_price: Number(amountInUSD.toFixed(2)), // Show converted USD amount
          total_amount: Number(amountInUSD.toFixed(2)), // Show converted USD amount
          creator_earning: Number(creatorEarning.toFixed(2)),
          platform_fee: Number(transactionFee.toFixed(2)),
          payment_status: item.status,
          created_at: item.created_at,
          order_total: Number(amountInUSD.toFixed(2)), // Show converted USD amount
          payout_eligible_date: payoutEligibleDate,
          payment_method: item.payment_method || 'Unknown'
        });
      } else {
        // Process course and event transactions (already in USD)
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
        let itemType: 'course' | 'event_ticket' = 'course';
        
        if (item.item_type === 'course') {
          itemName = courseMap.get(item.item_id) || 'Unknown Course';
          itemType = 'course';
        } else if (item.item_type === 'event_ticket') {
          const eventId = ticketToEventMap.get(item.item_id);
          itemName = eventId ? eventMap.get(eventId) || 'Unknown Event' : 'Unknown Event';
          itemType = 'event_ticket';
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
          item_type: itemType,
          item_name: itemName,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_amount: Number(itemTotal.toFixed(2)),
          creator_earning: Number(Math.max(0, creatorEarning).toFixed(2)),
          platform_fee: Number(platformFee.toFixed(2)),
          payment_status: item.orders.payment_status,
          created_at: item.orders.created_at,
          order_total: Number(orderTotal.toFixed(2)),
          payout_eligible_date: payoutEligibleDate.toISOString(),
          payment_method: item.orders.payment_method || 'Unknown'
        });
      }
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
