// components/payment/DirectCardPaymentDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface DirectCardPaymentDialogProps {
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
  discount: number;
  taxAmount: number;
  processingFee: number;
  promoCode?: string;
  giftCardCode?: string;
}

const DirectCardPaymentDialog: React.FC<DirectCardPaymentDialogProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  items,
  discount,
  taxAmount,
  processingFee,
  promoCode,
  giftCardCode
}) => {
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });

  const handleCardPayment = async () => {
    if (!validateCardDetails()) {
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        items: items,
        tax_amount: Math.round(taxAmount * 100),
        processing_fee: Math.round(processingFee * 100),
        discount_amount: Math.round(discount * 100),
        card: {
          number: cardDetails.number.replace(/\s/g, ''),
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          cvv: cardDetails.cvv
        },
        billing: {
          ...billingAddress,
          firstName: cardDetails.cardholderName.split(' ')[0] || '',
          lastName: cardDetails.cardholderName.split(' ').slice(1).join(' ') || ''
        },
        bearer: 'merchant' as const,
        promo_code: promoCode,
        gift_card_code: giftCardCode
      };

      const { data, error } = await supabase.functions.invoke('lenco-card-payment', {
        body: paymentData
      });

      if (error) {
        throw new Error(error.message || 'Failed to process card payment');
      }

      if (data.success) {
        if (data.requires3DS && data.redirectUrl) {
          // Redirect to 3DS authentication
          window.location.href = data.redirectUrl;
        } else {
          // Payment processed successfully without 3DS
          toast.success('Payment processed successfully!');
          onClose();
          
          // Store payment reference for verification
          if (data.reference) {
            localStorage.setItem('lastCardPaymentAttempt', JSON.stringify({
              reference: data.reference,
              orderId: data.order_id,
              timestamp: new Date().toISOString()
            }));
          }

          // Redirect to success page
          window.location.href = `/card-success?reference=${data.reference}&order_id=${data.order_id}`;
        }
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Card payment error:', error);
      toast.error(error.message || 'Failed to process card payment');
    } finally {
      setLoading(false);
    }
  };

  const validateCardDetails = (): boolean => {
    if (!cardDetails.number.trim() || cardDetails.number.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid card number');
      return false;
    }

    if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
      toast.error('Please enter card expiry date');
      return false;
    }

    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast.error('Please enter CVV');
      return false;
    }

    if (!cardDetails.cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return false;
    }

    if (!billingAddress.streetAddress.trim()) {
      toast.error('Please enter billing address');
      return false;
    }

    if (!billingAddress.city.trim()) {
      toast.error('Please enter city');
      return false;
    }

    if (!billingAddress.postalCode.trim()) {
      toast.error('Please enter postal code');
      return false;
    }

    return true;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({ ...prev, number: formatted }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Direct Card Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-slate-800">
                  <PriceDisplay amount={amount} originalCurrency={currency as any} />
                </div>
                <div className="text-sm text-slate-600">
                  Total amount to be charged
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield className="h-3 w-3 text-green-500" />
                <span>Secure payment processing</span>
              </div>
            </CardContent>
          </Card>

          {/* Card Details Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={cardDetails.cardholderName}
                onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={handleCardNumberChange}
                maxLength={19}
                className="mt-1 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    value={cardDetails.expiryMonth}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiryMonth: e.target.value.replace(/\D/g, '').substring(0, 2) }))}
                    maxLength={2}
                    className="text-center"
                  />
                  <Input
                    id="expiryYear"
                    placeholder="YY"
                    value={cardDetails.expiryYear}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiryYear: e.target.value.replace(/\D/g, '').substring(0, 2) }))}
                    maxLength={2}
                    className="text-center"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) }))}
                  maxLength={4}
                  className="mt-1 text-center font-mono"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Billing Address
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input
                    id="streetAddress"
                    placeholder="123 Main Street"
                    value={billingAddress.streetAddress}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, streetAddress: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="10001"
                      value={billingAddress.postalCode}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={billingAddress.state}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={billingAddress.country}
                      disabled
                      className="mt-1 bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 text-blue-800">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Secure Payment</div>
                <div className="text-blue-700">
                  Your card details are encrypted and processed securely. We never store your full card information.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCardPayment}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </div>

          {/* Payment Methods Badges */}
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              Visa
            </Badge>
            <Badge variant="outline" className="text-xs">
              Mastercard
            </Badge>
            <Badge variant="outline" className="text-xs">
              AMEX
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectCardPaymentDialog;
