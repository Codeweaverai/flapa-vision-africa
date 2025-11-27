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
const FUNDRAISING_PLATFORM_FEE_RATE = 0.05; // 5% for fundraising

export async function calculateCreatorEarningsFromOrders(creatorId: string): Promise<CreatorEarningsData> {
  try {
    console.log('🔄 Calculating creator earnings for:', creatorId);

    // Get creator's course IDs
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .eq('creator_id', creatorId);

    if (coursesError) {
      console.error('❌ Error fetching creator courses:', coursesError);
    }

    // Get creator's event IDs
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('creator_id', creatorId);

    if (eventsError) {
      console.error('❌ Error fetching creator events:', eventsError);
    }

    // Get creator's fundraising campaigns
    const { data: creatorCampaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('id, end_date, status')
      .eq('creator_id', creatorId);

    if (campaignsError) {
      console.error('❌ Error fetching creator campaigns:', campaignsError);
    }

    const courseIds = creatorCourses?.map(c => c.id) || [];
    const eventIds = creatorEvents?.map(e => e.id) || [];
    const campaignIds = creatorCampaigns?.map(c => c.id) || [];
    const campaignEndDateMap = new Map(creatorCampaigns?.map(c => [c.id, c.end_date]) || []);
    const campaignStatusMap = new Map(creatorCampaigns?.map(c => [c.id, c.status]) || []);

    console.log(`📊 Found: ${courseIds.length} courses, ${eventIds.length} events, ${campaignIds.length} campaigns`);

    // Get event ticket IDs for creator's events
    let eventTicketIds: string[] = [];
    if (eventIds.length > 0) {
      const { data: eventTickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('id')
        .in('event_id', eventIds);

      if (ticketsError) {
        console.error('❌ Error fetching event tickets:', ticketsError);
      } else {
        eventTicketIds = eventTickets?.map(t => t.id) || [];
      }
    }

    if (courseIds.length === 0 && eventTicketIds.length === 0 && campaignIds.length === 0) {
      console.log('ℹ️ No content found for creator, returning zero earnings');
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

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let courseRevenue = 0;
    let eventRevenue = 0;
    let fundraisingRevenue = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    const now = new Date();

    // Process course and event sales
    if (courseIds.length > 0 || eventTicketIds.length > 0) {
      let orderItemTypes: string[] = [];
      let itemIds: string[] = [];

      if (courseIds.length > 0) {
        orderItemTypes.push('course');
        itemIds = [...itemIds, ...courseIds];
      }

      if (eventTicketIds.length > 0) {
        orderItemTypes.push('event_ticket');
        itemIds = [...itemIds, ...eventTicketIds];
      }

      const { data: orderItems, error: orderItemsError } = await supabase
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
        .in('item_type', orderItemTypes)
        .in('item_id', itemIds);

      if (orderItemsError) {
        console.error('❌ Error fetching order items:', orderItemsError);
      } else if (orderItems) {
        console.log(`📦 Processing ${orderItems.length} order items`);

        for (const item of orderItems) {
          const itemTotal = Number(item.total_price || 0);
          const orderTotal = Number(item.orders.total_amount || 0);
          const orderTax = Number(item.orders.tax_amount || 0);
          
          // Calculate proportional tax allocation for this item
          const itemTaxAllocation = orderTotal > 0 ? (itemTotal / orderTotal) * orderTax : 0;
          
          // Calculate platform fee and creator earning with tax consideration
          const platformFee = itemTotal * PLATFORM_FEE_RATE;
          const creatorEarning = Math.max(0, itemTotal - platformFee - itemTaxAllocation);
          
          totalEarnings += creatorEarning;
          totalPlatformFees += platformFee;

          // Add to appropriate revenue category
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
        }
      }
    }

    // Process fundraising contributions with CORRECTED platform fee calculation
    if (campaignIds.length > 0) {
      const { data: contributions, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select('*')
        .eq('status', 'completed')
        .in('campaign_id', campaignIds);

      if (contributionsError) {
        console.error('❌ Error fetching fundraising contributions:', contributionsError);
      } else if (contributions) {
        console.log(`💰 Processing ${contributions.length} fundraising contributions`);

        for (const contribution of contributions) {
          const originalGrossAmount = Number(contribution.amount || 0);

          // CORRECTED: Platform fee calculated on GROSS amount (5% for fundraising)
          const platformFee = originalGrossAmount * FUNDRAISING_PLATFORM_FEE_RATE;
          
          // CORRECTED: Creator earning = gross amount - platform fee
          const creatorEarning = originalGrossAmount - platformFee;

          fundraisingRevenue += creatorEarning;
          totalPlatformFees += platformFee;
          totalEarnings += creatorEarning;

          const campaignEndDate = campaignEndDateMap.get(contribution.campaign_id);
          const campaignStatus = campaignStatusMap.get(contribution.campaign_id);

          // Check if campaign has ended
          const isCampaignEnded = campaignEndDate ? new Date(campaignEndDate) <= now : false;
          const isCampaignCompleted = campaignStatus === 'completed';

          if (isCampaignEnded || isCampaignCompleted) {
            // Campaign has ended - money is available
            availableBalance += creatorEarning;
          } else {
            // Campaign is still active - money is pending
            pendingBalance += creatorEarning;
          }
        }
      }
    }

    // Get completed payouts and subtract from available balance
    const { data: completedPayouts } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .in('status', ['completed', 'processing']);

    let totalPayouts = 0;
    
    if (completedPayouts) {
      totalPayouts = completedPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
    }

    availableBalance = Math.max(0, availableBalance - totalPayouts);

    const earningsData = {
      available_balance: Number(availableBalance.toFixed(2)),
      pending_balance: Number(pendingBalance.toFixed(2)),
      total_earnings: Number(totalEarnings.toFixed(2)),
      total_platform_fees: Number(totalPlatformFees.toFixed(2)),
      course_revenue: Number(courseRevenue.toFixed(2)),
      event_revenue: Number(eventRevenue.toFixed(2)),
      fundraising_revenue: Number(fundraisingRevenue.toFixed(2))
    };

    console.log('✅ Earnings calculation completed:', earningsData);
    return earningsData;
  } catch (error) {
    console.error('❌ Error calculating creator earnings from orders:', error);
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

// OPTIMIZED: fetchCreatorTransactions function with simplified queries
export async function fetchCreatorTransactions(creatorId: string, limit: number = 10, offset: number = 0): Promise<{ transactions: CreatorTransaction[], total: number }> {
  try {
    console.log('🔍 Fetching creator transactions for:', creatorId);

    // Get creator content in parallel
    const [coursesResult, eventsResult, campaignsResult] = await Promise.all([
      supabase.from('courses').select('id, title').eq('creator_id', creatorId),
      supabase.from('events').select('id, title').eq('creator_id', creatorId),
      supabase.from('fundraising_campaigns').select('id, title, end_date, status').eq('creator_id', creatorId)
    ]);

    const courseIds = coursesResult.data?.map(c => c.id) || [];
    const eventIds = eventsResult.data?.map(e => e.id) || [];
    const campaignIds = campaignsResult.data?.map(c => c.id) || [];
    const campaignMap = new Map(campaignsResult.data?.map(c => [c.id, c]) || []);

    console.log(`📊 Found: ${courseIds.length} courses, ${eventIds.length} events, ${campaignIds.length} campaigns`);

    const allTransactions: CreatorTransaction[] = [];
    const now = new Date();

    // Process course and event transactions together
    if (courseIds.length > 0 || eventIds.length > 0) {
      let itemTypes: string[] = [];
      let contentIds: string[] = [];

      if (courseIds.length > 0) {
        itemTypes.push('course');
        contentIds = [...contentIds, ...courseIds];
      }

      // Get event ticket IDs for events
      let eventTicketIds: string[] = [];
      if (eventIds.length > 0) {
        const { data: eventTickets } = await supabase
          .from('event_tickets')
          .select('id, event_id, name')
          .in('event_id', eventIds);
        eventTicketIds = eventTickets?.map(t => t.id) || [];
        
        if (eventTicketIds.length > 0) {
          itemTypes.push('event_ticket');
          contentIds = [...contentIds, ...eventTicketIds];
        }
      }

      if (itemTypes.length > 0) {
        const { data: orderItems, error: orderItemsError } = await supabase
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
          .in('item_type', itemTypes)
          .in('item_id', contentIds)
          .order('created_at', { ascending: false });

        if (orderItemsError) {
          console.error('❌ Error fetching order items:', orderItemsError);
        } else if (orderItems) {
          console.log(`🛒 Processing ${orderItems.length} order items`);

          // Get user profiles in batch
          const userIds = [...new Set(orderItems.map(item => item.orders.user_id).filter(Boolean))];
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

          for (const item of orderItems) {
            const itemTotal = Number(item.total_price || 0);
            const orderTotal = Number(item.orders.total_amount || 0);
            const orderTax = Number(item.orders.tax_amount || 0);
            
            const itemTaxAllocation = orderTotal > 0 ? (itemTotal / orderTotal) * orderTax : 0;
            const platformFee = itemTotal * PLATFORM_FEE_RATE;
            const creatorEarning = Math.max(0, itemTotal - platformFee - itemTaxAllocation);

            const orderDate = new Date(item.orders.created_at);
            const payoutEligibleDate = new Date(orderDate);
            payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

            const userProfile = userProfiles.get(item.orders.user_id);
            const customerName = userProfile?.full_name || userProfile?.username || 'Unknown Customer';

            const isCourse = item.item_type === 'course';
            const itemName = isCourse 
              ? (item.item_name || 'Course Purchase')
              : (item.item_name || 'Event Registration');

            allTransactions.push({
              id: item.id,
              order_id: item.orders.id,
              customer_email: item.orders.email,
              customer_name: customerName,
              item_type: item.item_type as 'course' | 'event_ticket',
              item_name: itemName,
              item_id: item.item_id,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || itemTotal,
              total_amount: itemTotal,
              creator_earning: Number(creatorEarning.toFixed(2)),
              platform_fee: Number(platformFee.toFixed(2)),
              payment_status: item.orders.payment_status,
              created_at: item.orders.created_at,
              order_total: orderTotal,
              payout_eligible_date: payoutEligibleDate.toISOString(),
              payment_method: item.orders.payment_method || 'Unknown'
            });
          }
        }
      }
    }

    // Process fundraising transactions
    if (campaignIds.length > 0) {
      const { data: contributions, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select(`
          *,
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
        console.log(`🎁 Processing ${contributions.length} fundraising contributions`);

        for (const contribution of contributions) {
          const originalGrossAmount = Number(contribution.amount || 0);

          // CORRECTED: Platform fee calculated on GROSS amount (5% for fundraising)
          const platformFee = originalGrossAmount * FUNDRAISING_PLATFORM_FEE_RATE;
          
          // CORRECTED: Creator earning = gross amount - platform fee
          const creatorEarning = originalGrossAmount - platformFee;

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
            unit_price: originalGrossAmount,
            total_amount: originalGrossAmount,
            creator_earning: Number(creatorEarning.toFixed(2)),
            platform_fee: Number(platformFee.toFixed(2)),
            payment_status: contribution.status,
            created_at: contribution.created_at,
            order_total: originalGrossAmount,
            payout_eligible_date: payoutEligibleDate,
            payment_method: contribution.payment_method || 'Unknown'
          });
        }
      }
    }

    // Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const total = allTransactions.length;
    const paginatedData = allTransactions.slice(offset, offset + limit);

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

// NOTE: Consider removing this duplicate function since it exists in creatorPaymentService.ts
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
    console.error('❌ Error fetching payout method:', error);
    throw error;
  }
}
