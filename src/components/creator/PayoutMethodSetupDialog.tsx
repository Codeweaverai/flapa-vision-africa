
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface PayoutMethodSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProfileData {
  stripe_connect_account_id?: string;
  stripe_onboarding_completed?: boolean;
  mobile_money_operator?: string;
  mobile_money_number?: string;
  default_payout_method?: string;
}

const PAWAPAY_COUNTRIES = {
  'Zambia': { code: 'ZMB', flag: '🇿🇲', dialCode: '+260' },
  'Kenya': { code: 'KEN', flag: '🇰🇪', dialCode: '+254' },
  'Uganda': { code: 'UGA', flag: '🇺🇬', dialCode: '+256' },
  'Tanzania': { code: 'TZA', flag: '🇹🇿', dialCode: '+255' },
  'Ghana': { code: 'GHA', flag: '🇬🇭', dialCode: '+233' },
  'Nigeria': { code: 'NGA', flag: '🇳🇬', dialCode: '+234' },
  'Rwanda': { code: 'RWA', flag: '🇷🇼', dialCode: '+250' },
  'Malawi': { code: 'MWI', flag: '🇲🇼', dialCode: '+265' },
  'Mozambique': { code: 'MOZ', flag: '🇲🇿', dialCode: '+258' },
  'Senegal': { code: 'SEN', flag: '🇸🇳', dialCode: '+221' },
  'Benin': { code: 'BEN', flag: '🇧🇯', dialCode: '+229' },
  'Burkina Faso': { code: 'BFA', flag: '🇧🇫', dialCode: '+226' },
  'Cameroon': { code: 'CMR', flag: '🇨🇲', dialCode: '+237' },
  'Congo-Brazzaville': { code: 'COG', flag: '🇨🇬', dialCode: '+242' },
  'DRC': { code: 'COD', flag: '🇨🇩', dialCode: '+243' },
  'Gabon': { code: 'GAB', flag: '🇬🇦', dialCode: '+241' },
  'Ivory Coast': { code: 'CIV', flag: '🇨🇮', dialCode: '+225' },
  'Lesotho': { code: 'LSO', flag: '🇱🇸', dialCode: '+266' },
  'Sierra Leone': { code: 'SLE', flag: '🇸🇱', dialCode: '+232' },
};

const MOBILE_OPERATORS = {
  ZMB: [
    { code: 'mtn_zmb', name: 'MTN Zambia' },
    { code: 'airtel_zmb', name: 'Airtel Zambia' }
  ],
  KEN: [
    { code: 'mpesa_ken', name: 'M-Pesa Kenya' },
    { code: 'airtel_ken', name: 'Airtel Kenya' },
    { code: 'equitel_ken', name: 'Equitel Kenya' }
  ],
  UGA: [
    { code: 'mtn_uga', name: 'MTN Uganda' },
    { code: 'airtel_uga', name: 'Airtel Uganda' }
  ],
  TZA: [
    { code: 'vodacom_tza', name: 'Vodacom Tanzania' },
    { code: 'tigo_tza', name: 'Tigo Tanzania' },
    { code: 'airtel_tza', name: 'Airtel Tanzania' }
  ],
  GHA: [
    { code: 'mtn_gha', name: 'MTN Ghana' },
    { code: 'vodafone_gha', name: 'Vodafone Ghana' },
    { code: 'airteltigo_gha', name: 'AirtelTigo Ghana' }
  ],
  NGA: [
    { code: 'mtn_nga', name: 'MTN Nigeria' },
    { code: 'airtel_nga', name: 'Airtel Nigeria' },
    { code: 'glo_nga', name: 'Glo Nigeria' },
    { code: '9mobile_nga', name: '9mobile Nigeria' }
  ],
  RWA: [
    { code: 'mtn_rwa', name: 'MTN Rwanda' },
    { code: 'airtel_rwa', name: 'Airtel Rwanda' }
  ],
  MWI: [
    { code: 'airtel_mwi', name: 'Airtel Malawi' },
    { code: 'tnm_mwi', name: 'TNM Malawi' }
  ],
  MOZ: [
    { code: 'vodacom_moz', name: 'Vodacom Mozambique' },
    { code: 'mcel_moz', name: 'Mcel Mozambique' }
  ],
  SEN: [
    { code: 'orange_sen', name: 'Orange Senegal' },
    { code: 'free_sen', name: 'Free Senegal' }
  ],
  BEN: [
    { code: 'mtn_ben', name: 'MTN Benin' },
    { code: 'moov_ben', name: 'Moov Benin' }
  ],
  BFA: [
    { code: 'orange_bfa', name: 'Orange Burkina Faso' },
    { code: 'moov_bfa', name: 'Moov Burkina Faso' }
  ],
  CMR: [
    { code: 'mtn_cmr', name: 'MTN Cameroon' },
    { code: 'orange_cmr', name: 'Orange Cameroon' }
  ],
  COG: [
    { code: 'airtel_cog', name: 'Airtel Congo' },
    { code: 'mtn_cog', name: 'MTN Congo' }
  ],
  COD: [
    { code: 'vodacom_cod', name: 'Vodacom DRC' },
    { code: 'airtel_cod', name: 'Airtel DRC' }
  ],
  GAB: [
    { code: 'airtel_gab', name: 'Airtel Gabon' },
    { code: 'moov_gab', name: 'Moov Gabon' }
  ],
  CIV: [
    { code: 'orange_civ', name: 'Orange Ivory Coast' },
    { code: 'mtn_civ', name: 'MTN Ivory Coast' },
    { code: 'moov_civ', name: 'Moov Ivory Coast' }
  ],
  LSO: [
    { code: 'vodacom_lso', name: 'Vodacom Lesotho' },
    { code: 'econet_lso', name: 'Econet Lesotho' }
  ],
  SLE: [
    { code: 'orange_sle', name: 'Orange Sierra Leone' },
    { code: 'airtel_sle', name: 'Airtel Sierra Leone' }
  ]
};

const PayoutMethodSetupDialog: React.FC<PayoutMethodSetupDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'mobile_money'>('stripe');
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [mobileOperator, setMobileOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      loadProfileData();
    }
  }, [open, user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id, stripe_onboarding_completed, mobile_money_operator, mobile_money_number, default_payout_method')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfileData(data);
        if (data.default_payout_method) {
          setSelectedMethod(data.default_payout_method as 'stripe' | 'mobile_money');
        }
        if (data.mobile_money_operator) {
          setMobileOperator(data.mobile_money_operator);
        }
        if (data.mobile_money_number) {
          setPhoneNumber(data.mobile_money_number);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First create or get the Stripe Connect account
      const { data: accountData, error: accountError } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { userId: user.id }
      });

      if (accountError) throw accountError;

      if (accountData?.accountId) {
        // Create account link for onboarding
        const { data: linkData, error: linkError } = await supabase.functions.invoke('create-stripe-account-link', {
          body: { 
            accountId: accountData.accountId,
            returnUrl: `${window.location.origin}/creator/payments?success=true`,
            refreshUrl: `${window.location.origin}/creator/payments?refresh=true`
          }
        });

        if (linkError) throw linkError;

        if (linkData?.url) {
          // Update default payout method
          await supabase
            .from('profiles')
            .update({ 
              default_payout_method: 'stripe'
            })
            .eq('id', user.id);

          window.open(linkData.url, '_blank');
          toast.success('Redirecting to Stripe Connect setup...');
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('Failed to connect to Stripe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMobileMoney = async () => {
    if (!user || !mobileOperator || !phoneNumber) {
      toast.error('Please fill in all mobile money details');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          default_payout_method: 'mobile_money',
          mobile_money_operator: mobileOperator,
          mobile_money_number: phoneNumber
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Mobile money details saved successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving mobile money details:', error);
      toast.error('Failed to save mobile money details');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading</DialogTitle>
            <DialogDescription>Loading payout settings...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading payout settings...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payout Method Setup</DialogTitle>
          <DialogDescription>
            Choose your preferred method to receive payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          {profileData && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Current Setup</Label>
              
              {profileData.stripe_connect_account_id && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Stripe Connect</span>
                  {profileData.stripe_onboarding_completed ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Setup Required</Badge>
                  )}
                </div>
              )}

              {profileData.mobile_money_operator && profileData.mobile_money_number && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Mobile Money</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Configured</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {profileData.mobile_money_operator} - {profileData.mobile_money_number}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Method Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select Payout Method</Label>
            
            <div className="space-y-3">
              {/* Stripe Option */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'stripe' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('stripe')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedMethod === 'stripe'}
                      onChange={() => setSelectedMethod('stripe')}
                      className="text-blue-600"
                    />
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">Stripe Connect</CardTitle>
                      <CardDescription>Bank transfers (2-7 business days) • Available in USA</CardDescription>
                    </div>
                    {profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed && (
                      <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Mobile Money Option */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'mobile_money' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('mobile_money')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedMethod === 'mobile_money'}
                      onChange={() => setSelectedMethod('mobile_money')}
                      className="text-blue-600"
                    />
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">Mobile Money</CardTitle>
                      <CardDescription>Direct mobile money transfers • Available in Africa</CardDescription>
                    </div>
                    {profileData?.mobile_money_operator && profileData?.mobile_money_number && (
                      <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Configuration Forms */}
          {selectedMethod === 'stripe' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">🇺🇸 United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your Stripe Connect account is already set up and ready to receive payments.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={handleConnectStripe} 
                  disabled={loading}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {loading ? "Connecting..." : "Connect with Stripe"}
                </Button>
              )}
            </div>
          )}

          {selectedMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAWAPAY_COUNTRIES).map(([country, details]) => (
                      <SelectItem key={details.code} value={details.code}>
                        <span className="flex items-center gap-2">
                          <span>{details.flag}</span>
                          <span>{country}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCountry && selectedCountry !== 'USA' && (
                <div className="space-y-2">
                  <Label htmlFor="operator">Mobile Operator</Label>
                  <Select value={mobileOperator} onValueChange={setMobileOperator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
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
              )}

              {selectedCountry && selectedCountry !== 'USA' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={`${Object.values(PAWAPAY_COUNTRIES).find(c => c.code === selectedCountry)?.dialCode || '+XXX'} XXX XXX XXX`}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              )}

              {selectedCountry && selectedCountry !== 'USA' && (
                <Button 
                  onClick={handleSaveMobileMoney}
                  disabled={loading || !mobileOperator || !phoneNumber}
                  className="w-full"
                >
                  {loading ? "Saving..." : "Save Mobile Money Details"}
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutMethodSetupDialog;
