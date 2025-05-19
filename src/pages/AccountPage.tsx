
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from 'sonner';
import { Edit, Check, User, Mail, Lock, ArrowLeft, Calendar, GraduationCap, BookOpen } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fetchUserCourses } from '@/services/courseService';
import { CourseWithEnrollment } from '@/types/eventTypes';

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
  const [consultations, setConsultations] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
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

  useEffect(() => {
    // Fetch consultations
    const fetchConsultations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('consultation_bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_time', { ascending: false });
          
        if (error) throw error;
        
        setConsultations(data || []);
      } catch (error) {
        console.error('Error fetching consultations:', error);
      }
    };
    
    // Fetch event registrations
    const fetchRegistrations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            *,
            event:events(id, title, start_time, location)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setRegistrations(data || []);
      } catch (error) {
        console.error('Error fetching event registrations:', error);
      }
    };
    
    // Fetch user courses
    const loadUserCourses = async () => {
      if (!user) return;
      
      try {
        const userCourses = await fetchUserCourses();
        setCourses(userCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    if (user) {
      fetchConsultations();
      fetchRegistrations();
      loadUserCourses();
    }
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

      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast.error("Failed to update profile.");
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
      
      toast.success("Creator access requested!");
    } catch (error: any) {
      console.error("Error requesting creator access:", error.message);
      toast.error("Failed to request creator access.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'confirmed' ? 'default' : 
                    status === 'cancelled' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string, isFree: boolean) => {
    if (isFree) return <Badge variant="outline">Free</Badge>;
    
    const variant = status === 'confirmed' ? 'outline' : 
                    status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-6">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="consultations">My Consultations</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Information Card */}
              <Card>
                <CardContent className="space-y-4 pt-6">
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
                <CardContent className="space-y-4 pt-6">
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
          </TabsContent>
          
          {/* Courses Tab */}
          <TabsContent value="courses">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BookOpen className="mr-2" />
              My Courses
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">You haven't enrolled in any courses yet</p>
                    <p className="text-muted-foreground mb-4 text-center">Explore our courses and start learning today</p>
                    <Button asChild>
                      <Link to="/learning">Browse Courses</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                courses.map((course) => (
                  <Card key={course.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-video relative">
                      {course.image_url ? (
                        <img 
                          src={course.image_url} 
                          alt={course.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2 flex-grow">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>{Math.ceil((course.duration_minutes || 0) / 60)} hours</span>
                        <span>{course.is_free ? "Free" : `$${course.price}`}</span>
                      </div>
                      
                      <div className="mt-2">
                        <Badge variant={course.enrollment?.is_completed ? "default" : "outline"}>
                          {course.enrollment?.is_completed ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button asChild variant="default" className="w-full">
                        <Link to={`/learning/player/${course.id}`}>
                          Continue Learning
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          {/* Events Tab */}
          <TabsContent value="events">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Calendar className="mr-2" />
              My Events
            </h2>
            
            {registrations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">You haven't registered for any events yet</p>
                  <p className="text-muted-foreground mb-4 text-center">Explore our upcoming events and join us</p>
                  <Button asChild>
                    <Link to="/events">Browse Events</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {registrations.map((registration) => (
                  <Card key={registration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{registration.event?.title}</CardTitle>
                        {getStatusBadge(registration.status)}
                      </div>
                      <CardDescription>
                        {registration.event?.start_time && (
                          <>
                            <Calendar className="inline-block mr-1 h-3 w-3" />
                            {format(new Date(registration.event.start_time), 'PPP p')}
                          </>
                        )}
                        {registration.event?.location && (
                          <span className="ml-3">{registration.event.location}</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Registration Date:</p>
                          <p className="text-muted-foreground">
                            {registration.created_at ? format(new Date(registration.created_at), 'PPP') : 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Payment Status:</p>
                          <div>{getPaymentStatusBadge(registration.payment_status, registration.event?.is_free)}</div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <div className="flex gap-3">
                        <Button asChild variant="outline">
                          <Link to={`/events/${registration.event_id}`}>
                            View Event
                          </Link>
                        </Button>
                        
                        {registration.status !== 'cancelled' && (
                          <Button variant="ghost" className="text-destructive">
                            Cancel Registration
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Consultations Tab */}
          <TabsContent value="consultations">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <User className="mr-2" />
              My Consultations
            </h2>
            
            {consultations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">You haven't booked any consultations yet</p>
                  <p className="text-muted-foreground mb-4 text-center">Book a consultation for personalized guidance</p>
                  <Button asChild>
                    <Link to="/consult">Book Consultation</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {consultations.map((consultation) => (
                  <Card key={consultation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{consultation.booking_type} Consultation</CardTitle>
                        {getStatusBadge(consultation.status)}
                      </div>
                      <CardDescription>
                        <Calendar className="inline-block mr-1 h-3 w-3" />
                        {consultation.scheduled_time && format(new Date(consultation.scheduled_time), 'PPP p')}
                        {consultation.duration && <span className="ml-2">({consultation.duration} minutes)</span>}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {consultation.topic && (
                          <div>
                            <p className="text-sm font-medium">Topic:</p>
                            <p className="text-muted-foreground">{consultation.topic}</p>
                          </div>
                        )}
                        
                        {consultation.location && (
                          <div>
                            <p className="text-sm font-medium">Location:</p>
                            <p className="text-muted-foreground">{consultation.location}</p>
                          </div>
                        )}
                        
                        {consultation.online_meeting_link && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium">Meeting Link:</p>
                            <a href={consultation.online_meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                              {consultation.online_meeting_link}
                            </a>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium">Payment Status:</p>
                          <div>{getPaymentStatusBadge(consultation.payment_status, false)}</div>
                        </div>
                      </div>
                      
                      {consultation.notes && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Notes:</p>
                          <p className="text-muted-foreground whitespace-pre-line">{consultation.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter>
                      {consultation.status !== 'cancelled' && new Date(consultation.scheduled_time) > new Date() && (
                        <Button variant="outline" className="text-destructive">
                          Cancel Booking
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AccountPage;
