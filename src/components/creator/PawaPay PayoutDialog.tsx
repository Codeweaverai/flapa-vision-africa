
import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestCreatorPayout } from '@/services/creatorPaymentService';
import { useAuth } from '@/contexts/AuthContext';

interface PawaPayPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

const MOBILE_OPERATORS = [
  { value: 'MTN_MOMO_UG', label: 'MTN Mobile Money (Uganda)', country: 'UG' },
  { value: 'AIRTEL_OAPI_UG', label: 'Airtel Money (Uganda)', country: 'UG' },
  { value: 'MTN_MOMO_ZM', label: 'MTN Mobile Money (Zambia)', country: 'ZM' },
  { value: 'AIRTEL_OAPI_ZM', label: 'Airtel Money (Zambia)', country: 'ZM' },
  { value: 'VODACOM_MPESA_TZ', label: 'Vodacom M-Pesa (Tanzania)', country: 'TZ' },
  { value: 'TIGO_TZ', label: 'Tigo Pesa (Tanzania)', country: 'TZ' },
];

const PawaPayPayoutDialog: React.FC<PawaPayPayoutDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  currency,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePayout = async () => {
    if (!user) return;

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return;
    }

    if (!phoneNumber || !selectedOperator) {
      return;
    }

    setLoading(true);
    try {
      const operator = MOBILE_OPERATORS.find(op => op.value === selectedOperator);
      if (!operator) return;

      const success = await requestCreatorPayout(user.id, {
        amount: payoutAmount,
        payout_method: 'mobile_money',
        mobile_money_details: {
          phone_number: phoneNumber,
          operator: selectedOperator,
          country: operator.country
        }
      });

      if (success) {
        onSuccess();
        onOpenChange(false);
        setAmount('');
        setPhoneNumber('');
        setSelectedOperator('');
      }
    } catch (error) {
      console.error('Mobile money payout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const payoutAmount = parseFloat(amount) || 0;
  const isValidAmount = payoutAmount >= 5 && payoutAmount <= availableBalance;
  const isValidPhone = phoneNumber.length >= 9;
  const isFormValid = isValidAmount && isValidPhone && selectedOperator;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Money Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your mobile money account via PawaPay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {currency} {availableBalance.toFixed(2)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Funds available for withdrawal (after 7-day hold period)
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency}
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12"
                min="5"
                max={availableBalance}
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operator">Mobile Money Operator</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Select your mobile money provider" />
              </SelectTrigger>
              <SelectContent>
                {MOBILE_OPERATORS.map((operator) => (
                  <SelectItem key={operator.value} value={operator.value}>
                    {operator.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +256781234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Enter your phone number with country code
            </div>
          </div>

          {payoutAmount > 0 && !isValidAmount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {payoutAmount < 5 
                  ? "Minimum withdrawal amount is $5.00"
                  : "Amount exceeds available balance"
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Minimum withdrawal: $5.00</div>
              <div>• Processing time: 5-30 minutes</div>
              <div>• Platform fee: 8% (already deducted)</div>
              <div>• Mobile money fees may apply from your operator</div>
              <div>• Ensure your mobile money account is active</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayout} 
            disabled={!isFormValid || loading}
            className="min-w-[100px]"
          >
            {loading ? "Processing..." : "Send to Mobile Money"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PawaPayPayoutDialog;
