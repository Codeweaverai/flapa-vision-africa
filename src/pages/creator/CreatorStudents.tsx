
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
import { Search, Download, Mail, BookOpen, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  progress?: number;
  is_completed: boolean;
  payment_status: string;
}

interface EventAttendee extends Student {
  event_id: string;
  event_title: string;
  registration_date: string;
  status: string;
  payment_status: string;
  booking_code?: string;
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
      console.log('Fetching students data for creator:', user?.id);
      
      // Get course enrollment data
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          user_id,
          enrollment_date,
          is_completed,
          payment_status,
          courses!inner(
            title,
            creator_id
          )
        `)
        .eq('courses.creator_id', user?.id);
        
      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError);
        throw enrollmentError;
      }
      
      console.log('Enrollment data:', enrollmentData);
      
      // Get event registration data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          event_id,
          user_id,
          created_at,
          status,
          payment_status,
          booking_code,
          events!inner(
            title,
            creator_id
          )
        `)
        .eq('events.creator_id', user?.id);
        
      if (bookingsError) {
        console.error('Bookings error:', bookingsError);
        throw bookingsError;
      }
      
      console.log('Bookings data:', bookingsData);
      
      // Get unique user IDs
      const enrollmentUserIds = enrollmentData?.map(item => item.user_id) || [];
      const bookingUserIds = bookingsData?.map(item => item.user_id) || [];
      const allUserIds = [...new Set([...enrollmentUserIds, ...bookingUserIds])];
      
      console.log('All user IDs:', allUserIds);
      
      // Get user profiles
      let userProfiles: any[] = [];
      
      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, created_at')
          .in('id', allUserIds);
          
        if (profilesError) {
          console.error('Profiles error:', profilesError);
        } else {
          userProfiles = profiles || [];
        }
      }
      
      console.log('User profiles:', userProfiles);
      
      // Create user map with fallback emails
      const userMap = new Map();
      
      userProfiles.forEach(profile => {
        userMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          email: `user-${profile.id.substring(0, 8)}@platform.com` // Fallback email
        });
      });
      
      // Format course students data
      const formattedCourseStudents: EnrolledStudent[] = (enrollmentData || []).map((enrollment: any) => {
        const userData = userMap.get(enrollment.user_id) || {};
        return {
          id: enrollment.user_id,
          email: userData.email || `user-${enrollment.user_id.substring(0, 8)}@platform.com`,
          full_name: userData.full_name || 'Unknown User',
          avatar_url: userData.avatar_url,
          created_at: userData.created_at || enrollment.enrollment_date,
          course_id: enrollment.course_id,
          course_title: enrollment.courses?.title || 'Unnamed Course',
          enrollment_date: enrollment.enrollment_date,
          progress: 0, // This would need to be calculated from course progress
          is_completed: enrollment.is_completed || false,
          payment_status: enrollment.payment_status || 'pending'
        };
      });
      
      // Format event attendees data
      const formattedEventAttendees: EventAttendee[] = (bookingsData || []).map((booking: any) => {
        const userData = userMap.get(booking.user_id) || {};
        return {
          id: booking.user_id,
          email: userData.email || `user-${booking.user_id.substring(0, 8)}@platform.com`,
          full_name: userData.full_name || 'Unknown User',
          avatar_url: userData.avatar_url,
          created_at: userData.created_at || booking.created_at,
          event_id: booking.event_id,
          event_title: booking.events?.title || 'Unnamed Event',
          registration_date: booking.created_at,
          status: booking.status || 'pending',
          payment_status: booking.payment_status || 'pending',
          booking_code: booking.booking_code
        };
      });
      
      setCourseStudents(formattedCourseStudents);
      setEventAttendees(formattedEventAttendees);
      
      console.log('Final course students:', formattedCourseStudents);
      console.log('Final event attendees:', formattedEventAttendees);
      
    } catch (error) {
      console.error('Error fetching students data:', error);
      toast.error('Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

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

  // Export functions
  const exportToExcel = (data: any[], filename: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success('Data exported to Excel successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const exportToPDF = (data: any[], filename: string, title: string) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(12);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 32);
      
      // Prepare table data
      const headers = Object.keys(data[0] || {});
      const rows = data.map(item => headers.map(header => item[header]));
      
      // Create table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [255, 140, 0], textColor: 255 },
      });
      
      doc.save(`${filename}.pdf`);
      toast.success('Data exported to PDF successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleExportAllStudents = (format: 'excel' | 'pdf') => {
    const data = filteredAllStudents.map(student => ({
      'Full Name': student.full_name || 'N/A',
      'Email': student.email,
      'Joined Date': format(new Date(student.created_at), 'PP')
    }));
    
    if (format === 'excel') {
      exportToExcel(data, 'all-students');
    } else {
      exportToPDF(data, 'all-students', 'All Students Report');
    }
  };

  const handleExportCourseStudents = (format: 'excel' | 'pdf') => {
    const data = filteredCourseStudents.map(student => ({
      'Student Name': student.full_name || 'N/A',
      'Email': student.email,
      'Course': student.course_title,
      'Enrollment Date': format(new Date(student.enrollment_date), 'PP'),
      'Status': student.is_completed ? 'Completed' : 'In Progress',
      'Payment Status': student.payment_status
    }));
    
    if (format === 'excel') {
      exportToExcel(data, 'course-enrollments');
    } else {
      exportToPDF(data, 'course-enrollments', 'Course Enrollments Report');
    }
  };

  const handleExportEventAttendees = (format: 'excel' | 'pdf') => {
    const data = filteredEventAttendees.map(attendee => ({
      'Attendee Name': attendee.full_name || 'N/A',
      'Email': attendee.email,
      'Event': attendee.event_title,
      'Registration Date': format(new Date(attendee.registration_date), 'PP'),
      'Status': attendee.status,
      'Payment Status': attendee.payment_status,
      'Booking Code': attendee.booking_code || 'N/A'
    }));
    
    if (format === 'excel') {
      exportToExcel(data, 'event-attendees');
    } else {
      exportToPDF(data, 'event-attendees', 'Event Attendees Report');
    }
  };

  return (
    <CreatorLayout title="Students">
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200 p-6">
        <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-orange-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 border-orange-200 focus:border-purple-400"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm border-orange-300">
                {getAllStudents().length} Total Students
              </Badge>
              <Badge variant="outline" className="text-sm border-purple-300">
                {courseStudents.length} Course Enrollments
              </Badge>
              <Badge variant="outline" className="text-sm border-orange-300">
                {eventAttendees.length} Event Registrations
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white/90 backdrop-blur-sm">
            <TabsTrigger value="all-students">All Students</TabsTrigger>
            <TabsTrigger value="course-enrollments">Course Enrollments</TabsTrigger>
            <TabsTrigger value="event-registrations">Event Registrations</TabsTrigger>
          </TabsList>
          
          {/* All Students Tab */}
          <TabsContent value="all-students">
            <Card className="bg-white/90 backdrop-blur-sm border border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Students</CardTitle>
                  <CardDescription>List of all students enrolled in your courses or registered for your events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportAllStudents('excel')}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportAllStudents('pdf')}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
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
            <Card className="bg-white/90 backdrop-blur-sm border border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Course Enrollments</CardTitle>
                  <CardDescription>Students enrolled in your courses</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportCourseStudents('excel')}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportCourseStudents('pdf')}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
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
                        <TableHead>Payment</TableHead>
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
                                className="bg-gradient-to-r from-orange-500 to-purple-600 h-2.5 rounded-full" 
                                style={{ width: `${student.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 inline-block">{student.progress || 0}%</span>
                          </TableCell>
                          <TableCell>
                            {student.is_completed ? (
                              <Badge className="bg-green-100 text-green-800">Completed</Badge>
                            ) : (
                              <Badge variant="outline">In Progress</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={student.payment_status === 'completed' ? 'default' : 'outline'}
                              className={student.payment_status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {student.payment_status}
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
          
          {/* Event Registrations Tab */}
          <TabsContent value="event-registrations">
            <Card className="bg-white/90 backdrop-blur-sm border border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Event Registrations</CardTitle>
                  <CardDescription>Students registered for your events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportEventAttendees('excel')}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportEventAttendees('pdf')}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
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
                        <TableHead>Payment</TableHead>
                        <TableHead>Booking Code</TableHead>
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
                              className={
                                attendee.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                attendee.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''
                              }
                            >
                              {attendee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={attendee.payment_status === 'completed' ? 'default' : 'outline'}
                              className={attendee.payment_status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {attendee.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {attendee.booking_code || 'N/A'}
                            </code>
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
      </div>
    </CreatorLayout>
  );
};

export default CreatorStudents;
