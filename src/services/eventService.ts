
import { supabase } from '@/lib/supabaseClient';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  is_free: boolean;
  price?: number;
  currency?: string;
  image_url?: string;
  creator_id?: string;
  workplace_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  booking_date?: string;
  phone_number?: string;
  mobile_operator?: string;
}

export interface MobileOperator {
  id: string;
  code: string;
  name: string;
  country: string;
}

// Valid event types that match the database constraint
export const VALID_EVENT_TYPES = [
  'webinar',
  'workshop',
  'conference',
  'seminar',
  'meetup',
  'training',
  'networking',
  'presentation'
];

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const fetchUserRegistrations = async (user: any): Promise<Registration[]> => {
  try {
    const { data, error } = await supabase
      .from('event_bookings')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    
    // Transform event_bookings to match Registration interface
    const registrations = data?.map((booking) => ({
      id: booking.id,
      event_id: booking.event_id,
      user_id: booking.user_id,
      status: booking.status || 'pending',
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      booking_date: booking.booking_date,
      phone_number: booking.phone_number,
      mobile_operator: booking.mobile_operator
    })) || [];

    return registrations;
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    throw error;
  }
};

export const registerForEvent = async (
  event: Event, 
  user: any, 
  phoneNumber?: string, 
  mobileOperator?: string
): Promise<any> => {
  try {
    const bookingData = {
      event_id: event.id,
      user_id: user.id,
      status: 'confirmed',
      phone_number: phoneNumber,
      mobile_operator: mobileOperator,
      booking_date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('event_bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};

export const cancelRegistration = async (registrationId: string, user: any): Promise<boolean> => {
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
};

export const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  // Return mock data for now - this would typically come from a database
  return [
    { id: '1', code: 'MTN_UG', name: 'MTN Uganda', country: 'UG' },
    { id: '2', code: 'AIRTEL_UG', name: 'Airtel Uganda', country: 'UG' },
    { id: '3', code: 'MTN_ZM', name: 'MTN Zambia', country: 'ZM' },
    { id: '4', code: 'AIRTEL_ZM', name: 'Airtel Zambia', country: 'ZM' }
  ];
};

export const createEventWithCreator = async (eventData: Partial<Event>, creatorId: string): Promise<Event | null> => {
  try {
    // Ensure event_type is lowercase and valid
    const processedEventData = {
      ...eventData,
      creator_id: creatorId,
      event_type: eventData.event_type?.toLowerCase(),
      // Ensure required fields are present
      title: eventData.title || '',
      start_time: eventData.start_time || new Date().toISOString(),
      end_time: eventData.end_time || new Date().toISOString()
    };

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(processedEventData.event_type || '')) {
      throw new Error(`Invalid event type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('events')
      .insert([processedEventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};
