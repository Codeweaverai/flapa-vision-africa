
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: 'webinar' | 'in-person' | 'mentorship';
  start_time: string;
  end_time: string;
  location: string | null;
  online_meeting_link: string | null;
  capacity: number | null;
  price: number | null;
  currency: string | null;
  is_free: boolean | null;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended' | string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  payment_id: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
  phone_number: string | null;
  mobile_operator: string | null;
  created_at?: string;
  updated_at?: string;
  events?: {
    id: string;
    title: string;
    event_type: string;
    start_time: string;
    end_time: string;
    location: string | null;
    online_meeting_link: string | null;
  };
}

export interface MobileOperator {
  id: string;
  name: string;
  code: string;
  country: string;
}

export const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      toast.error("Failed to load events");
      return [];
    }

    return data as Event[];
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const fetchEventById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      toast.error("Failed to load event details");
      return null;
    }

    return data as Event;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return null;
  }
};

export const fetchUserRegistrations = async (user: User | null) => {
  if (!user) return [];
  
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events:event_id (
          id, 
          title, 
          event_type,
          start_time, 
          end_time,
          location,
          online_meeting_link
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user registrations:', error);
      toast.error("Failed to load your registrations");
      return [];
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const fetchMobileOperators = async (): Promise<MobileOperator[]> => {
  try {
    const { data, error } = await supabase
      .from('mobile_operators')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching mobile operators:', error);
      toast.error("Failed to load mobile operators");
      return [];
    }

    return data as MobileOperator[];
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const registerForEvent = async (event: Event, user: User | null, phoneNumber?: string, mobileOperator?: string) => {
  if (!user) {
    toast.error("Please sign in to register for events");
    return null;
  }

  try {
    // For free events
    if (event.is_free || !event.price) {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          payment_status: 'completed',
          phone_number: phoneNumber || null,
          mobile_operator: mobileOperator || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering for event:', error);
        if (error.code === '23505') {
          toast.error("You are already registered for this event");
        } else {
          toast.error("Failed to register for event");
        }
        return null;
      }

      toast.success("Registration successful!");
      return data;
    } 
    // For paid events, we'll initiate the payment flow
    else {
      // Check if phone number is provided for paid events
      if (!phoneNumber) {
        toast.error("Please provide a phone number for mobile money payment");
        return null;
      }
      
      // First create a pending registration
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          payment_amount: event.price,
          payment_currency: event.currency || 'ZMW',
          phone_number: phoneNumber,
          mobile_operator: mobileOperator || 'MTN_MOMO_ZMB'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pending registration:', error);
        if (error.code === '23505') {
          toast.error("You are already registered for this event");
        } else {
          toast.error("Failed to register for event");
        }
        return null;
      }

      // Now initiate payment process
      try {
        const description = `Registration for ${event.title}`;
        
        const response = await initiatePawaPayPayment(data.id, {
          amount: event.price,
          currency: event.currency || 'ZMW',
          description: description,
          userId: user.id,
          referenceType: 'event',
          referenceId: event.id,
          phoneNumber: phoneNumber,
          mobileOperator: mobileOperator || 'MTN_MOMO_ZMB'
        });
        
        if (response && response.redirectUrl) {
          window.location.href = response.redirectUrl;
          return data;
        } else {
          toast.error("Failed to initialize payment");
          return null;
        }
      } catch (paymentError) {
        console.error('Payment initiation error:', paymentError);
        toast.error("Payment initiation failed");
        
        // Cleanup the pending registration
        await supabase
          .from('registrations')
          .delete()
          .eq('id', data.id);
          
        return null;
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return null;
  }
};

export const cancelRegistration = async (registrationId: string, user: User | null) => {
  if (!user) return false;
  
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error cancelling registration:', error);
      toast.error("Failed to cancel registration");
      return false;
    }

    toast.success("Registration cancelled successfully");
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Helper function to initiate PawaPay payment
const initiatePawaPayPayment = async (registrationId: string, paymentDetails: {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  referenceType: 'event' | 'consultation';
  referenceId: string;
  phoneNumber?: string;
  mobileOperator?: string;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        bookingId: registrationId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        reason: paymentDetails.description,
        userId: paymentDetails.userId,
        referenceType: paymentDetails.referenceType,
        referenceId: paymentDetails.referenceId,
        phoneNumber: paymentDetails.phoneNumber,
        mobileOperator: paymentDetails.mobileOperator
      }
    });

    if (error) {
      console.error('Error invoking payment function:', error);
      throw new Error('Payment function error');
    }

    return data;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};
