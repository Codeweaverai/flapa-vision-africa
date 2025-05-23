
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, KeyRound, Bell, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailUpdates: false,
    newCourses: false,
    newEvents: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        
        // Also fetch notification settings if you have them
        // For now using dummy data
        setNotificationSettings({
          emailUpdates: true,
          newCourses: false,
          newEvents: true,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // In a real app, you'd save this to the database
    toast.success(`Notification setting updated`);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploading(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);
      
      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setProfile({ ...profile, avatar_url: publicUrl });
      
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading && !profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile details and photo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Avatar className="h-20 w-20 border-2 border-muted">
                      {profile?.avatar_url ? (
                        <AvatarImage 
                          src={profile.avatar_url} 
                          alt={profile.full_name || user?.email} 
                        />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {(profile?.full_name?.[0] || user?.email?.[0] || '').toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <Label htmlFor="avatar" className="mb-2 block">Profile Picture</Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleUploadAvatar}
                        disabled={uploading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF. 1MB max.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profile?.username || ''}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      To change these details, please visit your profile page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>Update your password and manage security settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          value={passwordData.confirmNewPassword}
                          onChange={e => setPasswordData({...passwordData, confirmNewPassword: e.target.value})}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Update Password
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Updates</h3>
                        <p className="text-muted-foreground text-sm">
                          Receive general updates about your account
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailUpdates}
                        onCheckedChange={() => handleNotificationChange('emailUpdates')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">New Courses</h3>
                        <p className="text-muted-foreground text-sm">
                          Get notified when new courses are added
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.newCourses}
                        onCheckedChange={() => handleNotificationChange('newCourses')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Event Reminders</h3>
                        <p className="text-muted-foreground text-sm">
                          Get notified about upcoming events
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.newEvents}
                        onCheckedChange={() => handleNotificationChange('newEvents')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
