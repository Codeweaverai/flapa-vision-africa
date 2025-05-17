import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

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
  created_at?: string;
  updated_at?: string;
  phone_number?: string;
  mobile_operator?: string;
  payment_method?: string;
  payment_id?: string;
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

export const registerForEvent = async (event: Event, user: User | null, phoneNumber?: string, mobileOperator?: string): Promise<boolean> => {
  if (!user) {
    toast.error("Please sign in to register for events");
    return false;
  }

  try {
    let registrationData: any = {
      user_id: user.id,
      event_id: event.id,
      status: 'pending',
      payment_status: event.is_free ? 'confirmed' : 'pending',
    };

    if (phoneNumber && mobileOperator) {
      registrationData.phone_number = phoneNumber;
      registrationData.mobile_operator = mobileOperator;
      registrationData.payment_method = 'mobile_money';
    }

    const { data: existingRegistration, error: existingRegistrationError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .single();

    if (existingRegistrationError && existingRegistrationError.code !== '404') {
      console.error('Error checking existing registration:', existingRegistrationError);
      toast.error('Failed to check existing registration');
      return false;
    }

    if (existingRegistration) {
      toast.warn('You are already registered for this event.');
      return false;
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert([registrationData])
      .select()
      .single();

    if (error) {
      console.error('Error registering for event:', error);
      toast.error('Failed to register for event');
      return false;
    }

    if (!event.is_free && phoneNumber && mobileOperator) {
      // Initiate payment via Supabase Edge Function
      const initiatePayment = async (registrationId: string) => {
        try {
          const response = await fetch('/api/initiate-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              registrationId: registrationId,
              amount: event.price,
              currency: event.currency,
              phone_number: phoneNumber,
              mobile_operator: mobileOperator,
            }),
          });

          const result = await response.json();

          if (response.ok && result.payment_url) {
            // Redirect user to payment URL
            window.location.href = result.payment_url;
          } else {
            console.error('Payment initiation failed:', result.error || 'Unknown error');
            toast.error('Payment initiation failed. Please try again.');
            // Optionally, update registration status to failed
            await supabase
              .from('registrations')
              .update({ status: 'failed', payment_status: 'failed' })
              .eq('id', registrationId);
          }
        } catch (err) {
          console.error('Error initiating payment:', err);
          toast.error('Error initiating payment. Please try again.');
          // Optionally, update registration status to failed
          if (data?.id) {
            await supabase
              .from('registrations')
              .update({ status: 'failed', payment_status: 'failed' })
              .eq('id', data.id);
          }
        }
      };

      await initiatePayment(data.id);
    } else {
      toast.success('Successfully registered for the event!');
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
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user registrations:', error);
      toast.error('Failed to load registrations');
      return [];
    }

    return data as Registration[];
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
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error cancelling registration:', error);
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
