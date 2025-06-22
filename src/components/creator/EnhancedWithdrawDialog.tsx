
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
import { AlertCircle, DollarSign, CheckCircle, ExternalLink, Smartphone, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface ProfileData {
  stripe_connect_id?: string;
  mobile_money_operator?: string;
  mobile_money_number?: string;
  default_payout_method?: string;
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
  const [stripeConnected, setStripeConnected] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'mobile_money'>('stripe');
  const [mobileMoneyDetails, setMobileMoneyDetails] = useState<any>(null);
  const { user } = useAuth();
  const { convertPrice } = useCurrency();

  useEffect(() => {
    if (open && user) {
      checkPayoutMethods();
    }
  }, [open, user]);

  const checkPayoutMethods = async () => {
    if (!user) return;
    
    setCheckingStripe(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_id, mobile_money_operator, mobile_money_number, default_payout_method')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      const profileData = data as ProfileData;
      
      setStripeConnected(!!profileData?.stripe_connect_id);
      setMobileMoneyDetails({
        operator: profileData?.mobile_money_operator,
        number: profileData?.mobile_money_number
      });
      
      // Set default payout method
      if (profileData?.default_payout_method) {
        setPayoutMethod(profileData.default_payout_method as 'stripe' | 'mobile_money');
      } else if (profileData?.stripe_connect_id) {
        setPayoutMethod('stripe');
      } else if (profileData?.mobile_money_operator && profileData?.mobile_money_number) {
        setPayoutMethod('mobile_money');
      }
    } catch (error) {
      console.error('Error checking payout methods:', error);
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
    if (!user) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount < 5) {
      toast.error('Minimum withdrawal amount is $5.00');
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    setLoading(true);
    try {
      if (payoutMethod === 'stripe') {
        if (!stripeConnected) {
          toast.error('Please connect your Stripe account first');
          return;
        }

        // Process Stripe payout
        const { data, error } = await supabase.functions.invoke('stripe-payout', {
          body: {
            creatorId: user.id,
            amount: withdrawAmount,
            currency: 'usd'
          }
        });

        if (error) throw error;

        toast.success('Payout request submitted successfully! You will receive an email confirmation.');
      } else if (payoutMethod === 'mobile_money') {
        if (!mobileMoneyDetails?.operator || !mobileMoneyDetails?.number) {
          toast.error('Mobile money details not configured');
          return;
        }

        // Process PawaPay payout
        const { data, error } = await supabase.functions.invoke('pawapay-payout', {
          body: {
            amount: withdrawAmount,
            phone_number: mobileMoneyDetails.number,
            operator: mobileMoneyDetails.operator,
            country: 'UG', // Default to Uganda, can be made dynamic
            creator_id: user.id
          }
        });

        if (error) throw error;

        toast.success('Payout request submitted successfully! You will receive an email confirmation.');
      }

      onSuccess();
      onOpenChange(false);
      setAmount('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal. Please try again.');
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
            <span className="ml-2">Loading payout methods...</span>
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
            Request a payout from your available balance
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

          {/* Payout Method Selection */}
          <div className="space-y-3">
            <Label>Payout Method</Label>
            
            {stripeConnected && (
              <div 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  payoutMethod === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPayoutMethod('stripe')}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={payoutMethod === 'stripe'}
                    onChange={() => setPayoutMethod('stripe')}
                    className="text-blue-600"
                  />
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Stripe Connect</div>
                    <div className="text-sm text-muted-foreground">Bank transfer (2-7 business days)</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                </div>
              </div>
            )}

            {mobileMoneyDetails?.operator && mobileMoneyDetails?.number && (
              <div 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  payoutMethod === 'mobile_money' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPayoutMethod('mobile_money')}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={payoutMethod === 'mobile_money'}
                    onChange={() => setPayoutMethod('mobile_money')}
                    className="text-blue-600"
                  />
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-sm text-muted-foreground">
                      {mobileMoneyDetails.operator} - {mobileMoneyDetails.number}
                    </div>
                    <div className="text-xs text-muted-foreground">Within 24 hours</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                </div>
              </div>
            )}

            {!stripeConnected && (!mobileMoneyDetails?.operator || !mobileMoneyDetails?.number) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No payout methods configured. Please set up Stripe Connect or Mobile Money in your settings.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {(stripeConnected || (mobileMoneyDetails?.operator && mobileMoneyDetails?.number)) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                    min="5"
                    max={availableBalance}
                    step="0.01"
                  />
                </div>
                {withdrawAmount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ≈ <PriceDisplay amount={withdrawAmount} originalCurrency="USD" />
                  </div>
                )}
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
                  <div>• Processing time: {payoutMethod === 'stripe' ? '2-7 business days' : 'Within 24 hours'}</div>
                  <div>• Platform fee: 10% (already deducted)</div>
                  <div>• You'll receive an email confirmation</div>
                </div>
              </div>
            </div>
          )}

          {!stripeConnected && payoutMethod === 'stripe' && (
            <Button 
              onClick={handleConnectStripe} 
              disabled={loading}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {loading ? "Connecting..." : "Connect Stripe Account"}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {(stripeConnected || (mobileMoneyDetails?.operator && mobileMoneyDetails?.number)) && (
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

export default EnhancedWithdrawDialog;
