
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { Search, Download, Mail, BookOpen, Calendar } from 'lucide-react';

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface EnrolledStudent extends Student {
  course_id: string;
  course_title: string;
  enrollment_date: string;
  progress: number;
  is_completed: boolean;
}

interface EventAttendee extends Student {
  event_id: string;
  event_title: string;
  registration_date: string;
  status: string;
}

const CreatorStudents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseStudents, setCourseStudents] = useState<EnrolledStudent[]>([]);
  const [eventAttendees, setEventAttendees] = useState<EventAttendee[]>([]);
  const [activeTab, setActiveTab] = useState('all-students');
  
  useEffect(() => {
    if (user) {
      fetchStudentsData();
    }
  }, [user]);
  
  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      // Get course enrollment data
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          user_id,
          created_at,
          progress,
          is_completed,
          course:courses(title, creator_id),
          student:profiles(id, email, full_name, avatar_url, created_at)
        `)
        .eq('course:courses.creator_id', user?.id);
        
      if (enrollmentError) throw enrollmentError;
      
      // Get event registration data
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          id,
          event_id,
          user_id,
          created_at,
          status,
          event:events(title, creator_id),
          attendee:profiles(id, email, full_name, avatar_url, created_at)
        `)
        .eq('event:events.creator_id', user?.id);
        
      if (registrationsError) throw registrationsError;
      
      // Format course students data
      const formattedCourseStudents: EnrolledStudent[] = enrollmentData?.map((enrollment: any) => ({
        id: enrollment.student.id,
        email: enrollment.student.email,
        full_name: enrollment.student.full_name,
        avatar_url: enrollment.student.avatar_url,
        created_at: enrollment.student.created_at,
        course_id: enrollment.course_id,
        course_title: enrollment.course.title,
        enrollment_date: enrollment.created_at,
        progress: enrollment.progress || 0,
        is_completed: enrollment.is_completed || false
      })) || [];
      
      // Format event attendees data
      const formattedEventAttendees: EventAttendee[] = registrationsData?.map((registration: any) => ({
        id: registration.attendee.id,
        email: registration.attendee.email,
        full_name: registration.attendee.full_name,
        avatar_url: registration.attendee.avatar_url,
        created_at: registration.attendee.created_at,
        event_id: registration.event_id,
        event_title: registration.event.title,
        registration_date: registration.created_at,
        status: registration.status
      })) || [];
      
      setCourseStudents(formattedCourseStudents);
      setEventAttendees(formattedEventAttendees);
    } catch (error) {
      console.error('Error fetching students data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Setup realtime listeners for enrollments and registrations
  useEffect(() => {
    if (!user) return;
    
    // Enrollment channel
    const enrollmentChannel = supabase
      .channel('creator-enrollments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'enrollments', filter: `course.creator_id=eq.${user.id}` },
        () => {
          fetchStudentsData();
        }
      )
      .subscribe();
      
    // Registration channel
    const registrationChannel = supabase
      .channel('creator-registrations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'registrations', filter: `event.creator_id=eq.${user.id}` },
        () => {
          fetchStudentsData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(enrollmentChannel);
      supabase.removeChannel(registrationChannel);
    };
  }, [user]);

  // Get unique students from both courses and events
  const getAllStudents = (): Student[] => {
    const studentMap = new Map<string, Student>();
    
    courseStudents.forEach(student => {
      studentMap.set(student.id, {
        id: student.id,
        email: student.email,
        full_name: student.full_name,
        avatar_url: student.avatar_url,
        created_at: student.created_at
      });
    });
    
    eventAttendees.forEach(attendee => {
      studentMap.set(attendee.id, {
        id: attendee.id,
        email: attendee.email,
        full_name: attendee.full_name,
        avatar_url: attendee.avatar_url,
        created_at: attendee.created_at
      });
    });
    
    return Array.from(studentMap.values());
  };
  
  // Filter students based on search term
  const filteredAllStudents = getAllStudents().filter(student => 
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.full_name && student.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredCourseStudents = courseStudents.filter(student => 
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.full_name && student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    student.course_title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredEventAttendees = eventAttendees.filter(attendee => 
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (attendee.full_name && attendee.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    attendee.event_title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleExportData = () => {
    // Implementation for exporting student data
    console.log('Export data functionality would be implemented here');
  };

  return (
    <CreatorLayout title="Students">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-sm">
              {getAllStudents().length} Total Students
            </Badge>
            <Badge variant="outline" className="text-sm">
              {courseStudents.length} Course Enrollments
            </Badge>
            <Badge variant="outline" className="text-sm">
              {eventAttendees.length} Event Registrations
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all-students">All Students</TabsTrigger>
          <TabsTrigger value="course-enrollments">Course Enrollments</TabsTrigger>
          <TabsTrigger value="event-registrations">Event Registrations</TabsTrigger>
        </TabsList>
        
        {/* All Students Tab */}
        <TabsContent value="all-students">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>List of all students enrolled in your courses or registered for your events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredAllStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No students match your search" : "No students found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name || "No Name"}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{format(new Date(student.created_at), 'PP')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Course Enrollments Tab */}
        <TabsContent value="course-enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
              <CardDescription>Students enrolled in your courses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCourseStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No course enrollments match your search" : "No course enrollments found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourseStudents.map((student) => (
                      <TableRow key={`${student.id}-${student.course_id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.full_name || "No Name"}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{student.course_title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(student.enrollment_date), 'PP')}</TableCell>
                        <TableCell>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 inline-block">{student.progress}%</span>
                        </TableCell>
                        <TableCell>
                          {student.is_completed ? (
                            <Badge>Completed</Badge>
                          ) : (
                            <Badge variant="outline">In Progress</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Event Registrations Tab */}
        <TabsContent value="event-registrations">
          <Card>
            <CardHeader>
              <CardTitle>Event Registrations</CardTitle>
              <CardDescription>Students registered for your events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredEventAttendees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No event registrations match your search" : "No event registrations found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventAttendees.map((attendee) => (
                      <TableRow key={`${attendee.id}-${attendee.event_id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{attendee.full_name || "No Name"}</div>
                            <div className="text-xs text-muted-foreground">{attendee.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{attendee.event_title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(attendee.registration_date), 'PP')}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={attendee.status === 'confirmed' ? 'default' : 
                                    attendee.status === 'cancelled' ? 'destructive' : 'outline'}
                          >
                            {attendee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CreatorLayout>
  );
};

export default CreatorStudents;
