
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';

interface EventRegistrationButtonProps {
  eventId: string;
  eventName: string;
  isFree: boolean;
  price: number;
  currency: string;
  isUserRegistered: boolean;
  creatorId?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const EventRegistrationButton: React.FC<EventRegistrationButtonProps> = ({
  eventId,
  eventName,
  isFree,
  price,
  currency,
  isUserRegistered,
  creatorId,
  className,
  variant = "default"
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFreeRegistration = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('event_bookings')
        .insert({
          user_id: user.id,
          event_id: eventId,
          payment_status: 'completed',
          status: 'confirmed',
          payment_amount: 0,
          payment_currency: currency
        });

      if (error) throw error;

      toast.success(`You've successfully registered for ${eventName}`);
      window.location.reload();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register for the event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaidRegistration = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          referenceType: 'event',
          referenceId: eventId,
          amount: Math.round(price * 100), // Convert to cents
          currency: currency.toLowerCase(),
          title: eventName,
          creatorId,
          successUrl: `${window.location.origin}/payment/result?type=event&id=${eventId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/events/${eventId}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isUserRegistered) {
    return (
      <Button disabled className={className} variant={variant}>
        Already Registered
      </Button>
    );
  }

  if (isFree) {
    return (
      <Button 
        onClick={handleFreeRegistration} 
        disabled={loading}
        className={className}
        variant={variant}
      >
        {loading ? "Registering..." : "Register for Free"}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handlePaidRegistration} 
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? "Processing..." : `Register - ${currency} ${price.toFixed(2)}`}
    </Button>
  );
};

export default EventRegistrationButton;
