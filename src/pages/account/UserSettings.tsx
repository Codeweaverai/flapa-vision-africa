
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('account');
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
    
    // Check if we should open the creator application dialog
    if (searchParams.get('apply') === 'creator') {
      setCreatorDialogOpen(true);
    }
  }, [user, searchParams]);

  const fetchUserProfile = async () => {
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
      
      setProfile(data);
      
      // Initialize form values
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setBio(data.bio || '');
      setWebsite(data.website || '');
      setEmailNotifications(data.email_notifications !== false);
      setMarketingEmails(data.marketing_emails === true);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load your profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const updates = {
        id: user.id,
        full_name: fullName,
        username,
        bio,
        website,
        email_notifications: emailNotifications,
        marketing_emails: marketingEmails,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      setProfile({...profile, ...updates});
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyForCreator = async () => {
    try {
      setSaving(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const updates = {
        id: user.id,
        is_creator_pending: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Creator application submitted successfully');
      setCreatorDialogOpen(false);
      // Update local state
      setProfile({...profile, is_creator_pending: true});
    } catch (error) {
      console.error('Error applying for creator status:', error);
      toast.error('Failed to submit creator application');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // This would be implemented with appropriate confirmation steps
    toast.info('Account deletion is not yet available');
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
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="creator">Creator Settings</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details and public profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>Update your email address or change your password</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                    />
                    <Button className="ml-2" variant="outline">Change</Button>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline">Change Password</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. This action is permanent.
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive notifications about your account via email</p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-muted-foreground">Receive emails about new features and promotions</p>
                  </div>
                  <Switch 
                    checked={marketingEmails} 
                    onCheckedChange={setMarketingEmails} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Creator Settings Tab */}
          <TabsContent value="creator">
            <Card>
              <CardHeader>
                <CardTitle>Creator Status</CardTitle>
                <CardDescription>Manage your creator account settings</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.is_creator ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Badge variant="success" className="mr-2">Active Creator</Badge>
                      <p className="text-sm text-muted-foreground">You're an approved creator and can publish content</p>
                    </div>
                    <Button variant="outline">Access Creator Dashboard</Button>
                  </div>
                ) : profile.is_creator_pending ? (
                  <div className="p-4 bg-muted rounded-md">
                    <h3 className="font-medium mb-2">Creator Application Pending</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your application is being reviewed. We'll notify you once it's approved.
                    </p>
                    <Badge variant="outline">Pending Review</Badge>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Become a creator to publish courses, events, and other content on our platform.
                    </p>
                    <Dialog open={creatorDialogOpen} onOpenChange={setCreatorDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>Apply to be a Creator</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Creator Application</DialogTitle>
                          <DialogDescription>
                            Fill out this form to apply for creator status. Once approved, you'll be able to create and sell content.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="creatorBio">Professional Bio</Label>
                            <Textarea
                              id="creatorBio"
                              placeholder="Tell us about your background and expertise"
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="socialLinks">Social Media Links</Label>
                            <Input
                              id="socialLinks"
                              placeholder="LinkedIn, Twitter, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contentPlans">What do you plan to create?</Label>
                            <Textarea
                              id="contentPlans"
                              placeholder="Describe the courses, events, or content you plan to create"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreatorDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleApplyForCreator} disabled={saving}>
                            {saving ? 'Submitting...' : 'Submit Application'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Current Plan: Free</h3>
                    <p className="text-sm text-muted-foreground">Basic access to platform features</p>
                  </div>
                  <Button>Upgrade</Button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <p className="text-sm text-muted-foreground">No payment method on file</p>
                  <Button variant="outline" className="mt-2">Add Payment Method</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserAccountLayout>
  );
};

export default UserSettings;
