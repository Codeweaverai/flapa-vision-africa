
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import UserCourses from './account/UserCourses';
import UserEvents from './account/UserEvents';
import UserConsultations from './account/UserConsultations';
import UserProfile from './account/UserProfile';
import UserSettings from './account/UserSettings';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=/account');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching profile:', error.message);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Check for tab in URL params
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [user, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/account?tab=${value}`);
  };

  const handleAvatarUpload = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: url
      });
    }
  };

  if (!user) {
    return null; // Redirect is handled in useEffect
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar with Profile Card */}
          <div className="w-full md:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>My Account</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-32 h-32 mb-4">
                  <ProfilePictureUpload 
                    existingUrl={profile?.avatar_url || ''} 
                    onUploadComplete={handleAvatarUpload}
                  />
                </div>
                <h3 className="font-medium text-xl">{profile?.full_name}</h3>
                <p className="text-gray-500">@{profile?.username}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/account/settings')}>
                  Account Settings
                </Button>
              </CardFooter>
            </Card>
            
            {/* Navigation Tabs for Mobile */}
            <div className="md:hidden mt-6">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="hidden md:block">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="courses">My Courses</TabsTrigger>
                  <TabsTrigger value="events">My Events</TabsTrigger>
                  <TabsTrigger value="consultations">My Consultations</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile">
                <UserProfile />
              </TabsContent>
              
              <TabsContent value="courses">
                <UserCourses />
              </TabsContent>
              
              <TabsContent value="events">
                <UserEvents />
              </TabsContent>
              
              <TabsContent value="consultations">
                <UserConsultations />
              </TabsContent>
              
              <TabsContent value="settings">
                <UserSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
