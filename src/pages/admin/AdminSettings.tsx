
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'SkillPulse',
    siteDescription: 'Platform for entrepreneurs to develop skills',
    contactEmail: 'support@skillpulse.com',
    maxUploadSize: '100',
  });

  const [wasabiSettings, setWasabiSettings] = useState({
    accessKey: 'T4IRLRM3YEE4VOMEEC3X',
    secretKey: '************',
    bucket: 'skillpulse',
    region: 'us-east-1',
    endpoint: 'https://s3.us-east-1.wasabisys.com',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newRegistrationAlert: true,
    courseCompletionAlert: true,
    paymentNotifications: true,
  });

  const handleGeneralSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleWasabiSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWasabiSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveSettings = async (settingType: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${settingType} settings saved successfully`);
    } catch (error) {
      console.error(`Error saving ${settingType} settings:`, error);
      toast.error(`Failed to save ${settingType} settings`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">System Settings</h1>
        
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="wasabi">Storage Configuration</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic information about your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={generalSettings.siteName}
                      onChange={handleGeneralSettingChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={handleGeneralSettingChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    name="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={handleGeneralSettingChange}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUploadSize">Maximum Upload Size (MB)</Label>
                  <Input
                    id="maxUploadSize"
                    name="maxUploadSize"
                    type="number"
                    value={generalSettings.maxUploadSize}
                    onChange={handleGeneralSettingChange}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings('General')} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="wasabi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wasabi Storage Configuration</CardTitle>
                <CardDescription>
                  Configure your Wasabi storage settings for video and file uploads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessKey">Access Key</Label>
                    <Input
                      id="accessKey"
                      name="accessKey"
                      value={wasabiSettings.accessKey}
                      onChange={handleWasabiSettingChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      name="secretKey"
                      type="password"
                      value={wasabiSettings.secretKey}
                      onChange={handleWasabiSettingChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bucket">Bucket Name</Label>
                    <Input
                      id="bucket"
                      name="bucket"
                      value={wasabiSettings.bucket}
                      onChange={handleWasabiSettingChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      name="region"
                      value={wasabiSettings.region}
                      onChange={handleWasabiSettingChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    name="endpoint"
                    value={wasabiSettings.endpoint}
                    onChange={handleWasabiSettingChange}
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md mt-4 border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    Warning: These settings are used for file storage. Incorrect configuration may cause file upload/download failures.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings('Wasabi storage')} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure system notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Send email notifications for system events
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newRegistrationAlert">New Registration Alerts</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive alerts when new users register
                    </p>
                  </div>
                  <Switch
                    id="newRegistrationAlert"
                    checked={notificationSettings.newRegistrationAlert}
                    onCheckedChange={(checked) => handleSwitchChange('newRegistrationAlert', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="courseCompletionAlert">Course Completion Alerts</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive alerts when users complete courses
                    </p>
                  </div>
                  <Switch
                    id="courseCompletionAlert"
                    checked={notificationSettings.courseCompletionAlert}
                    onCheckedChange={(checked) => handleSwitchChange('courseCompletionAlert', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications about payments
                    </p>
                  </div>
                  <Switch
                    id="paymentNotifications"
                    checked={notificationSettings.paymentNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('paymentNotifications', checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings('Notification')} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment providers and options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stripeKey">Stripe API Key</Label>
                      <Input
                        id="stripeKey"
                        type="password"
                        value="sk_test_******************"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripePubKey">Stripe Public Key</Label>
                      <Input
                        id="stripePubKey"
                        value="pk_test_******************"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentWebhook">Payment Webhook URL</Label>
                    <Input
                      id="paymentWebhook"
                      value="https://your-site.com/api/webhooks/stripe"
                      readOnly
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch id="testMode" />
                    <Label htmlFor="testMode">Test Mode</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSaveSettings('Payment')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
