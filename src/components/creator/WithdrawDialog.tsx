
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
import { AlertCircle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestEnhancedPayout } from '@/services/enhancedPaymentService';
import { useAuth } from '@/contexts/AuthContext';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

const WithdrawDialog: React.FC<WithdrawDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  currency,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleWithdraw = async () => {
    if (!user) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return;
    }

    setLoading(true);
    try {
      const success = await requestEnhancedPayout(user.id, withdrawAmount, currency);
      if (success) {
        onSuccess();
        onOpenChange(false);
        setAmount('');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const withdrawAmount = parseFloat(amount) || 0;
  const isValidAmount = withdrawAmount >= 5 && withdrawAmount <= availableBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription>
            Request a payout to your connected Stripe account
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

          {withdrawAmount > 0 && !isValidAmount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {withdrawAmount < 5 
                  ? "Minimum withdrawal amount is $5.00"
                  : "Amount exceeds available balance"
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Minimum withdrawal: $5.00</div>
              <div>• Funds are held for 7 days after purchase</div>
              <div>• Platform fee: 8% (already deducted)</div>
              <div>• Payouts processed to your Stripe Connect account</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleWithdraw} 
            disabled={!isValidAmount || loading}
            className="min-w-[100px]"
          >
            {loading ? "Processing..." : "Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;
