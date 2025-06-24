
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
import { AlertCircle, DollarSign, CheckCircle, Smartphone, CreditCard } from 'lucide-react';
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
  stripe_connect_account_id?: string;
  stripe_onboarding_completed?: boolean;
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
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<'stripe' | 'mobile_money'>('stripe');
  const [convertedBalance, setConvertedBalance] = useState(0);
  const { user } = useAuth();
  const { convertPrice, currentCurrency, formatPrice } = useCurrency();

  useEffect(() => {
    if (open && user) {
      loadProfileData();
      convertAvailableBalance();
    }
  }, [open, user, currentCurrency]);

  const convertAvailableBalance = async () => {
    try {
      const converted = await convertPrice(availableBalance, 'USD');
      setConvertedBalance(converted);
    } catch (error) {
      console.error('Error converting balance:', error);
      setConvertedBalance(availableBalance);
    }
  };

  const loadProfileData = async () => {
    if (!user) return;
    
    setCheckingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id, stripe_onboarding_completed, mobile_money_operator, mobile_money_number, default_payout_method')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData(data);
        
        // Set the payout method based on what's configured
        if (data.default_payout_method) {
          setSelectedPayoutMethod(data.default_payout_method as 'stripe' | 'mobile_money');
        } else if (data.stripe_connect_account_id && data.stripe_onboarding_completed) {
          setSelectedPayoutMethod('stripe');
        } else if (data.mobile_money_operator && data.mobile_money_number) {
          setSelectedPayoutMethod('mobile_money');
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  // Define these variables before they're used
  const hasStripeSetup = profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed;
  const hasMobileMoneySetup = profileData?.mobile_money_operator && profileData?.mobile_money_number;
  const hasAnyPayoutMethod = hasStripeSetup || hasMobileMoneySetup;

  useEffect(() => {
    if (profileData) {
      if (profileData.default_payout_method === 'stripe' && hasStripeSetup) {
        setSelectedPayoutMethod('stripe');
      } else if (profileData.default_payout_method === 'mobile_money' && hasMobileMoneySetup) {
        setSelectedPayoutMethod('mobile_money');
      } else if (hasStripeSetup) {
        setSelectedPayoutMethod('stripe');
      } else if (hasMobileMoneySetup) {
        setSelectedPayoutMethod('mobile_money');
      }
    }
  }, [profileData, hasStripeSetup, hasMobileMoneySetup]);

  const handleWithdraw = async () => {
    if (!user || !profileData) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Convert minimum amount to current currency for validation
    const minAmountConverted = await convertPrice(5, 'USD');
    if (withdrawAmount < minAmountConverted) {
      toast.error(`Minimum withdrawal amount is ${formatPrice(minAmountConverted, currentCurrency)}`);
      return;
    }

    if (withdrawAmount > convertedBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    // Convert back to USD for processing
    const usdAmount = currentCurrency === 'USD' ? withdrawAmount : await convertPrice(withdrawAmount, currentCurrency);

    setLoading(true);
    try {
      if (selectedPayoutMethod === 'stripe') {
        if (!profileData.stripe_connect_account_id || !profileData.stripe_onboarding_completed) {
          toast.error('Please complete your Stripe Connect setup first');
          return;
        }

        // Process Stripe payout
        const { data, error } = await supabase.functions.invoke('stripe-payout', {
          body: {
            creatorId: user.id,
            amount: usdAmount,
            currency: 'usd'
          }
        });

        if (error) throw error;

        toast.success('Payout request submitted successfully! You will receive an email confirmation.');
      } else if (selectedPayoutMethod === 'mobile_money') {
        if (!profileData.mobile_money_operator || !profileData.mobile_money_number) {
          toast.error('Mobile money details not configured');
          return;
        }

        // Extract country code from operator (e.g., mtn_zmb -> ZMB)
        const operatorParts = profileData.mobile_money_operator.split('_');
        const countryCode = operatorParts[operatorParts.length - 1].toUpperCase();

        // Process PawaPay payout with proper currency conversion
        const { data, error } = await supabase.functions.invoke('pawapay-payout', {
          body: {
            amount: usdAmount, // Always pass USD amount to the function
            originalAmount: withdrawAmount, // Original amount in selected currency
            originalCurrency: currentCurrency, // Selected currency
            phone_number: profileData.mobile_money_number,
            operator: profileData.mobile_money_operator,
            country: countryCode,
            creator_id: user.id
          }
        });

        if (error) {
          console.error('PawaPay payout error:', error);
          throw error;
        }

        if (data?.success) {
          toast.success('Payout request submitted successfully! You will receive an email confirmation.');
        } else {
          throw new Error(data?.message || 'Payout request failed');
        }
      }

      onSuccess();
      onOpenChange(false);
      setAmount('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const withdrawAmount = parseFloat(amount) || 0;
  const isValidAmount = withdrawAmount >= 5 && withdrawAmount <= convertedBalance;

  if (checkingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading</DialogTitle>
            <DialogDescription>Loading payout methods...</DialogDescription>
          </DialogHeader>
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
                {formatPrice(convertedBalance, currentCurrency)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Funds available for withdrawal (after 7-day hold period)
            </div>
          </div>

          {/* Payout Method Selection */}
          {hasAnyPayoutMethod && (
            <div className="space-y-3">
              <Label>Payout Method</Label>
              
              {hasStripeSetup && (
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayoutMethod === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPayoutMethod('stripe')}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedPayoutMethod === 'stripe'}
                      onChange={() => setSelectedPayoutMethod('stripe')}
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

              {hasMobileMoneySetup && (
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayoutMethod === 'mobile_money' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPayoutMethod('mobile_money')}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedPayoutMethod === 'mobile_money'}
                      onChange={() => setSelectedPayoutMethod('mobile_money')}
                      className="text-blue-600"
                    />
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-sm text-muted-foreground">
                        {profileData?.mobile_money_operator} - {profileData?.mobile_money_number}
                      </div>
                      <div className="text-xs text-muted-foreground">Within 24 hours</div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasAnyPayoutMethod && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No payout methods configured. Please set up Stripe Connect or Mobile Money in your settings.
              </AlertDescription>
            </Alert>
          )}

          {hasAnyPayoutMethod && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currentCurrency === 'USD' ? '$' : currentCurrency}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-16"
                    min="5"
                    max={convertedBalance}
                    step="0.01"
                  />
                </div>
                {withdrawAmount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(withdrawAmount, currentCurrency)}
                  </div>
                )}
              </div>

              {withdrawAmount > 0 && !isValidAmount && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {withdrawAmount < 5 
                      ? `Minimum withdrawal amount is ${formatPrice(5, currentCurrency)}`
                      : "Amount exceeds available balance"
                    }
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• Minimum withdrawal: {formatPrice(5, currentCurrency)}</div>
                  <div>• Processing time: {selectedPayoutMethod === 'stripe' ? '2-7 business days' : 'Within 24 hours'}</div>
                  <div>• Platform fee: 8% (already deducted)</div>
                  <div>• You'll receive an email confirmation</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {hasAnyPayoutMethod && (
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
