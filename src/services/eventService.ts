import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  price?: number;
  is_free: boolean;
  currency?: string;
  capacity?: number;
  creator_id?: string;
  created_at: string;
  updated_at: string;
  online_meeting_link?: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  phone_number?: string;
  mobile_operator?: string;
  payment_method?: string;
  payment_id?: string;
}

export interface MobileOperator {
  id: string;
  name: string;
  code: string;
  country: string;
}

export const VALID_EVENT_TYPES = [
  'webinar',
  'workshop',
  'conference',
  'meetup',
  'seminar',
  'training',
  'mentorship',
  'networking'
];

export async function fetchPastEvents(limit: number = 10): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .lt('end_time', new Date().toISOString()) // Past events
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchUpcomingEvents(limit: number = 10): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('start_time', new Date().toISOString()) // Future events
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchCreatorEvents(creatorId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('creator_id', creatorId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchEventAttendeeCount(eventId: string): Promise<number> {
  const { data, error } = await supabase
    .from('event_bookings')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  if (error) throw error;
  return data?.length || 0;
}

export async function fetchUserRegistrations(user: User): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('event_bookings')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  
  return (data || []).map(booking => ({
    id: booking.id,
    event_id: booking.event_id,
    user_id: booking.user_id,
    status: booking.status || 'pending',
    payment_status: booking.payment_status || 'pending',
    created_at: booking.created_at,
    phone_number: booking.phone_number,
    mobile_operator: booking.mobile_operator
  }));
}

export async function fetchMobileOperators(): Promise<MobileOperator[]> {
  const { data, error } = await supabase
    .from('mobile_operators')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function registerForEvent(
  event: Event, 
  user: User, 
  phoneNumber?: string, 
  mobileOperator?: string
): Promise<boolean> {
  try {
    const bookingData = {
      event_id: event.id,
      user_id: user.id,
      status: event.is_free ? 'confirmed' : 'pending',
      payment_status: event.is_free ? 'completed' : 'pending',
      phone_number: phoneNumber,
      mobile_operator: mobileOperator,
      payment_amount: event.is_free ? 0 : event.price,
      payment_currency: event.currency || 'USD'
    };

    const { data, error } = await supabase
      .from('event_bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) throw error;

    if (!event.is_free && phoneNumber && mobileOperator) {
      // For paid events, initiate payment process
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('initiate-payment', {
        body: {
          amount: event.price,
          currency: event.currency || 'USD',
          phone_number: phoneNumber,
          mobile_operator: mobileOperator,
          reference_id: data.id,
          reference_type: 'event_booking',
          description: `Registration for ${event.title}`
        }
      });

      if (paymentError) throw paymentError;
      
      // Payment initiated successfully, user will be redirected
      if (paymentData?.payment_url) {
        window.location.href = paymentData.payment_url;
      }
    }

    return true;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
}

export async function cancelRegistration(registrationId: string, user: User | null): Promise<boolean> {
  if (!user) return false;

  try {
    const { error } = await supabase
      .from('event_bookings')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return false;
  }
}

export async function createEventWithCreator(eventData: Partial<Event>, creatorId: string): Promise<Event | null> {
  try {
    // Ensure required fields are present and properly typed
    const insertData = {
      title: eventData.title || '',
      description: eventData.description || '',
      start_time: eventData.start_time || new Date().toISOString(),
      end_time: eventData.end_time || new Date(Date.now() + 3600000).toISOString(), // Default 1 hour later
      event_type: eventData.event_type || 'webinar',
      location: eventData.location,
      image_url: eventData.image_url,
      price: eventData.price,
      is_free: eventData.is_free ?? true,
      currency: eventData.currency,
      capacity: eventData.capacity,
      online_meeting_link: eventData.online_meeting_link,
      creator_id: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}
