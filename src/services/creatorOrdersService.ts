
import { supabase } from '@/lib/supabaseClient';

export interface CreatorOrderTransaction {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  item_title: string;
  item_type: 'course' | 'event_ticket';
  total_price: number;
  platform_fee: number;
  creator_earning: number;
  currency: string;
  order_date: string;
  payment_status: string;
}

export interface CreatorOrdersResponse {
  transactions: CreatorOrderTransaction[];
  total: number;
}

export async function fetchCreatorOrderTransactions(
  creatorId: string,
  limit: number = 10,
  offset: number = 0
): Promise<CreatorOrdersResponse> {
  try {
    console.log('Fetching creator order transactions for:', creatorId, 'limit:', limit, 'offset:', offset);
    
    // Get orders with items for the creator's courses and events
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        currency,
        payment_status,
        created_at,
        order_items!inner(
          id,
          item_id,
          item_type,
          quantity,
          total_price
        )
      `)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Get user profiles for customer names
    const userIds = [...new Set(orders.map(order => order.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', userIds);

    // Get user emails
    let emailMap = new Map();
    try {
      const { data: authUsers } = await supabase.functions.invoke('get-user-emails', {
        body: { user_ids: userIds }
      });
      
      if (authUsers?.users) {
        authUsers.users.forEach((user: any) => {
          emailMap.set(user.id, user.email);
        });
      }
    } catch (error) {
      console.error('Error fetching user emails:', error);
    }

    // Filter and process orders for creator's content
    const transactions: CreatorOrderTransaction[] = [];
    
    for (const order of orders) {
      for (const item of order.order_items) {
        let isCreatorContent = false;
        let itemTitle = '';
        
        if (item.item_type === 'course') {
          const { data: course } = await supabase
            .from('courses')
            .select('title, creator_id')
            .eq('id', item.item_id)
            .single();
          
          if (course && course.creator_id === creatorId) {
            isCreatorContent = true;
            itemTitle = course.title;
          }
        } else if (item.item_type === 'event_ticket') {
          const { data: eventTicket } = await supabase
            .from('event_tickets')
            .select(`
              name,
              events!event_tickets_event_id_fkey(
                title,
                creator_id
              )
            `)
            .eq('id', item.item_id)
            .single();
          
          if (eventTicket && eventTicket.events && eventTicket.events.creator_id === creatorId) {
            isCreatorContent = true;
            itemTitle = `${eventTicket.events.title} - ${eventTicket.name}`;
          }
        }
        
        if (isCreatorContent) {
          const profile = profiles?.find(p => p.id === order.user_id);
          const customerName = profile?.full_name || profile?.username || 'Unknown Customer';
          const customerEmail = emailMap.get(order.user_id) || '';
          
          // Calculate platform fee (assuming 5% platform fee)
          const platformFeeRate = 0.05;
          const platformFee = item.total_price * platformFeeRate;
          const creatorEarning = item.total_price - platformFee;
          
          transactions.push({
            id: item.id,
            order_id: order.id,
            customer_name: customerName,
            customer_email: customerEmail,
            item_title: itemTitle,
            item_type: item.item_type as 'course' | 'event_ticket',
            total_price: item.total_price,
            platform_fee: platformFee,
            creator_earning: creatorEarning,
            currency: order.currency,
            order_date: order.created_at,
            payment_status: order.payment_status
          });
        }
      }
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'completed');

    return {
      transactions,
      total: totalCount || 0
    };
  } catch (error) {
    console.error('Error fetching creator order transactions:', error);
    throw error;
  }
}
