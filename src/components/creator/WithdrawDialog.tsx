
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
import { AlertCircle, DollarSign, CheckCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestCreatorPayout } from '@/services/creatorPaymentService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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
  const [stripeConnected, setStripeConnected] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      checkStripeConnection();
    }
  }, [open, user]);

  const checkStripeConnection = async () => {
    if (!user) return;
    
    setCheckingStripe(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setStripeConnected(!!data?.stripe_connect_id);
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
    } finally {
      setCheckingStripe(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to Stripe Connect setup...');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('Failed to connect to Stripe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !stripeConnected) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return;
    }

    setLoading(true);
    try {
      const success = await requestCreatorPayout(user.id, {
        amount: withdrawAmount,
        payout_method: 'stripe'
      });

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

  if (checkingStripe) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Checking Stripe connection...</span>
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
            Stripe Connect Withdrawal
          </DialogTitle>
          <DialogDescription>
            {stripeConnected 
              ? "Request a payout to your connected Stripe account"
              : "Connect your Stripe account to receive payouts"
            }
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

          {!stripeConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to connect your Stripe account before you can withdraw funds.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleConnectStripe} 
                disabled={loading}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {loading ? "Connecting..." : "Connect Stripe Account"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Stripe Account Connected</span>
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
                  <div>• Processing time: 2-7 business days</div>
                  <div>• Platform fee: 8% (already deducted)</div>
                  <div>• Funds transferred to your connected bank account</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {stripeConnected && (
            <Button 
              onClick={handleWithdraw} 
              disabled={!isValidAmount || loading}
              className="min-w-[100px]"
            >
              {loading ? "Processing..." : "Withdraw"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;
