
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface EventRegistrationButtonProps {
  eventId: string;
  title: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  isRegistered?: boolean;
  className?: string;
}

const EventRegistrationButton = ({
  eventId,
  title,
  isFree,
  price = 0,
  currency = 'USD',
  isRegistered = false,
  className = ''
}: EventRegistrationButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please sign in to register');
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);

    try {
      // Check if already registered
      const { data: existingRegistration, error: checkError } = await supabase
        .from('registrations')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRegistration) {
        if (existingRegistration.status === 'cancelled') {
          toast.info('Your previous registration was cancelled. Please register again.');
        } else {
          toast.info('You are already registered for this event');
          return;
        }
      }

      if (isFree) {
        // Process free registration directly
        const { error: regError } = await supabase
          .from('registrations')
          .upsert({
            user_id: user.id,
            event_id: eventId,
            status: 'confirmed',
            payment_status: 'free',
            created_at: new Date().toISOString()
          });

        if (regError) throw regError;

        toast.success('Successfully registered for event!');
      } else {
        // Process paid registration with Stripe
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
          body: {
            amount: price,
            currency: currency.toLowerCase(),
            itemName: `Event: ${title}`,
            itemId: eventId,
            itemType: 'event'
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Open Stripe checkout in a new tab
          window.open(data.url, '_blank');
        } else {
          throw new Error('Invalid response from payment service');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to process registration');
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <Button 
        variant="secondary"
        className={className}
        disabled
      >
        Registered
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleRegister} 
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {isFree ? 'Register for Free' : `Register for ${currency} ${price}`}
    </Button>
  );
};

export default EventRegistrationButton;
