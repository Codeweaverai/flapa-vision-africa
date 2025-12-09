import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Smartphone, Zap, CheckCircle, ArrowLeft, Gift, Shield, Globe, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import ReactCountryFlag from "react-country-flag";

// Currency Converter - Updated with accurate rates
class CurrencyConverter {
  static EXCHANGE_RATES = {
    USD: {
      ZMW: 22.50,  // 1 USD = 22.50 ZMW
      MWK: 1700.00, // 1 USD = 1700 MWK
      XOF: 600.00,  // 1 USD = 600 XOF (Benin, Burkina Faso, Cote d'Ivoire, Senegal)
      XAF: 600.00,  // 1 USD = 600 XAF (Cameroon, Gabon)
      KES: 150.00,  // 1 USD = 150 KES
      SLE: 22500.00, // 1 USD = 22,500 SLE (Sierra Leone)
      UGX: 3700.00, // 1 USD = 3,700 UGX
    },
    ZMW: {
      USD: 0.0444,  // 1 ZMW = 0.0444 USD
    },
    MWK: {
      USD: 0.000588, // 1 MWK = 0.000588 USD
    },
    XOF: {
      USD: 0.001667, // 1 XOF = 0.001667 USD
    },
    XAF: {
      USD: 0.001667, // 1 XAF = 0.001667 USD
    },
    KES: {
      USD: 0.006667, // 1 KES = 0.006667 USD
    },
    SLE: {
      USD: 0.000044, // 1 SLE = 0.000044 USD
    },
    UGX: {
      USD: 0.000270, // 1 UGX = 0.000270 USD
    }
  };

  static convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = this.EXCHANGE_RATES[fromCurrency]?.[toCurrency];
    if (!rate) {
      // Try reverse rate calculation
      const reverseRate = this.EXCHANGE_RATES[toCurrency]?.[fromCurrency];
      if (reverseRate) {
        return parseFloat((amount / reverseRate).toFixed(2));
      }
      throw new Error(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
    }
    
    return parseFloat((amount * rate).toFixed(2));
  }

  static usdToLocal(usdAmount: number, localCurrency: string): number {
    return this.convert(usdAmount, 'USD', localCurrency);
  }

  static localToUsd(localAmount: number, localCurrency: string): number {
    return this.convert(localAmount, localCurrency, 'USD');
  }

  static format(amount: number, currency: string, locale: string = 'en-US'): string {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      return formatter.format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency} ${amount.toFixed(2)}`;
    }
  }
}

// Phone number validation helper - Updated for PawaPay requirements
const validatePhoneNumber = (phone: string, countryCode: string): { isValid: boolean; message?: string } => {
  const phoneDigits = phone.replace(/\D/g, '');
  
  if (!phoneDigits) {
    return { isValid: false, message: 'Phone number is required' };
  }

  // PawaPay accepts phone numbers with country code
  // Just ensure it's a valid number with reasonable length
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return { isValid: false, message: 'Phone number should be between 9-15 digits including country code' };
  }

  // Ensure it starts with a valid digit (not 0 if country code is included)
  if (phoneDigits.startsWith('0')) {
    return { isValid: false, message: 'Please include country code (e.g., +260 for Zambia)' };
  }

  // Basic digit validation
  if (!/^[0-9]+$/.test(phoneDigits)) {
    return { isValid: false, message: 'Phone number should contain only digits' };
  }

  return { isValid: true };
};

// Format phone number for display (adds + sign)
const formatPhoneForDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
};

const TokenTopUpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tokenBalance, topUpConfig, calculatePrice, getAvailableTokens, refetch: refetchTokens } = useTokens();
  
  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ZMB');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });

  const availableTokens = getAvailableTokens();

  // PawaPay supported countries with providers
  const PAWAPAY_COUNTRIES = {
    'ZMB': { 
      name: 'Zambia', 
      code: 'ZMB', 
      flag: 'ZM', 
      dialCode: '+260', 
      currency: 'ZMW',
      mobileMoneyProviders: [
        'MTN Zambia',
        'Airtel Zambia'
      ]
    },
    'BEN': { 
      name: 'Benin', 
      code: 'BEN', 
      flag: 'BJ', 
      dialCode: '+229', 
      currency: 'XOF',
      mobileMoneyProviders: [
        'Moov',
        'MTN'
      ]
    },
    'BFA': { 
      name: 'Burkina Faso', 
      code: 'BFA', 
      flag: 'BF', 
      dialCode: '+226', 
      currency: 'XOF',
      mobileMoneyProviders: [
        'Moov',
        'Orange'
      ]
    },
    'CMR': { 
      name: 'Cameroon', 
      code: 'CMR', 
      flag: 'CM', 
      dialCode: '+237', 
      currency: 'XAF',
      mobileMoneyProviders: [
        'MTN'
      ]
    },
    'CIV': { 
      name: 'Cote d\'Ivoire', 
      code: 'CIV', 
      flag: 'CI', 
      dialCode: '+225', 
      currency: 'XOF',
      mobileMoneyProviders: [
        'MTN',
        'Orange'
      ]
    },
    'GAB': { 
      name: 'Gabon', 
      code: 'GAB', 
      flag: 'GA', 
      dialCode: '+241', 
      currency: 'XAF',
      mobileMoneyProviders: [
        'Airtel'
      ]
    },
    'KEN': { 
      name: 'Kenya', 
      code: 'KEN', 
      flag: 'KE', 
      dialCode: '+254', 
      currency: 'KES',
      mobileMoneyProviders: [
        'Safaricom (M-Pesa)'
      ]
    },
    'SEN': { 
      name: 'Senegal', 
      code: 'SEN', 
      flag: 'SN', 
      dialCode: '+221', 
      currency: 'XOF',
      mobileMoneyProviders: [
        'Free',
        'Orange'
      ]
    },
    'SLE': { 
      name: 'Sierra Leone', 
      code: 'SLE', 
      flag: 'SL', 
      dialCode: '+232', 
      currency: 'SLE',
      mobileMoneyProviders: [
        'Orange'
      ]
    },
    'UGA': { 
      name: 'Uganda', 
      code: 'UGA', 
      flag: 'UG', 
      dialCode: '+256', 
      currency: 'UGX',
      mobileMoneyProviders: [
        'Airtel',
        'MTN'
      ]
    }
  };

  const handlePresetSelect = (amount: number) => {
    setTokenAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setCustomAmount(numValue);
    if (numValue !== '') {
      setTokenAmount(numValue);
    }
  };

  const calculateCost = (tokens: number) => {
    if (!topUpConfig || tokens <= 0) return 0;
    return calculatePrice(tokens);
  };

  // For PawaPay, we send the phone number AS-IS (with country code)
  // The user should enter it with country code
  const formatPhoneNumberForAPI = (phone: string): string => {
    // Remove any non-digit characters and ensure it starts with country code
    let formatted = phone.replace(/\D/g, '');
    
    // If the user entered without +, ensure we have the country code
    const selectedCountryData = PAWAPAY_COUNTRIES[selectedCountry as keyof typeof PAWAPAY_COUNTRIES];
    if (selectedCountryData) {
      const countryCodeDigits = selectedCountryData.dialCode.replace('+', '');
      // If phone doesn't start with country code, add it
      if (!formatted.startsWith(countryCodeDigits)) {
        formatted = countryCodeDigits + formatted;
      }
    }
    
    return formatted;
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    const validation = validatePhoneNumber(value, selectedCountry);
    setPhoneValidation(validation);
  };

  const handlePawaPayPayment = async () => {
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error('Please select a token amount');
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.message || 'Invalid phone number');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const selectedCountryData = PAWAPAY_COUNTRIES[selectedCountry as keyof typeof PAWAPAY_COUNTRIES];
      
      if (!selectedCountryData) {
        throw new Error('Invalid country selected');
      }

      // Format phone number for PawaPay (with country code)
      const formattedPhone = formatPhoneNumberForAPI(phoneNumber);
      
      // Calculate USD amount
      const usdAmount = calculateCost(tokenAmount);
      
      // Convert to local currency (in cents for PawaPay)
      const localAmount = CurrencyConverter.usdToLocal(usdAmount, selectedCountryData.currency);
      const amountInCents = Math.round(localAmount * 100); // PawaPay expects amount in cents
      
      // Show payment initiation message
      toast.loading('Initiating PawaPay payment...');

      // Store payment attempt in localStorage for fallback
      const depositId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      const paymentAttempt = {
        depositId,
        tokenAmount,
        amountPaid: amountInCents,
        currency: selectedCountryData.currency,
        country: selectedCountry,
        phoneNumber: formattedPhone,
        timestamp: Date.now()
      };
      
      localStorage.setItem('lastPaymentAttempt', JSON.stringify(paymentAttempt));

      // Call PawaPay function
      const { data, error } = await supabase.functions.invoke('token-topup-pawapay', {
        body: {
          tokenAmount: tokenAmount,
          amountPaid: amountInCents, // Pass amount in cents
          currency: selectedCountryData.currency,
          phoneNumber: formattedPhone,
          country: selectedCountry,
          returnUrl: `${window.location.origin}/creator/tokens/success`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate payment');
      }

      if (data?.success && data.redirectUrl) {
        toast.dismiss();
        toast.success('Redirecting to payment page...');
        
        // Redirect to PawaPay payment page
        window.location.href = data.redirectUrl;
        
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
      
      // Clear localStorage on error
      localStorage.removeItem('lastPaymentAttempt');
    }
  };

  // Check for pending payments on page load
  useEffect(() => {
    const checkPendingPayments = async () => {
      const lastPayment = localStorage.getItem('lastPaymentAttempt');
      if (lastPayment) {
        const paymentData = JSON.parse(lastPayment);
        const timeSincePayment = Date.now() - paymentData.timestamp;
        
        // If payment was attempted in the last 30 minutes, show info
        if (timeSincePayment < 30 * 60 * 1000) {
          toast.info('You have a recent payment attempt. Check your payment status?', {
            action: {
              label: 'Check Status',
              onClick: () => navigate(`/creator/tokens/success?deposit_id=${paymentData.depositId}`)
            },
            duration: 10000,
          });
        } else {
          localStorage.removeItem('lastPaymentAttempt');
        }
      }
    };

    checkPendingPayments();
  }, []);

  // Update phone validation when country changes
  useEffect(() => {
    if (phoneNumber) {
      const validation = validatePhoneNumber(phoneNumber, selectedCountry);
      setPhoneValidation(validation);
    }
  }, [selectedCountry]);

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Delivery",
      description: "Tokens delivered immediately after successful payment"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Payments",
      description: "Powered by secure payment infrastructure"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Multiple Countries",
      description: "Available in 10+ African countries"
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "Best Value",
      description: "Competitive pricing with bulk discounts available"
    }
  ];

  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";

  const selectedCountryData = PAWAPAY_COUNTRIES[selectedCountry as keyof typeof PAWAPAY_COUNTRIES];
  
  const usdAmount = tokenAmount ? calculateCost(tokenAmount) : 0;
  const localAmount = selectedCountryData 
    ? CurrencyConverter.usdToLocal(usdAmount, selectedCountryData.currency)
    : 0;

  return (
    <CreatorLayout title="Top Up Tokens">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className={`rounded-full ${gradientClass} p-3 shadow-lg`}>
              <Coins className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className={`text-4xl font-bold ${gradientTextClass}`}>
            Top Up Your Tokens
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Purchase tokens with mobile money or card to unlock AI-powered course creation
          </p>
        </div>

        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Current Balance</h3>
                <p className="text-sm text-gray-600">Tokens available for AI features</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Coins className="h-6 w-6 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-600">
                    {availableTokens.paid + availableTokens.free}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {availableTokens.free > 0 && `${availableTokens.free} free + `}
                  {availableTokens.paid} paid tokens
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className={`mx-auto w-12 h-12 rounded-full ${gradientClass} flex items-center justify-center text-white mb-4 shadow-md`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Section */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
              Purchase Tokens
            </CardTitle>
            <CardDescription className="text-lg">
              Pay with mobile money across 10+ African countries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Method Tabs */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Payment Method</Label>
              <Tabs defaultValue="mobile_money" value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mobile_money" className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Money</span>
                  </TabsTrigger>
                  <TabsTrigger value="card" disabled className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Card (Coming Soon)</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="mobile_money" className="space-y-6 mt-6">
                  {/* Token Amount Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Select Token Amount</Label>
                    
                    {/* Preset Amounts */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {topUpConfig?.default_amounts?.map((amount) => (
                        <Button
                          key={amount}
                          variant={tokenAmount === amount ? "default" : "outline"}
                          onClick={() => handlePresetSelect(amount)}
                          className={`h-16 ${tokenAmount === amount ? gradientClass + ' text-white' : ''}`}
                        >
                          <div className="text-center">
                            <div className="font-semibold">{amount} tokens</div>
                            <div className="text-xs opacity-75">
                              ${calculatePrice(amount).toFixed(2)}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {/* Custom Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="customAmount">Custom Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="customAmount"
                          type="number"
                          placeholder="Enter custom token amount"
                          value={customAmount}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          min={topUpConfig?.min_amount || 10}
                          max={topUpConfig?.max_amount || 10000}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (customAmount && customAmount > 0) {
                              handlePresetSelect(customAmount);
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Min: {topUpConfig?.min_amount || 10} tokens, Max: {topUpConfig?.max_amount || 10000} tokens
                      </p>
                    </div>

                    {/* Cost Summary */}
                    {tokenAmount > 0 && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-green-800">Total Cost</div>
                              <div className="text-sm text-green-600">
                                {tokenAmount} tokens × ${(topUpConfig?.token_price || 0.01).toFixed(4)} per token
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-800">
                                ${usdAmount.toFixed(2)} USD
                              </div>
                              {selectedCountryData && (
                                <div className="text-sm text-green-600">
                                  ≈ {localAmount.toFixed(2)} {selectedCountryData.currency}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Mobile Money Payment Form */}
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Country Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="country">Country *</Label>
                          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                            <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="min-w-[300px] max-h-[400px]">
                              {Object.values(PAWAPAY_COUNTRIES).map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <div className="flex items-center gap-3 py-1">
                                    <ReactCountryFlag
                                      countryCode={country.flag}
                                      svg
                                      style={{
                                        width: '20px',
                                        height: '15px',
                                        borderRadius: '3px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      }}
                                      title={country.name}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-800 text-sm">{country.name}</span>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>{country.dialCode}</span>
                                        <span>•</span>
                                        <span>{country.currency}</span>
                                        <span>•</span>
                                        <span className="text-green-600">{country.mobileMoneyProviders.length} providers</span>
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCountryData && (
                            <div className="text-xs text-gray-500 mt-1">
                              Available providers: {selectedCountryData.mobileMoneyProviders.join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number *</Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm font-medium">
                                {selectedCountryData?.dialCode || '+xxx'}
                              </span>
                            </div>
                            <Input
                              id="phoneNumber"
                              type="tel"
                              placeholder={selectedCountryData ? `${selectedCountryData.dialCode} 96 123 4567` : 'Select country first'}
                              value={phoneNumber}
                              onChange={(e) => handlePhoneNumberChange(e.target.value)}
                              disabled={!selectedCountry}
                              className="pl-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          {!phoneValidation.isValid ? (
                            <p className="text-sm text-red-600">{phoneValidation.message}</p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Enter your phone number with country code (e.g., {selectedCountryData?.dialCode} 96 123 4567)
                            </p>
                          )}
                          {phoneNumber && phoneValidation.isValid && (
                            <div className="text-xs text-green-600">
                              ✓ Format valid: {formatPhoneForDisplay(phoneNumber)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Summary */}
                      {selectedCountry && tokenAmount > 0 && phoneValidation.isValid && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center space-x-2 text-blue-800 mb-3">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-semibold">Payment Summary</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Tokens:</span>
                                <span className="font-semibold">{tokenAmount} tokens</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Country:</span>
                                <span className="font-semibold">{selectedCountryData?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Phone Number:</span>
                                <span className="font-semibold">
                                  {formatPhoneForDisplay(phoneNumber)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Amount in USD:</span>
                                <span className="font-semibold">
                                  ${usdAmount.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Amount to pay:</span>
                                <span className="font-semibold text-green-700">
                                  {localAmount.toFixed(2)} {selectedCountryData?.currency}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Exchange rate:</span>
                                <span className="text-gray-500">
                                  1 USD = {CurrencyConverter.EXCHANGE_RATES.USD[selectedCountryData.currency] || 'N/A'} {selectedCountryData?.currency}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-xs text-blue-600">
                                💡 You'll be redirected to our secure payment page to complete your transaction.
                                Please ensure you enter the correct phone number registered with your mobile money account.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Button
                        onClick={handlePawaPayPayment}
                        disabled={loading || !tokenAmount || tokenAmount <= 0 || !phoneNumber || !phoneValidation.isValid || !selectedCountry}
                        className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Initiating Payment...
                          </>
                        ) : (
                          <>
                            <Smartphone className="h-4 w-4 mr-2" />
                            Proceed with Mobile Money
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Additional Info */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-800">Secure Payment Process</p>
                    <p className="text-sm text-orange-600 mt-1">
                      • Powered by secure payment infrastructure<br />
                      • Real-time payment verification<br />
                      • Tokens delivered instantly upon confirmation<br />
                      • Available in 10+ African countries<br />
                      • 100% secure - no sensitive data stored
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back Button */}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/creator/courses/create-with-ai')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Course Creation</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default TokenTopUpPage;
