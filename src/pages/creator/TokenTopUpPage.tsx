import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Smartphone, Zap, CheckCircle, ArrowLeft, Gift, Shield, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import ReactCountryFlag from "react-country-flag";

// ============ TYPES ============
interface PawaPayCountry {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  pawapayCode: string;
}

interface MobileMoneyOperator {
  code: string;
  name: string;
  pawapayCode: string;
}

// ============ CONSTANTS ============
const PAYMENT_POLL_INTERVAL = 5000; // 5 seconds
const PAYMENT_TIMEOUT = 300000; // 5 minutes

// PawaPay mobile money supported countries
const PAWAPAY_COUNTRIES: Record<string, PawaPayCountry> = {
  'ZMB': {
    code: 'ZMB',
    name: 'Zambia',
    flag: 'ZM',
    currency: 'ZMW',
    currencySymbol: 'ZK',
    phonePrefix: '+260',
    pawapayCode: 'ZM'
  },
  'MWI': {
    code: 'MWI',
    name: 'Malawi',
    flag: 'MW',
    currency: 'MWK',
    currencySymbol: 'MK',
    phonePrefix: '+265',
    pawapayCode: 'MW'
  },
  'NG': {
    code: 'NG',
    name: 'Nigeria',
    flag: 'NG',
    currency: 'NGN',
    currencySymbol: '₦',
    phonePrefix: '+234',
    pawapayCode: 'NG'
  },
  'KE': {
    code: 'KE',
    name: 'Kenya',
    flag: 'KE',
    currency: 'KES',
    currencySymbol: 'KSh',
    phonePrefix: '+254',
    pawapayCode: 'KE'
  },
  'GH': {
    code: 'GH',
    name: 'Ghana',
    flag: 'GH',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    phonePrefix: '+233',
    pawapayCode: 'GH'
  },
  'UG': {
    code: 'UG',
    name: 'Uganda',
    flag: 'UG',
    currency: 'UGX',
    currencySymbol: 'USh',
    phonePrefix: '+256',
    pawapayCode: 'UG'
  },
  'TZ': {
    code: 'TZ',
    name: 'Tanzania',
    flag: 'TZ',
    currency: 'TZS',
    currencySymbol: 'TSh',
    phonePrefix: '+255',
    pawapayCode: 'TZ'
  },
  'RW': {
    code: 'RW',
    name: 'Rwanda',
    flag: 'RW',
    currency: 'RWF',
    currencySymbol: 'FRw',
    phonePrefix: '+250',
    pawapayCode: 'RW'
  }
};

const MOBILE_MONEY_OPERATORS: Record<string, MobileMoneyOperator[]> = {
  'ZMB': [
    { code: 'mtn', name: 'MTN Mobile Money', pawapayCode: 'MTN' },
    { code: 'airtel', name: 'Airtel Money', pawapayCode: 'AIRTEL' }
  ],
  'MWI': [
    { code: 'airtel', name: 'Airtel Money', pawapayCode: 'AIRTEL' },
    { code: 'tnm', name: 'TNM Mpamba', pawapayCode: 'TNM' }
  ],
  'NG': [
    { code: 'mtn', name: 'MTN Nigeria', pawapayCode: 'MTN' },
    { code: 'airtel', name: 'Airtel Nigeria', pawapayCode: 'AIRTEL' }
  ],
  'KE': [
    { code: 'mpesa', name: 'M-Pesa', pawapayCode: 'MPESA' },
    { code: 'airtel', name: 'Airtel Money', pawapayCode: 'AIRTEL' }
  ],
  'GH': [
    { code: 'mtn', name: 'MTN Mobile Money', pawapayCode: 'MTN' },
    { code: 'airtel', name: 'AirtelTigo Money', pawapayCode: 'AIRTELTIGO' }
  ],
  'UG': [
    { code: 'mtn', name: 'MTN Mobile Money', pawapayCode: 'MTN' },
    { code: 'airtel', name: 'Airtel Money', pawapayCode: 'AIRTEL' }
  ],
  'TZ': [
    { code: 'vodacom', name: 'M-Pesa Tanzania', pawapayCode: 'VODACOM' },
    { code: 'airtel', name: 'Airtel Money', pawapayCode: 'AIRTEL' },
    { code: 'tigo', name: 'Tigo Pesa', pawapayCode: 'TIGO' }
  ],
  'RW': [
    { code: 'mtn', name: 'MTN Mobile Money', pawapayCode: 'MTN' },
    { code: 'airtel', name: 'Airtel Money', pawapayCode: 'AIRTEL' }
  ]
};

// ============ UTILITIES ============
const formatPhoneNumber = (phone: string, country: PawaPayCountry): string => {
  let formatted = phone.replace(/\D/g, '');
  
  // Remove country code if already included
  const prefixWithoutPlus = country.phonePrefix.replace('+', '');
  if (formatted.startsWith(prefixWithoutPlus)) {
    formatted = formatted.substring(prefixWithoutPlus.length);
  }
  
  return formatted;
};

const validatePhoneNumber = (phone: string, country: PawaPayCountry): { isValid: boolean; message?: string } => {
  const formatted = formatPhoneNumber(phone, country);
  
  if (!formatted) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  // Country-specific validation
  switch (country.code) {
    case 'KE': // Kenya: 10 digits (07XXXXXXXX)
      if (formatted.length !== 10 || !formatted.startsWith('7')) {
        return { isValid: false, message: 'Enter a valid Kenyan number (07XXXXXXXX)' };
      }
      break;
    case 'NG': // Nigeria: 10-11 digits
      if (formatted.length < 10 || formatted.length > 11) {
        return { isValid: false, message: 'Enter a valid Nigerian number (080XXXXXXXX)' };
      }
      break;
    case 'GH': // Ghana: 9 digits
      if (formatted.length !== 9) {
        return { isValid: false, message: 'Enter a valid Ghanaian number (05XXXXXXX)' };
      }
      break;
    default:
      // Default validation: 9-12 digits
      if (formatted.length < 9 || formatted.length > 12) {
        return { isValid: false, message: 'Enter a valid phone number (9-12 digits)' };
      }
  }
  
  return { isValid: true };
};

// ============ MAIN COMPONENT ============
const TokenTopUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tokenBalance, topUpConfig, calculatePrice, getAvailableTokens, refetch: refetchTokens } = useTokens();
  
  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ZMB');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [paymentPolling, setPaymentPolling] = useState<NodeJS.Timeout | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');

  const availableTokens = getAvailableTokens();
  const selectedCountryData = PAWAPAY_COUNTRIES[selectedCountry];
  const currentOperators = MOBILE_MONEY_OPERATORS[selectedCountry] || [];

  // ============ PAYMENT HANDLING ============
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

  const calculateCost = (tokens: number): number => {
    if (!topUpConfig || tokens <= 0) return 0;
    return calculatePrice(tokens);
  };

  const handleMobilePayment = async () => {
    // Validation
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error('Please select a token amount');
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    const phoneValidation = validatePhoneNumber(phoneNumber, selectedCountryData);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.message);
      return;
    }

    if (!selectedOperator) {
      toast.error('Please select a mobile money provider');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber, selectedCountryData);
      const usdAmount = calculateCost(tokenAmount);
      
      // Get selected operator data
      const operatorData = currentOperators.find(op => op.code === selectedOperator);
      if (!operatorData) {
        throw new Error('Invalid operator selected');
      }

      // Show payment initiation
      toast.loading('Initiating PawaPay mobile money payment...');

      // Call your existing token-topup-pawapay function
      const { data, error } = await supabase.functions.invoke('token-topup-pawapay', {
        body: {
          tokenAmount: tokenAmount,
          usdAmount: usdAmount,
          phone: formattedPhone,
          country: selectedCountryData.pawapayCode,
          operator: operatorData.pawapayCode,
          currency: selectedCountryData.currency,
          userId: user.id,
          userEmail: user.email,
          returnUrl: `${window.location.origin}/creator/tokens/success`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate payment');
      }

      if (data?.success) {
        toast.dismiss();
        toast.success('Payment initiated successfully!');
        
        // Store payment reference for polling
        const reference = data.deposit_id || data.transaction_id || data.reference;
        if (reference) {
          setPaymentReference(reference);
          
          // Store in sessionStorage for recovery
          const paymentSession = {
            reference: reference,
            depositId: data.deposit_id,
            transactionId: data.transaction_id,
            tokenAmount: tokenAmount,
            phone: formattedPhone,
            country: selectedCountry,
            operator: selectedOperator,
            timestamp: Date.now()
          };
          
          sessionStorage.setItem('pawapay_payment', JSON.stringify(paymentSession));
          
          // Start polling for payment status
          startPaymentPolling(reference);
        } else {
          // If no reference, redirect to success page directly
          toast.success('Payment initiated! You will receive a prompt on your phone.');
          navigate('/creator/tokens/success');
        }
      } else {
        throw new Error(data?.message || 'Invalid response from payment service');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============ POLLING FOR PAYMENT STATUS ============
  const startPaymentPolling = (reference: string) => {
    // Clear any existing polling
    if (paymentPolling) {
      clearInterval(paymentPolling);
    }

    let pollCount = 0;
    const maxPolls = 36; // 3 minutes (36 * 5 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(pollInterval);
        setPaymentPolling(null);
        toast.info('Payment verification taking longer than expected. Please check manually.');
        return;
      }

      try {
        // Use your existing check-payment-status function
        const { data } = await supabase.functions.invoke('check-payment-status', {
          body: { 
            deposit_id: reference,
            reference: reference
          }
        });

        if (data?.success) {
          switch (data.payment_status) {
            case 'completed':
              clearInterval(pollInterval);
              setPaymentPolling(null);
              
              toast.dismiss();
              toast.success(`Payment successful! ${data.transaction?.amount || tokenAmount} tokens added.`);
              
              await refetchTokens();
              sessionStorage.removeItem('pawapay_payment');
              
              // Navigate to success page
              navigate('/creator/tokens/success', {
                state: {
                  depositId: data.deposit_id,
                  transactionId: data.transaction_id,
                  tokensAdded: data.transaction?.amount || tokenAmount
                }
              });
              break;

            case 'failed':
            case 'cancelled':
            case 'declined':
              clearInterval(pollInterval);
              setPaymentPolling(null);
              
              toast.dismiss();
              toast.error(`Payment ${data.payment_status}. Please try again.`);
              sessionStorage.removeItem('pawapay_payment');
              break;

            case 'pending_authorization':
              if (!document.hidden) {
                toast.info('Please check your phone to authorize the payment...', {
                  duration: 5000,
                  id: 'authorization-prompt'
                });
              }
              break;

            // For pending status, continue polling
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, PAYMENT_POLL_INTERVAL);

    setPaymentPolling(pollInterval);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (paymentPolling === pollInterval) {
        clearInterval(pollInterval);
        setPaymentPolling(null);
        handlePaymentTimeout(reference);
      }
    }, PAYMENT_TIMEOUT);
  };

  const handlePaymentTimeout = (reference: string) => {
    setLoading(false);
    
    toast.dismiss();
    toast.warning('Payment verification timeout. Please check your payment status.', {
      action: {
        label: 'Check Now',
        onClick: () => checkPaymentStatusManually(reference)
      },
      duration: 10000
    });
  };

  const checkPaymentStatusManually = async (reference: string) => {
    try {
      toast.loading('Checking payment status...');
      const { data } = await supabase.functions.invoke('check-payment-status', {
        body: { reference: reference }
      });

      toast.dismiss();
      
      if (data?.success) {
        if (data.payment_status === 'completed') {
          toast.success('Payment completed!');
          await refetchTokens();
          sessionStorage.removeItem('pawapay_payment');
          navigate('/creator/tokens/success');
        } else {
          toast.info(`Payment status: ${data.payment_status}`);
        }
      } else {
        toast.error('Unable to verify payment status');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to check payment status');
    }
  };

  // ============ EFFECTS ============
  useEffect(() => {
    // Check for pending payments on mount
    const checkPendingPayment = async () => {
      const paymentSession = sessionStorage.getItem('pawapay_payment');
      if (paymentSession) {
        try {
          const session = JSON.parse(paymentSession);
          const timeElapsed = Date.now() - session.timestamp;
          
          if (timeElapsed < PAYMENT_TIMEOUT) {
            toast.info('Resuming pending payment...');
            setSelectedCountry(session.country);
            setSelectedOperator(session.operator);
            setPhoneNumber(session.phone);
            setTokenAmount(session.tokenAmount);
            startPaymentPolling(session.reference);
          } else {
            sessionStorage.removeItem('pawapay_payment');
          }
        } catch (error) {
          sessionStorage.removeItem('pawapay_payment');
        }
      }
    };

    checkPendingPayment();

    // Cleanup
    return () => {
      if (paymentPolling) {
        clearInterval(paymentPolling);
      }
    };
  }, []);

  useEffect(() => {
    // Reset operator when country changes
    setSelectedOperator('');
  }, [selectedCountry]);

  // ============ UI HELPERS ============
  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Delivery",
      description: "Tokens delivered immediately after successful payment"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Payments",
      description: "Powered by PawaPay's secure mobile money infrastructure"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Pan-African",
      description: "Pay with mobile money across multiple African countries"
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "Best Value",
      description: "Competitive pricing with bulk discounts available"
    }
  ];

  const gradientClass = "bg-gradient-to-r from-blue-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent";

  const usdAmount = tokenAmount ? calculateCost(tokenAmount) : 0;

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
            Purchase tokens with mobile money via PawaPay
          </p>
        </div>

        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Current Balance</h3>
                <p className="text-sm text-gray-600">Tokens available for AI features</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Coins className="h-6 w-6 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
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
              Pay with mobile money via PawaPay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                            Will be converted to {selectedCountryData.currency}
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
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[300px] max-h-[300px]">
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
                                <span className="text-xs text-gray-500">{country.phonePrefix} • {country.currency}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile Operator */}
                  <div className="space-y-2">
                    <Label htmlFor="operator">Mobile Money Provider *</Label>
                    <Select 
                      value={selectedOperator} 
                      onValueChange={setSelectedOperator}
                      disabled={!selectedCountry}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={selectedCountry ? "Select provider" : "Select country first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {currentOperators.map((operator) => (
                          <SelectItem key={operator.code} value={operator.code}>
                            <div className="flex items-center gap-2 py-1">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                              <span className="text-sm">{operator.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone Number */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">
                          {selectedCountryData?.phonePrefix || '+xxx'}
                        </span>
                      </div>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder={selectedCountryData ? `Enter your ${selectedCountryData.name} mobile number` : 'Select country first'}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!selectedCountry}
                        className="pl-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedCountryData && selectedOperator ? 
                        `Enter the mobile number registered with your ${currentOperators.find(op => op.code === selectedOperator)?.name} account` :
                        'Enter your mobile number without the country code'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment Summary */}
                {selectedCountry && selectedOperator && tokenAmount > 0 && (
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
                          <span className="text-gray-700">Provider:</span>
                          <span className="font-semibold">
                            {currentOperators.find(op => op.code === selectedOperator)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Country:</span>
                          <span className="font-semibold">{selectedCountryData?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Amount in USD:</span>
                          <span className="font-semibold">
                            ${usdAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Currency:</span>
                          <span className="font-semibold">
                            {selectedCountryData?.currency} ({selectedCountryData?.currencySymbol})
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-600">
                          💡 You'll receive a payment prompt on your phone. Please authorize the payment to complete your token purchase.
                          The exact amount in {selectedCountryData?.currency} will be shown on your phone.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={handleMobilePayment}
                  disabled={loading || !tokenAmount || tokenAmount <= 0 || 
                           !phoneNumber || !selectedOperator || !selectedCountry ||
                           paymentPolling !== null}
                  className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {paymentPolling ? 'Processing Payment...' : 'Initiating Payment...'}
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Pay with Mobile Money
                    </>
                  )}
                </Button>

                {paymentPolling && (
                  <div className="text-center text-sm text-gray-500">
                    <Loader2 className="h-3 w-3 inline mr-2 animate-spin" />
                    Waiting for payment confirmation...
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">How PawaPay Mobile Money Works</p>
                    <p className="text-sm text-blue-600 mt-1">
                      1. <strong>Initiate Payment:</strong> Enter your phone number and select provider<br />
                      2. <strong>Receive Prompt:</strong> You'll get a USSD/Push notification on your phone<br />
                      3. <strong>Authorize:</strong> Enter your PIN to authorize the payment<br />
                      4. <strong>Instant Tokens:</strong> Tokens are added immediately after confirmation<br />
                      • All payments are secure and encrypted<br />
                      • No card details required<br />
                      • Supported across Africa
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
