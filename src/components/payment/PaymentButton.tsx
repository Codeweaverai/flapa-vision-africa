
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PaymentButtonProps {
  courseId?: string;
  eventId?: string;
  price: number;
  title: string;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  courseId,
  eventId,
  price,
  title,
  buttonText = "Proceed to Payment",
  variant = "default",
  className = "",
  disabled = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (price <= 0) {
    // For free items, don't show a payment button
    return null;
  }

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!courseId && !eventId) {
      toast.error("Invalid item for payment");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          courseId,
          eventId,
          payment_method: 'stripe'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handlePayment} 
      disabled={disabled || loading} 
      className={className}
    >
      {loading ? "Processing..." : buttonText}
    </Button>
  );
};

export default PaymentButton;
