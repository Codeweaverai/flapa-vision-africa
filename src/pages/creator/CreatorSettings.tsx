
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, User, CreditCard, Settings } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';
import { supabase } from '@/lib/supabaseClient';

interface BankAccountDetails {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch_code: string;
}

interface ProfileData {
  username?: string;
  full_name?: string;
  bio?: string;
  is_creator?: boolean;
  mobile_money_number?: string;
  payout_method?: 'stripe' | 'mobile_money' | 'bank';
  bank_account_details?: BankAccountDetails | null;
  avatar_url?: string;
}

const CreatorSettings = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          username: data.username || '',
          full_name: data.full_name || '',
          bio: data.bio || '',
          is_creator: data.is_creator || false,
          mobile_money_number: data.mobile_money_number || '',
          payout_method: data.payout_method || 'stripe',
          bank_account_details: data.bank_account_details as BankAccountDetails || null,
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleBankDetailsChange = (field: keyof BankAccountDetails, value: string) => {
    setProfileData(prev => ({
      ...prev,
      bank_account_details: {
        ...prev.bank_account_details as BankAccountDetails,
        [field]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const updateData = {
        username: profileData.username,
        full_name: profileData.full_name,
        bio: profileData.bio,
        is_creator: profileData.is_creator,
        mobile_money_number: profileData.mobile_money_number,
        payout_method: profileData.payout_method,
        bank_account_details: profileData.bank_account_details as any,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updateData });

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setProfileData(prev => ({ ...prev, avatar_url: url }));
    toast.success('Avatar updated successfully');
  };

  if (loading) {
    return (
      <CreatorLayout title="Settings">
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  const bankDetails = profileData.bank_account_details as BankAccountDetails;

  return (
    <CreatorLayout title="Settings">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button 
            variant={activeTab === 'profile' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('profile')}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button 
            variant={activeTab === 'payout' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('payout')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payout Settings
          </Button>
          <Button 
            variant={activeTab === 'preferences' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('preferences')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </Button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <ProfilePictureUpload
                  id={user?.id || ''}
                  existingUrl={profileData.avatar_url || ''}
                  onUploadComplete={handleAvatarUpload}
                />
                <div>
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_creator">Creator Status</Label>
                  <p className="text-sm text-muted-foreground">Enable creator features</p>
                </div>
                <Switch
                  id="is_creator"
                  checked={profileData.is_creator || false}
                  onCheckedChange={(checked) => handleInputChange('is_creator', checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payout Settings Tab */}
        {activeTab === 'payout' && (
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>Configure how you receive payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="payout_method">Payout Method</Label>
                <Select 
                  value={profileData.payout_method || 'stripe'} 
                  onValueChange={(value) => handleInputChange('payout_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe Connect</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profileData.payout_method === 'mobile_money' && (
                <div>
                  <Label htmlFor="mobile_money_number">Mobile Money Number</Label>
                  <Input
                    id="mobile_money_number"
                    value={profileData.mobile_money_number || ''}
                    onChange={(e) => handleInputChange('mobile_money_number', e.target.value)}
                    placeholder="Enter mobile money number"
                  />
                </div>
              )}

              {profileData.payout_method === 'bank' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Bank Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={bankDetails?.account_name || ''}
                        onChange={(e) => handleBankDetailsChange('account_name', e.target.value)}
                        placeholder="Account holder name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={bankDetails?.account_number || ''}
                        onChange={(e) => handleBankDetailsChange('account_number', e.target.value)}
                        placeholder="Account number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={bankDetails?.bank_name || ''}
                        onChange={(e) => handleBankDetailsChange('bank_name', e.target.value)}
                        placeholder="Bank name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch_code">Branch Code</Label>
                      <Input
                        id="branch_code"
                        value={bankDetails?.branch_code || ''}
                        onChange={(e) => handleBankDetailsChange('branch_code', e.target.value)}
                        placeholder="Branch code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {profileData.payout_method === 'stripe' && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Stripe Connect integration will be set up during your first payout request.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your creator experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">More preference options coming soon...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
