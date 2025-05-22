
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';

interface UserSettings {
  full_name: string;
  username: string;
  bio: string;
  website?: string;
  email_notifications?: boolean;
  marketing_emails?: boolean;
}

const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    email_notifications: true,
    marketing_emails: false
  });

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Set the data we have and provide defaults for fields that might not exist
      setSettings({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        // Provide default values for optional fields that might not exist in the database
        website: '',
        email_notifications: true,
        marketing_emails: false
      });
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast.error('Failed to load your settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Only update fields that are guaranteed to exist in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: settings.full_name,
          username: settings.username,
          bio: settings.bio,
          // Additional fields may need a migration to be added to the table
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UserAccountLayout activeTab="settings">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </UserAccountLayout>
    );
  }

  return (
    <UserAccountLayout activeTab="settings">
      <div>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilePictureUpload />
            </CardContent>
          </Card>
          
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name" 
                    name="full_name" 
                    value={settings.full_name} 
                    onChange={handleChange} 
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    value={settings.username} 
                    onChange={handleChange} 
                    placeholder="Your username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={settings.bio} 
                    onChange={handleChange} 
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    name="website" 
                    value={settings.website} 
                    onChange={handleChange} 
                    placeholder="https://your-website.com"
                  />
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <Switch 
                      id="email_notifications"
                      checked={settings.email_notifications || false}
                      onCheckedChange={(checked) => handleSwitchChange('email_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketing_emails">Marketing Emails</Label>
                    <Switch 
                      id="marketing_emails"
                      checked={settings.marketing_emails || false}
                      onCheckedChange={(checked) => handleSwitchChange('marketing_emails', checked)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </UserAccountLayout>
  );
};

export default UserSettings;
