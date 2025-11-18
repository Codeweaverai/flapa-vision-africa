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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LayoutDashboard, ChevronRight, User, UserPlus, Settings, ExternalLink, Heart, BookOpen, Mail, Shield, Clock, Star, Users, Award, Globe, CreditCard, FileText, Gift, MessageSquare, Calendar, ShoppingCart, Bell } from 'lucide-react';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';
import CurrencySwitcher from '@/components/currency/CurrencySwitcher';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/constants/currencies';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  avatar_storage_path: string | null;
  is_creator: boolean;
  role: string;
  push_notifications_enabled?: boolean;
  push_interests?: string[];
  push_last_subscribed?: string;
  push_last_unsubscribed?: string;
}

interface UserStats {
  courses_enrolled: number;
  events_booked: number;
}

interface CreatorStats {
  courses_created: number;
  events_created: number;
  total_students: number;
  total_earnings: number;
}

interface LanguagePreference {
  user_id: string;
  language_code: string;
  updated_at: string;
  created_at: string;
}

interface CurrencyPreference {
  id: string;
  user_id: string;
  default_currency: string;
  country_code: string;
  detected_by_ip: boolean;
  ip_address: string;
  device_currency: string;
  created_at: string;
  updated_at: string;
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

// Single language option - English only
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

// Quick Links data
const QUICK_LINKS = [
  { href: '/my-orders', label: 'My Orders', icon: ShoppingCart, color: 'text-blue-500' },
  { href: '/inbox', label: 'My Inbox', icon: MessageSquare, color: 'text-green-500' },
  { href: '/my-courses', label: 'My Courses', icon: BookOpen, color: 'text-orange-500' },
  { href: '/my-events', label: 'My Events', icon: Calendar, color: 'text-purple-500' },
  { href: '/community', label: 'Community', icon: Users, color: 'text-indigo-500' },
  { href: '/wishlist', label: 'Wishlist', icon: Heart, color: 'text-pink-500' },
];

const AccountPage = () => {
  const { user } = useAuth();
  const { currentCurrency, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingCreator, setEnablingCreator] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ 
    courses_enrolled: 0, 
    events_booked: 0 
  });
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({ 
    courses_created: 0, 
    events_created: 0, 
    total_students: 0, 
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
    role: 'user',
    push_notifications_enabled: false,
    push_interests: ['hello'],
    push_last_subscribed: undefined,
    push_last_unsubscribed: undefined
  });
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>({
    user_id: '',
    language_code: 'en',
    updated_at: '',
    created_at: ''
  });
  const [currencyPreference, setCurrencyPreference] = useState<CurrencyPreference>({
    id: '',
    user_id: '',
    default_currency: 'USD',
    country_code: '',
    detected_by_ip: false,
    ip_address: '',
    device_currency: '',
    created_at: '',
    updated_at: ''
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
            push_notifications_enabled: data.push_notifications_enabled || false,
            push_interests: data.push_interests || ['hello'],
            push_last_subscribed: data.push_last_subscribed,
            push_last_unsubscribed: data.push_last_unsubscribed
          });

          // Fetch user stats (courses enrolled and events booked)
          await fetchUserStats(user.id);

          // Fetch creator stats if user is a creator
          if (data.is_creator) {
            await fetchCreatorStats(data.id);
          }

          // Fetch user preferences
          await fetchUserPreferences(data.id);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const fetchUserStats = async (userId: string) => {
    try {
      // Fetch courses enrolled count
      const { count: coursesEnrolled } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch events booked count
      const { count: eventsBooked } = await supabase
        .from('event_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setUserStats({
        courses_enrolled: coursesEnrolled || 0,
        events_booked: eventsBooked || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchCreatorStats = async (userId: string) => {
    try {
      // Fetch courses created count
      const { count: coursesCreated } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Fetch events created count
      const { count: eventsCreated } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Fetch total students (count unique enrollments across creator's courses)
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
        courses_created: coursesCreated || 0,
        events_created: eventsCreated || 0,
        total_students: uniqueStudents || 0,
        total_earnings: 0 // You can implement earnings logic based on your payment system
      });
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    try {
      // Fetch language preference
      const { data: languageData, error: languageError } = await supabase
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (languageError && languageError.code !== 'PGRST116') {
        console.error('Error fetching language preference:', languageError);
      }

      if (languageData) {
        setLanguagePreference(languageData);
      } else {
        // Create default language preference if it doesn't exist
        const { data: newLanguagePref } = await supabase
          .from('user_language_preferences')
          .insert({
            user_id: userId,
            language_code: 'en'
          })
          .select()
          .single();

        if (newLanguagePref) {
          setLanguagePreference(newLanguagePref);
        }
      }

      // Fetch currency preference
      const { data: currencyData, error: currencyError } = await supabase
        .from('user_currency_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (currencyError && currencyError.code !== 'PGRST116') {
        console.error('Error fetching currency preference:', currencyError);
      }

      if (currencyData) {
        setCurrencyPreference(currencyData);
      } else {
        // Create default currency preference if it doesn't exist
        const { data: newCurrencyPref } = await supabase
          .from('user_currency_preferences')
          .insert({
            user_id: userId,
            default_currency: 'USD'
          })
          .select()
          .single();

        if (newCurrencyPref) {
          setCurrencyPreference(newCurrencyPref);
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
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

  const handleSavePreferences = async () => {
    if (!user) return;

    setSavingPreferences(true);
    try {
      // Update language preference
      const { error: languageError } = await supabase
        .from('user_language_preferences')
        .upsert({
          user_id: user.id,
          language_code: languagePreference.language_code,
          updated_at: new Date().toISOString()
        });

      if (languageError) throw languageError;

      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePushNotificationToggle = async () => {
    if (!user) return;

    setNotificationLoading(true);
    try {
      const action = profile.push_notifications_enabled ? 'unsubscribe' : 'subscribe';
      
      // Check browser support
      if (!('Notification' in window)) {
        toast.error('Browser not supported', {
          description: 'Your browser does not support push notifications.'
        });
        return;
      }

      // Request permission if subscribing
      if (action === 'subscribe') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Permission denied', {
            description: 'Please allow notifications in your browser settings.'
          });
          return;
        }
      }

      // Only update the tracking in the database
      const { data, error } = await supabase.functions.invoke('subscribe-push', {
        body: {
          action: action,
          interests: ['hello', `user_${user.id}`]
        }
      });

      if (error) throw error;

      // Update local state
      setProfile(prev => ({
        ...prev,
        push_notifications_enabled: action === 'subscribe',
        push_last_subscribed: action === 'subscribe' ? new Date().toISOString() : prev.push_last_subscribed,
        push_last_unsubscribed: action === 'unsubscribe' ? new Date().toISOString() : prev.push_last_unsubscribed
      }));

      // Show success message
      if (action === 'subscribe') {
        toast.success('Push notifications enabled!', {
          description: 'You will now receive browser notifications for important updates.'
        });
        
        // The actual Pusher Beams subscription is handled by your PushNotificationSetup component
        // It will automatically detect the permission change and subscribe
      } else {
        toast.success('Push notifications disabled', {
          description: 'You will no longer receive browser notifications.'
        });
      }

    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setNotificationLoading(false);
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
          {/* Updated Header Section - Left Aligned */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 text-orange-500">
              My Account
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Manage your profile, track your progress, and unlock creator features
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Sidebar - Quick Stats & Links */}
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
                            {userStats.courses_enrolled}
                          </div>
                          <div className="text-xs text-gray-500">Courses Enrolled</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                            {userStats.events_booked}
                          </div>
                          <div className="text-xs text-gray-500">Events Booked</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-gray-800">
                    <Settings className="h-5 w-5 mr-2 text-purple-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {QUICK_LINKS.map((link, index) => {
                    const IconComponent = link.icon;
                    return (
                      <Button
                        key={link.href}
                        variant="outline"
                        className="w-full justify-start h-12 bg-white/50 hover:bg-orange-50 border-orange-200 text-gray-700 hover:text-orange-600 transition-all duration-300 shadow-sm group"
                        asChild
                      >
                        <a href={link.href}>
                          <IconComponent className={`h-4 w-4 mr-3 ${link.color} group-hover:scale-110 transition-transform`} />
                          {link.label}
                          <ChevronRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-orange-500 transition-colors" />
                        </a>
                      </Button>
                    );
                  })}
                  
                  {/* Public Profile Link for Creators */}
                  {profile.is_creator && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 bg-gradient-to-r from-orange-50 to-purple-50 border-purple-200 text-gray-700 hover:text-purple-600 transition-all duration-300 shadow-sm group mt-4"
                      asChild
                    >
                      <a href={`/creator/profile/${user.id}`}>
                        <ExternalLink className="h-4 w-4 mr-3 text-purple-500 group-hover:scale-110 transition-transform" />
                        View Public Profile
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </a>
                    </Button>
                  )}
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

              {/* Preferences & Creator Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Settings Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-800">
                      <Settings className="h-6 w-6 mr-2 text-purple-500" />
                      Profile Settings
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Customize your language, currency, and notification preferences
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Language Preference - Single English Option */}
                    <div className="space-y-3">
                      <Label htmlFor="language" className="text-gray-700 font-medium flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-orange-500" />
                        Preferred Language
                      </Label>
                      <Select
                        value={languagePreference.language_code}
                        onValueChange={(value) => setLanguagePreference(prev => ({ ...prev, language_code: value }))}
                      >
                        <SelectTrigger className="border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500/20">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🇺🇸</span>
                              <span>English</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{language.flag}</span>
                                <div>
                                  <span className="font-medium">{language.name}</span>
                                  <span className="text-gray-500 text-sm ml-2">({language.nativeName})</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Currently only English is supported. More languages coming soon!
                      </p>
                    </div>

                    {/* Currency Preference - Now using CurrencySwitcher */}
                    <div className="space-y-3">
                      <Label htmlFor="currency" className="text-gray-700 font-medium flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                        Preferred Currency
                      </Label>
                      <div className="border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                        <CurrencySwitcher />
                      </div>
                      <p className="text-xs text-gray-500">
                        Prices will be displayed in your selected currency
                      </p>
                    </div>

                    {/* Push Notifications Toggle */}
                    <div className="space-y-3">
                      <Label htmlFor="notifications" className="text-gray-700 font-medium flex items-center">
                        <Bell className="h-4 w-4 mr-2 text-orange-500" />
                        Push Notifications
                      </Label>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200/50">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Bell className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Browser Notifications</h4>
                            <p className="text-sm text-gray-600">
                              Receive updates about courses, events, and messages
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handlePushNotificationToggle}
                          disabled={notificationLoading}
                          variant={profile.push_notifications_enabled ? "default" : "outline"}
                          className={`${
                            profile.push_notifications_enabled 
                              ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg' 
                              : 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
                          } transition-all duration-300 min-w-20`}
                        >
                          {notificationLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : profile.push_notifications_enabled ? (
                            'Enabled'
                          ) : (
                            'Enable'
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {profile.push_notifications_enabled 
                          ? 'You will receive browser notifications for important updates'
                          : 'Enable to get notified about new courses, events, and messages'
                        }
                      </p>
                    </div>

                    {/* Current Settings Summary */}
                    <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200/50">
                      <h4 className="font-semibold text-gray-800 mb-3">Current Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Language:</span>
                          <div className="font-medium text-gray-800 flex items-center gap-2 mt-1">
                            <span>🇺🇸</span>
                            <span>English</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Currency:</span>
                          <div className="font-medium text-gray-800 flex items-center gap-2 mt-1">
                            <span>{SUPPORTED_CURRENCIES[currentCurrency as CurrencyCode]?.flag}</span>
                            <span>{currentCurrency} - {SUPPORTED_CURRENCIES[currentCurrency as CurrencyCode]?.name}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Notifications:</span>
                          <div className="font-medium text-gray-800 flex items-center gap-2 mt-1">
                            <Bell className={`h-4 w-4 ${profile.push_notifications_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                            <span>{profile.push_notifications_enabled ? 'Enabled' : 'Disabled'}</span>
                            {profile.push_last_subscribed && (
                              <span className="text-xs text-gray-500 ml-2">
                                since {new Date(profile.push_last_subscribed).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 py-3 text-base font-semibold"
                    >
                      {savingPreferences ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving Preferences...
                        </>
                      ) : (
                        'Save All Preferences'
                      )}
                    </Button>
                  </CardFooter>
                </Card>

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
                            <div className="text-2xl font-bold text-gray-800">{creatorStats.courses_created}</div>
                            <div className="text-xs text-gray-600">Courses Created</div>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl text-center shadow-lg">
                            <Calendar className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{creatorStats.events_created}</div>
                            <div className="text-xs text-gray-600">Events Created</div>
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
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default AccountPage;
