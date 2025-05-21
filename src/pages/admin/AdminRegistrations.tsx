
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Calendar, Users, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { EventWithRegistrations, CombinedRegistration } from '@/types/eventTypes';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import RegistrationsTable from '@/components/admin/RegistrationsTable';
import RegistrationEditDialog from '@/components/admin/RegistrationEditDialog';
import EnrollmentsTable, { CourseEnrollment } from '@/components/admin/EnrollmentsTable';
import EnrollmentEditDialog from '@/components/admin/EnrollmentEditDialog';

const AdminRegistrations = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('events');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnrollmentEditDialogOpen, setIsEnrollmentEditDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollment | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchEnrollments();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events with registration counts
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations:registrations(count)
        `)
        .order('start_time', { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch detailed registrations for each event
      const eventsWithRegistrations = await Promise.all(
        eventsData.map(async (event) => {
          const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
              *,
              profiles:profiles(id, email, full_name)
            `)
            .eq('event_id', event.id);

          if (regError) {
            console.error('Error fetching registrations:', regError);
            return {
              ...event,
              date: event.start_time,
              registrations: []
            };
          }

          // Format registrations properly
          const formattedRegistrations = registrations.map((reg: any) => ({
            ...reg,
            user: {
              id: reg.profiles?.id,
              email: reg.profiles?.email,
              full_name: reg.profiles?.full_name
            }
          }));

          return {
            ...event,
            date: event.start_time,
            registrations: formattedRegistrations as CombinedRegistration[]
          };
        })
      );

      setEvents(eventsWithRegistrations as EventWithRegistrations[]);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setEnrollmentsLoading(true);
    try {
      // Fetch enrollments with user and course details
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          profiles:profiles(id, email, full_name),
          courses:courses(id, title, is_free, price)
        `)
        .order('enrollment_date', { ascending: false });

      if (error) {
        throw error;
      }

      setEnrollments(data as CourseEnrollment[]);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'upcoming') return matchesSearch && new Date(event.date) > new Date();
    if (activeTab === 'past') return matchesSearch && new Date(event.date) <= new Date();
    
    return matchesSearch;
  });

  const filteredEnrollments = enrollments.filter((enrollment) => 
    enrollment.courses?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalRegistrations = (event: EventWithRegistrations) => {
    return event.registrations?.length || 0;
  };

  const getRegistrationData = () => {
    const data: any[] = [];
    
    events.forEach(event => {
      event.registrations?.forEach(reg => {
        data.push({
          'Event Name': event.title,
          'Event Date': format(new Date(event.date), 'PPP'),
          'Registration Date': reg.created_at ? format(new Date(reg.created_at), 'PPP') : 'N/A',
          'Attendee Name': reg.user?.full_name || 'N/A',
          'Attendee Email': reg.user?.email || 'N/A',
          'Phone Number': reg.phone_number || 'N/A',
          'Status': reg.status,
          'Payment Status': reg.payment_status
        });
      });
    });
    
    return data;
  };

  const getEnrollmentData = () => {
    return enrollments.map(enrollment => ({
      'Course': enrollment.courses?.title || 'N/A',
      'Student': enrollment.profiles?.full_name || 'N/A',
      'Email': enrollment.profiles?.email || 'N/A',
      'Enrollment Date': enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'PPP') : 'N/A',
      'Completion Status': enrollment.is_completed ? 'Completed' : 'In Progress',
      'Completion Date': enrollment.completion_date ? format(new Date(enrollment.completion_date), 'PPP') : 'N/A',
      'Payment Status': enrollment.payment_status
    }));
  };

  const getAllRegistrations = () => {
    return events.flatMap(event => 
      event.registrations.map(reg => ({
        ...reg,
        events: event
      }))
    );
  };

  const handleEditRegistration = (registration: CombinedRegistration) => {
    setSelectedRegistration(registration);
    setIsEditDialogOpen(true);
  };

  const handleEditEnrollment = (enrollment: CourseEnrollment) => {
    setSelectedEnrollment(enrollment);
    setIsEnrollmentEditDialogOpen(true);
  };

  const handleDeleteRegistration = async (registration: CombinedRegistration) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registration.id);

      if (error) {
        throw error;
      }

      // Update state by removing the deleted registration
      setEvents(prevEvents => 
        prevEvents.map(event => ({
          ...event,
          registrations: event.registrations.filter(reg => reg.id !== registration.id)
        }))
      );

      toast.success('Registration deleted successfully');
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    }
  };

  const handleDeleteEnrollment = async (enrollment: CourseEnrollment) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollment.id);

      if (error) {
        throw error;
      }

      // Update enrollments state
      setEnrollments(prevEnrollments => 
        prevEnrollments.filter(e => e.id !== enrollment.id)
      );

      toast.success('Enrollment deleted successfully');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Failed to delete enrollment');
    }
  };

  const handleSaveRegistration = async (updatedRegistration: CombinedRegistration) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status: updatedRegistration.status,
          payment_status: updatedRegistration.payment_status,
          phone_number: updatedRegistration.phone_number,
          mobile_operator: updatedRegistration.mobile_operator
        })
        .eq('id', updatedRegistration.id);

      if (error) throw error;

      // Update state
      setEvents(prevEvents => 
        prevEvents.map(event => ({
          ...event,
          registrations: event.registrations.map(reg => 
            reg.id === updatedRegistration.id ? updatedRegistration : reg
          )
        }))
      );

      toast.success('Registration updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    }
  };

  const handleSaveEnrollment = async (updatedEnrollment: CourseEnrollment) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({
          payment_status: updatedEnrollment.payment_status,
          is_completed: updatedEnrollment.is_completed,
          completion_date: updatedEnrollment.completion_date
        })
        .eq('id', updatedEnrollment.id);

      if (error) throw error;

      // Update enrollments state
      setEnrollments(prevEnrollments => 
        prevEnrollments.map(enrollment => 
          enrollment.id === updatedEnrollment.id ? updatedEnrollment : enrollment
        )
      );

      toast.success('Enrollment updated successfully');
      setIsEnrollmentEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast.error('Failed to update enrollment');
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Registrations & Enrollments</h1>
          <div className="flex space-x-2">
            {activeMainTab === 'events' && (
              <CSVLink 
                data={getRegistrationData()} 
                filename="event-registrations.csv"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Events CSV
              </CSVLink>
            )}
            {activeMainTab === 'courses' && (
              <CSVLink 
                data={getEnrollmentData()} 
                filename="course-enrollments.csv"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Courses CSV
              </CSVLink>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                  <Calendar className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                  <Users className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Registrations</p>
                    <p className="text-2xl font-bold">
                      {events.reduce((acc, event) => acc + getTotalRegistrations(event), 0)}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                  <DollarSign className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Course Enrollments</p>
                    <p className="text-2xl font-bold">
                      {enrollments.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="events" className="w-full" onValueChange={setActiveMainTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="events">Event Registrations</TabsTrigger>
              <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
            </TabsList>
            
            {/* Events Tab Content */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle>Event Registrations</CardTitle>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                      <TabsTrigger value="all">All Events</TabsTrigger>
                      <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                      <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No events found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">All Registrations</h2>
                      <RegistrationsTable
                        registrations={getAllRegistrations()}
                        onEdit={handleEditRegistration}
                        onDelete={handleDeleteRegistration}
                        loading={loading}
                      />
                      
                      {filteredEvents.map(event => (
                        <Card key={event.id} id={`tab-${event.id}`} className="mt-6">
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle>{event.title} - Registrations</CardTitle>
                              {event.registrations.length > 0 && (
                                <CSVLink
                                  data={event.registrations.map(reg => ({
                                    'Event': event.title,
                                    'Date': format(new Date(event.start_time), 'PPP'),
                                    'Name': reg.user?.full_name || 'N/A',
                                    'Email': reg.user?.email || 'N/A',
                                    'Phone': reg.phone_number || 'N/A',
                                    'Status': reg.status,
                                    'Payment': reg.payment_status
                                  }))}
                                  filename={`${event.title.replace(/\s+/g, '-').toLowerCase()}-registrations.csv`}
                                  className="text-sm text-primary underline flex items-center"
                                >
                                  <Download className="h-4 w-4 mr-1" /> Export This Event
                                </CSVLink>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <RegistrationsTable
                              registrations={event.registrations.map(reg => ({...reg, events: event}))}
                              onEdit={handleEditRegistration}
                              onDelete={handleDeleteRegistration}
                              loading={loading}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Courses Tab Content */}
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle>Course Enrollments</CardTitle>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search enrollments..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {enrollmentsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredEnrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No enrollments found</p>
                    </div>
                  ) : (
                    <EnrollmentsTable
                      enrollments={filteredEnrollments}
                      onEdit={handleEditEnrollment}
                      onDelete={handleDeleteEnrollment}
                      loading={enrollmentsLoading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {selectedRegistration && (
          <RegistrationEditDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            registration={selectedRegistration}
            onSave={handleSaveRegistration}
          />
        )}

        {selectedEnrollment && (
          <EnrollmentEditDialog
            isOpen={isEnrollmentEditDialogOpen}
            onClose={() => setIsEnrollmentEditDialogOpen(false)}
            enrollment={selectedEnrollment}
            onSave={handleSaveEnrollment}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
