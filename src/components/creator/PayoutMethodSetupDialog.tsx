
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

const PayoutMethodSetupDialog: React.FC<PayoutMethodSetupDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'mobile_money'>('stripe');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [mobileOperator, setMobileOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const { user } = useAuth();

  const mobileOperators = {
    UG: [
      { code: 'mtn_ug', name: 'MTN Uganda' },
      { code: 'airtel_ug', name: 'Airtel Uganda' }
    ],
    KE: [
      { code: 'mpesa_ke', name: 'M-Pesa Kenya' },
      { code: 'airtel_ke', name: 'Airtel Kenya' }
    ],
    TZ: [
      { code: 'vodacom_tz', name: 'Vodacom Tanzania' },
      { code: 'tigo_tz', name: 'Tigo Tanzania' }
    ]
  };

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
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.accountId) {
        // Create account link for onboarding
        const { data: linkData, error: linkError } = await supabase.functions.invoke('create-stripe-account-link', {
          body: { 
            accountId: data.accountId,
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
              default_payout_method: 'stripe',
              stripe_connect_account_id: data.accountId
            })
            .eq('id', user.id);

          window.open(linkData.url, '_blank');
          toast.success('Redirecting to Stripe Connect setup...');
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
                    <SelectItem value="US">United States</SelectItem>
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UG">Uganda</SelectItem>
                    <SelectItem value="KE">Kenya</SelectItem>
                    <SelectItem value="TZ">Tanzania</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Mobile Operator</Label>
                <Select value={mobileOperator} onValueChange={setMobileOperator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {mobileOperators[selectedCountry as keyof typeof mobileOperators]?.map((operator) => (
                      <SelectItem key={operator.code} value={operator.code}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSaveMobileMoney}
                disabled={loading || !mobileOperator || !phoneNumber}
                className="w-full"
              >
                {loading ? "Saving..." : "Save Mobile Money Details"}
              </Button>
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
