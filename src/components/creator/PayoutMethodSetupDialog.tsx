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
import { AlertCircle, CreditCard, Smartphone, CheckCircle, ExternalLink, Sparkles, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ReactCountryFlag from "react-country-flag";

interface PayoutMethodSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Bank {
  id: string;
  name: string;
  country: string;
}

interface BankAccountDetails {
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_id: string;
  branch_code: string;
  verified: boolean;
  recipient_id?: string;
}

interface ProfileData {
  stripe_connect_account_id?: string;
  stripe_onboarding_completed?: boolean;
  mobile_money_operator?: string;
  mobile_money_number?: string;
  default_payout_method?: string;
  bank_account_details?: BankAccountDetails;
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
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'mobile_money' | 'bank'>('stripe');
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [mobileOperator, setMobileOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Bank Transfer State
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>({
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_id: '',
    branch_code: '',
    verified: false
  });

  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      loadProfileData();
      loadBanks();
    }
  }, [open, user]);

  const loadBanks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-lenco-banks', {
        body: { country: 'zm' }
      });

      if (error) throw error;

      if (data.success) {
        setBanks(data.data.data || []);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      toast.error('Failed to load bank list');
    }
  };

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id, stripe_onboarding_completed, mobile_money_operator, mobile_money_number, default_payout_method, bank_account_details')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfileData(data as any);
        if (data.default_payout_method) {
          setSelectedMethod(data.default_payout_method as 'stripe' | 'mobile_money' | 'bank');
        }
        if (data.mobile_money_operator) {
          setMobileOperator(data.mobile_money_operator);
        }
        if (data.mobile_money_number) {
          setPhoneNumber(data.mobile_money_number);
        }
        // Load bank account details if they exist
        if (data.bank_account_details && typeof data.bank_account_details === 'object') {
          const existingDetails = data.bank_account_details as any;
          setBankDetails({
            account_name: existingDetails.account_name || '',
            account_number: existingDetails.account_number || '',
            bank_name: existingDetails.bank_name || '',
            bank_id: existingDetails.bank_id || '',
            branch_code: existingDetails.branch_code || '',
            verified: existingDetails.verified || false,
            recipient_id: existingDetails.recipient_id || ''
          });
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
      const { data: accountData, error: accountError } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { userId: user.id }
      });

      if (accountError) {
        console.error('Account creation error:', accountError);
        throw accountError;
      }

      if (accountData?.accountId) {
        const { data: linkData, error: linkError } = await supabase.functions.invoke('create-stripe-account-link', {
          body: { 
            accountId: accountData.accountId,
            returnUrl: `${window.location.origin}/creator/payments`,
            refreshUrl: `${window.location.origin}/creator/payments?refresh=true`
          }
        });

        if (linkError) {
          console.error('Link creation error:', linkError);
          throw linkError;
        }

        if (linkData?.url) {
          window.location.href = linkData.url;
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

  const createRecipient = async (): Promise<string> => {
    if (!bankDetails.account_number || !bankDetails.bank_id || !bankDetails.account_name) {
      throw new Error('Account details are incomplete for recipient creation');
    }

    setIsCreatingRecipient(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-recipient', {
        body: {
          accountNumber: bankDetails.account_number,
          bankId: bankDetails.bank_id,
          accountName: bankDetails.account_name,
          country: 'zm',
          currency: 'ZMW'
        }
      });

      if (error) throw error;

      if (data.success) {
        const recipientId = data.data.data.id;
        toast.success('Recipient created successfully in Lenco system!');
        return recipientId;
      } else {
        throw new Error(data.error || 'Recipient creation failed');
      }
    } catch (error) {
      console.error('Error creating recipient:', error);
      toast.error('Failed to create recipient in Lenco system');
      throw error;
    } finally {
      setIsCreatingRecipient(false);
    }
  };

  const handleSaveBankTransfer = async () => {
    if (!user || !bankDetails.account_number || !bankDetails.bank_id || !bankDetails.verified) {
      toast.error('Please verify your bank account first');
      return;
    }

    setLoading(true);
    try {
      let recipientId = bankDetails.recipient_id;

      // Create recipient in Lenco system if not already created
      if (!recipientId) {
        recipientId = await createRecipient();
      }

      // Save bank details with recipient ID
      const { error } = await supabase
        .from('profiles')
        .update({
          default_payout_method: 'bank',
          bank_account_details: {
            ...bankDetails,
            recipient_id: recipientId
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Bank transfer setup completed successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving bank transfer:', error);
      toast.error('Failed to save bank transfer details');
    } finally {
      setLoading(false);
    }
  };

  const verifyAccount = async () => {
    if (!bankDetails.account_number || !bankDetails.bank_id) {
      toast.error('Please enter account number and select a bank');
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('resolve-account', {
        body: {
          accountNumber: bankDetails.account_number,
          bankId: bankDetails.bank_id,
          country: 'zm'
        }
      });

      if (error) throw error;

      if (data.success) {
        const resolvedAccount = data.data.data;
        setBankDetails(prev => ({
          ...prev,
          account_name: resolvedAccount.accountName,
          bank_name: resolvedAccount.bank.name,
          verified: true
        }));
        toast.success('Account verified successfully!');
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      toast.error('Account verification failed. Please check details.');
      setBankDetails(prev => ({ ...prev, verified: false }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({ 
      ...prev, 
      [name]: value,
      verified: false // Reset verification when details change
    }));
  };

  const handleBankSelect = (bankId: string) => {
    const selectedBank = banks.find(bank => bank.id === bankId);
    setBankDetails(prev => ({
      ...prev,
      bank_id: bankId,
      bank_name: selectedBank?.name || '',
      verified: false // Reset verification when bank changes
    }));
  };

  // Helper function to get 2-letter country code for ReactCountryFlag
  const getCountryCode = (countryCode: string): string => {
    return COUNTRY_CODE_MAP[countryCode] || 'US';
  };

  if (loadingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-orange-50/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Loading Payment Settings
            </DialogTitle>
            <DialogDescription>Loading your payout preferences...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-to-r from-orange-500 to-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading payout settings...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50/20 border-0 shadow-2xl rounded-2xl">
        {/* Header with Gradient */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-orange-500/5 to-purple-600/5 rounded-t-2xl border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Payout Method Setup
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Choose your preferred method to receive payments securely
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Current Status */}
          {profileData && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Current Setup</Label>
              
              {profileData.stripe_connect_account_id && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Stripe Connect</span>
                    {profileData.stripe_onboarding_completed ? (
                      <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Connected</Badge>
                    ) : (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">Setup Required</Badge>
                    )}
                  </div>
                </div>
              )}

              {profileData.mobile_money_operator && profileData.mobile_money_number && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Smartphone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Mobile Money</span>
                    <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Configured</Badge>
                  </div>
                  <span className="text-xs text-gray-600">
                    {profileData.mobile_money_operator} • {profileData.mobile_money_number}
                  </span>
                </div>
              )}

              {profileData.bank_account_details && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Bank Transfer</span>
                    <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                      {profileData.bank_account_details.recipient_id ? 'Fully Configured' : 'Configured'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-600">
                    {profileData.bank_account_details.bank_name} • {profileData.bank_account_details.account_number}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Method Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Select Payout Method</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stripe Option */}
              <Card 
                className={`cursor-pointer transition-all duration-300 border-2 ${
                  selectedMethod === 'stripe' 
                    ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-purple-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-orange-200 hover:shadow-md'
                }`}
                onClick={() => setSelectedMethod('stripe')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === 'stripe' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600' 
                        : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        selectedMethod === 'stripe' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        Stripe Connect
                        {profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Bank transfers (2-7 business days) • Available in USA
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Mobile Money Option */}
              <Card 
                className={`cursor-pointer transition-all duration-300 border-2 ${
                  selectedMethod === 'mobile_money' 
                    ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-purple-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-orange-200 hover:shadow-md'
                }`}
                onClick={() => setSelectedMethod('mobile_money')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === 'mobile_money' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600' 
                        : 'bg-gray-100'
                    }`}>
                      <Smartphone className={`h-5 w-5 ${
                        selectedMethod === 'mobile_money' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        Mobile Money
                        {profileData?.mobile_money_operator && profileData?.mobile_money_number && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Direct mobile money transfers • Available in Africa
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Bank Transfer Option */}
              <Card 
                className={`cursor-pointer transition-all duration-300 border-2 ${
                  selectedMethod === 'bank' 
                    ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-purple-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-orange-200 hover:shadow-md'
                }`}
                onClick={() => setSelectedMethod('bank')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === 'bank' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600' 
                        : 'bg-gray-100'
                    }`}>
                      <Building2 className={`h-5 w-5 ${
                        selectedMethod === 'bank' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        Bank Transfer
                        {profileData?.bank_account_details && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Direct bank transfers • Available in Zambia
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Configuration Forms */}
          {selectedMethod === 'stripe' && (
            <div className="space-y-4 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
              <div className="space-y-3">
                <Label htmlFor="country" className="text-sm font-semibold">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 bg-white hover:border-orange-300 transition-colors rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-sm">
                    <SelectItem value="USA">
                      <div className="flex items-center gap-3 py-2">
                        <ReactCountryFlag
                          countryCode={getCountryCode('USA')}
                          svg
                          style={{
                            width: '20px',
                            height: '15px',
                            borderRadius: '3px',
                          }}
                        />
                        <span>United States</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profileData?.stripe_connect_account_id && profileData?.stripe_onboarding_completed ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your Stripe Connect account is already set up and ready to receive payments.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={handleConnectStripe} 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {loading ? "Connecting to Stripe..." : "Connect with Stripe"}
                </Button>
              )}
            </div>
          )}

          {selectedMethod === 'mobile_money' && (
            <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50/30 to-purple-50/30 rounded-xl border border-orange-200/50">
              <div className="space-y-3">
                <Label htmlFor="country" className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Country
                </Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-12 border-2 border-orange-200/60 bg-white hover:border-orange-300 transition-colors rounded-xl">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[300px] border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-sm max-h-[300px]">
                    {Object.entries(PAWAPAY_COUNTRIES).map(([country, details]) => (
                      <SelectItem key={details.code} value={details.code}>
                        <div className="flex items-center gap-3 py-2">
                          <ReactCountryFlag
                            countryCode={getCountryCode(details.code)}
                            svg
                            style={{
                              width: '20px',
                              height: '15px',
                              borderRadius: '3px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                            title={country}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{country}</span>
                            <span className="text-xs text-gray-500">{details.dialCode}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCountry && selectedCountry !== 'USA' && (
                <div className="space-y-3">
                  <Label htmlFor="operator" className="text-sm font-semibold">Mobile Operator</Label>
                  <Select value={mobileOperator} onValueChange={setMobileOperator}>
                    <SelectTrigger className="h-12 border-2 border-orange-200/60 bg-white hover:border-orange-300 transition-colors rounded-xl">
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent className="border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-sm">
                      {MOBILE_OPERATORS[selectedCountry as keyof typeof MOBILE_OPERATORS]?.map((operator) => (
                        <SelectItem key={operator.code} value={operator.code}>
                          <div className="flex items-center gap-2 py-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full"></div>
                            {operator.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCountry && selectedCountry !== 'USA' && (
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">
                        {Object.values(PAWAPAY_COUNTRIES).find(c => c.code === selectedCountry)?.dialCode}
                      </span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="XXX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-12 pl-20 border-2 border-orange-200/60 bg-white hover:border-orange-300 focus:border-orange-400 transition-colors rounded-xl"
                    />
                  </div>
                </div>
              )}

              {selectedCountry && selectedCountry !== 'USA' && (
                <Button 
                  onClick={handleSaveMobileMoney}
                  disabled={loading || !mobileOperator || !phoneNumber}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving Details...
                    </div>
                  ) : (
                    "Save Mobile Money Details"
                  )}
                </Button>
              )}
            </div>
          )}

          {selectedMethod === 'bank' && (
            <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50/30 to-purple-50/30 rounded-xl border border-orange-200/50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Bank Account Details</span>
                  {profileData?.bank_account_details && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-1" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_id" className="text-sm font-medium text-gray-700">
                      Bank
                    </Label>
                    <Select value={bankDetails.bank_id} onValueChange={handleBankSelect}>
                      <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number" className="text-sm font-medium text-gray-700">
                      Account Number
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        id="account_number"
                        name="account_number"
                        value={bankDetails.account_number}
                        onChange={handleBankDetailsChange}
                        placeholder="Enter account number"
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 flex-1"
                      />
                      <Button
                        type="button"
                        onClick={verifyAccount}
                        disabled={isVerifying || !bankDetails.account_number || !bankDetails.bank_id}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-purple-700 transition-all duration-200"
                      >
                        {isVerifying ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name" className="text-sm font-medium text-gray-700">
                      Account Name
                    </Label>
                    <Input
                      type="text"
                      id="account_name"
                      name="account_name"
                      value={bankDetails.account_name}
                      onChange={handleBankDetailsChange}
                      placeholder={bankDetails.verified ? "Auto-verified" : "Will auto-populate after verification"}
                      className={`border-gray-300 focus:border-orange-500 focus:ring-orange-500 ${
                        bankDetails.verified ? 'bg-green-50 border-green-200' : ''
                      }`}
                      readOnly={bankDetails.verified}
                    />
                    {bankDetails.verified && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Account verified</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch_code" className="text-sm font-medium text-gray-700">
                      Branch Code (Optional)
                    </Label>
                    <Input
                      type="text"
                      id="branch_code"
                      name="branch_code"
                      value={bankDetails.branch_code}
                      onChange={handleBankDetailsChange}
                      placeholder="Branch code"
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {bankDetails.verified && !bankDetails.recipient_id && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Your account is verified! Click "Save Bank Transfer Details" to create a recipient in Lenco system for faster future payouts.
                    </AlertDescription>
                  </Alert>
                )}

                {bankDetails.recipient_id && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Recipient successfully created in Lenco system! Future payouts will be faster.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSaveBankTransfer}
                  disabled={loading || !bankDetails.account_number || !bankDetails.bank_id || !bankDetails.verified || isCreatingRecipient}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || isCreatingRecipient ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {isCreatingRecipient ? "Creating Recipient..." : "Saving Details..."}
                    </div>
                  ) : (
                    "Save Bank Transfer Details"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium rounded-xl px-6 py-2 transition-colors"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutMethodSetupDialog;
