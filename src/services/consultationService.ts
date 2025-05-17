import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
// Import the MobileOperator from eventService
import { MobileOperator } from './eventService';

export interface ConsultationBooking {
  id: string;
  user_id: string;
  booking_type: 'google_meet' | 'in_person';
  scheduled_time: string;
  duration: number;
  location?: string;
  topic?: string;
  notes?: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  created_at?: string;
  updated_at?: string;
  online_meeting_link?: string;
  phone_number?: string;
  mobile_operator?: string;
}

export const createConsultationBooking = async (
  bookingData: {
    booking_type: 'google_meet' | 'in_person';
    duration: number;
    scheduled_time: Date;
    location?: string;
    topic?: string;
    notes?: string;
    phone_number: string;
    mobile_operator: string;
  },
  user: User | null,
  price: number
): Promise<boolean> => {
  if (!user) {
    toast.error("Please sign in to book a consultation");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('consultation_bookings')
      .insert([
        {
          user_id: user.id,
          booking_type: bookingData.booking_type,
          scheduled_time: bookingData.scheduled_time.toISOString(),
          duration: bookingData.duration,
          location: bookingData.location,
          topic: bookingData.topic,
          notes: bookingData.notes,
          status: 'pending',
          payment_status: 'pending',
          phone_number: bookingData.phone_number,
          mobile_operator: bookingData.mobile_operator,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation booking:', error);
      toast.error('Failed to create consultation booking');
      return false;
    }

    // Initiate payment via Supabase Edge Function
    const initiatePayment = async (bookingId: string) => {
      try {
        const response = await fetch('/api/initiate-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingId,
            amount: price,
            currency: 'ZMW', // Default currency
            phone_number: bookingData.phone_number,
            mobile_operator: bookingData.mobile_operator,
          }),
        });

        const result = await response.json();

        if (response.ok && result.payment_url) {
          // Redirect user to payment URL
          window.location.href = result.payment_url;
        } else {
          console.error('Payment initiation failed:', result.error || 'Unknown error');
          toast.error('Payment initiation failed. Please try again.');
          // Optionally, update booking status to failed
          await supabase
            .from('consultation_bookings')
            .update({ status: 'failed', payment_status: 'failed' })
            .eq('id', bookingId);
        }
      } catch (err) {
        console.error('Error initiating payment:', err);
        toast.error('Error initiating payment. Please try again.');
        // Optionally, update booking status to failed
        if (data?.id) {
          await supabase
            .from('consultation_bookings')
            .update({ status: 'failed', payment_status: 'failed' })
            .eq('id', data.id);
        }
      }
    };

    await initiatePayment(data.id);

    return true;
  } catch (error) {
    console.error('Error in createConsultationBooking:', error);
    toast.error('An unexpected error occurred during booking.');
    return false;
  }
};

export const fetchUserBookings = async (user: User | null): Promise<ConsultationBooking[]> => {
  if (!user) {
    console.log('No user, returning empty bookings');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      toast.error('Failed to load bookings');
      return [];
    }

    return data as ConsultationBooking[];
  } catch (error) {
    console.error('Error in fetchUserBookings:', error);
    return [];
  }
};

export const cancelBooking = async (bookingId: string, user: User | null): Promise<boolean> => {
  if (!user) {
    toast.error("Please sign in to cancel booking");
    return false;
  }

  try {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
      return false;
    }

    toast.success('Booking cancelled successfully.');
    return true;
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    toast.error('An unexpected error occurred while cancelling booking.');
    return false;
  }
};

export const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  try {
    const { data, error } = await supabase
      .from('mobile_operators')
      .select('*');

    if (error) {
      console.error('Error fetching mobile operators:', error);
      toast.error('Failed to load mobile operators');
      return [];
    }

    return data as MobileOperator[];
  } catch (error) {
    console.error('Error in fetchMobileOperators:', error);
    return [];
  }
};
