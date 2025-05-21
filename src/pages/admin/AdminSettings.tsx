
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { getStripeAccountStatus, connectStripeAccount } from '@/services/paymentService';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState('');
  
  useEffect(() => {
    loadSettings();
    checkStripeStatus();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSiteName(data.site_name || '');
        setSiteDescription(data.site_description || '');
        setContactEmail(data.contact_email || '');
        setEnableRegistration(data.enable_registration !== false);
        setRequireEmailVerification(data.require_email_verification !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { isConnected, accountId } = await getStripeAccountStatus(user.id);
      setStripeConnected(isConnected);
      setStripeAccountId(accountId || '');
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to connect Stripe');
        return;
      }
      
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

  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1, // Assuming a single settings record
          site_name: siteName,
          site_description: siteDescription,
          contact_email: contactEmail,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      toast.success('General settings saved successfully');
    } catch (error) {
      console.error('Error saving general settings:', error);
      toast.error('Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  const saveAuthSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1, // Assuming a single settings record
          enable_registration: enableRegistration,
          require_email_verification: requireEmailVerification,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      toast.success('Authentication settings saved successfully');
    } catch (error) {
      console.error('Error saving auth settings:', error);
      toast.error('Failed to save authentication settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general site settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="Enter site description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Enter contact email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={saveGeneralSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save General Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
              <CardDescription>
                Configure user authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="enableRegistration" className="flex-1">
                  Enable User Registration
                </Label>
                <Switch
                  id="enableRegistration"
                  checked={enableRegistration}
                  onCheckedChange={setEnableRegistration}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="requireEmailVerification" className="flex-1">
                  Require Email Verification
                </Label>
                <Switch
                  id="requireEmailVerification"
                  checked={requireEmailVerification}
                  onCheckedChange={setRequireEmailVerification}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={saveAuthSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Authentication Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment and Stripe integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-muted">
                <h3 className="text-lg font-semibold mb-2">Stripe Connect Status</h3>
                <p className="mb-4">
                  {stripeConnected 
                    ? `Connected to Stripe (Account ID: ${stripeAccountId})` 
                    : 'Not connected to Stripe'}
                </p>
                
                <Button 
                  onClick={handleConnectStripe}
                  variant={stripeConnected ? "outline" : "default"}
                >
                  {stripeConnected ? 'Reconnect Stripe Account' : 'Connect Stripe Account'}
                </Button>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-2">Platform Fees</h3>
                <div className="space-y-2">
                  <Label htmlFor="platformFee">Platform Fee (%)</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    placeholder="Enter platform fee percentage"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue="10"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the percentage fee that your platform will take from each transaction.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
