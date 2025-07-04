import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { currencyService } from '@/services/currencyService';

interface PaymentButtonProps {
  courseId?: string;
  eventId?: string;
  price: number;
  title: string;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: boolean;
  currency?: string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  courseId,
  eventId,
  price,
  title,
  buttonText = "Proceed to Payment",
  variant = "default",
  className = "",
  disabled = false,
  currency = 'USD'
}) => {
  const { user } = useAuth();
  const { currentCurrency } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Early validation of price
  const validPrice = Math.max(Number(price) || 0, 0);
  if (validPrice <= 0) {
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

    // Validate price again before processing
    if (validPrice <= 0) {
      toast.error("Invalid price amount");
      return;
    }

    setLoading(true);
    try {
      console.log('[PAYMENT-BUTTON] Starting payment process for:', { 
        courseId, 
        eventId, 
        price: validPrice, 
        currency,
        currentCurrency 
      });

      // Convert price to current currency if needed
      let finalPrice = validPrice;
      let finalCurrency = currency || 'USD';

      if (currentCurrency && currentCurrency !== currency) {
        try {
          console.log('[PAYMENT-BUTTON] Converting currency from', currency, 'to', currentCurrency, 'amount:', validPrice);
          
          // Only convert if we have a valid amount > 0
          if (validPrice > 0) {
            const conversion = await currencyService.convertCurrency(validPrice, currency || 'USD', currentCurrency);
            if (conversion.convertedAmount > 0) {
              finalPrice = conversion.convertedAmount;
              finalCurrency = currentCurrency;
              
              console.log('[PAYMENT-BUTTON] Currency conversion successful:', {
                original: `${validPrice} ${currency}`,
                converted: `${finalPrice} ${finalCurrency}`
              });
            } else {
              console.warn('[PAYMENT-BUTTON] Currency conversion resulted in 0 amount, using original price');
            }
          }
        } catch (conversionError) {
          console.warn('[PAYMENT-BUTTON] Currency conversion failed, using original price:', conversionError);
          // Keep original values on conversion failure
        }
      }

      // Final validation - ensure we have a valid amount (minimum 1 cent equivalent)
      const amountToCharge = Math.max(finalPrice, 0.01);
      if (amountToCharge <= 0) {
        console.error('[PAYMENT-BUTTON] Final price is invalid:', finalPrice);
        toast.error("Invalid payment amount");
        setLoading(false);
        return;
      }

      console.log('[PAYMENT-BUTTON] Initiating payment with final price:', {
        finalPrice: amountToCharge,
        finalCurrency,
        courseId,
        eventId
      });
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          courseId,
          eventId,
          payment_method: 'stripe',
          amount: amountToCharge,
          currency: finalCurrency
        }
      });

      console.log('[PAYMENT-BUTTON] Checkout session response:', { data, error });

      if (error) {
        throw error;
      }

      if (data?.url) {
        console.log('[PAYMENT-BUTTON] Redirecting to Stripe checkout:', data.url);
        // Redirect to Stripe checkout - this should naturally redirect to our success URL after payment
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error('[PAYMENT-BUTTON] Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      toast.error(`Payment failed: ${errorMessage}`);
      setLoading(false);
    }
    // Note: We don't set loading to false here because we're redirecting away from the page
  };

  return (
    <Button 
      variant={variant} 
      onClick={handlePayment} 
      disabled={disabled || loading || validPrice <= 0} 
      className={className}
    >
      {loading ? "Processing..." : buttonText}
    </Button>
  );
};

export default PaymentButton;
