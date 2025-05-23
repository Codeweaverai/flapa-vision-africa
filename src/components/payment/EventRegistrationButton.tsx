
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface EventRegistrationButtonProps {
  eventId: string;
  eventName: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  isUserRegistered?: boolean;
}

const EventRegistrationButton: React.FC<EventRegistrationButtonProps> = ({
  eventId,
  eventName,
  isFree,
  price,
  currency = 'USD',
  isUserRegistered = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegistration = async () => {
    if (!user) {
      toast.error('Please sign in to register for this event');
      navigate('/auth', { state: { from: `/events/${eventId}` } });
      return;
    }

    if (isUserRegistered) {
      toast.info('You are already registered for this event');
      return;
    }

    setIsLoading(true);

    try {
      // Generate a unique ticket number
      const ticketNumber = `TCKT-${uuidv4().substring(0, 8).toUpperCase()}`;
      
      if (isFree) {
        // For free events, directly create a booking record
        const { data, error } = await supabase.from('event_bookings').insert({
          event_id: eventId,
          user_id: user.id,
          status: 'confirmed',
          payment_status: 'free',
          ticket_number: ticketNumber
        }).select();

        if (error) throw error;

        toast.success('Successfully registered for this event!');
        
        // Navigate to the ticket page
        navigate(`/events/${eventId}/ticket/${data[0].id}`);
      } else {
        // For paid events, create a booking record with pending status
        const { data: bookingData, error: bookingError } = await supabase.from('event_bookings').insert({
          event_id: eventId,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          ticket_number: ticketNumber
        }).select();
        
        if (bookingError) throw bookingError;
        
        // Create a checkout session using the create-checkout-session Edge Function
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            eventId,
            returnUrl: `${window.location.origin}/events/${eventId}/ticket/${bookingData[0].id}`
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Open Stripe checkout in a new tab
          window.open(data.url, '_blank');
        } else {
          throw new Error("No checkout URL returned");
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register for this event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRegistration}
      disabled={isLoading || isUserRegistered}
      className="w-full"
    >
      {isLoading ? 'Processing...' : 
       isUserRegistered ? 'Already Registered' : 
       isFree ? 'Register for Free' : `Register for ${currency} ${price?.toFixed(2)}`}
    </Button>
  );
};

export default EventRegistrationButton;
