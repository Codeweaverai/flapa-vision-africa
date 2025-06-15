
import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, MapPin, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { PAWAPAY_COUNTRY_CODES, PawapayCountryCode } from '@/constants/pawapayCountries';

interface PayoutMethodSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COUNTRY_OPTIONS = [
  { code: 'USA', name: 'United States', flag: '🇺🇸', paymentMethod: 'stripe' },
  { code: 'ZMB', name: 'Zambia', flag: '🇿🇲', paymentMethod: 'mobile_money' },
  { code: 'NGA', name: 'Nigeria', flag: '🇳🇬', paymentMethod: 'mobile_money' },
  { code: 'MWI', name: 'Malawi', flag: '🇲🇼', paymentMethod: 'mobile_money' },
  { code: 'KEN', name: 'Kenya', flag: '🇰🇪', paymentMethod: 'mobile_money' },
];

const MOBILE_OPERATORS = {
  ZMB: [
    { name: 'MTN Zambia', code: 'MTN_MOMO_ZMB' },
    { name: 'Airtel Zambia', code: 'AIRTEL_OAPI_ZMB' },
  ],
  NGA: [
    { name: 'MTN Nigeria', code: 'MTN_MOMO_NGA' },
    { name: 'Airtel Nigeria', code: 'AIRTEL_OAPI_NGA' },
  ],
  MWI: [
    { name: 'TNM Malawi', code: 'TNM_MPAMBA_MWI' },
    { name: 'Airtel Malawi', code: 'AIRTEL_OAPI_MWI' },
  ],
  KEN: [
    { name: 'Safaricom M-Pesa', code: 'MPESA_KEN' },
    { name: 'Airtel Kenya', code: 'AIRTEL_OAPI_KEN' },
  ],
};

const PayoutMethodSetupDialog: React.FC<PayoutMethodSetupDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const selectedCountryData = COUNTRY_OPTIONS.find(c => c.code === selectedCountry);
  const countryDialCode = selectedCountryData ? PAWAPAY_COUNTRY_CODES[selectedCountryData.name as PawapayCountryCode]?.dialCode || '' : '';

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setStep(2);
  };

  const handleStripeSetup = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-stripe-account-session');

      if (error) throw error;

      if (data?.clientSecret) {
        // For now, we'll show a success message since we don't have the full Stripe Connect UI integration
        toast({
          title: "Stripe Account Session Created",
          description: "Your Stripe Connect session has been created successfully.",
        });
        
        onSuccess();
        onOpenChange(false);
        resetDialog();
      } else {
        throw new Error('No client secret received from Stripe');
      }
    } catch (error) {
      console.error('Error setting up Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to set up Stripe Connect account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobileMoneySetup = async () => {
    if (!selectedOperator || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please select an operator and enter your phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          payout_method: 'mobile_money',
          mobile_money_details: {
            operator: selectedOperator,
            phone_number: phoneNumber,
            country: selectedCountry
          }
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Mobile money payout method has been set up successfully!",
      });

      onSuccess();
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      console.error('Error setting up mobile money:', error);
      toast({
        title: "Error",
        description: "Failed to set up mobile money payout method",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep(1);
    setSelectedCountry('');
    setSelectedOperator('');
    setPhoneNumber('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetDialog();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Up Payout Method
          </DialogTitle>
          <DialogDescription>
            Choose your country and preferred payout method to receive earnings
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Select Your Country</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your country to see available payout methods
              </p>
            </div>

            <div className="space-y-2">
              {COUNTRY_OPTIONS.map((country) => (
                <Card 
                  key={country.code}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{country.flag}</span>
                        <div>
                          <div className="font-medium">{country.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {country.paymentMethod === 'stripe' ? (
                              <>
                                <CreditCard className="h-3 w-3" />
                                Stripe Connect
                              </>
                            ) : (
                              <>
                                <Smartphone className="h-3 w-3" />
                                Mobile Money
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {country.paymentMethod === 'stripe' ? 'Bank Transfer' : 'Mobile Money'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedCountryData?.paymentMethod === 'stripe' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🇺🇸</div>
              <h3 className="text-lg font-semibold">United States - Stripe Connect</h3>
              <p className="text-sm text-muted-foreground">
                Connect your bank account through Stripe for secure payouts
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Connect Setup
                </CardTitle>
                <CardDescription>
                  You'll be connected to Stripe to complete your account setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Secure bank account connection
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Fast transfers (2-7 business days)
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Low processing fees
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && selectedCountryData?.paymentMethod === 'mobile_money' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">{selectedCountryData.flag}</div>
              <h3 className="text-lg font-semibold">{selectedCountryData.name} - Mobile Money</h3>
              <p className="text-sm text-muted-foreground">
                Set up mobile money for instant payouts
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="operator">Mobile Money Operator</Label>
                <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mobile money operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILE_OPERATORS[selectedCountry as keyof typeof MOBILE_OPERATORS]?.map((operator) => (
                      <SelectItem key={operator.code} value={operator.code}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                    <span className="text-sm text-gray-600">{countryDialCode}</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your mobile money number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the number registered with your mobile money account
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Instant transfers (5-30 minutes)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    No bank account required
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Available 24/7
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 1 && (
            <Button disabled>
              Select a Country
            </Button>
          )}
          {step === 2 && selectedCountryData?.paymentMethod === 'stripe' && (
            <Button onClick={handleStripeSetup} disabled={loading}>
              {loading ? "Connecting..." : "Connect with Stripe"}
            </Button>
          )}
          {step === 2 && selectedCountryData?.paymentMethod === 'mobile_money' && (
            <Button onClick={handleMobileMoneySetup} disabled={loading || !selectedOperator || !phoneNumber}>
              {loading ? "Setting up..." : "Set Up Mobile Money"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutMethodSetupDialog;
