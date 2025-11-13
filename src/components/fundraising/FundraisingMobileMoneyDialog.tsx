import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PAWAPAY_COUNTRY_CODES, PawapayCountryCode } from '@/constants/pawapayCountries';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Smartphone, AlertCircle, ArrowRight, Loader2, Shield, CheckCircle2, Zap, Lock, Globe, Clock, Heart, Gift } from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { currencyService } from '@/services/currencyService';
import ReactCountryFlag from "react-country-flag";

interface FundraisingMobileMoneyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    title: string;
    goal_amount: number;
    current_amount: number;
    currency: string;
    creator_id: string;
  };
}

interface CampaignReward {
  id: string;
  title: string;
  description: string;
  amount: number;
  delivery_estimate: string;
  stock_limit: number | null;
  claimed_count: number;
}

// Country code mapping for ReactCountryFlag (3-letter to 2-letter)
const COUNTRY_CODE_MAP: { [key: string]: string } = {
  'ZMB': 'ZM',
  'KEN': 'KE',
  'UGA': 'UG',
  'TZA': 'TZ',
  'GHA': 'GH',
  'NGA': 'NG',
  'RWA': 'RW',
  'MWI': 'MW',
  'MOZ': 'MZ',
  'SEN': 'SN',
  'BEN': 'BJ',
  'BFA': 'BF',
  'CMR': 'CM',
  'COG': 'CG',
  'COD': 'CD',
  'GAB': 'GA',
  'CIV': 'CI',
  'LSO': 'LS',
  'SLE': 'SL',
  'USA': 'US'
};

const FundraisingMobileMoneyDialog: React.FC<FundraisingMobileMoneyDialogProps> = ({
  isOpen,
  onClose,
  campaign
}) => {
  const [selectedCountry, setSelectedCountry] = useState<PawapayCountryCode>('Zambia');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedReward, setSelectedReward] = useState<string>('');
  const [rewards, setRewards] = useState<CampaignReward[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rewards when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      loadCampaignRewards();
    }
  }, [isOpen, campaign.id]);

  const loadCampaignRewards = async () => {
    try {
      setLoadingRewards(true);
      const { data, error } = await supabase
        .from('campaign_rewards')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('amount', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const getSelectedReward = () => {
    return rewards.find(reward => reward.id === selectedReward);
  };

  const getPaymentAmount = () => {
    if (selectedReward) {
      const reward = getSelectedReward();
      return reward ? reward.amount : 0;
    }
    if (customAmount) {
      const amount = parseFloat(customAmount);
      return isNaN(amount) ? 0 : amount;
    }
    return 0;
  };

  const handlePayment = async () => {
    const paymentAmount = getPaymentAmount();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (paymentAmount <= 0) {
      toast.error('Please select a reward or enter a valid amount');
      return;
    }

    // Validate minimum amount
    if (paymentAmount < 1) {
      toast.error('Minimum contribution amount is $1');
      return;
    }

    setError(null);
    
    // Remove any non-digit characters except the leading + if present
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure phone number format is correct (no + at start, country code included)
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Validate phone number format
    const countryInfo = PAWAPAY_COUNTRY_CODES[selectedCountry];
    const expectedPrefix = countryInfo.dialCode.substring(1); // Remove the +
    
    if (!formattedPhone.startsWith(expectedPrefix)) {
      toast.error(`Phone number must start with ${countryInfo.dialCode} for ${selectedCountry}`);
      return;
    }

    setLoading(true);
    
    try {
      // Convert amount to appropriate currency for the selected country
      let finalAmount = paymentAmount;
      let finalCurrency = campaign.currency;
      
      // Convert to local currency if needed
      const countryCurrencyMap: { [key: string]: string } = {
        'Zambia': 'ZMW',
        'Nigeria': 'NGN',
        'Kenya': 'KES',
        'Ghana': 'GHS',
        'Uganda': 'UGX',
        'Tanzania': 'TZS'
      };
      
      const targetCurrency = countryCurrencyMap[selectedCountry];
      if (targetCurrency && targetCurrency !== campaign.currency) {
        try {
          const conversion = await currencyService.convertCurrency(paymentAmount, campaign.currency, targetCurrency);
          finalAmount = conversion.convertedAmount;
          finalCurrency = targetCurrency;
          console.log('Currency conversion for PawaPay:', {
            original: `${paymentAmount} ${campaign.currency}`,
            converted: `${finalAmount} ${finalCurrency}`
          });
        } catch (conversionError) {
          console.warn('Currency conversion failed for PawaPay, using original amount:', conversionError);
        }
      }
      
      // Ensure final amount is valid
      if (finalAmount <= 0) {
        throw new Error('Invalid converted amount for payment');
      }

      console.log('Initiating fundraising payment with:', {
        amount: Math.round(finalAmount * 100),
        currency: finalCurrency,
        msisdn: formattedPhone,
        country: countryInfo.code,
        campaignId: campaign.id,
        rewardId: selectedReward || null,
        isAnonymous,
        message
      });

      const { data, error } = await supabase.functions.invoke('create-fundraising-pawapay-session', {
        body: {
          amount: Math.round(finalAmount * 100), // Convert to cents
          currency: finalCurrency,
          msisdn: formattedPhone,
          country: countryInfo.code,
          campaign_id: campaign.id,
          reward_id: selectedReward || null,
          is_anonymous: isAnonymous,
          message_to_creator: message || null,
          return_url: `${window.location.origin}/campaign/${campaign.id}?payment=success`
        }
      });

      console.log('PawaPay fundraising response:', { data, error });

      if (error) {
        console.error('PawaPay function error:', error);
        setError(error.message || 'Failed to initiate payment');
        toast.error('Failed to initiate mobile money payment: ' + (error.message || 'Unknown error'));
        return;
      }

      if (data?.redirectUrl) {
        console.log('Redirecting to PawaPay:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      } else {
        console.error('No redirect URL in response:', data);
        setError('No redirect URL returned from payment provider');
        toast.error('Failed to get payment link from provider');
      }
    } catch (error) {
      console.error('Error initiating PawaPay payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to initiate mobile money payment: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedCountryInfo = PAWAPAY_COUNTRY_CODES[selectedCountry];
  const paymentAmount = getPaymentAmount();

  // Helper function to get 2-letter country code for ReactCountryFlag
  const getCountryCode = (countryCode: string): string => {
    return COUNTRY_CODE_MAP[countryCode] || countryCode;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-4 pb-2 px-6 pt-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full mx-auto mb-2">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            Support This Campaign
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
            Make a difference with mobile money. Choose your contribution and help bring this project to life.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Campaign Info */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Goal: <PriceDisplay amount={campaign.goal_amount} originalCurrency="USD" /></span>
                <span>Raised: <PriceDisplay amount={campaign.current_amount} originalCurrency="USD" /></span>
              </div>
            </div>

            {/* Contribution Type Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Choose Your Contribution</Label>
              
              {/* Rewards Selection */}
              {!loadingRewards && rewards.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">Select a Reward</Label>
                  <Select value={selectedReward} onValueChange={(value) => {
                    setSelectedReward(value);
                    setCustomAmount('');
                  }}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-xl">
                      <SelectValue placeholder="Choose a reward tier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      {rewards.map((reward) => (
                        <SelectItem key={reward.id} value={reward.id} className="py-3">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{reward.title}</div>
                              <div className="text-sm text-gray-600 line-clamp-1">{reward.description}</div>
                              {reward.delivery_estimate && (
                                <div className="text-xs text-gray-500">Est. delivery: {reward.delivery_estimate}</div>
                              )}
                            </div>
                            <div className="font-bold text-orange-600 ml-4">
                              <PriceDisplay amount={reward.amount} originalCurrency="USD" />
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Amount */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Or Enter Custom Amount</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedReward('');
                    }}
                    className="pl-7 h-12 border-gray-300 rounded-xl"
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Selected Amount Display */}
              {paymentAmount > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-800 mb-1">Your Contribution</p>
                    <p className="text-2xl font-bold text-green-900">
                      <PriceDisplay amount={paymentAmount} originalCurrency="USD" />
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Anonymous Contribution */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">Contribute Anonymously</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Your name won't be shown publicly on the campaign
                </p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>

            {/* Message to Creator */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Message to Creator (Optional)
              </Label>
              <Textarea
                placeholder="Share words of encouragement or why you're supporting this campaign..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] border-gray-300 rounded-xl resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {message.length}/500 characters
              </div>
            </div>

            {/* Country Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Select Country</Label>
              <Select value={selectedCountry} onValueChange={(value: PawapayCountryCode) => setSelectedCountry(value)}>
                <SelectTrigger className="h-12 border-gray-300 rounded-xl hover:border-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors">
                  <SelectValue>
                    <span className="flex items-center gap-3">
                      <ReactCountryFlag
                        countryCode={getCountryCode(selectedCountryInfo.code)}
                        svg
                        style={{
                          width: '1.5em',
                          height: '1.5em',
                          borderRadius: '4px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                        title={selectedCountry}
                      />
                      <span className="font-medium text-gray-900">{selectedCountry}</span>
                      <span className="text-gray-500">{selectedCountryInfo.dialCode}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-0 shadow-lg min-w-[320px]">
                  {Object.entries(PAWAPAY_COUNTRY_CODES).map(([country, info]) => (
                    <SelectItem 
                      key={country} 
                      value={country}
                      className="rounded-lg focus:bg-orange-50/50"
                    >
                      <span className="flex items-center gap-3 py-1">
                        <ReactCountryFlag
                          countryCode={getCountryCode(info.code)}
                          svg
                          style={{
                            width: '1.5em',
                            height: '1.5em',
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                          title={country}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">{country}</span>
                          <span className="text-xs text-gray-500">{info.dialCode}</span>
                        </div>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
              <div className="flex rounded-xl overflow-hidden shadow-sm border border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
                <div className="flex items-center px-4 bg-gray-50 border-r border-gray-300">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <ReactCountryFlag
                      countryCode={getCountryCode(selectedCountryInfo.code)}
                      svg
                      style={{
                        width: '1.2em',
                        height: '1.2em',
                        borderRadius: '3px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                      title={selectedCountry}
                    />
                    {selectedCountryInfo.dialCode}
                  </span>
                </div>
                <Input
                  placeholder="Enter your mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 border-0 focus:ring-0 rounded-l-none h-12 text-gray-900 placeholder-gray-500"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter your number without the country code (e.g., 968554225 for {selectedCountryInfo.dialCode}968554225)
              </p>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-orange-600" />
                Why Support This Campaign?
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Your contribution helps bring creative projects to life</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Get exclusive rewards and updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Join a community of supporters</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment} 
                  disabled={loading || !phoneNumber.trim() || paymentAmount <= 0}
                  className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Support Campaign
                      <Heart className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Info */}
              <div className="text-xs text-gray-500 text-center leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Lock className="h-3 w-3 text-green-600" />
                  <span className="font-medium">Secure Payment</span>
                </div>
                You will be redirected to complete the payment on your mobile device.
                Please ensure you have sufficient balance in your mobile money account.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FundraisingMobileMoneyDialog;
