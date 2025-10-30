import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, CreditCard, Smartphone, Zap, CheckCircle, ArrowLeft, Gift, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import PriceDisplay from '@/components/currency/PriceDisplay';
import ReactCountryFlag from "react-country-flag";

const TokenTopUpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tokenBalance, topUpConfig, calculatePrice, calculateTokens, getAvailableTokens, refetch: refetchTokens } = useTokens();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('card');
  const [tokenAmount, setTokenAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ZMB');
  const [selectedOperator, setSelectedOperator] = useState('');
  
  const availableTokens = getAvailableTokens();

  // Country data with currencies and flags
  const PAWAPAY_COUNTRIES = {
    'ZMB': { name: 'Zambia', code: 'ZMB', flag: 'ZM', dialCode: '+260', currency: 'ZMW' },
    'KEN': { name: 'Kenya', code: 'KEN', flag: 'KE', dialCode: '+254', currency: 'KES' },
    'UGA': { name: 'Uganda', code: 'UGA', flag: 'UG', dialCode: '+256', currency: 'UGX' },
    'TZA': { name: 'Tanzania', code: 'TZA', flag: 'TZ', dialCode: '+255', currency: 'TZS' },
    'GHA': { name: 'Ghana', code: 'GHA', flag: 'GH', dialCode: '+233', currency: 'GHS' },
    'NGA': { name: 'Nigeria', code: 'NGA', flag: 'NG', dialCode: '+234', currency: 'NGN' },
    'RWA': { name: 'Rwanda', code: 'RWA', flag: 'RW', dialCode: '+250', currency: 'RWF' },
    'MWI': { name: 'Malawi', code: 'MWI', flag: 'MW', dialCode: '+265', currency: 'MWK' },
    'MOZ': { name: 'Mozambique', code: 'MOZ', flag: 'MZ', dialCode: '+258', currency: 'MZN' },
    'SEN': { name: 'Senegal', code: 'SEN', flag: 'SN', dialCode: '+221', currency: 'XOF' },
    'BEN': { name: 'Benin', code: 'BEN', flag: 'BJ', dialCode: '+229', currency: 'XOF' },
    'BFA': { name: 'Burkina Faso', code: 'BFA', flag: 'BF', dialCode: '+226', currency: 'XOF' },
    'CMR': { name: 'Cameroon', code: 'CMR', flag: 'CM', dialCode: '+237', currency: 'XAF' },
    'COG': { name: 'Congo-Brazzaville', code: 'COG', flag: 'CG', dialCode: '+242', currency: 'XAF' },
    'COD': { name: 'DRC', code: 'COD', flag: 'CD', dialCode: '+243', currency: 'CDF' },
    'GAB': { name: 'Gabon', code: 'GAB', flag: 'GA', dialCode: '+241', currency: 'XAF' },
    'CIV': { name: 'Ivory Coast', code: 'CIV', flag: 'CI', dialCode: '+225', currency: 'XOF' },
    'LSO': { name: 'Lesotho', code: 'LSO', flag: 'LS', dialCode: '+266', currency: 'LSL' },
    'SLE': { name: 'Sierra Leone', code: 'SLE', flag: 'SL', dialCode: '+232', currency: 'SLL' },
  };

  // Mobile operators by country
  const MOBILE_OPERATORS = {
    ZMB: [
      { code: 'MTN_MOMO_ZMB', name: 'MTN Mobile Money Zambia' },
      { code: 'AIRTEL_MONEY_ZMB', name: 'Airtel Money Zambia' }
    ],
    KEN: [
      { code: 'MPESA_KE', name: 'M-Pesa Kenya' },
      { code: 'AIRTEL_MONEY_KE', name: 'Airtel Money Kenya' },
      { code: 'T_KASH_KE', name: 'T-Kash Kenya' }
    ],
    UGA: [
      { code: 'MTN_MOMO_UGA', name: 'MTN Mobile Money Uganda' },
      { code: 'AIRTEL_MONEY_UGA', name: 'Airtel Money Uganda' }
    ],
    TZA: [
      { code: 'MPESA_TZA', name: 'M-Pesa Tanzania' },
      { code: 'AIRTEL_MONEY_TZA', name: 'Airtel Money Tanzania' },
      { code: 'TIGO_PESA_TZA', name: 'Tigo Pesa Tanzania' }
    ],
    GHA: [
      { code: 'MTN_MOMO_GH', name: 'MTN Mobile Money Ghana' },
      { code: 'VODAFONE_CASH_GH', name: 'Vodafone Cash Ghana' },
      { code: 'AIRTELTIGO_GH', name: 'AirtelTigo Ghana' }
    ],
    NGA: [
      { code: 'MTN_MOBILE_NGA', name: 'MTN Mobile Nigeria' },
      { code: 'AIRTEL_MONEY_NGA', name: 'Airtel Money Nigeria' },
      { code: 'GLO_MOBILE_NGA', name: 'Glo Mobile Nigeria' }
    ],
    RWA: [
      { code: 'MTN_MOMO_RWA', name: 'MTN Mobile Money Rwanda' },
      { code: 'AIRTEL_MONEY_RWA', name: 'Airtel Money Rwanda' }
    ],
    MWI: [
      { code: 'AIRTEL_MONEY_MWI', name: 'Airtel Money Malawi' },
      { code: 'TNM_MWI', name: 'TNM Mpamba Malawi' }
    ],
    MOZ: [
      { code: 'MPESA_MOZ', name: 'M-Pesa Mozambique' },
      { code: 'VODACOM_MOZ', name: 'Vodacom Mozambique' }
    ],
    SEN: [
      { code: 'ORANGE_MONEY_SEN', name: 'Orange Money Senegal' },
      { code: 'WAVE_SEN', name: 'Wave Senegal' }
    ],
    BEN: [
      { code: 'MTN_MOBILE_BEN', name: 'MTN Mobile Benin' },
      { code: 'MOOV_BEN', name: 'Moov Benin' }
    ],
    BFA: [
      { code: 'ORANGE_MONEY_BFA', name: 'Orange Money Burkina Faso' },
      { code: 'MOOV_BFA', name: 'Moov Burkina Faso' }
    ],
    CMR: [
      { code: 'MTN_MOBILE_CMR', name: 'MTN Mobile Cameroon' },
      { code: 'ORANGE_MONEY_CMR', name: 'Orange Money Cameroon' }
    ],
    COG: [
      { code: 'AIRTEL_MONEY_COG', name: 'Airtel Money Congo' },
      { code: 'MTN_MOBILE_COG', name: 'MTN Mobile Congo' }
    ],
    COD: [
      { code: 'VODACOM_MONEY_COD', name: 'Vodacom Money DRC' },
      { code: 'AIRTEL_MONEY_COD', name: 'Airtel Money DRC' }
    ],
    GAB: [
      { code: 'AIRTEL_MONEY_GAB', name: 'Airtel Money Gabon' },
      { code: 'MOOV_GAB', name: 'Moov Gabon' }
    ],
    CIV: [
      { code: 'ORANGE_MONEY_CIV', name: 'Orange Money Ivory Coast' },
      { code: 'MTN_MOBILE_CIV', name: 'MTN Mobile Ivory Coast' },
      { code: 'MOOV_CIV', name: 'Moov Ivory Coast' }
    ],
    LSO: [
      { code: 'VODACOM_MONEY_LSO', name: 'Vodacom Money Lesotho' },
      { code: 'ECONET_LSO', name: 'Econet Lesotho' }
    ],
    SLE: [
      { code: 'ORANGE_MONEY_SLE', name: 'Orange Money Sierra Leone' },
      { code: 'AIRTEL_MONEY_SLE', name: 'Airtel Money Sierra Leone' }
    ]
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

  const handleCardPayment = async () => {
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error('Please select a token amount');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const cost = calculateCost(tokenAmount);
      
      const { data, error } = await supabase.functions.invoke('token-topup-lenco', {
        body: {
          tokenAmount: tokenAmount,
          amountPaid: cost,
          currency: 'ZMW',
          successUrl: `${window.location.origin}/creator/tokens/success`,
          cancelUrl: `${window.location.origin}/creator/tokens`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (data?.success && data.checkout_data) {
        // Redirect to Lenco checkout
        // In a real implementation, you'd use Lenco's checkout.js or redirect
        toast.success('Redirecting to payment gateway...');
        console.log('Lenco checkout data:', data.checkout_data);
        
        // For now, simulate successful payment
        setTimeout(() => {
          handlePaymentSuccess(data.reference);
        }, 2000);
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error: any) {
      console.error('Error initiating card payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMobilePayment = async () => {
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error('Please select a token amount');
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter your phone number');
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
      const selectedCountryData = PAWAPAY_COUNTRIES[selectedCountry as keyof typeof PAWAPAY_COUNTRIES];
      
      if (!selectedCountryData) {
        throw new Error('Invalid country selected');
      }

      // Get the converted amount in local currency - this should match what's displayed in Payment Summary
      const convertedAmount = calculateCost(tokenAmount);
      
      // Convert to cents for PawaPay (they expect amount in smallest currency unit)
      // For most currencies, multiply by 100, but some like UGX, TZS, etc. might be different
      const amountInCents = Math.round(convertedAmount * 100);
      
      const { data, error } = await supabase.functions.invoke('token-topup-pawapay', {
        body: {
          tokenAmount: tokenAmount,
          amountPaid: amountInCents, // This should be the converted local currency amount
          currency: selectedCountryData.currency,
          phoneNumber: phoneNumber,
          country: selectedCountryData.code,
          returnUrl: `${window.location.origin}/creator/tokens/success`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate mobile payment');
      }

      if (data?.success && data.redirectUrl) {
        toast.success('Redirecting to payment gateway...');
        
        // Store transaction info for success page reference (backup)
        if (data.deposit_id) {
          localStorage.setItem('lastPaymentAttempt', JSON.stringify({
            depositId: data.deposit_id,
            transactionId: data.transaction_id,
            tokenAmount: tokenAmount,
            amountPaid: convertedAmount, // Store the actual converted amount
            currency: selectedCountryData.currency,
            timestamp: Date.now()
          }));
        }
        
        // Redirect to PawaPay payment page
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error: any) {
      console.error('Error initiating mobile payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Verify payment
      const { data, error } = await supabase.functions.invoke('token-topup-lenco', {
        body: {
          reference: reference
        }
      });

      if (error) {
        throw new Error(error.message || 'Payment verification failed');
      }

      if (data?.success) {
        toast.success(`Success! ${data.tokens_added} tokens added to your account`);
        await refetchTokens();
        navigate('/creator/courses/create-with-ai');
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error('Payment verification failed. Please contact support.');
    }
  };

  // Check for any pending payments when page loads
  useEffect(() => {
    const checkPendingPayments = async () => {
      const lastPayment = localStorage.getItem('lastPaymentAttempt');
      if (lastPayment) {
        const paymentData = JSON.parse(lastPayment);
        const timeSincePayment = Date.now() - paymentData.timestamp;
        
        // If payment was attempted in the last 30 minutes, check status
        if (timeSincePayment < 30 * 60 * 1000) {
          try {
            const { data } = await supabase.functions.invoke('check-payment-status', {
              body: { deposit_id: paymentData.depositId }
            });

            if (data?.success && data.payment_status === 'completed') {
              toast.success(`Previous payment completed! ${paymentData.tokenAmount} tokens added to your account.`);
              await refetchTokens();
              localStorage.removeItem('lastPaymentAttempt');
            } else if (data?.success && (data.payment_status === 'failed' || data.payment_status === 'cancelled')) {
              // Clear failed payment data
              localStorage.removeItem('lastPaymentAttempt');
            }
          } catch (error) {
            console.error('Error checking pending payment:', error);
          }
        } else {
          // Remove stale payment data
          localStorage.removeItem('lastPaymentAttempt');
        }
      }
    };

    checkPendingPayments();
  }, [refetchTokens]);

  // Reset operator when country changes
  useEffect(() => {
    setSelectedOperator('');
  }, [selectedCountry]);

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Access",
      description: "Tokens are added to your account immediately after payment"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Payment",
      description: "All payments are processed through secure payment gateways"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Multiple Methods",
      description: "Support for cards and mobile money across Africa"
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
  const currentOperators = MOBILE_OPERATORS[selectedCountry as keyof typeof MOBILE_OPERATORS] || [];

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
            Purchase tokens to unlock AI-powered course creation features
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
              Choose your payment method and token amount
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
                          ${calculateCost(tokenAmount).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600">
                          <PriceDisplay 
                            amount={calculateCost(tokenAmount)} 
                            originalCurrency="USD" 
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Payment Method Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="card" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Card Payment</span>
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile Money</span>
                </TabsTrigger>
              </TabsList>

              {/* Card Payment */}
              <TabsContent value="card" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Shield className="h-4 w-4" />
                    <span className="font-semibold">Secure Card Payment</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Pay with Visa, Mastercard, or local Zambian cards through our secure payment partner.
                  </p>
                </div>

                <Button
                  onClick={handleCardPayment}
                  disabled={loading || !tokenAmount || tokenAmount <= 0}
                  className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${calculateCost(tokenAmount || 0).toFixed(2)} with Card
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Mobile Money */}
              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Country Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
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
                                  <span className="text-xs text-gray-500">{country.dialCode} • {country.currency}</span>
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
                      <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                        <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentOperators.map((operator) => (
                            <SelectItem key={operator.code} value={operator.code}>
                              <div className="flex items-center gap-2 py-1">
                                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full"></div>
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
                          <span className="text-gray-500 text-sm">
                            {selectedCountryData?.dialCode}
                          </span>
                        </div>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="XXX XXX XXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Enter your mobile number without the country code
                      </p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {selectedCountry && selectedOperator && tokenAmount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-800 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">Payment Summary</span>
                      </div>
                      <div className="space-y-2 text-sm text-green-700">
                        <div className="flex justify-between">
                          <span>Tokens:</span>
                          <span className="font-semibold">{tokenAmount} tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Provider:</span>
                          <span className="font-semibold">
                            {currentOperators.find(op => op.code === selectedOperator)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Country:</span>
                          <span className="font-semibold">{selectedCountryData?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount to pay:</span>
                          <span className="font-semibold">
                            <PriceDisplay 
                              amount={calculateCost(tokenAmount)} 
                              originalCurrency="USD" 
                              targetCurrency={selectedCountryData?.currency}
                            />
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        You will be redirected to complete your payment. Tokens will be added automatically after successful payment.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleMobilePayment}
                    disabled={loading || !tokenAmount || tokenAmount <= 0 || !phoneNumber || !selectedOperator || !selectedCountry}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Initiating Payment...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Pay via Mobile Money
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Additional Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center text-blue-800">
                  <p className="font-semibold">Seamless Payment Experience</p>
                  <p className="text-sm mt-1">
                    After payment completion, you'll be automatically redirected to check your payment status. 
                    Tokens are added instantly once payment is confirmed.
                  </p>
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
