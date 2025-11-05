import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';
import ReactCountryFlag from "react-country-flag";
import { Smartphone, Sparkles, CheckCircle, AlertCircle, Building2, Shield } from 'lucide-react';
import OTPVerificationModal from '@/components/auth/OTPVerificationModal';

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

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  is_creator?: boolean;
  payout_method?: 'stripe' | 'mobile_money' | 'bank';
  mobile_money_number?: string;
  mobile_money_country?: string;
  mobile_money_operator?: string;
  bank_account_details?: BankAccountDetails;
}

// Country data from PaymentMethodSetupDialog
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

const CreatorSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>({
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_id: '',
    branch_code: '',
    verified: false
  });
  
  // Mobile Money State
  const [mobileCountry, setMobileCountry] = useState('ZMB');
  const [mobileOperator, setMobileOperator] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // OTP Verification State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
  const [hasPayoutChanges, setHasPayoutChanges] = useState(false);

  // Track original payout details for comparison
  const [originalPayoutMethod, setOriginalPayoutMethod] = useState<string>('');
  const [originalMobileDetails, setOriginalMobileDetails] = useState({
    country: '',
    operator: '',
    number: ''
  });
  const [originalBankDetails, setOriginalBankDetails] = useState<BankAccountDetails>({
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_id: '',
    branch_code: '',
    verified: false
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadBanks();
    }
  }, [user]);

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

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData: Profile = {
          id: data.id,
          username: data.username,
          full_name: data.full_name,
          bio: data.bio,
          avatar_url: data.avatar_url,
          is_creator: data.is_creator,
          payout_method: data.payout_method as 'stripe' | 'mobile_money' | 'bank',
          mobile_money_number: data.mobile_money_number,
          mobile_money_country: data.mobile_money_country,
          mobile_money_operator: data.mobile_money_operator,
        };

        setProfile(profileData);

        // Store original payout details for comparison
        setOriginalPayoutMethod(data.payout_method || 'stripe');

        // Set mobile money data if exists
        if (data.mobile_money_country) {
          setMobileCountry(data.mobile_money_country);
          setOriginalMobileDetails({
            country: data.mobile_money_country,
            operator: data.mobile_money_operator || '',
            number: data.mobile_money_number || ''
          });
        }
        if (data.mobile_money_operator) {
          setMobileOperator(data.mobile_money_operator);
        }
        if (data.mobile_money_number) {
          setMobileNumber(data.mobile_money_number);
        }

        // Set bank details if exists
        if (data.bank_account_details && typeof data.bank_account_details === 'object') {
          const existingDetails = data.bank_account_details as any;
          const bankDetailsData = {
            account_name: existingDetails.account_name || '',
            account_number: existingDetails.account_number || '',
            bank_name: existingDetails.bank_name || '',
            bank_id: existingDetails.bank_id || '',
            branch_code: existingDetails.branch_code || '',
            verified: existingDetails.verified || false,
            recipient_id: existingDetails.recipient_id || ''
          };
          setBankDetails(bankDetailsData);
          setOriginalBankDetails(bankDetailsData);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const hasPayoutDetailsChanged = (): boolean => {
    if (!profile) return false;

    // Check if payout method changed
    if (profile.payout_method !== originalPayoutMethod) {
      return true;
    }

    // Check mobile money details changes
    if (profile.payout_method === 'mobile_money') {
      return (
        mobileCountry !== originalMobileDetails.country ||
        mobileOperator !== originalMobileDetails.operator ||
        mobileNumber !== originalMobileDetails.number
      );
    }

    // Check bank details changes
    if (profile.payout_method === 'bank') {
      return (
        bankDetails.account_number !== originalBankDetails.account_number ||
        bankDetails.bank_id !== originalBankDetails.bank_id ||
        bankDetails.account_name !== originalBankDetails.account_name ||
        bankDetails.branch_code !== originalBankDetails.branch_code
      );
    }

    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
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

  const handlePayoutMethodChange = (value: string) => {
    setProfile(prev => prev ? { 
      ...prev, 
      payout_method: value as 'stripe' | 'mobile_money' | 'bank' 
    } : null);
  };

  const handleMobileCountryChange = (countryCode: string) => {
    setMobileCountry(countryCode);
    // Reset operator when country changes
    setMobileOperator('');
  };

  const prepareUpdateData = () => {
    if (!user || !profile) return null;

    const updateData: any = {
      username: profile.username,
      full_name: profile.full_name,
      bio: profile.bio,
      is_creator: profile.is_creator,
      payout_method: profile.payout_method,
      updated_at: new Date().toISOString()
    };

    // Add mobile money data if selected
    if (profile.payout_method === 'mobile_money') {
      updateData.mobile_money_country = mobileCountry;
      updateData.mobile_money_operator = mobileOperator;
      updateData.mobile_money_number = mobileNumber;
    }

    // Add bank data if selected
    if (profile.payout_method === 'bank') {
      let recipientId = bankDetails.recipient_id;

      // Create recipient in Lenco system if verified but not created yet
      if (bankDetails.verified && !recipientId) {
        updateData.recipient_id_pending = true; // Flag to indicate recipient creation needed
      }

      updateData.bank_account_details = {
        ...bankDetails,
        recipient_id: recipientId
      };
    }

    return updateData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    // Check if payout details have changed
    const payoutChanges = hasPayoutDetailsChanged();
    setHasPayoutChanges(payoutChanges);

    if (payoutChanges) {
      // Prepare update data and show OTP modal
      const updateData = prepareUpdateData();
      setPendingUpdateData(updateData);
      setShowOTPModal(true);
    } else {
      // No payout changes, proceed with normal update
      await performProfileUpdate(prepareUpdateData());
    }
  };

  const handleOTPVerified = async () => {
    setShowOTPModal(false);
    if (pendingUpdateData) {
      await performProfileUpdate(pendingUpdateData);
    }
  };

  const performProfileUpdate = async (updateData: any) => {
    setIsSubmitting(true);

    try {
      // Handle recipient creation if needed for bank transfers
      if (updateData.recipient_id_pending && profile?.payout_method === 'bank') {
        try {
          const recipientId = await createRecipient();
          updateData.bank_account_details.recipient_id = recipientId;
        } catch (error) {
          console.error('Recipient creation failed, but saving bank details anyway:', error);
          // Continue with saving even if recipient creation fails
        }
        delete updateData.recipient_id_pending;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user!.id);

      if (error) throw error;

      // Update original values after successful save
      setOriginalPayoutMethod(profile?.payout_method || 'stripe');
      if (profile?.payout_method === 'mobile_money') {
        setOriginalMobileDetails({
          country: mobileCountry,
          operator: mobileOperator,
          number: mobileNumber
        });
      }
      if (profile?.payout_method === 'bank') {
        setOriginalBankDetails({ ...bankDetails });
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
      setPendingUpdateData(null);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update profile picture');
    }
  };

  // Helper function to get 2-letter country code for ReactCountryFlag
  const getCountryCode = (countryCode: string): string => {
    return COUNTRY_CODE_MAP[countryCode] || 'US';
  };

  if (!profile) {
    return (
      <CreatorLayout title="Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Settings">
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Creator Profile Settings
            </CardTitle>
            <CardDescription className="text-gray-600">
              Update your profile information and payout preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="avatar" className="text-sm font-medium text-gray-700">
                Profile Picture
              </Label>
              <ProfilePictureUpload
                currentImageUrl={profile?.avatar_url}
                onImageUpdate={handleAvatarUpdate}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    value={profile.username || ''}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profile.full_name || ''}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us about yourself and your content..."
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[100px]"
                />
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  Payout Settings
                </h3>
                
                {/* Security Notice */}
                <Alert className="bg-blue-50 border-blue-200 mb-6">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Security Notice:</strong> Changing payout details requires OTP verification to protect your earnings.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="payout_method" className="text-sm font-medium text-gray-700">
                      Payout Method
                    </Label>
                    <Select 
                      value={profile.payout_method || 'stripe'} 
                      onValueChange={handlePayoutMethodChange}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {profile.payout_method === 'mobile_money' && (
                    <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50 to-purple-50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
                          <Smartphone className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Mobile Money Details</span>
                        {profile.mobile_money_number && profile.mobile_money_operator && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-1" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mobile_country" className="text-sm font-medium text-gray-700">
                            Country
                          </Label>
                          <Select value={mobileCountry} onValueChange={handleMobileCountryChange}>
                            <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="min-w-[300px] max-h-[300px]">
                              {Object.entries(PAWAPAY_COUNTRIES).map(([country, details]) => (
                                <SelectItem key={details.code} value={details.code}>
                                  <div className="flex items-center gap-3 py-1">
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
                                      <span className="font-medium text-gray-800 text-sm">{country}</span>
                                      <span className="text-xs text-gray-500">{details.dialCode}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mobile_operator" className="text-sm font-medium text-gray-700">
                            Mobile Operator
                          </Label>
                          <Select value={mobileOperator} onValueChange={setMobileOperator}>
                            <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOBILE_OPERATORS[mobileCountry as keyof typeof MOBILE_OPERATORS]?.map((operator) => (
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

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="mobile_number" className="text-sm font-medium text-gray-700">
                            Phone Number
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm">
                                {Object.values(PAWAPAY_COUNTRIES).find(c => c.code === mobileCountry)?.dialCode}
                              </span>
                            </div>
                            <Input
                              id="mobile_number"
                              type="tel"
                              placeholder="XXX XXX XXX"
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              className="pl-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.payout_method === 'bank' && (
                    <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50 to-purple-50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Bank Account Details</span>
                        {profile.bank_account_details && (
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
                            Your account is verified! Click "Update Profile" to create a recipient in Lenco system for faster future payouts.
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
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isCreatingRecipient}
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                {isSubmitting || isCreatingRecipient ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>
                      {isCreatingRecipient ? "Creating Recipient..." : "Updating Profile..."}
                    </span>
                  </div>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
        verificationType="login"
        userEmail={user?.email || ''}
      />
    </CreatorLayout>
  );
};

export default CreatorSettings;
