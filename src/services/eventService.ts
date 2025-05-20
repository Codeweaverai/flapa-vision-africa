import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

// Define Event type
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
  price?: number | null;
  currency?: string | null;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
}

// Define Registration type
export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string;
  payment_id?: string;
  created_at?: string;
  updated_at?: string;
  phone_number?: string;
  mobile_operator?: string;
  event?: Event; // Add the event relation property
}

// Define MobileOperator type
export interface MobileOperator {
  id: string;
  name: string;
  code: string;
  country: string;
}

// Update the VALID_EVENT_TYPES constant to include all valid event types
export const VALID_EVENT_TYPES = [
  'webinar', 
  'workshop', 
  'meetup', 
  'conference', 
  'seminar', 
  'training', 
  'other'
];

// Add a function to create an event with creator_id
export const createEventWithCreator = async (
  eventData: Partial<Event>, 
  creatorId: string
): Promise<Event | null> => {
  try {
    // Make sure required fields are present
    if (!eventData.title || !eventData.event_type || 
        !eventData.start_time || !eventData.end_time) {
      console.error('Error creating event: Missing required fields');
      toast.error('Please fill in all required fields');
      return null;
    }
    
    // Validate event_type against allowed values in the database
    if (!VALID_EVENT_TYPES.includes(eventData.event_type.toLowerCase())) {
      console.error(`Error creating event: Invalid event type: ${eventData.event_type}`);
      toast.error(`Invalid event type: ${eventData.event_type}. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
      return null;
    }
    
    // Create the complete event object with required fields
    const eventWithCreator = {
      title: eventData.title,
      event_type: eventData.event_type.toLowerCase(), // Convert to lowercase to ensure consistency
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      description: eventData.description || '',
      location: eventData.location || null,
      online_meeting_link: eventData.online_meeting_link || null,
      capacity: eventData.capacity || null,
      is_free: eventData.is_free !== undefined ? eventData.is_free : false,
      price: eventData.is_free ? null : eventData.price, // Set price to null if is_free is true
      currency: eventData.is_free ? null : (eventData.currency || 'USD'), // Set currency to null if is_free is true
      creator_id: creatorId,
      image_url: eventData.image_url || null,
    };

    // Log the event data for debugging
    console.log('Sending event data to Supabase:', eventWithCreator);

    const { data, error } = await supabase
      .from('events')
      .insert(eventWithCreator)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      toast.error(`Failed to create event: ${error.message}`);
      throw error;
    }

    toast.success('Event created successfully!');
    return data as Event;
  } catch (error: any) {
    console.error('Error in createEventWithCreator:', error);
    toast.error(`Failed to create event: ${error.message || 'Unknown error'}`);
    return null;
  }
};

// Function to fetch events
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });
      
    if (error) throw error;
    return data as Event[];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

// Function to fetch events by creator
export const fetchEventsByCreator = async (creatorId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', creatorId)
      .order('start_time', { ascending: true });
      
    if (error) throw error;
    return data as Event[];
  } catch (error) {
    console.error('Error fetching creator events:', error);
    return [];
  }
};

// Function to register for an event
export const registerForEvent = async (
  event: Event, 
  user: User,
  phoneNumber?: string,
  mobileOperator?: string
): Promise<boolean> => {
  try {
    const registration = {
      event_id: event.id,
      user_id: user.id,
      status: 'confirmed',
      payment_status: event.is_free ? 'free' : 'pending',
      payment_amount: event.price,
      payment_currency: event.currency,
      phone_number: phoneNumber,
      mobile_operator: mobileOperator,
    };
    
    const { data, error } = await supabase
      .from('registrations')
      .insert(registration)
      .select()
      .single();
      
    if (error) throw error;
    
    if (event.is_free) {
      toast.success(`Successfully registered for ${event.title}`);
      return true;
    } else {
      // For paid events, redirect to payment or show payment info
      // This is a placeholder for the payment process
      console.log('Proceeding to payment for', data.id);
      return true;
    }
  } catch (error) {
    console.error('Error registering for event:', error);
    toast.error('Failed to register for event');
    return false;
  }
};

// Function to fetch user registrations
export const fetchUserRegistrations = async (user: User): Promise<Registration[]> => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Registration[];
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return [];
  }
};

// Function to cancel registration
export const cancelRegistration = async (registrationId: string, user: User): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('registrations')
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

// Function to fetch mobile operators
export const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  try {
    const { data, error } = await supabase
      .from('mobile_operators')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data as MobileOperator[];
  } catch (error) {
    console.error('Error fetching mobile operators:', error);
    return [];
  }
};
