import { supabase } from '@/lib/supabaseClient';

// Currency conversion rates (same as other files)
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

// Platform fee rates
const PLATFORM_FEE_RATE = 0.08; // 8% for courses/events
const FUNDRAISING_TRANSACTION_FEE_RATE = 0.05; // 5% for fundraising

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

    // Get creator's fundraising campaigns with end dates
    const { data: creatorCampaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, end_date, status')
      .eq('creator_id', creatorId);

    if (campaignsError) {
      console.error('Error fetching creator campaigns:', campaignsError);
    }

    const campaignIds = creatorCampaigns?.map(c => c.id) || [];
    const campaignEndDateMap = new Map(creatorCampaigns?.map(c => [c.id, c.end_date]) || []);
    const campaignStatusMap = new Map(creatorCampaigns?.map(c => [c.id, c.status]) || []);

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
            status
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

    // Process course and event sales
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

    // FIXED: Process fundraising contributions with currency conversion
    for (const contribution of fundraisingContributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalAmount = Number(contribution.amount);
      const originalNetAmount = Number(contribution.net_amount || contribution.amount);
      const originalTransactionFee = originalAmount - originalNetAmount;

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

      // Apply platform fee for fundraising (5%)
      const platformFee = netAmountInUSD * FUNDRAISING_TRANSACTION_FEE_RATE;
      const creatorEarning = netAmountInUSD - platformFee;

      fundraisingRevenue += creatorEarning;
      totalPlatformFees += (feeInUSD + platformFee);
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

    return {
      available_balance: Number(availableBalance.toFixed(2)),
      pending_balance: Number(pendingBalance.toFixed(2)),
      total_earnings: Number(totalEarnings.toFixed(2)),
      total_platform_fees: Number(totalPlatformFees.toFixed(2)),
      course_revenue: Number(courseRevenue.toFixed(2)),
      event_revenue: Number(eventRevenue.toFixed(2)),
      fundraising_revenue: Number(fundraisingRevenue.toFixed(2))
    };
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

// FIXED: Also update the fetchCreatorTransactions function to handle currency conversion
export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    // ... (existing code remains the same until transaction processing)

    // Process transactions
    const creatorTransactions: CreatorTransaction[] = [];
    const now = new Date();

    for (const item of paginatedItems) {
      if (item.source === 'fundraising') {
        // FIXED: Process fundraising contribution with currency conversion
        const contributionCurrency = item.currency || 'USD';
        const originalAmount = Number(item.amount);
        const originalNetAmount = Number(item.net_amount || item.amount);
        const originalTransactionFee = originalAmount - originalNetAmount;

        let netAmountInUSD = originalNetAmount;
        let feeInUSD = originalTransactionFee;

        // Convert to USD if different currency
        if (contributionCurrency !== 'USD') {
          try {
            netAmountInUSD = await convertCurrency(originalNetAmount, contributionCurrency, 'USD');
            feeInUSD = await convertCurrency(originalTransactionFee, contributionCurrency, 'USD');
          } catch (error) {
            console.warn(`Currency conversion failed for transaction ${item.id}:`, error);
          }
        }

        // Apply platform fee for fundraising (5%)
        const platformFee = netAmountInUSD * FUNDRAISING_TRANSACTION_FEE_RATE;
        const creatorEarning = netAmountInUSD - platformFee;

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

        const customerName = item.is_anonymous 
          ? 'Anonymous Supporter' 
          : (item.profiles?.username || item.profiles?.full_name || 'Unknown Supporter');

        creatorTransactions.push({
          id: item.id,
          order_id: item.id,
          customer_email: 'campaign@supporter.com',
          customer_name: customerName,
          item_type: 'fundraising_contribution',
          item_name: `Campaign: ${item.fundraising_campaigns?.title}`,
          item_id: item.campaign_id,
          quantity: 1,
          unit_price: Number(originalAmount),
          total_amount: Number(originalAmount),
          creator_earning: Number(creatorEarning.toFixed(2)),
          platform_fee: Number((feeInUSD + platformFee).toFixed(2)),
          payment_status: item.status,
          created_at: item.created_at,
          order_total: Number(originalAmount),
          payout_eligible_date: payoutEligibleDate,
          payment_method: item.payment_method || 'Unknown'
        });
      } else {
        // ... (existing course/event processing code remains the same)
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
