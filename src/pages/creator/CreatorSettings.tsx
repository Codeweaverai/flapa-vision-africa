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

interface BankAccountDetails {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch_code: string;
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
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_code: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

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
          setBankDetails(data.bank_account_details as unknown as BankAccountDetails);
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
    setBankDetails(prev => ({ ...prev, [name]: value }));
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
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="avatar">Profile Picture</Label>
              <ProfilePictureUpload
                currentImageUrl={profile?.avatar_url}
                onImageUpdate={handleAvatarUpdate}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    value={profile.username || ''}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profile.full_name || ''}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Payout Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payout_method">Payout Method</Label>
                    <Select 
                      value={profile.payout_method || 'stripe'} 
                      onValueChange={handlePayoutMethodChange}
                    >
                      <SelectTrigger>
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
                    <div>
                      <Label htmlFor="mobile_money_number">Mobile Money Number</Label>
                      <Input
                        type="text"
                        id="mobile_money_number"
                        name="mobile_money_number"
                        value={profile.mobile_money_number || ''}
                        onChange={handleChange}
                        placeholder="Enter mobile money number"
                      />
                    </div>
                  )}

                  {profile.payout_method === 'bank' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account_name">Account Name</Label>
                        <Input
                          type="text"
                          id="account_name"
                          name="account_name"
                          value={bankDetails.account_name}
                          onChange={handleBankDetailsChange}
                          placeholder="Account holder name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_number">Account Number</Label>
                        <Input
                          type="text"
                          id="account_number"
                          name="account_number"
                          value={bankDetails.account_number}
                          onChange={handleBankDetailsChange}
                          placeholder="Account number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          type="text"
                          id="bank_name"
                          name="bank_name"
                          value={bankDetails.bank_name}
                          onChange={handleBankDetailsChange}
                          placeholder="Bank name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="branch_code">Branch Code</Label>
                        <Input
                          type="text"
                          id="branch_code"
                          name="branch_code"
                          value={bankDetails.branch_code}
                          onChange={handleBankDetailsChange}
                          placeholder="Branch code"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button
            type="submit"
           disabled={isSubmitting}
           className="bg-gradient-to-r from-orange-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-purple-700"
          >
           {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
