
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fetchUserRegistrations, Registration, cancelRegistration } from '@/services/eventService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, User, MapPin, Video, ShieldCheck, Loader2 } from 'lucide-react';

const AccountPage = () => {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
          
          // Check if user is admin
          try {
            const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
            if (!isAdminError) {
              setIsAdmin(isAdminData);
            }
          } catch (err) {
            console.error('Error checking admin status:', err);
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    const getRegistrations = async () => {
      if (user) {
        try {
          const data = await fetchUserRegistrations(user);
          setRegistrations(data);
        } catch (error) {
          console.error('Error fetching registrations:', error);
        } finally {
          setLoadingRegistrations(false);
        }
      }
    };

    if (user) {
      getProfile();
      getRegistrations();
    }
  }, [user]);

  const handleCancelRegistration = async (registrationId: string) => {
    const success = await cancelRegistration(registrationId, user);
    if (success) {
      setRegistrations(registrations.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'cancelled' } : reg
      ));
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : 'U';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Your Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            {loadingProfile ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="bg-primary text-lg">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 text-center mb-4">
                  <h3 className="text-xl font-medium">{profile?.full_name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center">
                    <User className="h-3 w-3 mr-1" /> 
                    @{profile?.username || 'username'}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  
                  {isAdmin && (
                    <div className="flex items-center justify-center mt-2">
                      <ShieldCheck className="h-4 w-4 mr-1 text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">Admin</span>
                    </div>
                  )}
                </div>
                
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="mb-2">
                    <Link to="/admin">
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1 md:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>Your Registrations</CardTitle>
            <CardDescription>Events you have registered for</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRegistrations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : registrations.length > 0 ? (
              <div className="space-y-4">
                {registrations.map((registration) => (
                  <div key={registration.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {registration.events?.title || 'Event'}
                        </h3>
                        
                        <div className="flex flex-wrap gap-y-1 gap-x-3 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {registration.events?.start_time ? (
                              format(new Date(registration.events.start_time), 'MMM d, yyyy • h:mm a')
                            ) : (
                              'Date not available'
                            )}
                          </div>
                          
                          {registration.events?.event_type && (
                            <div className="flex items-center">
                              {registration.events.event_type === 'webinar' ? (
                                <Video className="h-3 w-3 mr-1" />
                              ) : (
                                <MapPin className="h-3 w-3 mr-1" />
                              )}
                              {registration.events.event_type}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        {registration.status === 'confirmed' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancelRegistration(registration.id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {registration.status === 'cancelled' ? 'Cancelled' : registration.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't registered for any events yet</p>
                <Button asChild>
                  <Link to="/events">Browse Events</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountPage;
