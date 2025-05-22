
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StripeAccountManagement from '@/components/creator/StripeAccountManagement';

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  stripe_connect_id?: string;
  payout_method?: string;
  mobile_money_number?: string;
  bank_account_details?: {
    account_name: string;
    account_number: string;
    bank_name: string;
    branch_code: string;
  };
}

const CreatorSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<string>('stripe');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_code: ''
  });

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

      setProfile(data);
      setAvatarUrl(data.avatar_url || '');
      setPayoutMethod(data.payout_method || 'stripe');
      setMobileMoneyNumber(data.mobile_money_number || '');
      
      if (data.bank_account_details) {
        const bankData = data.bank_account_details as {
          account_name: string;
          account_number: string;
          bank_name: string;
          branch_code: string;
        };
        
        setBankDetails(bankData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    try {
      setUpdating(true);

      if (!user) {
        toast.error('You must be logged in to update your profile');
        return;
      }

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
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

  const handleUpdatePaymentSettings = async () => {
    try {
      setUpdating(true);

      if (!user) {
        toast.error('You must be logged in to update payment settings');
        return;
      }

      const updates = {
        payout_method: payoutMethod,
        mobile_money_number: mobileMoneyNumber,
        bank_account_details: payoutMethod === 'bank_transfer' ? bankDetails : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Payment settings updated successfully');
    } catch (error) {
      console.error('Error updating payment settings:', error);
      toast.error('Failed to update payment settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
  };

  const handleProfileChange = (field: keyof Profile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
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
                      value={profile?.full_name || ''}
                      onChange={(e) => handleProfileChange('full_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Username"
                      value={profile?.username || ''}
                      onChange={(e) => handleProfileChange('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell others about yourself as a creator"
                      value={profile?.bio || ''}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleUpdateProfile} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
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
                    existingUrl={avatarUrl}
                    onUploadComplete={handleAvatarUpload}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Integration</CardTitle>
                  <CardDescription>
                    Connect your Stripe account to receive payments directly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StripeAccountManagement userId={user?.id || ''} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                  <CardDescription>
                    Choose how you'd like to receive payments from the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payoutMethod">Payout Method</Label>
                      <Select 
                        value={payoutMethod} 
                        onValueChange={setPayoutMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payout method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe Connect</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {payoutMethod === 'mobile_money' && (
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Money Number</Label>
                        <Input
                          id="mobileNumber"
                          placeholder="+1234567890"
                          value={mobileMoneyNumber}
                          onChange={(e) => setMobileMoneyNumber(e.target.value)}
                        />
                      </div>
                    )}

                    {payoutMethod === 'bank_transfer' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Holder Name</Label>
                          <Input
                            id="accountName"
                            placeholder="Account holder name"
                            value={bankDetails.account_name}
                            onChange={(e) => setBankDetails({...bankDetails, account_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            placeholder="Account number"
                            value={bankDetails.account_number}
                            onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            placeholder="Bank name"
                            value={bankDetails.bank_name}
                            onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branchCode">Branch Code / Routing Number</Label>
                          <Input
                            id="branchCode"
                            placeholder="Branch code"
                            value={bankDetails.branch_code}
                            onChange={(e) => setBankDetails({...bankDetails, branch_code: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleUpdatePaymentSettings} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Payment Settings'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
