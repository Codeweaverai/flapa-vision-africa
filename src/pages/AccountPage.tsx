import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { LayoutDashboard, ChevronRight, User, UserPlus, Settings } from 'lucide-react';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  avatar_storage_path: string | null;
  is_creator: boolean;
  role: string;
  creator_enabled_at: string | null;
}

const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingCreator, setEnablingCreator] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    avatar_storage_path: null,
    is_creator: false,
    role: 'user',
    creator_enabled_at: null
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

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          setProfile({
            id: data.id,
            username: data.username || '',
            full_name: data.full_name || '',
            avatar_url: data.avatar_url || '',
            bio: data.bio || '',
            avatar_storage_path: data.avatar_storage_path || null,
            is_creator: data.is_creator || false,
            role: data.role || 'user',
            creator_enabled_at: data.creator_enabled_at || null
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
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
  
  const handleProfilePictureUpload = async (url: string, path: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: url,
          avatar_storage_path: path,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        avatar_url: url,
        avatar_storage_path: path
      }));
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const handleEnableCreatorMode = async () => {
    if (!user) return;

    setEnablingCreator(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_creator: true,
          creator_enabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        is_creator: true,
        creator_enabled_at: new Date().toISOString()
      }));
      
      toast.success('Your Creator Dashboard has been Enabled');
    } catch (error) {
      console.error('Error enabling creator mode:', error);
      toast.error('Failed to enable creator mode');
    } finally {
      setEnablingCreator(false);
    }
  };

  const handleCreatorDashboardClick = () => {
    if (profile.is_creator) {
      navigate('/creator/dashboard');
    } else {
      // This shouldn't happen as button should be "Enable Creator Mode"
      toast.info('Please enable creator mode first');
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2)
      : 'U';
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">My Account</h1>
            <p className="text-xl text-muted-foreground">
              Manage your profile and account settings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and public information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center space-y-4 md:w-1/3">
                      <ProfilePictureUpload 
                        currentImageUrl={profile.avatar_url} 
                        username={profile.username}
                        onUploadComplete={handleProfilePictureUpload}
                      />
                    </div>
                    
                    <div className="space-y-4 md:w-2/3">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={user.email || ''}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Your email cannot be changed
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={profile.username}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={profile.full_name}
                          onChange={handleChange}
                        />
                      </div>
                    
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          rows={4}
                          value={profile.bio}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <Label>Account Status</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">
                            {user?.email_confirmed_at ? 'Verified Email' : 'Unverified Email'}
                          </Badge>
                          
                          <Badge variant={profile.is_creator ? 'default' : 'secondary'}>
                            {profile.is_creator ? 'Creator' : 'User'}
                          </Badge>
                          
                          {profile.role && profile.role !== 'user' && (
                            <Badge variant="outline">{profile.role}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving || loading}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Creator Dashboard Card */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LayoutDashboard className="h-5 w-5 mr-2" />
                    Creator Dashboard
                  </CardTitle>
                  {profile.is_creator ? (
                    <CardDescription>
                      Access your creator tools and manage your content
                    </CardDescription>
                  ) : (
                    <CardDescription>
                      Become a creator to publish courses and events
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  {profile.is_creator ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{profile.full_name}</p>
                          <p className="text-sm text-muted-foreground">Creator</p>
                        </div>
                      </div>
                      
                      <p className="text-sm">
                        Access your creator dashboard to manage your courses, events, and track 
                        your performance.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background/50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold">0</div>
                          <div className="text-xs text-muted-foreground">Courses</div>
                        </div>
                        <div className="bg-background/50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold">0</div>
                          <div className="text-xs text-muted-foreground">Events</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">Create and Share</h4>
                          <p className="text-sm text-muted-foreground">
                            Publish courses and events to share your expertise
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <UserPlus className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">Build Your Audience</h4>
                          <p className="text-sm text-muted-foreground">
                            Connect with students and grow your following
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter>
                  {profile.is_creator ? (
                    <Button 
                      className="w-full" 
                      onClick={handleCreatorDashboardClick}
                    >
                      Go to Creator Dashboard
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleEnableCreatorMode}
                      disabled={enablingCreator}
                    >
                      {enablingCreator ? 'Enabling...' : 'Enable Creator Mode'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/my-courses">
                      My Courses
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/my-events">
                      My Events
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/community">
                      Community
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default AccountPage;
