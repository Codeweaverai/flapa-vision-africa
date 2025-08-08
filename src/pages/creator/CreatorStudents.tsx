
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Download, 
  Mail, 
  Calendar,
  BookOpen,
  Filter,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CreatorAnnouncementModal from '@/components/creator/CreatorAnnouncementModal';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  username: string;
  enrollment_date?: string;
  booking_date?: string;
  course_title?: string;
  event_title?: string;
  type: 'course' | 'event';
  payment_status: string;
}

interface AttendeeExportButtonProps {
  students: Student[];
  fileName: string;
}

const AttendeeExportButton: React.FC<AttendeeExportButtonProps> = ({ students, fileName }) => {
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Username,Type,Date\n"
      + students.map(s => `${s.full_name},${s.email},${s.username},${s.type},${s.enrollment_date || s.booking_date}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
  onClick={handleExport} 
  variant="outline"
  className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 border-transparent hover:border-transparent shadow hover:shadow-md"
>
  <Download className="h-4 w-4 mr-2" />
  Export CSV
</Button>
  );
};

const CreatorStudents: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'course' | 'event'>('all');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching students for creator:', user.id);

      // Get course enrollments
      const { data: courseEnrollments, error: courseError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          enrollment_date,
          payment_status,
          courses!inner (
            title,
            creator_id
          )
        `)
        .eq('courses.creator_id', user.id)
        .eq('payment_status', 'completed');

      if (courseError) {
        console.error('Error fetching course enrollments:', courseError);
        toast.error('Failed to load course enrollments');
      }

      // Get event bookings
      const { data: eventBookings, error: eventError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          user_id,
          booking_date,
          payment_status,
          events!inner (
            title,
            creator_id
          )
        `)
        .eq('events.creator_id', user.id)
        .eq('payment_status', 'completed');

      if (eventError) {
        console.error('Error fetching event bookings:', eventError);
        toast.error('Failed to load event bookings');
      }

      // Get unique user IDs
      const courseUserIds = courseEnrollments?.map(e => e.user_id) || [];
      const eventUserIds = eventBookings?.map(b => b.user_id) || [];
      const allUserIds = [...new Set([...courseUserIds, ...eventUserIds])];

      console.log('Found unique user IDs:', allUserIds.length);

      if (allUserIds.length === 0) {
        setStudents([]);
        return;
      }

      // Use the updated get_user_emails RPC function 
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_emails', { user_ids: allUserIds });

      if (emailError) {
        console.error('Error fetching user emails:', emailError);
        // If RPC fails, continue without emails but log the error
        toast.error('Failed to load some student data, but continuing...');
      }

      // Get user profiles for additional data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', allUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to load student profiles');
      }

      console.log('Found profiles:', profiles?.length);
      console.log('Found email data:', emailData?.length);

      // Combine the data
      const studentsData: Student[] = [];

      // Add course students
      if (courseEnrollments && profiles) {
        courseEnrollments.forEach(enrollment => {
          const profile = profiles.find(p => p.id === enrollment.user_id);
          const emailInfo = emailData?.find(e => e.id === enrollment.user_id);
          
          if (profile) {
            studentsData.push({
              id: enrollment.id,
              user_id: enrollment.user_id,
              full_name: profile.full_name || 'Unknown',
              email: emailInfo?.email || 'Email not available',
              username: profile.username || '',
              enrollment_date: enrollment.enrollment_date,
              course_title: enrollment.courses.title,
              type: 'course',
              payment_status: enrollment.payment_status
            });
          }
        });
      }

      // Add event students
      if (eventBookings && profiles) {
        eventBookings.forEach(booking => {
          const profile = profiles.find(p => p.id === booking.user_id);
          const emailInfo = emailData?.find(e => e.id === booking.user_id);
          
          if (profile) {
            studentsData.push({
              id: booking.id,
              user_id: booking.user_id,
              full_name: profile.full_name || 'Unknown',
              email: emailInfo?.email || 'Email not available',
              username: profile.username || '',
              booking_date: booking.booking_date,
              event_title: booking.events.title,
              type: 'event',
              payment_status: booking.payment_status
            });
          }
        });
      }

      console.log('Total students found:', studentsData.length);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.course_title && student.course_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (student.event_title && student.event_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || student.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueStudents = filteredStudents.reduce((acc, current) => {
    const existingStudent = acc.find(student => student.user_id === current.user_id);
    if (!existingStudent) {
      acc.push(current);
    }
    return acc;
  }, [] as Student[]);

  const handleSelectAll = () => {
    if (selectedStudents.length === uniqueStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(uniqueStudents.map(s => s.user_id));
    }
  };

  const handleSelectStudent = (userId: string) => {
    setSelectedStudents(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAnnouncementSuccess = () => {
    setShowAnnouncementModal(false);
    setSelectedStudents([]);
    toast.success('Announcement sent successfully');
  };

  if (loading) {
    return (
      <CreatorLayout title="Students & Attendees">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Students & Attendees">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Manage students from your courses and event attendees
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAnnouncementModal(true)}
              disabled={selectedStudents.length === 0}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Announcement ({selectedStudents.length})
            </Button>
            <AttendeeExportButton
              students={uniqueStudents}
              fileName="students-attendees"
            />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
             onClick={() => setFilterType('all')}
             size="sm"
             className={
            filterType === 'all' 
               ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
             : "hover:bg-accent"
              }
              >
              All
              </Button>
            <Button
              variant={filterType === 'course' ? 'default' : 'outline'}
              onClick={() => setFilterType('course')}
              size="sm"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Courses
            </Button>
            <Button
              variant={filterType === 'event' ? 'default' : 'outline'}
              onClick={() => setFilterType('event')}
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Total Students</p>
                  <p className="text-2xl font-bold">{uniqueStudents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Course Enrollments</p>
                  <p className="text-2xl font-bold">
                    {students.filter(s => s.type === 'course').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Event Bookings</p>
                  <p className="text-2xl font-bold">
                    {students.filter(s => s.type === 'event').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Students List ({uniqueStudents.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === uniqueStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {uniqueStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' 
                    ? 'No students match your current filters'
                    : 'You don\'t have any students or attendees yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {uniqueStudents.map((student) => {
                  const studentCourses = students.filter(s => 
                    s.user_id === student.user_id && s.type === 'course'
                  );
                  const studentEvents = students.filter(s => 
                    s.user_id === student.user_id && s.type === 'event'
                  );

                  return (
                    <div
                      key={student.user_id}
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedStudents.includes(student.user_id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.user_id)}
                            onChange={() => handleSelectStudent(student.user_id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{student.full_name}</h4>
                              <Badge variant="outline">
                                @{student.username}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {student.email}
                            </p>
                            
                            {studentCourses.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Enrolled Courses ({studentCourses.length}):
                                </p>
                                {studentCourses.map((course, index) => (
                                  <div key={course.id} className="text-xs text-muted-foreground">
                                    • {course.course_title} 
                                    {course.enrollment_date && (
                                      <span className="ml-1">
                                        - {new Date(course.enrollment_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {studentEvents.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Event Bookings ({studentEvents.length}):
                                </p>
                                {studentEvents.map((event, index) => (
                                  <div key={event.id} className="text-xs text-muted-foreground">
                                    • {event.event_title}
                                    {event.booking_date && (
                                      <span className="ml-1">
                                        - {new Date(event.booking_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              {studentCourses.length > 0 && (
                                <Badge variant="secondary">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {studentCourses.length} Course{studentCourses.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {studentEvents.length > 0 && (
                                <Badge variant="secondary">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {studentEvents.length} Event{studentEvents.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(`mailto:${student.email}`)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <CreatorAnnouncementModal
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          selectedStudents={selectedStudents}
          studentsData={uniqueStudents}
          onSuccess={handleAnnouncementSuccess}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorStudents;
