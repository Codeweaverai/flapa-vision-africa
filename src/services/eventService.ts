
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_id: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
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

export const registerForEvent = async (event: Event, user: User | null) => {
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
      // First create a pending registration
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          payment_amount: event.price,
          payment_currency: event.currency || 'ZMW'
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
        const response = await initiatePawaPayPayment(data.id, {
          amount: event.price,
          currency: event.currency || 'ZMW',
          description: `Registration for ${event.title}`,
          userId: user.id,
          referenceType: 'event',
          referenceId: event.id
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
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        registrationId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        reason: paymentDetails.description,
        userId: paymentDetails.userId,
        referenceType: paymentDetails.referenceType,
        referenceId: paymentDetails.referenceId
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
