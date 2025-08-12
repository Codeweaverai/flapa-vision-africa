import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EventRegistrationsTable from '@/components/event/EventRegistrationsTable';
import CourseEnrollmentsTable from '@/components/course/CourseEnrollmentsTable';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface Course {
  id: string;
  title: string;
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  capacity?: number;
}

interface EventBooking {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  booking_date: string;
  user?: UserProfile;
}

interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrollment_date: string;
  payment_status: string;
  is_completed: boolean;
  user?: UserProfile;
  course?: Course;
}

interface EventWithRegistrations extends Event {
  registrations: (EventBooking & { user: UserProfile })[];
}

interface CourseEnrollmentWithUser extends CourseEnrollment {
  user: UserProfile;
  course: Course;
}

const AdminRegistrationsPage = () => {
  const [loading, setLoading] = useState({
    events: true,
    courses: true
  });
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollmentWithUser[]>([]);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    fetchEventRegistrations();
    fetchCourseEnrollments();
  }, []);

  const fetchEventRegistrations = async () => {
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');
      
      if (eventsError) throw eventsError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          user:user_id (id),
          profile:profiles!user_id (id, email, full_name)
        `);
      
      if (bookingsError) throw bookingsError;

      const eventsWithRegistrations = eventsData.map(event => ({
        ...event,
        date: event.start_time,
        registrations: bookingsData
          .filter(booking => booking.event_id === event.id)
          .map(booking => ({
            ...booking,
            user: {
              id: booking.user?.id || '',
              email: booking.profile?.email || '',
              full_name: booking.profile?.full_name || ''
            }
          }))
      }));

      setEvents(eventsWithRegistrations);
    } catch (error: any) {
      console.error('Error fetching event registrations:', error);
      toast.error(error.message || 'Failed to load event registrations');
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  const fetchCourseEnrollments = async () => {
    setLoading(prev => ({ ...prev, courses: true }));
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          user:user_id (id),
          profile:profiles!user_id (id, email, full_name),
          course:course_id (id, title)
        `);
      
      if (error) throw error;

      const formattedEnrollments: CourseEnrollmentWithUser[] = data.map(enrollment => ({
        ...enrollment,
        user: {
          id: enrollment.user?.id || '',
          email: enrollment.profile?.email || '',
          full_name: enrollment.profile?.full_name || ''
        },
        course: {
          id: enrollment.course?.id || '',
          title: enrollment.course?.title || ''
        }
      }));

      setCourseEnrollments(formattedEnrollments);
    } catch (error: any) {
      console.error('Error fetching course enrollments:', error);
      toast.error(error.message || 'Failed to load course enrollments');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const handleDeleteEventRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('event_bookings')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      setEvents(prev => prev.map(event => ({
        ...event,
        registrations: event.registrations.filter(reg => reg.id !== registrationId)
      })));

      toast.success('Event registration deleted successfully');
    } catch (error) {
      console.error('Error deleting event registration:', error);
      toast.error('Failed to delete event registration');
    }
  };

  const handleDeleteCourseEnrollment = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      setCourseEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));

      toast.success('Course enrollment deleted successfully');
    } catch (error) {
      console.error('Error deleting course enrollment:', error);
      toast.error('Failed to delete course enrollment');
    }
  };

  return (
    <AdminLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Registrations Management</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="events">Event Registrations</TabsTrigger>
            <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Registrations</CardTitle>
                <CardDescription>
                  Manage all event registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.events ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-8">
                    {events.map(event => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {event.registrations.length} registrations
                          {event.capacity && ` (${event.registrations.length}/${event.capacity} spots)`}
                        </p>
                        <EventRegistrationsTable 
                          registrations={event.registrations}
                          onDelete={handleDeleteEventRegistration}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No event registrations found.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Enrollments</CardTitle>
                <CardDescription>
                  Manage all course enrollments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.courses ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : courseEnrollments.length > 0 ? (
                  <CourseEnrollmentsTable 
                    enrollments={courseEnrollments}
                    onDelete={handleDeleteCourseEnrollment}
                  />
                ) : (
                  <Alert>
                    <AlertDescription>
                      No course enrollments found.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrationsPage;
