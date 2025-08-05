
import { supabase } from '@/lib/supabaseClient';

export interface CreatorOrderTransaction {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name: string;
  item_type: 'course' | 'event_ticket';
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
  payment_method: string;
}

// Platform fee rate (8%)
const PLATFORM_FEE_RATE = 0.08;

export async function fetchCreatorOrderTransactions(
  creatorId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ transactions: CreatorOrderTransaction[], total: number }> {
  try {
    console.log('Fetching creator order transactions for:', creatorId, 'limit:', limit, 'offset:', offset);
    
    // Get creator's course IDs
    const { data: creatorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return { transactions: [], total: 0 };
    }

    const courseIds = creatorCourses?.map(c => c.id) || [];
    const courseMap = new Map(creatorCourses?.map(c => [c.id, c.title]) || []);

    // Get creator's event IDs
    const { data: creatorEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .eq('creator_id', creatorId);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return { transactions: [], total: 0 };
    }

    const eventIds = creatorEvents?.map(e => e.id) || [];
    const eventMap = new Map(creatorEvents?.map(e => [e.id, e.title]) || []);

    // Get event ticket IDs for creator's events
    let eventTicketIds: string[] = [];
    let ticketToEventMap = new Map();
    
    if (eventIds.length > 0) {
      const { data: eventTickets, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('id, event_id')
        .in('event_id', eventIds);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
      } else {
        eventTicketIds = eventTickets?.map(t => t.id) || [];
        ticketToEventMap = new Map(eventTickets?.map(t => [t.id, t.event_id]) || []);
      }
    }

    if (courseIds.length === 0 && eventTicketIds.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Fetch completed order items for courses
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
            created_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'course')
        .in('item_id', courseIds)
        .order('created_at', { ascending: false });

      if (courseError) {
        console.error('Error fetching course order items:', courseError);
      } else {
        courseOrderItems = courseItems || [];
      }
    }

    // Fetch completed order items for event tickets
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
            created_at
          )
        `)
        .eq('orders.payment_status', 'completed')
        .eq('item_type', 'event_ticket')
        .in('item_id', eventTicketIds)
        .order('created_at', { ascending: false });

      if (eventError) {
        console.error('Error fetching event order items:', eventError);
      } else {
        eventOrderItems = eventItems || [];
      }
    }

    // Combine and sort by date
    const allOrderItems = [...courseOrderItems, ...eventOrderItems]
      .sort((a, b) => new Date(b.orders.created_at).getTime() - new Date(a.orders.created_at).getTime());

    const total = allOrderItems.length;

    // Apply pagination
    const paginatedItems = allOrderItems.slice(offset, offset + limit);

    if (!paginatedItems || paginatedItems.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Get user profiles for customer names
    const userIds = [...new Set(paginatedItems.map(item => item.orders.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    // Process transactions
    const creatorTransactions: CreatorOrderTransaction[] = [];
    
    for (const item of paginatedItems) {
      const profile = profiles?.find(p => p.id === item.orders.user_id);
      const itemTotal = Number(item.total_price);
      const platformFee = itemTotal * PLATFORM_FEE_RATE;
      const creatorEarning = itemTotal - platformFee;
      
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
        total_amount: itemTotal,
        creator_earning: creatorEarning,
        platform_fee: platformFee,
        payment_status: item.orders.payment_status,
        created_at: item.orders.created_at,
        order_total: Number(item.orders.total_amount),
        payment_method: item.orders.payment_method || 'Unknown'
      });
    }

    console.log('Creator order transactions fetched:', creatorTransactions.length, 'total:', total);
    return { transactions: creatorTransactions, total };
  } catch (error) {
    console.error('Error fetching creator order transactions:', error);
    return { transactions: [], total: 0 };
  }
}
