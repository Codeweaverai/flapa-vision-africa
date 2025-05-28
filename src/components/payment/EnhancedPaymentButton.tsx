
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createStripeCheckoutSession } from '@/services/enhancedPaymentService';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

interface EnhancedPaymentButtonProps {
  referenceType: 'course' | 'event';
  referenceId: string;
  amount: number;
  currency?: string;
  title: string;
  creatorId?: string;
  className?: string;
  children?: React.ReactNode;
}

const EnhancedPaymentButton: React.FC<EnhancedPaymentButtonProps> = ({
  referenceType,
  referenceId,
  amount,
  currency = 'USD',
  title,
  creatorId,
  className,
  children
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      const checkoutUrl = await createStripeCheckoutSession(
        referenceType,
        referenceId,
        amount,
        currency,
        title,
        creatorId
      );

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (amount <= 0) {
    return null;
  }

  return (
    <Button 
      onClick={handlePayment} 
      disabled={loading} 
      className={className}
    >
      {loading ? (
        "Processing..."
      ) : children ? (
        children
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay {currency} {amount.toFixed(2)}
        </>
      )}
    </Button>
  );
};

export default EnhancedPaymentButton;
