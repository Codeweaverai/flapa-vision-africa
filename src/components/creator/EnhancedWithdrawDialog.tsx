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
import { useCurrency } from '@/components/currency/CurrencyContext';
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
          const converted = await convertPrice(availableBalance, 'USD');
          setConvertedBalance(converted);
          setLocalCurrency(currentCurrency);
          setExchangeRate(converted / availableBalance);
        } else if (selectedPayoutMethod === 'mobile_money' && profileData?.mobile_money_operator) {
          const operatorParts = profileData.mobile_money_operator.split('_');
          const countryCode = operatorParts[operatorParts.length - 1].toUpperCase();
          
          const currencyMap: Record<string, CurrencyCode> = {
            'ZMB': 'ZMW', 'KEN': 'KES', 'UGA': 'UGX', 'TZA': 'TZS', 
            'RWA': 'RWF', 'GHA': 'GHS',
          };
          
          const targetCurrency = currencyMap[countryCode] || 'USD';
          let localAmount = availableBalance;
          let rate = 1;
          
          if (targetCurrency !== 'USD') {
            const exchangeRates: Record<string, number> = {
              'ZMW': 23.4, 'KES': 150.0, 'UGX': 3700.0, 
              'TZS': 2300.0, 'RWF': 1100.0, 'GHS': 12.0,
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

        const usdAmount = selectedPayoutMethod === 'stripe' && localCurrency !== 'USD' 
          ? withdrawAmount / exchangeRate 
          : withdrawAmount;

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

        const operatorParts = profileData.mobile_money_operator.split('_');
        const countryCode = operatorParts[operatorParts.length - 1].toUpperCase();
        const usdAmountToDeduct = withdrawAmount / exchangeRate;
        const formattedPhoneNumber = formatPhoneNumberForAPI(profileData.mobile_money_number);

        const { data, error } = await supabase.functions.invoke('pawapay-payout', {
          body: {
            amount: usdAmountToDeduct,
            targetAmount: withdrawAmount,
            targetCurrency: localCurrency,
            phone_number: formattedPhoneNumber,
            operator: profileData.mobile_money_operator,
            country: countryCode,
            creator_id: user.id
          }
        });

        if (error) throw error;
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
    (localCurrency === 'ZMW' ? 75 : localCurrency === 'KES' ? 750 : 5);
  const isValidAmount = withdrawAmount >= minAmount && withdrawAmount <= convertedBalance;

  if (checkingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-orange-50/30 border-0 shadow-2xl rounded-2xl">
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] bg-gradient-to-br from-white to-purple-50/20 border-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Compact Header */}
        <DialogHeader className="p-6 pb-3 bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Withdraw Funds
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm">
                Transfer from your available balance
              </DialogDescription>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              {selectedPayoutMethod === 'stripe' ? 
                formatPrice(convertedBalance, currentCurrency) :
                formatPrice(convertedBalance, localCurrency)
              }
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Payout Method Selection - Horizontal Compact */}
          {hasAnyPayoutMethod && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Payout Method
              </Label>
              
              <div className="flex gap-3">
                {hasStripeSetup && (
                  <div 
                    className={`flex-1 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 min-w-0 ${
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
                        <div className="font-medium text-sm truncate">Stripe Transfer</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 text-green-500" />
                          Instant
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
                    className={`flex-1 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 min-w-0 ${
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
                        <div className="font-medium text-sm truncate">Mobile Money</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 text-blue-500" />
                          24 hours
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
            <Alert className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 p-3">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                No payout methods configured. Please set up payout methods in settings.
              </AlertDescription>
            </Alert>
          )}

          {hasAnyPayoutMethod && (
            <div className="space-y-4">
              {/* Amount Input Row */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700 mb-2 block">
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
                  className="h-12 min-w-[120px] bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : selectedPayoutMethod === 'stripe' ? "Transfer" : "Withdraw"}
                </Button>
              </div>

              {/* Amount Details & Validation */}
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  {withdrawAmount > 0 && (
                    <div className="text-gray-600">
                      {selectedPayoutMethod === 'stripe' ? 
                        formatPrice(withdrawAmount, currentCurrency) :
                        `${formatPrice(withdrawAmount, localCurrency)} (${formatPrice(withdrawAmount / exchangeRate, 'USD')} USD)`
                      }
                    </div>
                  )}
                  
                  {withdrawAmount > 0 && !isValidAmount && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {withdrawAmount < minAmount
                        ? `Minimum: ${formatPrice(minAmount, selectedPayoutMethod === 'stripe' ? currentCurrency : localCurrency)}`
                        : "Exceeds balance"
                      }
                    </div>
                  )}
                </div>

                <div className="text-right text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Fee: 8%</span>
                  </div>
                  {selectedPayoutMethod === 'mobile_money' && localCurrency !== 'USD' && (
                    <div>1 USD = {exchangeRate} {localCurrency}</div>
                  )}
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
