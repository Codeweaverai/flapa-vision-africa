import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, CreditCard, Smartphone, Zap, CheckCircle, ArrowLeft, Gift, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';

const TokenTopUpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tokenBalance, topUpConfig, calculatePrice, calculateTokens, getAvailableTokens, refetch: refetchTokens } = useTokens();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('card');
  const [tokenAmount, setTokenAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  
  const availableTokens = getAvailableTokens();

  // Payment providers for PawaPay
  const paymentProviders = [
    { id: 'MTN_MOMO_ZMB', name: 'MTN Mobile Money Zambia', country: 'Zambia', currency: 'ZMW' },
    { id: 'AIRTEL_MONEY_ZMB', name: 'Airtel Money Zambia', country: 'Zambia', currency: 'ZMW' },
    { id: 'MPESA_KE', name: 'M-Pesa Kenya', country: 'Kenya', currency: 'KES' },
    { id: 'AIRTEL_MONEY_KE', name: 'Airtel Money Kenya', country: 'Kenya', currency: 'KES' },
    { id: 'ORANGE_MONEY_CM', name: 'Orange Money Cameroon', country: 'Cameroon', currency: 'XAF' },
    { id: 'MTN_MOMO_GH', name: 'MTN Mobile Money Ghana', country: 'Ghana', currency: 'GHS' },
    { id: 'VODAFONE_CASH_GH', name: 'Vodafone Cash Ghana', country: 'Ghana', currency: 'GHS' },
  ];

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

    if (!selectedProvider) {
      toast.error('Please select a mobile money provider');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const cost = calculateCost(tokenAmount);
      
      // Convert to cents for PawaPay (they expect amount in smallest currency unit)
      const amountInCents = Math.round(cost * 100);
      
      const { data, error } = await supabase.functions.invoke('token-topup-pawapay', {
        body: {
          tokenAmount: tokenAmount,
          amountPaid: amountInCents, // Now in cents
          currency: 'ZMW',
          phoneNumber: phoneNumber,
          country: 'ZM', // Zambia country code
          returnUrl: `${window.location.origin}/creator/tokens/success?reference=${Date.now()}&type=tokens`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to initiate mobile payment');
      }

      if (data?.success && data.redirectUrl) {
        toast.success('Redirecting to payment gateway...');
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

  // Handle successful payment return from PawaPay
  useEffect(() => {
    const checkForSuccessfulPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const reference = urlParams.get('reference');

      if (success === 'true' && reference) {
        toast.success('Payment successful! Tokens will be added to your account shortly.');
        await refetchTokens();
        navigate('/creator/courses/create-with-ai');
      }
    };

    checkForSuccessfulPayment();
  }, [navigate, refetchTokens]);

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
                          {calculateCost(tokenAmount) * 12.5} ZMW
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
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="260XXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                      <p className="text-sm text-gray-500">Format: 260 followed by your number (e.g., 260976123456)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provider">Mobile Money Provider *</Label>
                      <select
                        id="provider"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        required
                      >
                        <option value="">Select Provider</option>
                        {paymentProviders.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name} ({provider.country})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedProvider && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">
                          {paymentProviders.find(p => p.id === selectedProvider)?.name}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        You will be redirected to complete your payment. Tokens will be added automatically after successful payment.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleMobilePayment}
                    disabled={loading || !tokenAmount || tokenAmount <= 0 || !phoneNumber || !selectedProvider}
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
                        Pay {calculateCost(tokenAmount || 0) * 12.5} ZMW via Mobile Money
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

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
