import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCreatorEarnings, requestCreatorPayout } from '@/services/creatorPaymentService';
import { currencyService } from '@/services/currencyService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { CreditCard, Smartphone, DollarSign, Clock, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { PAWAPAY_COUNTRIES } from '@/constants/pawapayCountries';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface EnhancedWithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Map country codes to names
const countryCodeToName = (code: string): string => {
  const country = PAWAPAY_COUNTRIES.find((c) => c.code === code);
  return country ? country.name : code;
};

// Map country codes to mobile operators
const countryCodeToOperators = (code: string): string[] => {
  const country = PAWAPAY_COUNTRIES.find((c) => c.code === code);
  return country ? country.operators : [];
};

const COUNTRY_CODES = {
  'ZM': '260',
  'NG': '234',
  'KE': '254',
  'GH': '233',
  'UG': '256',
  'TZ': '255',
};

const EnhancedWithdrawDialog: React.FC<EnhancedWithdrawDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'mobile_money'>('stripe');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [localCurrency, setLocalCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  const { user } = useAuth();
  const { currency } = useCurrency();

  useEffect(() => {
    const loadEarnings = async () => {
      if (!user) return;
      setLoadingEarnings(true);
      try {
        const creatorEarnings = await fetchCreatorEarnings(user.id);
        setEarnings(creatorEarnings);
      } catch (error) {
        console.error('Error loading creator earnings:', error);
        toast.error('Failed to load balance information');
      } finally {
        setLoadingEarnings(false);
      }
    };

    loadEarnings();
  }, [user]);

  useEffect(() => {
    const detectCurrency = async () => {
      const detectedCurrency = await currencyService.detectUserCurrency();
      setLocalCurrency(detectedCurrency);
    };

    detectCurrency();
  }, []);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (localCurrency === 'USD') {
        setExchangeRate(1);
        return;
      }

      try {
        const { exchangeRate } = await currencyService.convertCurrency(1, localCurrency, 'USD');
        setExchangeRate(exchangeRate);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setExchangeRate(1);
      }
    };

    fetchExchangeRate();
  }, [localCurrency]);

  const formatPhoneNumber = (phone: string, countryCode: string): string => {
    // Remove all non-digits
    let cleanNumber = phone.replace(/\D/g, '');
    
    // Remove leading zeros
    cleanNumber = cleanNumber.replace(/^0+/, '');
    
    // Get country prefix
    const prefix = COUNTRY_CODES[countryCode as keyof typeof COUNTRY_CODES];
    
    // If number doesn't start with country code, add it
    if (prefix && !cleanNumber.startsWith(prefix)) {
      cleanNumber = prefix + cleanNumber;
    }
    
    return cleanNumber;
  };

  const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
    const formattedNumber = formatPhoneNumber(phone, countryCode);
    
    // Basic validation - should be digits only and reasonable length
    return /^\d{10,15}$/.test(formattedNumber);
  };

  const handleWithdraw = async () => {
    if (!user || !earnings) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (payoutMethod === 'mobile_money') {
      if (!phoneNumber || !selectedCountry || !selectedOperator) {
        toast.error('Please fill in all mobile money details');
        return;
      }

      if (!validatePhoneNumber(phoneNumber, selectedCountry)) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }

    setIsLoading(true);

    try {
      let usdAmountToDeduct: number;
      
      if (localCurrency === 'USD') {
        usdAmountToDeduct = withdrawAmount;
      } else {
        // Convert local currency amount back to USD for balance deduction
        usdAmountToDeduct = await currencyService.convertPrice(withdrawAmount, localCurrency, 'USD');
      }

      console.log('Mobile Money Withdrawal:', {
        availableBalance: earnings.available_balance,
        withdrawAmount,
        localCurrency,
        usdAmountToDeduct,
        exchangeRate
      });

      const payoutRequest = {
        amount: usdAmountToDeduct,
        payout_method: payoutMethod,
        ...(payoutMethod === 'mobile_money' && {
          mobile_money_details: {
            phone_number: formatPhoneNumber(phoneNumber, selectedCountry),
            operator: selectedOperator,
            country: selectedCountry
          }
        })
      };

      const success = await requestCreatorPayout(user.id, payoutRequest);
      
      if (success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>

        {loadingEarnings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading balance...</span>
          </div>
        ) : earnings ? (
          <div className="space-y-6">
            {/* Balance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Balance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold text-green-600">
                      <PriceDisplay 
                        amount={earnings.available_balance} 
                        originalCurrency="USD"
                        className="text-2xl font-bold text-green-600"
                      />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-semibold text-yellow-600">
                      <PriceDisplay 
                        amount={earnings.pending_balance} 
                        originalCurrency="USD"
                        className="text-xl font-semibold text-yellow-600"
                      />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-xl font-semibold">
                      <PriceDisplay 
                        amount={earnings.total_earnings} 
                        originalCurrency="USD"
                        className="text-xl font-semibold"
                      />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Form */}
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Details</CardTitle>
                <CardDescription>
                  Choose your preferred withdrawal method and enter the amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div>
                  <Label className="text-base font-medium">Withdrawal Method</Label>
                  <RadioGroup
                    value={payoutMethod}
                    onValueChange={(value: 'stripe' | 'mobile_money') => setPayoutMethod(value)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Stripe Connect</p>
                          <p className="text-sm text-muted-foreground">Bank transfer via Stripe</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                      <RadioGroupItem value="mobile_money" id="mobile_money" />
                      <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Mobile Money</p>
                          <p className="text-sm text-muted-foreground">Direct to mobile wallet</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount">Withdrawal Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum withdrawal: $5.00
                  </p>
                </div>

                {/* Mobile Money Details */}
                {payoutMethod === 'mobile_money' && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label>Country</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAWAPAY_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCountry && (
                      <div>
                        <Label>Mobile Operator</Label>
                        <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAWAPAY_COUNTRIES.find(c => c.code === selectedCountry)?.operators.map((op) => (
                              <SelectItem key={op} value={op}>
                                {op}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter number without country code (e.g., 123456789)
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleWithdraw}
                    disabled={isLoading || !amount}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Request Withdrawal`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Unable to load balance information</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWithdrawDialog;
