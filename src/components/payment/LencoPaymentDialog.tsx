import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Building, CheckCircle, Smartphone, CreditCard, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

interface LencoPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_type: string;
    item_name: string;
    quantity: number;
    price: number;
    metadata?: any;
  }>;
  discount?: number;
  taxAmount?: number;
  promoCode?: string;
  giftCardCode?: string;
}

// Load Lenco script dynamically
const loadLencoScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="lenco"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.lenco.co/js/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Lenco script'));
    document.head.appendChild(script);
  });
};

declare global {
  interface Window {
    LencoPay: {
      getPaid: (config: any) => void;
    };
  }
}

const LencoPaymentDialog: React.FC<LencoPaymentDialogProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  items,
  discount = 0,
  taxAmount = 0,
  promoCode,
  giftCardCode
}) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      loadLencoScript()
        .then(() => {
          setScriptLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load Lenco script:', error);
          toast.error('Failed to load payment system');
        });
    }
  }, [isOpen]);

  const handleLencoPayment = async () => {
    if (!user) {
      toast.error('Please log in to continue with payment');
      return;
    }

    if (!scriptLoaded || !window.LencoPay) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Prepare checkout data for Lenco
      const checkoutData: any = {
        items: items,
        currency: currency,
        customerPhone: customerPhone || undefined,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout`
      };

      // Add discount info if applicable
      if (discount > 0) {
        checkoutData.discount = discount;
      }

      if (taxAmount > 0) {
        checkoutData.taxAmount = taxAmount;
      }

      // Add promo code if applied
      if (promoCode) {
        checkoutData.promoCode = promoCode;
      }

      // Add gift card info if applied
      if (giftCardCode) {
        checkoutData.giftCardCode = giftCardCode;
      }

      // Call Lenco create checkout function
      const { data: lencoData, error } = await supabase.functions.invoke('lenco-create-checkout', {
        body: checkoutData
      });

      if (error) {
        console.error('Lenco checkout error:', error);
        throw new Error(error.message || 'Failed to create Lenco checkout');
      }

      if (!lencoData.success) {
        throw new Error(lencoData.error || 'Failed to create Lenco checkout');
      }

      // Initialize Lenco payment with the returned checkout data
      window.LencoPay.getPaid(lencoData.checkout_data);

      // Close dialog since Lenco will handle the payment flow
      onClose();

    } catch (error: any) {
      console.error('Lenco payment error:', error);
      toast.error(error.message || 'Failed to initialize Lenco payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPayment = async () => {
    await handleLencoPayment();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Pay with Lenco
          </DialogTitle>
          <DialogDescription>
            Complete your payment using Lenco - supports cards and mobile money
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {formatPrice(amount, currency as any)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} • Includes tax and discounts
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Supported Payment Methods
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <CreditCard className="h-3 w-3" />
                Credit/Debit Cards
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Smartphone className="h-3 w-3" />
                Mobile Money
              </div>
            </div>
          </div>

          {/* Optional Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">
              Phone Number (Optional for mobile money)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+260 97 123 4567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Provide your phone number if you plan to use mobile money
            </p>
          </div>

          {/* Security Info */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Your payment is secured by Lenco's advanced encryption technology
            </AlertDescription>
          </Alert>

          {!scriptLoaded && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Loading payment system...
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDirectPayment}
            disabled={loading || !scriptLoaded}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initializing Payment...
              </>
            ) : (
              <>
                <Building className="h-4 w-4 mr-2" />
                Continue to Lenco
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Payment Processing Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            You will be redirected to Lenco's secure payment page
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LencoPaymentDialog;
