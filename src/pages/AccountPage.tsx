import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Clock, MapPin, X, ExternalLink, Calendar, CreditCard, Settings, BookOpen, Star, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ConsultationBooking, fetchUserBookings, cancelBooking } from '@/services/consultationService';
import { Registration, fetchUserRegistrations, cancelRegistration } from '@/services/eventService';
import { Course, fetchCourseById } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';

interface UserCourse {
  id: string;
  enrollment_id: string;
  course_id: string;
  enrollment_date: string;
  is_completed: boolean;
  is_favorite: boolean;
  course: Course | null;
  progress_percentage: number;
}

const AccountPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<UserCourse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      loadUserData();
      loadEnrolledCourses();
    }
  }, [user, loading, navigate]);

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      const consultations = await fetchUserBookings(user);
      const events = await fetchUserRegistrations(user);
      
      setBookings(consultations);
      setRegistrations(events as Registration[]);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load your account data');
    } finally {
      setLoadingData(false);
    }
  };

  const loadEnrolledCourses = async () => {
    if (!user) return;
    
    setLoadingCourses(true);
    try {
      // Get all enrollments for the user
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (enrollmentsError) throw enrollmentsError;
      
      // Get favorite courses info
      const { data: favorites, error: favoritesError } = await supabase
        .from('course_favorites')
        .select('course_id')
        .eq('user_id', user.id);
        
      if (favoritesError) throw favoritesError;
      
      const favoriteCoursesIds = new Set((favorites || []).map(fav => fav.course_id));
      
      // For each enrollment, get the actual course data and progress
      const coursesWithDetails = await Promise.all((enrollments || []).map(async (enrollment) => {
        // Get the course data
        const course = await fetchCourseById(enrollment.course_id);
        
        // Get progress data for this enrollment
        const { data: progresses, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('enrollment_id', enrollment.id);
          
        if (progressError) throw progressError;
        
        // Calculate progress percentage (if there are lessons)
        let progressPercentage = 0;
        if (course?.modules?.length) {
          let totalLessons = 0;
          let completedLessons = 0;
          
          course.modules.forEach(module => {
            if (module.lessons) {
              totalLessons += module.lessons.length;
              module.lessons.forEach(lesson => {
                if ((progresses || []).some(p => p.lesson_id === lesson.id && p.is_completed)) {
                  completedLessons++;
                }
              });
            }
          });
          
          progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        }
        
        return {
          id: enrollment.id,
          enrollment_id: enrollment.id,
          course_id: enrollment.course_id,
          enrollment_date: enrollment.enrollment_date,
          is_completed: enrollment.is_completed || false,
          is_favorite: favoriteCoursesIds.has(enrollment.course_id),
          course,
          progress_percentage: progressPercentage
        };
      }));
      
      setEnrolledCourses(coursesWithDetails);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCancelConsultation = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this consultation?')) {
      const success = await cancelBooking(bookingId, user);
      if (success) {
        setBookings(prev => prev.filter(booking => booking.id !== bookingId));
        toast.success('Consultation cancelled successfully');
      }
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (confirm('Are you sure you want to cancel this event registration?')) {
      const success = await cancelRegistration(registrationId, user);
      if (success) {
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
        toast.success('Event registration cancelled successfully');
      }
    }
  };

  const handleToggleFavorite = async (courseId: string, isFavorite: boolean) => {
    if (!user) return;
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('course_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);
          
        if (error) throw error;
        
        setEnrolledCourses(prev => 
          prev.map(course => 
            course.course_id === courseId 
              ? {...course, is_favorite: false} 
              : course
          )
        );
        
        toast.success('Course removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('course_favorites')
          .insert({
            user_id: user.id,
            course_id: courseId,
            added_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        setEnrolledCourses(prev => 
          prev.map(course => 
            course.course_id === courseId 
              ? {...course, is_favorite: true} 
              : course
          )
        );
        
        toast.success('Course added to favorites');
      }
    } catch (error) {
      console.error('Error updating course favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP p');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="section-container bg-light-purple min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading account...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <h1 className="heading-lg mb-8 text-gradient">My Account</h1>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || user.email || ''} />
                    <AvatarFallback className="text-xl">{getInitials(user.user_metadata.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{user.user_metadata.full_name || 'User'}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/consult">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Consultation
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/events">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      View Events
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/learning">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Courses
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="consultations">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="consultations">My Consultations</TabsTrigger>
                <TabsTrigger value="events">Event Registrations</TabsTrigger>
                <TabsTrigger value="courses">My Courses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="consultations">
                <Card>
                  <CardHeader>
                    <CardTitle>My Consultation Bookings</CardTitle>
                    <CardDescription>
                      View and manage your scheduled consultations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingData ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading your bookings...</p>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="py-12 text-center border rounded-lg bg-muted/10">
                        <h3 className="font-medium text-lg mb-2">No consultations booked yet</h3>
                        <p className="text-muted-foreground mb-6">Book your first consultation with Mbolela Pule</p>
                        <Button asChild>
                          <a href="/consult">Book a Consultation</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {bookings.map(booking => (
                          <Card key={booking.id} className="overflow-hidden">
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{booking.topic || 'Consultation'}</h3>
                                  <p className="text-muted-foreground">
                                    {booking.booking_type === 'google_meet' ? 'Online Meeting' : 'In-Person Meeting'}
                                  </p>
                                </div>
                                <Badge className={getStatusBadgeClass(booking.status)}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{formatDateTime(booking.scheduled_time)}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{booking.duration} minutes</span>
                                </div>
                              </div>
                              
                              {booking.booking_type === 'in_person' && booking.location && (
                                <div className="flex items-start text-sm mb-4">
                                  <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                                  <span>{booking.location}</span>
                                </div>
                              )}
                              
                              {booking.notes && (
                                <div className="bg-muted/20 p-3 rounded-md text-sm mb-4">
                                  <p className="font-medium mb-1">Notes:</p>
                                  <p>{booking.notes}</p>
                                </div>
                              )}
                              
                              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                                <div className="text-sm">
                                  <span className="font-medium">Payment:</span>{' '}
                                  <Badge variant={booking.payment_status === 'completed' ? 'default' : 'outline'}>
                                    {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                                  </Badge>
                                  {booking.payment_amount && (
                                    <span className="ml-2">
                                      {booking.payment_currency || 'ZMW'} {booking.payment_amount}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  {booking.online_meeting_link && booking.status === 'confirmed' && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={booking.online_meeting_link} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Join
                                      </a>
                                    </Button>
                                  )}
                                  
                                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCancelConsultation(booking.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle>My Event Registrations</CardTitle>
                    <CardDescription>
                      View and manage your event registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingData ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading your registrations...</p>
                      </div>
                    ) : registrations.length === 0 ? (
                      <div className="py-12 text-center border rounded-lg bg-muted/10">
                        <h3 className="font-medium text-lg mb-2">No events registered yet</h3>
                        <p className="text-muted-foreground mb-6">Explore and register for upcoming events</p>
                        <Button asChild>
                          <a href="/events">View Events</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {registrations.map(reg => (
                          <Card key={reg.id} className="overflow-hidden">
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{reg.events?.title || 'Event Registration'}</h3>
                                  <p className="text-muted-foreground">
                                    {reg.events?.event_type || 'Event'}
                                  </p>
                                </div>
                                <Badge className={getStatusBadgeClass(reg.status)}>
                                  {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                </Badge>
                              </div>
                              
                              {reg.events && (
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center text-sm">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{formatDateTime(reg.events.start_time)}</span>
                                  </div>
                                  
                                  {reg.events.location && (
                                    <div className="flex items-center text-sm">
                                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>{reg.events.location}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                                <div className="text-sm">
                                  <span className="font-medium">Payment:</span>{' '}
                                  <Badge variant={reg.payment_status === 'completed' ? 'default' : 'outline'}>
                                    {reg.payment_status.charAt(0).toUpperCase() + reg.payment_status.slice(1)}
                                  </Badge>
                                  {reg.payment_amount && (
                                    <span className="ml-2">
                                      {reg.payment_currency || 'ZMW'} {reg.payment_amount}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  {reg.events?.online_meeting_link && reg.status === 'confirmed' && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={reg.events.online_meeting_link} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Join
                                      </a>
                                    </Button>
                                  )}
                                  
                                  {reg.status !== 'cancelled' && reg.status !== 'attended' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCancelRegistration(reg.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="courses">
                <Card>
                  <CardHeader>
                    <CardTitle>My Learning Journey</CardTitle>
                    <CardDescription>
                      View and access your enrolled courses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingCourses ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading your courses...</p>
                      </div>
                    ) : enrolledCourses.length === 0 ? (
                      <div className="py-12 text-center border rounded-lg bg-muted/10">
                        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="font-medium text-lg mt-4 mb-2">No courses enrolled yet</h3>
                        <p className="text-muted-foreground mb-6">Explore our courses and start your learning journey</p>
                        <Button asChild>
                          <a href="/learning">Browse Courses</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {enrolledCourses.map((course) => (
                          <Card key={course.enrollment_id} className="overflow-hidden">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="md:col-span-1">
                                {course.course?.thumbnail_url ? (
                                  <img 
                                    src={course.course.thumbnail_url} 
                                    alt={course.course.title} 
                                    className="w-full h-full object-cover min-h-[180px]"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center bg-muted h-full min-h-[180px]">
                                    <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="md:col-span-2 p-4 md:p-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex gap-2 mb-2">
                                      <Badge variant="outline">{course.course?.category || 'Course'}</Badge>
                                      <Badge variant="outline">{course.course?.difficulty_level || 'All Levels'}</Badge>
                                      {course.is_completed && (
                                        <Badge variant="default" className="bg-green-500">Completed</Badge>
                                      )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{course.course?.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.course?.summary}</p>
                                  </div>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleToggleFavorite(course.course_id, course.is_favorite)}
                                    className={course.is_favorite ? "text-red-500" : "text-muted-foreground"}
                                  >
                                    <Heart className={course.is_favorite ? "fill-current" : ""} />
                                  </Button>
                                </div>
                                
                                <div className="mt-auto">
                                  <div className="flex items-center mb-2">
                                    <div className="text-sm font-medium mr-2">Progress:</div>
                                    <div className="w-full bg-muted rounded-full h-2.5">
                                      <div 
                                        className="bg-primary h-2.5 rounded-full" 
                                        style={{ width: `${Math.round(course.progress_percentage)}%` }}
                                      ></div>
                                    </div>
                                    <div className="ml-2 text-sm font-medium">{Math.round(course.progress_percentage)}%</div>
                                  </div>
                                  
                                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>Enrolled: {formatDateTime(course.enrollment_date)}</span>
                                  </div>
                                  
                                  <div className="flex justify-end">
                                    <Button asChild>
                                      <a href={`/learning/course/${course.course_id}`}>
                                        {course.progress_percentage > 0 ? 'Continue Learning' : 'Start Course'}
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
