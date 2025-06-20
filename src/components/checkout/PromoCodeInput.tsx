
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface PromoCodeInputProps {
  onPromoCodeApplied: (discount: number, promoCode: string) => void;
  totalAmount: number;
  itemType?: 'course' | 'event';
  itemId?: string;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onPromoCodeApplied,
  totalAmount,
  itemType,
  itemId
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
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

      // Check if promo code applies to current item (if specified)
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

      setAppliedPromoCode(promoCode.toUpperCase());
      setAppliedDiscount(discountAmount);
      onPromoCodeApplied(discountAmount, promoCode.toUpperCase());
      toast.success('Promo code applied successfully!');
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedPromoCode(null);
    setAppliedDiscount(0);
    onPromoCodeApplied(0, '');
    toast.success('Promo code removed');
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="promo-code">Promo Code</Label>
      {appliedPromoCode ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">
              {appliedPromoCode} applied
            </span>
            <span className="text-sm text-green-600">
              (-${appliedDiscount.toFixed(2)})
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removePromoCode}
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
            placeholder="Enter promo code"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={validatePromoCode}
            disabled={isValidating || !promoCode.trim()}
          >
            {isValidating ? 'Validating...' : 'Apply'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;
