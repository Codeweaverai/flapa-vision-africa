
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { createGoogleMeetEvent } from "./googleCalendarService";

export interface ConsultationBooking {
  id: string;
  user_id: string;
  booking_type: 'google_meet' | 'in_person';
  duration: number;
  scheduled_time: string;
  location: string | null;
  online_meeting_link: string | null;
  topic: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_id: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
  phone_number: string | null; // Added phone_number field, making it optional with null
}

export interface BookingFormData {
  booking_type: 'google_meet' | 'in_person';
  duration: number;
  scheduled_time: Date;
  location?: string;
  topic?: string;
  notes?: string;
  phone_number?: string;
}

export const fetchUserBookings = async (user: User | null) => {
  if (!user) return [];
  
  try {
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      toast.error("Failed to load your bookings");
      return [];
    }

    // Cast the data to the correct type since we know the structure
    return data as ConsultationBooking[];
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const fetchBookingById = async (id: string, user: User | null) => {
  if (!user) return null;
  
  try {
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      toast.error("Failed to load booking details");
      return null;
    }

    // Cast the data to the correct type
    return data as ConsultationBooking;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return null;
  }
};

export const createConsultationBooking = async (bookingData: BookingFormData, user: User | null, price: number, currency: string = 'ZMW') => {
  if (!user) {
    toast.error("Please sign in to book a consultation");
    return null;
  }

  try {
    // For Google Meet bookings, create a meeting link
    let meetingLink = null;
    if (bookingData.booking_type === 'google_meet') {
      // Get the user's profile to use their email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      const username = profileData?.full_name || user.email?.split('@')[0] || 'User';
      
      // Calculate end time
      const endTime = new Date(bookingData.scheduled_time);
      endTime.setMinutes(endTime.getMinutes() + bookingData.duration);
      
      // Create Google Meet event
      meetingLink = await createGoogleMeetEvent({
        title: `Consultation with ${username}: ${bookingData.topic || 'Business Consultation'}`,
        description: `Consultation booking: ${bookingData.topic || ''}\n\nNotes: ${bookingData.notes || ''}`,
        startTime: bookingData.scheduled_time,
        endTime: endTime,
        attendeeEmails: [user.email || '']
      });
      
      console.log("Created meeting link:", meetingLink);
    }

    // Create a new booking record
    const { data, error } = await supabase
      .from('consultation_bookings')
      .insert({
        user_id: user.id,
        booking_type: bookingData.booking_type,
        duration: bookingData.duration,
        scheduled_time: bookingData.scheduled_time.toISOString(),
        location: bookingData.location || null,
        online_meeting_link: meetingLink || null,
        topic: bookingData.topic || null,
        notes: bookingData.notes || null,
        status: 'pending',
        payment_status: 'pending',
        payment_amount: price,
        payment_currency: currency,
        phone_number: bookingData.phone_number || null // Add phone number
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      toast.error("Failed to create booking");
      return null;
    }

    // Now initiate payment process
    try {
      const response = await initiatePawaPayPayment(data.id, {
        amount: price,
        currency: currency,
        description: `Consultation booking: ${bookingData.topic || bookingData.booking_type}`,
        userId: user.id,
        referenceType: 'consultation',
        referenceId: data.id,
        phoneNumber: bookingData.phone_number // Add phone number to payment request
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
      
      // Cleanup the pending booking
      await supabase
        .from('consultation_bookings')
        .delete()
        .eq('id', data.id);
        
      return null;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return null;
  }
};

export const cancelBooking = async (bookingId: string, user: User | null) => {
  if (!user) return false;
  
  try {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error cancelling booking:', error);
      toast.error("Failed to cancel booking");
      return false;
    }

    toast.success("Booking cancelled successfully");
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Helper function to initiate PawaPay payment
const initiatePawaPayPayment = async (bookingId: string, paymentDetails: {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  referenceType: 'event' | 'consultation';
  referenceId: string;
  phoneNumber?: string;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        bookingId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        reason: paymentDetails.description,
        userId: paymentDetails.userId,
        referenceType: paymentDetails.referenceType,
        referenceId: paymentDetails.referenceId,
        phoneNumber: paymentDetails.phoneNumber
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
