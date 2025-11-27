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
const FUNDRAISING_PLATFORM_FEE_RATE = 0.05; // 5% for fundraising

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

    // FIXED: Use proper field name 'currency' not 'currencyascampaign_currency'
    const { data: creatorCampaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, currency, end_date, status')
      .eq('creator_id', creatorId);

    if (campaignsError) {
      console.error('Error fetching creator campaigns:', campaignsError);
    }

    const campaignIds = creatorCampaigns?.map(c => c.id) || [];
    const campaignCurrencyMap = new Map(creatorCampaigns?.map(c => [c.id, c.currency || 'USD']) || []);
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

    // FIXED: Process fundraising contributions with campaign currency and no double fee application
    for (const contribution of fundraisingContributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const campaignBaseCurrency = campaignCurrencyMap.get(contribution.campaign_id) || 'USD';
      
      // Use the pre-calculated net_amount from database (already has all fees deducted)
      const originalNetAmount = Number(contribution.net_amount || 0);

      // Convert to campaign base currency
      let netAmountInBaseCurrency = originalNetAmount;

      if (contributionCurrency !== campaignBaseCurrency) {
        try {
          netAmountInBaseCurrency = await convertCurrency(originalNetAmount, contributionCurrency, campaignBaseCurrency);
        } catch (error) {
          console.warn(`Currency conversion failed for contribution ${contribution.id}:`, error);
        }
      }

      // FIXED: No need to apply platform fees again - net_amount already has them deducted
      const creatorEarning = netAmountInBaseCurrency;

      fundraisingRevenue += creatorEarning;
      totalEarnings += creatorEarning;

      const campaignEndDate = campaignEndDateMap.get(contribution.campaign_id);
      const campaignStatus = campaignStatusMap.get(contribution.campaign_id);

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

// FIXED: fetchCreatorTransactions function with proper field names
export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    console.log('🔍 Fetching creator transactions for:', creatorId, 'limit:', limit, 'offset:', offset);

    // Step 1: Get all creator content IDs with proper field names
    const [coursesResult, eventsResult, campaignsResult] = await Promise.all([
      supabase.from('courses').select('id, title').eq('creator_id', creatorId),
      supabase.from('events').select('id, title').eq('creator_id', creatorId),
      // FIXED: Use proper field name 'currency' not 'currencyascampaign_currency'
      supabase.from('fundraising_campaigns').select('id, title, currency, end_date, status').eq('creator_id', creatorId)
    ]);

    const courseIds = coursesResult.data?.map(c => c.id) || [];
    const eventIds = eventsResult.data?.map(e => e.id) || [];
    const campaignIds = campaignsResult.data?.map(c => c.id) || [];
    const campaignMap = new Map(campaignsResult.data?.map(c => [c.id, c]) || []);

    console.log(`📊 Found: ${courseIds.length} courses, ${eventIds.length} events, ${campaignIds.length} campaigns`);

    // Step 2: Get event ticket IDs
    let eventTicketIds: string[] = [];
    if (eventIds.length > 0) {
      const { data: eventTickets } = await supabase
        .from('event_tickets')
        .select('id, event_id, name')
        .in('event_id', eventIds);
      eventTicketIds = eventTickets?.map(t => t.id) || [];
    }

    // Step 3: Fetch transactions from all sources
    const allTransactions: CreatorTransaction[] = [];

    // Fetch and process course transactions
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
        .in('item_id', courseIds)
        .order('created_at', { ascending: false });

      if (courseError) {
        console.error('❌ Error fetching course transactions:', courseError);
      } else if (courseItems) {
        console.log(`📚 Found ${courseItems.length} course transactions`);
        
        // Get user profiles separately to avoid complex nested joins
        const userIds = [...new Set(courseItems.map(item => item.orders.user_id).filter(Boolean))];
        let userProfiles = new Map();
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', userIds);
          
          if (profiles) {
            userProfiles = new Map(profiles.map(p => [p.id, p]));
          }
        }

        for (const item of courseItems) {
          const itemTotal = Number(item.total_price);
          const orderTotal = Number(item.orders.total_amount);
          const orderTax = Number(item.orders.tax_amount) || 0;
          
          const itemTaxAllocation = orderTotal > 0 ? (itemTotal / orderTotal) * orderTax : 0;
          const platformFee = itemTotal * PLATFORM_FEE_RATE;
          const creatorEarning = Math.max(0, itemTotal - platformFee - itemTaxAllocation);

          const orderDate = new Date(item.orders.created_at);
          const payoutEligibleDate = new Date(orderDate);
          payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

          const userProfile = userProfiles.get(item.orders.user_id);
          const customerName = userProfile?.full_name || userProfile?.username || 'Unknown Customer';

          allTransactions.push({
            id: item.id,
            order_id: item.orders.id,
            customer_email: item.orders.email,
            customer_name: customerName,
            item_type: 'course',
            item_name: item.item_name || 'Course Purchase',
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: itemTotal,
            creator_earning: creatorEarning,
            platform_fee: platformFee,
            payment_status: item.orders.payment_status,
            created_at: item.orders.created_at,
            order_total: orderTotal,
            payout_eligible_date: payoutEligibleDate.toISOString(),
            payment_method: item.orders.payment_method
          });
        }
      }
    }

    // Fetch and process event transactions
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
        .in('item_id', eventTicketIds)
        .order('created_at', { ascending: false });

      if (eventError) {
        console.error('❌ Error fetching event transactions:', eventError);
      } else if (eventItems) {
        console.log(`🎫 Found ${eventItems.length} event transactions`);
        
        // Get user profiles separately
        const userIds = [...new Set(eventItems.map(item => item.orders.user_id).filter(Boolean))];
        let userProfiles = new Map();
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', userIds);
          
          if (profiles) {
            userProfiles = new Map(profiles.map(p => [p.id, p]));
          }
        }

        for (const item of eventItems) {
          const itemTotal = Number(item.total_price);
          const orderTotal = Number(item.orders.total_amount);
          const orderTax = Number(item.orders.tax_amount) || 0;
          
          const itemTaxAllocation = orderTotal > 0 ? (itemTotal / orderTotal) * orderTax : 0;
          const platformFee = itemTotal * PLATFORM_FEE_RATE;
          const creatorEarning = Math.max(0, itemTotal - platformFee - itemTaxAllocation);

          const orderDate = new Date(item.orders.created_at);
          const payoutEligibleDate = new Date(orderDate);
          payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

          const userProfile = userProfiles.get(item.orders.user_id);
          const customerName = userProfile?.full_name || userProfile?.username || 'Unknown Customer';

          allTransactions.push({
            id: item.id,
            order_id: item.orders.id,
            customer_email: item.orders.email,
            customer_name: customerName,
            item_type: 'event_ticket',
            item_name: item.item_name || 'Event Registration',
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: itemTotal,
            creator_earning: creatorEarning,
            platform_fee: platformFee,
            payment_status: item.orders.payment_status,
            created_at: item.orders.created_at,
            order_total: orderTotal,
            payout_eligible_date: payoutEligibleDate.toISOString(),
            payment_method: item.orders.payment_method
          });
        }
      }
    }

    // FIXED: Fetch and process fundraising transactions with proper field names
    if (campaignIds.length > 0) {
      const { data: contributions, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select(`
          *,
          fundraising_campaigns!inner(
            id,
            title,
            currency,
            end_date,
            status
          ),
          profiles!campaign_contributions_supporter_id_fkey(
            username,
            full_name
          )
        `)
        .eq('status', 'completed')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false });

      if (contributionsError) {
        console.error('❌ Error fetching fundraising transactions:', contributionsError);
      } else if (contributions) {
        console.log(`💰 Found ${contributions.length} fundraising transactions`);

        for (const contribution of contributions) {
          const contributionCurrency = contribution.currency || 'USD';
          // FIXED: Use proper field access
          const campaignBaseCurrency = contribution.fundraising_campaigns?.currency || 'USD';
          
          // Use the pre-calculated net_amount from database
          const originalNetAmount = Number(contribution.net_amount || 0);

          // Convert to campaign base currency
          let netAmountInBaseCurrency = originalNetAmount;

          if (contributionCurrency !== campaignBaseCurrency) {
            try {
              netAmountInBaseCurrency = await convertCurrency(originalNetAmount, contributionCurrency, campaignBaseCurrency);
            } catch (error) {
              console.warn(`Currency conversion failed for contribution ${contribution.id}:`, error);
            }
          }

          const creatorEarning = netAmountInBaseCurrency;

          const campaign = campaignMap.get(contribution.campaign_id);
          const campaignEndDate = campaign?.end_date;

          // Determine payout eligible date - campaign end date for fundraising
          let payoutEligibleDate = contribution.created_at;
          if (campaignEndDate) {
            payoutEligibleDate = campaignEndDate;
          }

          const customerName = contribution.is_anonymous 
            ? 'Anonymous Supporter' 
            : (contribution.profiles?.full_name || contribution.profiles?.username || 'Unknown Supporter');

          allTransactions.push({
            id: contribution.id,
            order_id: contribution.id,
            customer_email: 'campaign@supporter.com',
            customer_name: customerName,
            item_type: 'fundraising_contribution',
            item_name: `Campaign: ${campaign?.title || 'Unknown Campaign'}`,
            item_id: contribution.campaign_id,
            quantity: 1,
            unit_price: Number(contribution.amount),
            total_amount: Number(contribution.amount),
            creator_earning: Number(creatorEarning.toFixed(2)),
            platform_fee: 0, // Platform fee already included in net_amount
            payment_status: contribution.status,
            created_at: contribution.created_at,
            order_total: Number(contribution.amount),
            payout_eligible_date: payoutEligibleDate,
            payment_method: contribution.payment_method || 'Unknown'
          });
        }
      }
    }

    // Step 4: Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Step 5: Apply pagination
    const total = allTransactions.length;
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedData = allTransactions.slice(startIndex, endIndex);

    console.log(`✅ Returning ${paginatedData.length} transactions out of ${total} total`);

    return {
      transactions: paginatedData,
      total: total
    };

  } catch (error) {
    console.error('❌ Error fetching creator transactions:', error);
    return {
      transactions: [],
      total: 0
    };
  }
}

export async function getCreatorPayoutMethod(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('payout_method, mobile_money_details, stripe_connect_id, bank_account_details')
      .eq('id', creatorId)
      .single();

    if (error) throw error;

    return {
      payout_method: data?.payout_method || null,
      mobile_money_details: data?.mobile_money_details || null,
      stripe_connect_id: data?.stripe_connect_id || null,
      bank_account_details: data?.bank_account_details || null,
      has_payout_method: !!(data?.payout_method)
    };
  } catch (error) {
    console.error('Error fetching payout method:', error);
    throw error;
  }
}
