
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { getStripeAccountStatus, connectStripeAccount } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';

const CreatorSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    mobile_money_number: '',
    payout_method: 'stripe',
  });
  
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState('');
  
  useEffect(() => {
    if (user) {
      loadProfile();
      checkStripeStatus();
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
      
      if (error) throw error;
      
      setProfileData({
        username: data.username || '',
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        mobile_money_number: data.mobile_money_number || '',
        payout_method: data.payout_method || 'stripe',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    if (!user) return;
    
    try {
      const { isConnected, accountId } = await getStripeAccountStatus(user.id);
      setStripeConnected(isConnected);
      setStripeAccountId(accountId || '');
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) {
      toast.error('You must be logged in to connect Stripe');
      return;
    }
    
    try {
      const url = await connectStripeAccount(user.id);
      if (url) {
        window.open(url, '_blank');
        toast.success('Redirecting to Stripe Connect...');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('Failed to connect Stripe account');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const savePayoutSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mobile_money_number: profileData.mobile_money_number,
          payout_method: profileData.payout_method,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Payout settings updated successfully');
    } catch (error) {
      console.error('Error updating payout settings:', error);
      toast.error('Failed to update payout settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
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
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your creator profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.avatar_url || ''} alt={profileData.full_name} />
                  <AvatarFallback>{profileData.username?.substring(0, 2)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatar_url">Profile Picture URL</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    value={profileData.avatar_url}
                    onChange={handleInputChange}
                    placeholder="Enter URL for your profile picture"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a URL for your profile picture or upload an image (coming soon).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell others about yourself"
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure your payment and payout options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-md bg-muted">
                <h3 className="text-lg font-semibold mb-2">Stripe Connect</h3>
                <p className="mb-4">
                  {stripeConnected 
                    ? `Connected to Stripe (Account ID: ${stripeAccountId})` 
                    : 'Connect your Stripe account to receive payouts directly to your bank account.'}
                </p>
                
                <Button 
                  onClick={handleConnectStripe}
                  variant={stripeConnected ? "outline" : "default"}
                >
                  {stripeConnected ? 'Reconnect Stripe Account' : 'Connect Stripe Account'}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payout_method">Preferred Payout Method</Label>
                <Select 
                  value={profileData.payout_method} 
                  onValueChange={(value) => handleSelectChange('payout_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe (Bank Transfer)</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
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
                    onChange={handleInputChange}
                    placeholder="Enter your mobile money number"
                  />
                </div>
              )}
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Platform Fees</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The platform charges a 10% fee on all transactions. This fee covers payment processing costs and platform maintenance.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={savePayoutSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new registrations, payments, and messages via email.
                  </p>
                </div>
                <Switch id="emailNotifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="registrationAlerts">Registration Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone registers for your events or courses.
                  </p>
                </div>
                <Switch id="registrationAlerts" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="paymentAlerts">Payment Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you receive payments or payouts.
                  </p>
                </div>
                <Switch id="paymentAlerts" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive tips, updates, and promotional offers from the platform.
                  </p>
                </div>
                <Switch id="marketingEmails" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  This is the email address associated with your account.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CreatorLayout>
  );
};

export default CreatorSettings;
