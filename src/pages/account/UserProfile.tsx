
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LayoutDashboard, ChevronRight, User, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
        
      if (error) throw error;
      
      setProfile({
        ...profile,
        ...formData
      });
      
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
  
  const handleCreatorDashboardClick = () => {
    if (profile?.is_creator) {
      navigate('/creator');
    } else {
      // Navigate to creator application page
      navigate('/account/settings?apply=creator');
    }
  };

  if (loading) {
    return (
      <Layout>
        <UserAccountLayout activeTab="profile">
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </UserAccountLayout>
      </Layout>
    );
  }

  return (
    <Layout>
      <UserAccountLayout activeTab="profile">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal details and public information</CardDescription>
            </CardHeader>
            
            {editMode ? (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback>{getInitials(profile?.full_name || 'User')}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-xl font-semibold">{profile?.full_name || 'No name provided'}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                      {profile?.username && (
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Bio</h4>
                    <p className="text-muted-foreground">
                      {profile?.bio || 'No bio provided yet.'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Account Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {user?.email_confirmed_at ? 'Verified Email' : 'Unverified Email'}
                      </Badge>
                      
                      <Badge variant={profile?.is_creator ? 'default' : 'secondary'}>
                        {profile?.is_creator ? 'Creator' : 'User'}
                      </Badge>
                      
                      {profile?.role && (
                        <Badge variant="outline">{profile.role}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/account/settings">
                      Account Settings
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button onClick={() => setEditMode(true)}>
                    Edit Profile
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
          
          {/* Creator Dashboard Card */}
          <Card className="bg-gradient-to-br from-light-purple to-light-purple/70 border-none text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Creator Dashboard
              </CardTitle>
              {profile?.is_creator ? (
                <CardDescription className="text-foreground/80">
                  Access your creator tools and manage your content
                </CardDescription>
              ) : (
                <CardDescription className="text-foreground/80">
                  Become a creator to publish courses and events
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              {profile?.is_creator ? (
                <div className="space-y-4">
                  <p>
                    Access your creator dashboard to manage your courses, events, and track 
                    your earnings.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/20 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-xs">Courses</div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-xs">Events</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Create and Share</h4>
                      <p className="text-sm text-foreground/80">
                        Publish courses and events to share your expertise
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <UserPlus className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Build Your Audience</h4>
                      <p className="text-sm text-foreground/80">
                        Connect with students and grow your following
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={handleCreatorDashboardClick}
              >
                {profile?.is_creator ? (
                  <>Go to Creator Dashboard</>
                ) : (
                  <>Apply to Become a Creator</>
                )}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </UserAccountLayout>
    </Layout>
  );
};

export default UserProfile;
