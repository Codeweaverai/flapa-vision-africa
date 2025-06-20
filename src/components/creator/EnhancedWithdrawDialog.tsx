
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
import { AlertCircle, DollarSign, CheckCircle, ExternalLink, CreditCard, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestCreatorPayout } from '@/services/creatorPaymentService';
import { getCreatorPayoutMethod } from '@/services/creatorEarningsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EnhancedWithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

const EnhancedWithdrawDialog: React.FC<EnhancedWithdrawDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  currency,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<any>(null);
  const [checkingMethod, setCheckingMethod] = useState(true);
  const { user } = useAuth();
  const { convertPrice, currentCurrency } = useCurrency();

  useEffect(() => {
    if (open && user) {
      checkPayoutMethod();
    }
  }, [open, user]);

  const checkPayoutMethod = async () => {
    if (!user) return;
    
    setCheckingMethod(true);
    try {
      const method = await getCreatorPayoutMethod(user.id);
      setPayoutMethod(method);
    } catch (error) {
      console.error('Error checking payout method:', error);
    } finally {
      setCheckingMethod(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !payoutMethod?.has_payout_method) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return;
    }

    setLoading(true);
    try {
      let payoutRequest;
      
      if (payoutMethod.payout_method === 'stripe') {
        payoutRequest = {
          amount: withdrawAmount,
          payout_method: 'stripe' as const
        };
      } else if (payoutMethod.payout_method === 'mobile_money') {
        payoutRequest = {
          amount: withdrawAmount,
          payout_method: 'mobile_money' as const,
          mobile_money_details: payoutMethod.mobile_money_details
        };
      } else {
        toast.error('Invalid payout method');
        return;
      }

      const success = await requestCreatorPayout(user.id, payoutRequest);

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

  if (checkingMethod) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Checking payout method...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Request a payout to your connected payout method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <PriceDisplay amount={availableBalance} originalCurrency="USD" />
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Funds available for withdrawal (after 7-day hold period)
            </div>
          </div>

          {!payoutMethod?.has_payout_method ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to set up a payout method before you can withdraw funds. Please go to Payout Settings to configure your preferred method.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Payout Method Display */}
              <div className="space-y-2">
                <Label>Current Payout Method</Label>
                {payoutMethod.payout_method === 'stripe' ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-blue-800 font-medium">Stripe Connect</span>
                      <p className="text-sm text-blue-600">Bank transfers (2-7 business days)</p>
                    </div>
                  </div>
                ) : payoutMethod.payout_method === 'mobile_money' ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="text-green-800 font-medium">Mobile Money</span>
                      <p className="text-sm text-green-600">
                        {payoutMethod.mobile_money_details?.operator} • {payoutMethod.mobile_money_details?.phone_number}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currentCurrency}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-16"
                    min="5"
                    max={availableBalance}
                    step="0.01"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    <PriceDisplay amount={withdrawAmount} originalCurrency="USD" showCurrency={false} />
                  </div>
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
                  <div>• Processing time: {payoutMethod.payout_method === 'stripe' ? '2-7 business days' : 'Within 24 hours'}</div>
                  <div>• Platform fee: 8% (already deducted)</div>
                  <div>• Email confirmation will be sent</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {payoutMethod?.has_payout_method && (
            <Button 
              onClick={handleWithdraw} 
              disabled={!isValidAmount || loading}
              className="min-w-[100px]"
            >
              {loading ? "Processing..." : "Withdraw Funds"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWithdrawDialog;
