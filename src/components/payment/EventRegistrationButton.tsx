
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

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
      if (isFree) {
        // For free events, directly create a booking record
        const { error } = await supabase.from('event_bookings').insert({
          event_id: eventId,
          user_id: user.id,
          status: 'confirmed',
          payment_status: 'free',
        });

        if (error) throw error;

        toast.success('Successfully registered for this event!');
      } else {
        // For paid events, navigate to payment form
        navigate(`/events/${eventId}/register`, { 
          state: { 
            eventId, 
            eventName,
            price,
            currency
          } 
        });
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
