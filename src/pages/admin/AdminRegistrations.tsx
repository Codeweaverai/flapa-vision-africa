
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Calendar, Users, GraduationCap, FileText } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { EventWithRegistrations, CombinedRegistration } from '@/types/eventTypes';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import RegistrationsTable from '@/components/admin/RegistrationsTable';
import RegistrationEditDialog from '@/components/admin/RegistrationEditDialog';
import EnrollmentsTable from '@/components/admin/EnrollmentsTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminRegistrations = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else {
      fetchCourses();
    }
  }, [activeTab]);

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

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch enrollments for all courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          profiles:profiles(id, email, full_name),
          courses:course_id(title, price, is_free)
        `);

      if (enrollmentsError) throw enrollmentsError;

      const formattedEnrollments = enrollmentsData.map((enrollment: any) => ({
        ...enrollment,
        user: {
          id: enrollment.profiles?.id,
          email: enrollment.profiles?.email,
          full_name: enrollment.profiles?.full_name
        },
        course_title: enrollment.courses?.title || 'Unknown',
        course_price: enrollment.courses?.price || 0,
        is_free: enrollment.courses?.is_free || false
      }));

      setEnrollmentsList(formattedEnrollments);

      // Group enrollments by course
      const coursesWithEnrollments = coursesData.map((course) => {
        const courseEnrollments = formattedEnrollments.filter(
          (enrollment) => enrollment.course_id === course.id
        );
        
        return {
          ...course,
          enrollments: courseEnrollments,
          enrollmentCount: courseEnrollments.length
        };
      });

      setCourses(coursesWithEnrollments);
    } catch (error: any) {
      console.error('Error fetching courses and enrollments:', error);
      toast.error('Failed to load courses and enrollments');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredCourses = courses.filter((course) => {
    return course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredEnrollments = enrollmentsList.filter((enrollment) => {
    return enrollment.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           enrollment.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           enrollment.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
    return enrollmentsList.map(enrollment => ({
      'Course': enrollment.course_title,
      'Student Name': enrollment.user?.full_name || 'N/A',
      'Student Email': enrollment.user?.email || 'N/A',
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

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      // Update local state
      setEnrollmentsList(prev => prev.filter(e => e.id !== enrollmentId));
      
      // Update courses with enrollments
      setCourses(prev => 
        prev.map(course => ({
          ...course,
          enrollments: course.enrollments.filter((e: any) => e.id !== enrollmentId),
          enrollmentCount: course.enrollments.filter((e: any) => e.id !== enrollmentId).length
        }))
      );

      toast.success('Enrollment deleted successfully');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Failed to delete enrollment');
    }
  };

  const exportRegistrationsToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Event Registrations Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 14, 30);
    
    const registrationData = getRegistrationData();
    const headers = registrationData.length > 0 ? Object.keys(registrationData[0]) : [];
    
    const rows = registrationData.map(item => headers.map(header => item[header]));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [75, 75, 250] }
    });
    
    doc.save('event-registrations-report.pdf');
  };
  
  const exportEnrollmentsToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Course Enrollments Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 14, 30);
    
    const enrollmentData = getEnrollmentData();
    const headers = enrollmentData.length > 0 ? Object.keys(enrollmentData[0]) : [];
    
    const rows = enrollmentData.map(item => headers.map(header => item[header]));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [75, 75, 250] }
    });
    
    doc.save('course-enrollments-report.pdf');
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Registrations & Enrollments</h1>
        </div>

        <Tabs defaultValue="events" className="w-full" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid grid-cols-2 mb-8 w-[400px]">
            <TabsTrigger value="events">Event Registrations</TabsTrigger>
            <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Registration Analytics</CardTitle>
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
                      <Calendar className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Upcoming Events</p>
                        <p className="text-2xl font-bold">
                          {events.filter(event => new Date(event.date) > new Date()).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <CSVLink 
                    data={getRegistrationData()} 
                    filename="event-registrations.csv"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </CSVLink>
                  <Button variant="outline" onClick={exportRegistrationsToPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Event Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <RegistrationsTable
                    registrations={getAllRegistrations()}
                    onEdit={handleEditRegistration}
                    onDelete={handleDeleteRegistration}
                    loading={loading}
                  />
                </CardContent>
              </Card>

              {/* Individual Event Registrations */}
              {filteredEvents.map(event => (
                <Card key={event.id} id={`tab-${event.id}`} className="mt-6">
                  <CardHeader>
                    <CardTitle>{event.title} - Registrations</CardTitle>
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
          </TabsContent>

          <TabsContent value="courses">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Enrollment Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                      <GraduationCap className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Courses</p>
                        <p className="text-2xl font-bold">{courses.length}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                      <Users className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Enrollments</p>
                        <p className="text-2xl font-bold">{enrollmentsList.length}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                      <GraduationCap className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Courses</p>
                        <p className="text-2xl font-bold">
                          {enrollmentsList.filter(e => e.is_completed).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses or students..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <CSVLink 
                    data={getEnrollmentData()} 
                    filename="course-enrollments.csv"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </CSVLink>
                  <Button variant="outline" onClick={exportEnrollmentsToPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnrollmentsTable 
                    enrollments={filteredEnrollments}
                    loading={loading}
                    onDelete={handleDeleteEnrollment}
                  />
                </CardContent>
              </Card>

              {/* Individual Course Enrollments */}
              {filteredCourses.map(course => (
                <Card key={course.id} className="mt-6">
                  <CardHeader>
                    <CardTitle>{course.title} - Enrollments ({course.enrollmentCount})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EnrollmentsTable 
                      enrollments={course.enrollments}
                      loading={loading}
                      onDelete={handleDeleteEnrollment}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {selectedRegistration && (
          <RegistrationEditDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            registration={selectedRegistration}
            onSave={handleSaveRegistration}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
