import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { Edit, Check, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';

const AccountPage = () => {
  const { user, signOut, updateUser } = useAuth();
  const [profile, setProfile] = useState<{
    id: string | undefined;
    email: string | undefined;
    full_name: string | null | undefined;
    avatar_url: string | null | undefined;
    is_creator: boolean | null | undefined;
  }>({
    id: user?.id,
    email: user?.email,
    full_name: null,
    avatar_url: null,
    is_creator: false,
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`full_name, avatar_url, is_creator`)
            .eq('id', user.id)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setProfile(prevProfile => ({
              ...prevProfile,
              full_name: data.full_name,
              avatar_url: data.avatar_url,
              is_creator: data.is_creator,
            }));
            setNewFullName(data.full_name || '');
            setNewAvatarUrl(data.avatar_url || '');
          }
        } catch (error: any) {
          console.error("Error fetching profile:", error.message);
          toast("Failed to fetch profile data.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: newFullName,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Update local state
      setProfile(prevProfile => ({
        ...prevProfile,
        full_name: newFullName,
        avatar_url: newAvatarUrl,
      }));

      // Update AuthContext if needed
      if (user) {
        updateUser({
          ...user,
          user_metadata: {
            ...user?.user_metadata,
            full_name: newFullName,
            avatar_url: newAvatarUrl,
          },
        });
      }

      toast("Profile updated successfully!");
      setEditMode(false);
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatorRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_creator: true,
        })
        .eq('id', user?.id);
        
      if (error) {
        throw error;
      }
      
      setProfile(prevProfile => ({
        ...prevProfile,
        is_creator: true,
      }));
      
      toast("Creator access requested!");
    } catch (error: any) {
      console.error("Error requesting creator access:", error.message);
      toast("Failed to request creator access.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex justify-center items-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information Card */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || "Avatar"} />
                  <AvatarFallback>{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{profile.full_name || "No Name"}</h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                {editMode ? (
                  <Input
                    id="full_name"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                  />
                ) : (
                  <Input id="full_name" value={profile.full_name || ""} disabled />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                {editMode ? (
                  <Input
                    id="avatar_url"
                    value={newAvatarUrl}
                    onChange={(e) => setNewAvatarUrl(e.target.value)}
                  />
                ) : (
                  <Input id="avatar_url" value={profile.avatar_url || ""} disabled />
                )}
              </div>

              <div className="flex justify-end space-x-2">
                {editMode ? (
                  <>
                    <Button variant="secondary" onClick={toggleEditMode}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} disabled={loading}>
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Update <Check className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={toggleEditMode}>
                    Edit Profile <Edit className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold">Actions</h2>
              <Button variant="destructive" className="w-full" onClick={handleSignOut} disabled={loading}>
                Sign Out
              </Button>
              
              {!profile.is_creator && (
                <Button className="w-full" onClick={handleCreatorRequest} disabled={loading}>
                  Request Creator Access
                </Button>
              )}
              
              {profile.is_creator && (
                <Button asChild className="w-full">
                  <Link to="/creator/dashboard">
                    Go to Creator Dashboard
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
