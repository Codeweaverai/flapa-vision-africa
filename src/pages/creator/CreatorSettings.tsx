
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';
import StripeAccountManagement from '@/components/creator/StripeAccountManagement';

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
  avatar_url?: string;
  bio?: string;
  payout_method?: string;
  mobile_money_number?: string;
  stripe_connect_id?: string;
  bank_account_details?: BankAccountDetails;
  avatar_storage_path?: string;
}

const CreatorSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    id: '',
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    payout_method: 'stripe',
    mobile_money_number: '',
    stripe_connect_id: '',
    bank_account_details: {
      account_name: '',
      account_number: '',
      bank_name: '',
      branch_code: ''
    },
    avatar_storage_path: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Convert JSON string to object if needed
        const bankDetails = typeof data.bank_account_details === 'string' 
          ? JSON.parse(data.bank_account_details) 
          : (data.bank_account_details || {
              account_name: '',
              account_number: '',
              bank_name: '',
              branch_code: ''
            });

        setProfile({
          ...data,
          bank_account_details: bankDetails
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);

      if (!user) {
        toast.error('You must be logged in to update your profile');
        return;
      }

      // Convert bank_account_details to JSON format that Supabase expects
      const updates = {
        id: user.id,
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        payout_method: profile.payout_method,
        mobile_money_number: profile.mobile_money_number,
        // Convert BankAccountDetails to Json type
        bank_account_details: profile.bank_account_details as any, // Using 'as any' to bypass type checking
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setProfile({
      ...profile,
      avatar_url: url
    });
  };

  const handlePayoutMethodChange = (value: string) => {
    setProfile({
      ...profile,
      payout_method: value
    });
  };

  const handleBankDetailsChange = (field: keyof BankAccountDetails, value: string) => {
    setProfile({
      ...profile,
      bank_account_details: {
        ...(profile.bank_account_details || {
          account_name: '',
          account_number: '',
          bank_name: '',
          branch_code: ''
        }),
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Creator Settings</h1>
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Creator Profile</CardTitle>
                  <CardDescription>
                    Update your creator profile information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Username"
                      value={profile.username || ''}
                      onChange={(e) => setProfile({...profile, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">About Me</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleUpdateProfile} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Profile'}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    Upload a profile picture for your creator profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ProfilePictureUpload
                    existingUrl={profile.avatar_url || ''}
                    onUploadComplete={handleAvatarUpload}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>
                    Configure how you receive payments from your courses and events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="payoutMethod">Payout Method</Label>
                    <Select 
                      value={profile.payout_method || 'stripe'} 
                      onValueChange={handlePayoutMethodChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe Connect</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="mobile">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {profile.payout_method === 'stripe' && (
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Stripe Connect Account</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Stripe Connect allows you to receive payments directly to your bank account.
                      </p>
                      {user && <StripeAccountManagement />}
                    </div>
                  )}

                  {profile.payout_method === 'bank' && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Bank Account Details</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Enter bank name"
                          value={profile.bank_account_details?.bank_name || ''}
                          onChange={(e) => handleBankDetailsChange('bank_name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Holder Name</Label>
                        <Input
                          id="accountName"
                          placeholder="Enter account holder name"
                          value={profile.bank_account_details?.account_name || ''}
                          onChange={(e) => handleBankDetailsChange('account_name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Enter account number"
                          value={profile.bank_account_details?.account_number || ''}
                          onChange={(e) => handleBankDetailsChange('account_number', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="branchCode">Branch/Sort Code</Label>
                        <Input
                          id="branchCode"
                          placeholder="Enter branch or sort code"
                          value={profile.bank_account_details?.branch_code || ''}
                          onChange={(e) => handleBankDetailsChange('branch_code', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {profile.payout_method === 'mobile' && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Mobile Money</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Money Number</Label>
                        <Input
                          id="mobileNumber"
                          placeholder="Enter mobile money number"
                          value={profile.mobile_money_number || ''}
                          onChange={(e) => setProfile({...profile, mobile_money_number: e.target.value})}
                        />
                        <p className="text-sm text-gray-500">
                          Include country code (e.g., +233) and ensure this is the number registered with your mobile money provider.
                        </p>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUpdateProfile} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Payment Settings'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
