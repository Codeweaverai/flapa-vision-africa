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
import { AlertCircle, Building, CheckCircle, Smartphone, CreditCard, Loader2, Shield, Zap, Globe, Clock, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

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
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="space-y-4 pb-2 px-6 pt-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full mx-auto mb-2">
            <Building className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            Pay with Lenco
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
            Complete your payment securely using Lenco - supports cards, bank transfers, and mobile money
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="p-6 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl shadow-lg">
              <div className="text-center">
                <p className="text-sm font-medium text-white/90 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-white">
                  <PriceDisplay amount={amount} originalCurrency={currency as any} />
                </p>
                <div className="text-xs text-white/80 mt-2">
                  {items.length} {items.length === 1 ? 'item' : 'items'} • Includes tax and discounts
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Secure</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Instant</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Globe className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-800">Multi-Method</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-800">24/7</span>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                Supported Payment Methods
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-900">Credit & Debit Cards</span>
                    <span className="text-xs text-gray-600 block">Visa, Mastercard, and more</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-900">Mobile Money</span>
                    <span className="text-xs text-gray-600 block">Multiple providers supported</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-900">Bank Transfer</span>
                    <span className="text-xs text-gray-600 block">Direct bank payments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Phone Number */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Phone Number <span className="text-gray-500 font-normal">(Optional for mobile money)</span>
              </Label>
              <div className="flex rounded-xl overflow-hidden shadow-sm border border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
                <Input
                  type="tel"
                  placeholder="+260 97 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 border-0 focus:ring-0 h-12 text-gray-900 placeholder-gray-500"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Provide your phone number if you plan to use mobile money. For card payments, this is not required.
              </p>
            </div>

            {/* Benefits Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-600" />
                Why Pay with Lenco?
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Enterprise-grade security and encryption</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Multiple payment methods in one platform</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Instant payment confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">24/7 customer support</span>
                </div>
              </div>
            </div>

            {!scriptLoaded && (
              <Alert className="bg-yellow-50 border-yellow-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Loading payment system...
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons - Fixed at bottom of scrollable area */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDirectPayment} 
                  disabled={loading || !scriptLoaded}
                  className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      Continue to Lenco
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Info */}
              <div className="text-xs text-gray-500 text-center leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span className="font-medium text-gray-700">Secure Payment</span>
                </div>
                You will be redirected to Lenco's secure payment page to complete your transaction.
                Your payment information is encrypted and protected.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LencoPaymentDialog;
