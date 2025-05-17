import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface MobileOperator {
  id: string;
  code: string;
  name: string;
  country: string;
  created_at?: string;
  updated_at?: string;
}

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
  is_free?: boolean;
  price?: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  payment_status: string;
  created_at: string; // Changed from optional to required
  updated_at?: string;
  phone_number?: string | null;
  mobile_operator?: string | null;
  payment_method?: string | null;
  payment_id?: string | null;
  payment_currency?: string | null;
  payment_amount?: number | null;
  events?: Event; // Join with events table
}

export interface EventBooking {
  id: string;
  user_id: string;
  event_id: string;
  booking_date: string;
  status: string;
  payment_status: string;
  payment_id?: string | null;
  payment_amount?: number | null;
  payment_currency?: string | null;
  phone_number?: string | null;
  mobile_operator?: string | null;
  created_at: string; // Changed from optional to required
  updated_at?: string;
  events?: Event; // Join with events table
}

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
    
    return data as Event[];
  } catch (error) {
    console.error('Error in fetchEvents:', error);
    return [];
  }
};

export const registerForEvent = async (event: Event, user: User | null): Promise<boolean> => {
  if (!user) {
    toast.error("Please sign in to register for events");
    return false;
  }

  try {
    // First check if user is already registered for this event in either table
    // Check registrations table (old)
    const { data: existingRegistration, error: existingRegistrationError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .maybeSingle(); // Using maybeSingle() to avoid 406 errors

    // Check event_bookings table (new)
    const { data: existingBooking, error: existingBookingError } = await supabase
      .from('event_bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingRegistrationError && !existingBookingError) {
      console.error('Error checking existing registration:', existingRegistrationError);
      toast.error('Failed to check existing registration');
      return false;
    }

    if (existingRegistration || existingBooking) {
      toast.error('You are already registered for this event.');
      return false;
    }

    // Create booking data object with proper structure
    const bookingData: any = {
      user_id: user.id,
      event_id: event.id,
      status: 'pending',
      payment_status: event.is_free ? 'confirmed' : 'pending',
      booking_date: new Date().toISOString()
    };

    // Insert into the new event_bookings table
    const { data: bookingResult, error: bookingError } = await supabase
      .from('event_bookings')
      .insert([bookingData])
      .select();

    if (bookingError) {
      console.error('Error registering for event:', bookingError);
      toast.error('Failed to register for event');
      return false;
    }

    if (!event.is_free) {
      // Initiate payment via Stripe Checkout
      try {
        // Get the session token for authorization
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('Authentication session expired. Please sign in again.');
          return false;
        }

        // Get the supabase URL from the environment variable
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rxqoczksnddbxcdwobnw.supabase.co";
        
        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            amount: event.price,
            currency: event.currency || 'USD',
            referenceType: 'event',
            referenceId: bookingResult[0].id,
            userId: user.id,
            eventTitle: event.title
          }),
        });

        const result = await response.json();

        if (response.ok && result.url) {
          // Open Stripe checkout in a new window
          window.location.href = result.url;
          return true;
        } else {
          console.error('Payment initiation failed:', result.error || 'Unknown error');
          toast.error('Payment initiation failed. Please try again.');
          
          // Update booking status to failed
          await supabase
            .from('event_bookings')
            .update({ status: 'failed', payment_status: 'failed' })
            .eq('id', bookingResult[0].id);
            
          return false;
        }
      } catch (err) {
        console.error('Error initiating payment:', err);
        toast.error('Error initiating payment. Please try again.');
        
        // Update booking status to failed if possible
        if (bookingResult && bookingResult[0]?.id) {
          await supabase
            .from('event_bookings')
            .update({ status: 'failed', payment_status: 'failed' })
            .eq('id', bookingResult[0].id);
        }
        return false;
      }
    } else if (event.is_free) {
      toast.success('Successfully registered for the event!');
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    toast.error('An unexpected error occurred during registration.');
    return false;
  }
};

export const fetchUserRegistrations = async (user: User | null): Promise<Registration[]> => {
  if (!user) {
    console.log('No user, returning empty registrations');
    return [];
  }

  try {
    // First get registrations from the old table
    const { data: oldRegistrations, error: oldError } = await supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (oldError) {
      console.error('Error fetching user registrations from old table:', oldError);
    }

    // Then get registrations from the new event_bookings table
    const { data: newBookings, error: newError } = await supabase
      .from('event_bookings')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (newError) {
      console.error('Error fetching user registrations from new table:', newError);
    }

    // Convert event_bookings to the Registration format
    const convertedBookings: Registration[] = (newBookings || []).map((booking: EventBooking) => ({
      id: booking.id,
      user_id: booking.user_id,
      event_id: booking.event_id,
      status: booking.status,
      payment_status: booking.payment_status,
      created_at: booking.created_at || new Date().toISOString(), // Ensure created_at is not undefined
      updated_at: booking.updated_at,
      phone_number: booking.phone_number,
      mobile_operator: booking.mobile_operator,
      payment_id: booking.payment_id,
      payment_currency: booking.payment_currency,
      payment_amount: booking.payment_amount,
      events: booking.events
    }));

    // Merge both results, with new bookings taking precedence for the same event
    const combinedResults: Registration[] = [...(oldRegistrations || [])].map(reg => ({
      ...reg,
      created_at: reg.created_at || new Date().toISOString(), // Ensure created_at is not undefined
      phone_number: reg.phone_number || null,
      mobile_operator: reg.mobile_operator || null,
      payment_id: reg.payment_id || null,
      payment_currency: reg.payment_currency || null,
      payment_amount: reg.payment_amount || null,
      payment_method: reg.payment_method || null
    }));
    
    // Add new bookings, avoiding duplicates by event_id
    for (const newBooking of convertedBookings) {
      const existingIndex = combinedResults.findIndex(r => r.event_id === newBooking.event_id);
      if (existingIndex >= 0) {
        combinedResults[existingIndex] = newBooking; // Replace with the newer booking
      } else {
        combinedResults.push(newBooking);
      }
    }

    return combinedResults as Registration[];
  } catch (error) {
    console.error('Error in fetchUserRegistrations:', error);
    return [];
  }
};

export const cancelRegistration = async (registrationId: string, user: User | null): Promise<boolean> => {
  if (!user) {
    toast.error("Please sign in to cancel registration");
    return false;
  }

  try {
    // Try to cancel in both tables
    // First try in the old registrations table
    const { error: oldError } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
      .eq('user_id', user.id);

    // Then try in the new event_bookings table
    const { error: newError } = await supabase
      .from('event_bookings')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
      .eq('user_id', user.id);

    // If both failed, show error
    if (oldError && newError) {
      console.error('Error cancelling registration:', oldError || newError);
      toast.error('Failed to cancel registration');
      return false;
    }

    toast.success('Registration cancelled successfully.');
    return true;
  } catch (error) {
    console.error('Error in cancelRegistration:', error);
    toast.error('An unexpected error occurred while cancelling registration.');
    return false;
  }
};

// Add function to fetch mobile operators
export const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  try {
    const { data, error } = await supabase
      .from('mobile_operators')
      .select('*');
      
    if (error) {
      console.error('Error fetching mobile operators:', error);
      return [];
    }
    
    return data as MobileOperator[];
  } catch (error) {
    console.error('Error in fetchMobileOperators:', error);
    return [];
  }
};
