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
import { AlertCircle, DollarSign, CheckCircle, Smartphone, CreditCard, Sparkles, Zap, Clock, Shield } from 'lucide-react';
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
    return phoneNumber.replace(/^\+/, '').trim();
  };

  // Helper function to format phone number for PawaPay API (digits only)
  const formatPhoneNumberForAPI = (phoneNumber: string | undefined) => {
    if (!phoneNumber) return '';
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
        } else {
          // Fallback: if no specific conversion is needed, use the available balance directly
          setConvertedBalance(availableBalance);
          setLocalCurrency('USD');
          setExchangeRate(1);
        }
      } catch (error) {
        console.error('Error converting balance:', error);
        // Fallback to original values
        setConvertedBalance(availableBalance);
        setLocalCurrency('USD');
        setExchangeRate(1);
      }
    };

    if (availableBalance > 0 && profileData) {
      handleCurrencyConversion();
    } else {
      // Set initial values even if balance is 0 or profile not loaded yet
      setConvertedBalance(availableBalance);
      setLocalCurrency('USD');
      setExchangeRate(1);
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
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-orange-50/30 border-0 shadow-2xl rounded-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-to-r from-orange-500 to-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading payout methods...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] bg-gradient-to-br from-white to-purple-50/20 border-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Compact Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Withdraw Funds
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Transfer from your available balance
                </DialogDescription>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg">
              <PriceDisplay 
                value={convertedBalance} 
                currency={selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Available Balance Info */}
          <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-xl border border-orange-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
                  <DollarSign className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Available Balance</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  <PriceDisplay 
                    value={convertedBalance} 
                    currency={selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency}
                  />
                </div>
                {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                  <div className="text-xs text-gray-500 mt-1">
                    USD: <PriceDisplay value={availableBalance} currency="USD" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Funds available for withdrawal (after 7-day hold period)
              {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                <div className="mt-1 text-xs text-orange-600 font-medium">
                  Exchange rate: 1 USD = {exchangeRate} {localCurrency}
                </div>
              )}
            </div>
          </div>

          {/* Payout Method Selection - Horizontal Layout */}
          {hasAnyPayoutMethod && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Payout Method
              </Label>
              
              <div className="flex gap-3">
                {hasStripeSetup && (
                  <div 
                    className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 min-w-0 ${
                      selectedPayoutMethod === 'stripe' 
                        ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-purple-50 shadow-lg' 
                        : 'border-gray-200 hover:border-orange-200 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPayoutMethod('stripe')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        selectedPayoutMethod === 'stripe' 
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600' 
                          : 'bg-gray-100'
                      }`}>
                        <CreditCard className={`h-4 w-4 ${
                          selectedPayoutMethod === 'stripe' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">Stripe Transfer</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Zap className="h-3 w-3 text-green-500" />
                          <span>Instant</span>
                        </div>
                      </div>
                      {selectedPayoutMethod === 'stripe' && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )}

                {hasMobileMoneySetup && (
                  <div 
                    className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 min-w-0 ${
                      selectedPayoutMethod === 'mobile_money' 
                        ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-purple-50 shadow-lg' 
                        : 'border-gray-200 hover:border-orange-200 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPayoutMethod('mobile_money')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        selectedPayoutMethod === 'mobile_money' 
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600' 
                          : 'bg-gray-100'
                      }`}>
                        <Smartphone className={`h-4 w-4 ${
                          selectedPayoutMethod === 'mobile_money' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">Mobile Money</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span>24 hours</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {profileData?.mobile_money_operator}
                        </div>
                      </div>
                      {selectedPayoutMethod === 'mobile_money' && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasAnyPayoutMethod && (
            <Alert className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <AlertDescription className="text-orange-800 text-sm">
                  No payout methods configured. Please set up payout methods in settings.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {hasAnyPayoutMethod && (
            <div className="space-y-4">
              {/* Amount Input Row */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                    Withdrawal Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
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
                      className="pl-12 h-12 border-2 border-orange-200/60 bg-white hover:border-orange-300 focus:border-orange-400 transition-colors rounded-xl text-lg font-semibold"
                      min={minAmount}
                      max={convertedBalance}
                      step="0.01"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleWithdraw} 
                  disabled={!isValidAmount || loading}
                  className="h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing</span>
                    </div>
                  ) : selectedPayoutMethod === 'stripe' ? "Transfer Now" : "Withdraw"}
                </Button>
              </div>

              {/* Amount Details & Validation */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  {withdrawAmount > 0 && (
                    <div className="text-gray-600 font-medium">
                      <PriceDisplay 
                        value={withdrawAmount} 
                        currency={selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency}
                      />
                      {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                        <div className="text-xs text-gray-500 mt-1">
                          USD: <PriceDisplay value={withdrawAmount / exchangeRate} currency="USD" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {withdrawAmount > 0 && !isValidAmount && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-sm">
                        {withdrawAmount < minAmount
                          ? `Minimum: ${formatPrice(minAmount, selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency)}`
                          : "Exceeds balance"
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Platform fee: 8%</span>
                  </div>
                  {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                    <div className="text-xs text-gray-500">
                      Rate: 1 USD = {exchangeRate} {localCurrency}
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-end text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{selectedPayoutMethod === 'stripe' ? 'Instant' : '24 hours'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-gray-200 bg-gray-50/50">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium rounded-xl px-6 transition-colors"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWithdrawDialog;
