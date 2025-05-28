
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Event } from '@/services/eventService';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface StripePaymentFormProps {
  event: Event;
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripePaymentForm = ({ 
  event, 
  user, 
  onSuccess, 
  onCancel 
}: StripePaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStripePayment = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // Create event booking first
      const { data: booking, error: bookingError } = await supabase
        .from('event_bookings')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          payment_amount: event.price,
          payment_currency: event.currency || 'USD'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          amount: Math.round(Number(event.price) * 100), // Convert to cents
          currency: event.currency?.toLowerCase() || 'usd',
          reference_type: 'event',
          reference_id: event.id,
          booking_id: booking.id,
          success_url: `${window.location.origin}/payment-success?type=event&id=${event.id}`,
          cancel_url: `${window.location.origin}/events/${event.id}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment...');
        onSuccess();
      }
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Pay securely with your credit or debit card
        </p>
        <p className="font-semibold">
          Amount: {event.currency} {event.price}
        </p>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleStripePayment} disabled={loading}>
          {loading ? "Processing..." : "Pay with Card"}
        </Button>
      </div>
    </div>
  );
};

export default StripePaymentForm;
