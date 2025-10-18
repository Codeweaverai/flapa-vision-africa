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
import { LayoutDashboard, ChevronRight, User, UserPlus, Settings, ExternalLink, BookOpen, Mail, Shield, Clock, Star, Users, Award } from 'lucide-react';
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
}

interface CreatorStats {
  courses: number;
  events: number;
  students: number;
  total_earnings: number;
}

// Enhanced Pulse Loading Component for Account Page
const AccountPulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-purple-100">
      <Layout>
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Enhanced Pulse Animation Container */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              {/* Outer Pulse Ring */}
              <div className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-orange-400/10 to-purple-600/10 animate-ping" />
              
              {/* Middle Pulse Ring */}
              <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-pulse" />
              
              {/* Inner Pulse Ring */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Center Icon with Gradient */}
              <div className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-white/50">
                <User className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Enhanced Loading Text */}
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-clip-text text-transparent animate-pulse">
                Loading Your Profile
              </h3>
              <p className="text-gray-600 text-lg font-medium">
                Getting your account information ready...
              </p>
            </div>

            {/* Enhanced Progress Dots */}
            <div className="flex space-x-3 mt-8">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 animate-bounce shadow-lg" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 animate-bounce shadow-lg" style={{ animationDelay: '150ms' }} />
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 animate-bounce shadow-lg" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingCreator, setEnablingCreator] = useState(false);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({ 
    courses: 0, 
    events: 0, 
    students: 0, 
    total_earnings: 0 
  });
  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    avatar_storage_path: null,
    is_creator: false,
    role: 'user'
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
            role: data.role || 'user'
          });

          // Fetch creator stats if user is a creator
          if (data.is_creator) {
            await fetchCreatorStats(data.id);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const fetchCreatorStats = async (userId: string) => {
    try {
      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Fetch events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Fetch total students (simplified - count unique enrollments across creator's courses)
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .in('course_id', 
          await supabase
            .from('courses')
            .select('id')
            .eq('creator_id', userId)
            .then(({ data }) => data?.map(c => c.id) || [])
        );

      const uniqueStudents = new Set(enrollments?.map(e => e.user_id)).size;

      setCreatorStats({
        courses: coursesCount || 0,
        events: eventsCount || 0,
        students: uniqueStudents || 0,
        total_earnings: 0 // You can implement earnings logic based on your payment system
      });
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    }
  };

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
      
      toast.success('Profile picture updated successfully');
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
        is_creator: true
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
    navigate('/creator/dashboard');
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
    return <AccountPulseLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-purple-100">
      <Layout>
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Enhanced Header Section */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-clip-text text-transparent">
              My Account
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your profile, track your progress, and unlock creator features
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Sidebar - Quick Stats */}
            <div className="xl:col-span-1 space-y-6">
              {/* User Profile Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-white/80 shadow-2xl">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xl font-bold">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Active
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-800">{profile.full_name || 'User'}</h3>
                      <p className="text-gray-600 text-sm">@{profile.username || 'username'}</p>
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg">
                        {profile.is_creator ? '🎨 Creator' : '👤 Learner'}
                      </Badge>
                    </div>
                    
                    <div className="w-full pt-4 border-t border-gray-200/50">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                            {creatorStats.courses}
                          </div>
                          <div className="text-xs text-gray-500">Courses</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                            {creatorStats.students}
                          </div>
                          <div className="text-xs text-gray-500">Students</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status Card */}
              <Card className="bg-gradient-to-br from-orange-500/10 to-purple-600/10 border-0 shadow-2xl backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-gray-800">
                    <Shield className="h-5 w-5 mr-2 text-orange-500" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <Badge variant={user?.email_confirmed_at ? "default" : "secondary"} 
                      className={user?.email_confirmed_at ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                      {user?.email_confirmed_at ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-orange-500" />
                      <span className="text-sm font-medium">Role</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      {profile.role || 'User'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="text-sm font-medium">Member Since</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-8">
              {/* Profile Information Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Update your personal details and public information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Profile Picture Upload Section */}
                      <div className="flex flex-col items-center space-y-6 lg:w-1/3">
                        <ProfilePictureUpload 
                          currentImageUrl={profile.avatar_url} 
                          username={profile.username}
                          onUploadComplete={handleProfilePictureUpload}
                        />
                        <div className="text-center space-y-2">
                          <h4 className="font-semibold text-gray-800">Profile Photo</h4>
                          <p className="text-sm text-gray-500">
                            Upload a clear photo to help others recognize you
                          </p>
                        </div>
                      </div>
                      
                      {/* Form Fields */}
                      <div className="space-y-6 lg:w-2/3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                            <Input
                              id="email"
                              value={user.email || ''}
                              disabled
                              className="bg-gray-50/80 border-gray-200 shadow-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Your email cannot be changed
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                            <Input
                              id="username"
                              name="username"
                              value={profile.username}
                              onChange={handleChange}
                              className="border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-gray-700 font-medium">Full Name</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={profile.full_name}
                            onChange={handleChange}
                            className="border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-gray-700 font-medium">Bio</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            rows={4}
                            value={profile.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            className="border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500/20 resize-none"
                          />
                          <p className="text-xs text-gray-500">
                            Share your interests, expertise, or a brief introduction
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-gray-200/50 pt-6">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || loading}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Creator Dashboard & Quick Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Creator Dashboard Card */}
                <Card className="bg-gradient-to-br from-orange-500/5 to-purple-600/10 border-0 shadow-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-800">
                      <LayoutDashboard className="h-6 w-6 mr-2 text-orange-500" />
                      Creator Dashboard
                    </CardTitle>
                    {profile.is_creator ? (
                      <CardDescription className="text-gray-600">
                        Access your creator tools and manage your content
                      </CardDescription>
                    ) : (
                      <CardDescription className="text-gray-600">
                        Become a creator to publish courses and events
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    {profile.is_creator ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl shadow-sm">
                          <Avatar className="h-14 w-14 ring-2 ring-white/80 shadow-lg">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                              {getInitials(profile.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-gray-800">{profile.full_name}</p>
                            <p className="text-sm text-gray-600">Verified Creator</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/60 p-4 rounded-xl text-center shadow-lg">
                            <BookOpen className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{creatorStats.courses}</div>
                            <div className="text-xs text-gray-600">Courses</div>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl text-center shadow-lg">
                            <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{creatorStats.students}</div>
                            <div className="text-xs text-gray-600">Students</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-white/50 rounded-xl shadow-sm">
                          <User className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-800">Create and Share</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Publish courses and events to share your expertise with the world
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-white/50 rounded-xl shadow-sm">
                          <UserPlus className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-800">Build Your Audience</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Connect with students and grow your professional following
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 py-3 text-base font-semibold"
                      onClick={profile.is_creator ? handleCreatorDashboardClick : handleEnableCreatorMode}
                      disabled={enablingCreator}
                    >
                      {profile.is_creator ? (
                        <>
                          Go to Creator Dashboard
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </>
                      ) : (
                        <>
                          {enablingCreator ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Enabling...
                            </>
                          ) : (
                            <>
                              Enable Creator Mode
                              <ChevronRight className="h-5 w-5 ml-2" />
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Quick Actions Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-800">
                      <Settings className="h-6 w-6 mr-2 text-purple-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.is_creator && (
                      <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-orange-50 border-orange-200 text-gray-700 hover:text-orange-600 transition-all duration-300 shadow-sm" asChild>
                        <a href={`/creator/profile/${user.id}`}>
                          <ExternalLink className="h-4 w-4 mr-3" />
                          View Public Profile
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-purple-50 border-purple-200 text-gray-700 hover:text-purple-600 transition-all duration-300 shadow-sm" asChild>
                      <a href="/my-orders">
                        My Orders
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-orange-50 border-orange-200 text-gray-700 hover:text-orange-600 transition-all duration-300 shadow-sm" asChild>
                      <a href="/inbox">
                        My Inbox
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-purple-50 border-purple-200 text-gray-700 hover:text-purple-600 transition-all duration-300 shadow-sm" asChild>
                      <a href="/my-courses">
                        My Courses
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-orange-50 border-orange-200 text-gray-700 hover:text-orange-600 transition-all duration-300 shadow-sm" asChild>
                      <a href="/my-events">
                        My Events
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-purple-50 border-purple-200 text-gray-700 hover:text-purple-600 transition-all duration-300 shadow-sm" asChild>
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
        </div>
      </Layout>
    </div>
  );
};

export default AccountPage;
