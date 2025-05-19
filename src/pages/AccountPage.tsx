
// Import React and necessary components/hooks
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Import layout components
import Layout from '@/components/layout/Layout';

// Import services and contexts
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserRegistrations, cancelRegistration } from '@/services/eventService';
import { fetchUserCourses } from '@/services/courseService';
import { RegistrationWithEvent, CourseWithEnrollment } from '@/types/eventTypes';

const AccountPage = () => {
  // Update state types to use the new interfaces
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithEnrollment[]>([]);
  const [activeTab, setActiveTab] = useState("events");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Load user data on component mount
  useEffect(() => {
    if (user) {
      loadUserData(user);
    } else {
      // Redirect to login if not authenticated
      navigate('/auth', { state: { from: '/account' } });
    }
  }, [user, navigate]);
  
  // Function to load user registrations and courses
  const loadUserData = async (user: User) => {
    try {
      // Load user event registrations
      const userRegistrations = await fetchUserRegistrations(user);
      setRegistrations(userRegistrations as RegistrationWithEvent[]);
      
      // Load user courses
      const userCourses = await fetchUserCourses();
      setEnrolledCourses(userCourses as CourseWithEnrollment[]);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load your account data");
    }
  };
  
  // When working with registrations, use the event property
  const handleCancelRegistration = async (registrationId: string) => {
    if (!user) return;
    
    setCancellingId(registrationId);
    
    try {
      const success = await cancelRegistration(registrationId, user);
      
      if (success) {
        // Update local state to reflect cancellation
        setRegistrations(prevRegistrations => 
          prevRegistrations.map(reg => 
            reg.id === registrationId 
              ? { ...reg, status: 'cancelled' } 
              : reg
          )
        );
        toast.success("Registration cancelled successfully");
      } else {
        toast.error("Failed to cancel registration");
      }
    } catch (error) {
      console.error("Error cancelling registration:", error);
      toast.error("An error occurred while cancelling your registration");
    } finally {
      setCancellingId(null);
    }
  };
  
  // When working with courses, use the modules property
  const renderCourseProgress = (course: CourseWithEnrollment) => {
    if (!course.modules || course.modules.length === 0) {
      return <Progress value={0} className="h-2" />;
    }
    
    // Calculate progress based on completed modules
    const totalLessons = course.modules.reduce(
      (total, module) => total + (module.lessons ? module.lessons.length : 0), 
      0
    );
    const completedLessons = 0; // This would come from user progress data
    
    const progressPercentage = totalLessons > 0 
      ? (completedLessons / totalLessons) * 100 
      : 0;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{completedLessons} of {totalLessons} lessons completed</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    );
  };
  
  // Render registered events
  const renderEvents = () => {
    if (registrations.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You haven't registered for any events yet.</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/events')}
          >
            Browse Events
          </Button>
        </div>
      );
    }
  
    return (
      <div className="space-y-4">
        {registrations.map(registration => (
          <Card key={registration.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="md:flex">
                {registration.event && registration.event.image_url && (
                  <div className="md:w-1/4">
                    <img 
                      src={registration.event.image_url} 
                      alt={registration.event.title || 'Event image'} 
                      className="h-40 w-full object-cover md:h-full" 
                    />
                  </div>
                )}
                <div className={`p-6 ${registration.event && registration.event.image_url ? 'md:w-3/4' : 'w-full'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-x-2">
                      {registration.status === 'confirmed' && (
                        <Badge variant="default" className="bg-green-500">Confirmed</Badge>
                      )}
                      {registration.status === 'cancelled' && (
                        <Badge variant="destructive">Cancelled</Badge>
                      )}
                      {registration.event && registration.event.is_free ? (
                        <Badge variant="outline">Free</Badge>
                      ) : (
                        <Badge variant="secondary">Paid</Badge>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">
                    {registration.event && registration.event.title}
                  </h3>
                  
                  {registration.event && (
                    <div className="text-sm text-muted-foreground mb-4">
                      {new Date(registration.event.start_time).toLocaleDateString()} at {new Date(registration.event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => registration.event && navigate(`/events/${registration.event.id}`)}
                    >
                      View Details
                    </Button>
                    
                    {registration.status === 'confirmed' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={cancellingId === registration.id}
                          >
                            {cancellingId === registration.id ? 'Cancelling...' : 'Cancel Registration'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your registration for "{registration.event && registration.event.title}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelRegistration(registration.id)}>
                              Yes, Cancel Registration
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Render enrolled courses
  const renderCourses = () => {
    if (enrolledCourses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/learning')}
          >
            Browse Courses
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {enrolledCourses.map(course => (
          <Card key={course.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="md:flex">
                {course.image_url && (
                  <div className="md:w-1/4">
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="h-40 w-full object-cover md:h-full" 
                    />
                  </div>
                )}
                <div className={`p-6 ${course.image_url ? 'md:w-3/4' : 'w-full'}`}>
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    Enrolled on: {course.enrollment?.enrollment_date 
                      ? new Date(course.enrollment.enrollment_date).toLocaleDateString() 
                      : 'Unknown date'}
                  </div>
                  
                  <div className="mb-4">
                    {renderCourseProgress(course)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/learning/course/${course.id}`)}
                    >
                      View Course
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/learning/course/${course.id}/learn`)}
                    >
                      {course.enrollment?.is_completed ? 'Review Course' : 'Continue Learning'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="section-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Account</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-muted-foreground mb-1">Email</h3>
                  <p>{user?.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground mb-1">Member Since</h3>
                  <p>{user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString() 
                    : 'Unknown'}</p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => navigate('/account/settings')}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="events">My Events</TabsTrigger>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="space-y-6">
              {renderEvents()}
            </TabsContent>
            
            <TabsContent value="courses" className="space-y-6">
              {renderCourses()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
