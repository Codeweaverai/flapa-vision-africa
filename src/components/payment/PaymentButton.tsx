
import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PaymentButtonProps extends ButtonProps {
  itemType: 'course' | 'event';
  itemId: string;
  label?: string;
  price?: number;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  itemType,
  itemId,
  label = 'Pay Now',
  price = 0,
  disabled = false,
  variant = 'default',
  ...props
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    try {
      if (!user) {
        toast.error('Please log in to purchase');
        navigate('/auth?redirect=' + window.location.pathname);
        return;
      }

      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          itemType,
          itemId,
          userId: user.id
        }
      });
      
      if (error) {
        throw new Error(`Error creating checkout session: ${error.message}`);
      }
      
      if (!data || !data.url) {
        throw new Error('No checkout URL returned');
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Payment process error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading || price <= 0}
      variant={variant}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-current"></span>
          Processing...
        </>
      ) : (
        label
      )}
    </Button>
  );
};

export default PaymentButton;
