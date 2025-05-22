
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import StripeAccountManagement from '@/components/creator/StripeAccountManagement';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';

const CreatorSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    bio: '',
    mobile_money_number: '',
    payout_method: 'stripe',
    avatar_url: '',
    bank_account_details: {
      account_name: '',
      account_number: '',
      bank_name: '',
      branch_code: '',
    }
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Cast the bank_account_details to an object or set to default if null
        const bank_account_details = data.bank_account_details 
          ? data.bank_account_details 
          : { account_name: '', account_number: '', bank_name: '', branch_code: '' };

        setProfileData({
          username: data.username || '',
          full_name: data.full_name || '',
          bio: data.bio || '',
          mobile_money_number: data.mobile_money_number || '',
          payout_method: data.payout_method || 'stripe',
          avatar_url: data.avatar_url || '',
          bank_account_details
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          bio: profileData.bio,
          mobile_money_number: profileData.mobile_money_number,
          payout_method: profileData.payout_method,
          bank_account_details: profileData.bank_account_details,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      bank_account_details: { ...prev.bank_account_details, [name]: value }
    }));
  };

  const handleAvatarUpdate = (url: string) => {
    setProfileData(prev => ({ ...prev, avatar_url: url }));
    // Update avatar in database
    if (user) {
      supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating avatar:', error);
            toast.error('Error updating avatar');
          } else {
            toast.success('Avatar updated successfully');
          }
        });
    }
  };

  if (!user) {
    return (
      <CreatorLayout>
        <div className="container py-10">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Please sign in to access creator settings.</p>
            </CardContent>
          </Card>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Creator Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Creator Profile</CardTitle>
                <CardDescription>
                  Update your creator profile information that will be visible to your audience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profileData.username}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={profileData.full_name}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleChange}
                        disabled={loading}
                        rows={5}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <h3 className="text-lg font-medium mb-2">Profile Picture</h3>
                    <ProfilePictureUpload 
                      existingUrl={profileData.avatar_url} 
                      onUploadComplete={handleAvatarUpdate}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving || loading}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Stripe Connect</CardTitle>
                <CardDescription>
                  Connect your Stripe account to receive payments directly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StripeAccountManagement userId={user.id} />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Choose how you want to receive your payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="payout_method">Payout Method</Label>
                  <Select 
                    value={profileData.payout_method} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, payout_method: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {profileData.payout_method === 'mobile_money' && (
                  <div className="space-y-2">
                    <Label htmlFor="mobile_money_number">Mobile Money Number</Label>
                    <Input
                      id="mobile_money_number"
                      name="mobile_money_number"
                      value={profileData.mobile_money_number}
                      onChange={handleChange}
                      placeholder="+XX XXX XXX XXX"
                      disabled={loading}
                    />
                  </div>
                )}

                {profileData.payout_method === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Holder Name</Label>
                      <Input
                        id="account_name"
                        name="account_name"
                        value={typeof profileData.bank_account_details === 'object' ? 
                          profileData.bank_account_details.account_name || '' : ''}
                        onChange={handleBankDetailsChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        name="account_number"
                        value={typeof profileData.bank_account_details === 'object' ? 
                          profileData.bank_account_details.account_number || '' : ''}
                        onChange={handleBankDetailsChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        name="bank_name"
                        value={typeof profileData.bank_account_details === 'object' ? 
                          profileData.bank_account_details.bank_name || '' : ''}
                        onChange={handleBankDetailsChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch_code">Branch/Sort Code</Label>
                      <Input
                        id="branch_code"
                        name="branch_code"
                        value={typeof profileData.bank_account_details === 'object' ? 
                          profileData.bank_account_details.branch_code || '' : ''}
                        onChange={handleBankDetailsChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving || loading}
                >
                  {saving ? 'Saving...' : 'Save Payment Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
