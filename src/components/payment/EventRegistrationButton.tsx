
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import EnhancedPaymentButton from './EnhancedPaymentButton';

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
  const { toast } = useToast();
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

      toast({
        title: "Registration Successful",
        description: `You've successfully registered for ${eventName}`,
      });

      window.location.reload();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register for the event. Please try again.",
        variant: "destructive"
      });
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
    <EnhancedPaymentButton
      referenceType="event"
      referenceId={eventId}
      amount={price}
      currency={currency}
      title={eventName}
      creatorId={creatorId}
      className={className}
    >
      Register - {currency} {price.toFixed(2)}
    </EnhancedPaymentButton>
  );
};

export default EventRegistrationButton;
