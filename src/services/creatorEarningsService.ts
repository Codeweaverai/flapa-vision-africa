import { supabase } from '@/lib/supabaseClient';

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

    // Process fundraising contributions - available only after campaign ends
    fundraisingContributions.forEach(contribution => {
      // net_amount is already the final amount after 5% transaction fee
      const creatorEarning = Number(contribution.net_amount) || Number(contribution.amount);
      const originalAmount = Number(contribution.amount);
      const transactionFee = originalAmount - creatorEarning; // Already calculated 5% fee

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
    });

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

    // Get creator's fundraising campaigns with end dates
    const { data: creatorCampaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, title, end_date, status')
      .eq('creator_id', creatorId);

    if (campaignsError) {
      console.error('Error fetching campaigns for transactions:', campaignsError);
    }

    const campaignIds = creatorCampaigns?.map(c => c.id) || [];
    const campaignMap = new Map(creatorCampaigns?.map(c => [c.id, c.title]) || []);
    const campaignEndDateMap = new Map(creatorCampaigns?.map(c => [c.id, c.end_date]) || []);
    const campaignStatusMap = new Map(creatorCampaigns?.map(c => [c.id, c.status]) || []);

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

    // ✅ FIXED: Fetch fundraising contributions WITHOUT comments in the query string
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
        // Process fundraising contribution - net_amount is final creator earning
        const creatorEarning = Number(item.net_amount) || Number(item.amount);
        const originalAmount = Number(item.amount);
        const platformFee = originalAmount - creatorEarning; // Already deducted 5%

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
          customer_email: 'campaign@supporter.com', // Placeholder email
          customer_name: customerName,
          item_type: 'fundraising_contribution',
          item_name: `Campaign: ${item.fundraising_campaigns?.title}`,
          item_id: item.campaign_id,
          quantity: 1,
          unit_price: Number(item.amount),
          total_amount: Number(item.amount),
          creator_earning: Number(creatorEarning.toFixed(2)),
          platform_fee: Number(platformFee.toFixed(2)),
          payment_status: item.status,
          created_at: item.created_at,
          order_total: Number(item.amount),
          payout_eligible_date: payoutEligibleDate,
          payment_method: item.payment_method || 'Unknown'
        });
      } else {
        // Process course and event transactions
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
