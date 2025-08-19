import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Check, X, Gift } from 'lucide-react';

interface PromoCodeInputProps {
  onPromoCodeApplied: (discount: number, promoCode: string) => void;
  onGiftCardApplied?: (giftCard: any, discount: number) => void;
  totalAmount: number;
  itemType?: 'course' | 'event';
  itemId?: string;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onPromoCodeApplied,
  onGiftCardApplied,
  totalAmount,
  itemType,
  itemId
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null);

  const validateCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code or gift card code');
      return;
    }

    setIsValidating(true);
    try {
      const code = promoCode.toUpperCase();
      
      // Check if it's a gift card (starts with GC-)
      if (code.startsWith('GC-')) {
        const { data, error } = await supabase.functions.invoke('validate-gift-card', {
          body: { giftCardCode: code, orderAmount: totalAmount }
        });

        if (error) throw error;

        if (data.success) {
          setAppliedGiftCard(data.giftCard);
          setAppliedDiscount(data.discount_amount);
          setAppliedPromoCode(code);
          
          if (onGiftCardApplied) {
            onGiftCardApplied(data.giftCard, data.discount_amount);
          } else {
            onPromoCodeApplied(data.discount_amount, code);
          }
          
          toast.success(`Gift card applied! $${data.discount_amount.toFixed(2)} discount`);
        } else {
          toast.error(data.message || 'Invalid gift card code');
        }
        return;
      }

      // Otherwise, treat as regular promo code
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error validating promo code:', error);
        toast.error('Error validating promo code');
        return;
      }

      if (!data) {
        toast.error('Invalid promo code');
        return;
      }

      // Check if promo code is valid
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;

      if (now < validFrom) {
        toast.error('Promo code is not yet valid');
        return;
      }

      if (validUntil && now > validUntil) {
        toast.error('Promo code has expired');
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error('Promo code usage limit reached');
        return;
      }

      if (totalAmount < data.min_order_amount) {
        toast.error(`Minimum order amount for this promo code is $${data.min_order_amount}`);
        return;
      }

      // Check if promo code applies to current item (if specified and promo code has restrictions)
      if (itemType && itemId && data.item_type && data.item_id) {
        if (data.item_type !== itemType || data.item_id !== itemId) {
          toast.error('This promo code does not apply to this item');
          return;
        }
      }

      // Calculate discount
      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        discountAmount = totalAmount * (data.discount_value / 100);
      } else {
        discountAmount = data.discount_value;
      }

      // Don't allow discount to exceed total amount
      discountAmount = Math.min(discountAmount, totalAmount);

      setAppliedPromoCode(code);
      setAppliedDiscount(discountAmount);
      onPromoCodeApplied(discountAmount, code);
      toast.success('Promo code applied successfully!');
    } catch (error) {
      console.error('Error validating code:', error);
      toast.error('Failed to validate code');
    } finally {
      setIsValidating(false);
    }
  };

  const removeCode = () => {
    setPromoCode('');
    setAppliedPromoCode(null);
    setAppliedDiscount(0);
    setAppliedGiftCard(null);
    onPromoCodeApplied(0, '');
    toast.success('Code removed');
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="promo-code">Promo Code / Gift Card</Label>
      {appliedPromoCode ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            {appliedGiftCard ? (
              <Gift className="h-4 w-4 text-green-600" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <span className="font-medium text-green-800">
              {appliedPromoCode} applied
            </span>
            <span className="text-sm text-green-600">
              (-${appliedDiscount.toFixed(2)})
            </span>
            {appliedGiftCard && (
              <span className="text-xs text-green-600">
                (Gift Card Balance: ${appliedGiftCard.remaining_balance.toFixed(2)})
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeCode}
            className="text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            id="promo-code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code or gift card code"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={validateCode}
            disabled={isValidating || !promoCode.trim()}
          >
            {isValidating ? 'Validating...' : 'Apply'}
          </Button>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Enter a promo code or gift card code (e.g., GC-ABC1234567)
      </p>
    </div>
  );
};

export default PromoCodeInput;
