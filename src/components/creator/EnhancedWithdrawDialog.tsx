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
import { AlertCircle, DollarSign, CheckCircle, Smartphone, CreditCard, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyCode } from '@/constants/currencies';

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
  const [localCurrency, setLocalCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const { user } = useAuth();
  const { convertPrice, currentCurrency, formatPrice } = useCurrency();

  // Helper function to format phone number for display (remove + prefix)
  const formatDisplayNumber = (phoneNumber: string | undefined) => {
    if (!phoneNumber) return '';
    
    // Remove any + prefix and trim whitespace
    return phoneNumber.replace(/^\+/, '').trim();
  };

  // Helper function to format phone number for PawaPay API (digits only)
  const formatPhoneNumberForAPI = (phoneNumber: string | undefined) => {
    if (!phoneNumber) return '';
    
    // Remove ALL non-digit characters: +, spaces, dashes, etc.
    return phoneNumber.replace(/\D/g, '');
  };

  useEffect(() => {
    if (open && user) {
      loadProfileData();
    }
  }, [open, user]);

  // Convert balance and determine local currency based on selected payout method
  useEffect(() => {
    const handleCurrencyConversion = async () => {
      try {
        if (selectedPayoutMethod === 'stripe') {
          // For Stripe, show balance in current display currency
          const converted = await convertPrice(availableBalance, 'USD');
          setConvertedBalance(converted);
          setLocalCurrency(currentCurrency);
          setExchangeRate(converted / availableBalance);
        } else if (selectedPayoutMethod === 'mobile_money' && profileData?.mobile_money_operator) {
          // For mobile money, determine local currency from operator
          const operatorParts = profileData.mobile_money_operator.split('_');
          const countryCode = operatorParts[operatorParts.length - 1].toUpperCase();
          
          // Map country codes to currencies
          const currencyMap: Record<string, CurrencyCode> = {
            'ZMB': 'ZMW', // Zambia
            'KEN': 'KES', // Kenya
            'UGA': 'UGX', // Uganda
            'TZA': 'TZS', // Tanzania
            'RWA': 'RWF', // Rwanda
            'GHA': 'GHS', // Ghana
            // Add more as needed
          };
          
          const targetCurrency = currencyMap[countryCode] || 'USD';
          
          // Get exchange rate for mobile money
          let localAmount = availableBalance;
          let rate = 1;
          
          if (targetCurrency !== 'USD') {
            // Simulate exchange rates (in a real app, you'd fetch from an API)
            const exchangeRates: Record<string, number> = {
              'ZMW': 23.4, // 1 USD = 23.4 ZMW
              'KES': 150.0, // 1 USD = 150 KES
              'UGX': 3700.0, // 1 USD = 3700 UGX
              'TZS': 2300.0, // 1 USD = 2300 TZS
              'RWF': 1100.0, // 1 USD = 1100 RWF
              'GHS': 12.0, // 1 USD = 12 GHS
            };
            
            rate = exchangeRates[targetCurrency] || 1;
            localAmount = availableBalance * rate;
          }
          
          setConvertedBalance(localAmount);
          setLocalCurrency(targetCurrency);
          setExchangeRate(rate);
        }
      } catch (error) {
        console.error('Error converting balance:', error);
        setConvertedBalance(availableBalance);
        setLocalCurrency('USD');
        setExchangeRate(1);
      }
    };

    if (availableBalance > 0 && profileData) {
      handleCurrencyConversion();
    }
  }, [availableBalance, selectedPayoutMethod, profileData, currentCurrency, convertPrice]);

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

    // Check minimum amount based on local currency
    const minAmountUSD = 2;
    const minAmountLocal = selectedPayoutMethod === 'mobile_money' ? 
      minAmountUSD * exchangeRate : minAmountUSD;
    
    if (withdrawAmount < minAmountLocal) {
      toast.error(`Minimum withdrawal amount is ${formatPrice(minAmountLocal, localCurrency)}`);
      return;
    }

    if (withdrawAmount > convertedBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    setLoading(true);
    try {
      if (selectedPayoutMethod === 'stripe') {
        if (!profileData.stripe_connect_account_id || !profileData.stripe_onboarding_completed) {
          toast.error('Please complete your Stripe Connect setup first');
          return;
        }

        // For Stripe, convert back to USD if needed
        const usdAmount = selectedPayoutMethod === 'stripe' && localCurrency !== 'USD' 
          ? withdrawAmount / exchangeRate 
          : withdrawAmount;

        // Process Stripe transfer
        const { data, error } = await supabase.functions.invoke('stripe-payout', {
          body: {
            creatorId: user.id,
            amount: usdAmount,
            currency: 'usd'
          }
        });

        if (error) throw error;

        toast.success('Transfer request processed successfully! You will receive an email confirmation.');
      } else if (selectedPayoutMethod === 'mobile_money') {
        if (!profileData.mobile_money_operator || !profileData.mobile_money_number) {
          toast.error('Mobile money details not configured');
          return;
        }

        // Extract country code from operator (e.g., mtn_zmb -> ZMB)
        const operatorParts = profileData.mobile_money_operator.split('_');
        const countryCode = operatorParts[operatorParts.length - 1].toUpperCase();

        // Calculate the USD equivalent to deduct from balance
        const usdAmountToDeduct = withdrawAmount / exchangeRate;

        // Format phone number for PawaPay API - DIGITS ONLY
        const formattedPhoneNumber = formatPhoneNumberForAPI(profileData.mobile_money_number);

        console.log('Mobile Money Withdrawal:', {
          withdrawAmount: withdrawAmount, // Local currency amount
          localCurrency,
          exchangeRate,
          usdAmountToDeduct, // USD amount to deduct from balance
          availableBalance,
          originalPhoneNumber: profileData.mobile_money_number,
          formattedPhoneNumber: formattedPhoneNumber
        });

        const { data, error } = await supabase.functions.invoke('pawapay-payout', {
          body: {
            amount: usdAmountToDeduct,          // USD amount to deduct from creator balance
            targetAmount: withdrawAmount,       // Local currency amount to send to user
            targetCurrency: localCurrency,      // Local currency code (e.g., ZMW, KES)
            phone_number: formattedPhoneNumber, // Use formatted digits-only number
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
          toast.success(`Payout request submitted successfully! You will receive ${formatPrice(withdrawAmount, localCurrency)} via mobile money.`);
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
  const minAmount = selectedPayoutMethod === 'stripe' ? 5 : 
    (localCurrency === 'ZMW' ? 75 : localCurrency === 'KES' ? 750 : 5); // Approximate minimums
  const isValidAmount = withdrawAmount >= minAmount && withdrawAmount <= convertedBalance;

  if (checkingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-slate-50 border-0 shadow-xl">
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-1 rounded-t-lg">
            <div className="bg-white rounded-t-lg p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                  Loading
                </DialogTitle>
                <DialogDescription>Loading payout methods...</DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-slate-50 border-0 shadow-xl p-0 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-orange-500 via-purple-500 to-purple-600 p-1">
          <div className="bg-white rounded-t-lg p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                  <DollarSign className="h-5 w-5" />
                </div>
                Withdraw Funds
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Request a transfer from your available balance
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-xl border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-600">Available Balance</span>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mt-1">
                  {selectedPayoutMethod === 'stripe' ? 
                    formatPrice(convertedBalance, currentCurrency) :
                    formatPrice(convertedBalance, localCurrency)
                  }
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-3 py-1">
                Available
              </Badge>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Funds available for withdrawal (after 7-day hold period)
              {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                <div className="mt-1 text-xs bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent font-medium">
                  USD equivalent: {formatPrice(availableBalance, 'USD')} • Rate: 1 USD = {exchangeRate} {localCurrency}
                </div>
              )}
            </div>
          </div>

          {/* Payout Method Selection - Horizontal Layout */}
          {hasAnyPayoutMethod && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Payout Method</Label>
              <div className="grid grid-cols-2 gap-3">
                {hasStripeSetup && (
                  <div 
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedPayoutMethod === 'stripe' 
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-purple-50 shadow-md scale-105' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedPayoutMethod('stripe')}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`p-2 rounded-lg ${
                        selectedPayoutMethod === 'stripe' 
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="font-medium text-sm">Stripe</div>
                      <div className="text-xs text-slate-500">Instant transfer</div>
                      {selectedPayoutMethod === 'stripe' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                )}

                {hasMobileMoneySetup && (
                  <div 
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedPayoutMethod === 'mobile_money' 
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-orange-50 shadow-md scale-105' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedPayoutMethod('mobile_money')}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`p-2 rounded-lg ${
                        selectedPayoutMethod === 'mobile_money' 
                          ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="font-medium text-sm">Mobile Money</div>
                      <div className="text-xs text-slate-500">Within 24 hours</div>
                      {selectedPayoutMethod === 'mobile_money' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Method Details */}
              {selectedPayoutMethod === 'mobile_money' && profileData?.mobile_money_number && (
                <div className="text-center text-sm text-slate-600 bg-slate-50 py-2 rounded-lg">
                  {profileData?.mobile_money_operator} • {formatDisplayNumber(profileData?.mobile_money_number)}
                </div>
              )}
            </div>
          )}

          {!hasAnyPayoutMethod && (
            <Alert className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                No payout methods configured. Please set up Stripe Connect or Mobile Money in your settings.
              </AlertDescription>
            </Alert>
          )}

          {hasAnyPayoutMethod && (
            <div className="space-y-4">
              {/* Amount Input */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-sm font-semibold text-slate-700">Withdrawal Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    {selectedPayoutMethod === 'stripe' ? 
                      (currentCurrency === 'USD' ? '$' : currentCurrency) :
                      (localCurrency === 'USD' ? '$' : localCurrency)
                    }
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-16 py-3 text-lg border-2 border-slate-200 rounded-xl focus:border-orange-500 transition-colors"
                    min={minAmount}
                    max={convertedBalance}
                    step="0.01"
                  />
                </div>
                {withdrawAmount > 0 && (
                  <div className="text-sm bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent font-medium">
                    {selectedPayoutMethod === 'stripe' ? 
                      formatPrice(withdrawAmount, currentCurrency) :
                      `${formatPrice(withdrawAmount, localCurrency)} (${formatPrice(withdrawAmount / exchangeRate, 'USD')} USD)`
                    }
                  </div>
                )}
              </div>

              {withdrawAmount > 0 && !isValidAmount && (
                <Alert className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {withdrawAmount < minAmount
                      ? `Minimum withdrawal amount is ${formatPrice(minAmount, selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency)}`
                      : "Amount exceeds available balance"
                    }
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Box */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <div className="text-sm text-blue-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Minimum withdrawal:</span>
                    <span className="font-semibold">{formatPrice(minAmount, selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Processing time:</span>
                    <span className="font-semibold">{selectedPayoutMethod === 'stripe' ? 'Instant' : 'Within 24 hours'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform fee:</span>
                    <span className="font-semibold">8% (already deducted)</span>
                  </div>
                  {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                    <div className="flex items-center justify-between">
                      <span>Exchange rate:</span>
                      <span className="font-semibold">1 USD = {exchangeRate} {localCurrency}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Horizontal Button Layout */}
        <DialogFooter className="px-6 pb-6 pt-4 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl py-2"
            >
              Cancel
            </Button>
            {hasAnyPayoutMethod && (
              <Button 
                onClick={handleWithdraw} 
                disabled={!isValidAmount || loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl py-2 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedPayoutMethod === 'stripe' ? "Transfer Now" : "Withdraw"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWithdrawDialog;
