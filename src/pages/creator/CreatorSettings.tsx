import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';

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
  bank_account_details?: BankAccountDetails;
}

const CreatorSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>({
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
        body: { country: 'zm' } // Default to Zambia, can be made dynamic
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
        };

        setProfile(profileData);

        if (data.bank_account_details && typeof data.bank_account_details === 'object') {
          const existingDetails = data.bank_account_details as any;
          setBankDetails({
            account_name: existingDetails.account_name || '',
            account_number: existingDetails.account_number || '',
            bank_name: existingDetails.bank_name || '',
            bank_id: existingDetails.bank_id || '',
            branch_code: existingDetails.branch_code || '',
            verified: existingDetails.verified || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
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

  const handlePayoutMethodChange = (value: string) => {
    setProfile(prev => prev ? { 
      ...prev, 
      payout_method: value as 'stripe' | 'mobile_money' | 'bank' 
    } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSubmitting(true);

    try {
      const updateData = {
        username: profile.username,
        full_name: profile.full_name,
        bio: profile.bio,
        is_creator: profile.is_creator,
        payout_method: profile.payout_method,
        mobile_money_number: profile.mobile_money_number,
        bank_account_details: bankDetails as any,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
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
                    <div className="space-y-2">
                      <Label htmlFor="mobile_money_number" className="text-sm font-medium text-gray-700">
                        Mobile Money Number
                      </Label>
                      <Input
                        type="text"
                        id="mobile_money_number"
                        name="mobile_money_number"
                        value={profile.mobile_money_number || ''}
                        onChange={handleChange}
                        placeholder="Enter mobile money number"
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  {profile.payout_method === 'bank' && (
                    <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50 to-purple-50 rounded-lg border border-orange-100">
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
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating Profile...</span>
                  </div>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
