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

// Card color configurations
const cardColors = [
  { bg: 'bg-gradient-to-br from-orange-100 to-purple-100', border: 'border-orange-200' },
  { bg: 'bg-gradient-to-br from-orange-50 to-purple-50', border: 'border-purple-200' },
  { bg: 'bg-gradient-to-br from-amber-100 to-indigo-100', border: 'border-amber-200' }
];

const AttendeeExportButton: React.FC<AttendeeExportButtonProps> = ({ students, fileName }) => {
  const handleExport = () => {
    // Don't include email in the export
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Username,Type,Content,Date\n"
      + students.map(s => `${s.full_name},${s.username},${s.type},${s.course_title || s.event_title},${s.enrollment_date || s.booking_date}`).join("\n");

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
      <span className="hidden sm:inline">Export CSV</span>
      <span className="sm:hidden">Export</span>
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

      if (courseError) throw courseError;

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

      if (eventError) throw eventError;

      // Get unique user IDs
      const courseUserIds = courseEnrollments?.map(e => e.user_id) || [];
      const eventUserIds = eventBookings?.map(b => b.user_id) || [];
      const allUserIds = [...new Set([...courseUserIds, ...eventUserIds])];

      if (allUserIds.length === 0) {
        setStudents([]);
        return;
      }

      // Get user emails (hidden from UI but needed for sending messages)
      const { data: emailData } = await supabase
        .rpc('get_user_emails', { user_ids: allUserIds });

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', allUserIds);

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
              email: emailInfo?.email || '', // Email is stored but not shown
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
              email: emailInfo?.email || '', // Email is stored but not shown
              username: profile.username || '',
              booking_date: booking.booking_date,
              event_title: booking.events.title,
              type: 'event',
              payment_status: booking.payment_status
            });
          }
        });
      }

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
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Students & Attendees</h1>
            <p className="text-sm bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Manage students from your courses and event attendees
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowAnnouncementModal(true)}
              disabled={selectedStudents.length === 0}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white w-full sm:w-auto"
            >
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Send Announcement</span>
              <span className="sm:hidden">Announce</span>
              {selectedStudents.length > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {selectedStudents.length}
                </span>
              )}
            </Button>
            <AttendeeExportButton
              students={uniqueStudents}
              fileName="students-attendees"
            />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
            <Input
              placeholder="Search by name, username, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/90"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
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
              className={
                filterType === 'course'
                  ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
                  : "hover:bg-accent"
              }
            >
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Courses</span>
              <span className="sm:hidden">Courses</span>
            </Button>
            <Button
              variant={filterType === 'event' ? 'default' : 'outline'}
              onClick={() => setFilterType('event')}
              size="sm"
              className={
                filterType === 'event'
                  ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
                  : "hover:bg-accent"
              }
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Events</span>
              <span className="sm:hidden">Events</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Students Card */}
          <Card className={`${cardColors[0].bg} border ${cardColors[0].border}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-800">
                    {uniqueStudents.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Enrollments Card */}
          <Card className={`${cardColors[1].bg} border ${cardColors[1].border}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Course Enrollments</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-800">
                    {students.filter(s => s.type === 'course').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Bookings Card */}
          <Card className={`${cardColors[2].bg} border ${cardColors[2].border}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Event Bookings</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-800">
                    {students.filter(s => s.type === 'event').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl">
                Students List ({uniqueStudents.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="w-full sm:w-auto"
              >
                {selectedStudents.length === uniqueStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {uniqueStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  No students found
                </h3>
                <p className="text-purple-500">
                  {searchTerm || filterType !== 'all' 
                    ? 'No students match your current filters'
                    : 'You don\'t have any students or attendees yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                      className={`p-3 sm:p-4 border rounded-lg transition-colors ${
                        selectedStudents.includes(student.user_id)
                          ? 'bg-gradient-to-r from-orange-50 to-purple-50 border-orange-300'
                          : 'hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-purple-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.user_id)}
                            onChange={() => handleSelectStudent(student.user_id)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold truncate">{student.full_name}</h4>
                              <Badge variant="outline" className="bg-white">
                                @{student.username}
                              </Badge>
                            </div>
                            
                            {studentCourses.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-purple-600 mb-1">
                                  Enrolled Courses ({studentCourses.length}):
                                </p>
                                <div className="space-y-1">
                                  {studentCourses.slice(0, 2).map((course) => (
                                    <div key={course.id} className="text-xs text-orange-700 truncate">
                                      • {course.course_title} 
                                      {course.enrollment_date && (
                                        <span className="ml-1">
                                          - {new Date(course.enrollment_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {studentCourses.length > 2 && (
                                    <div className="text-xs text-orange-500">
                                      +{studentCourses.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {studentEvents.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-purple-600 mb-1">
                                  Event Bookings ({studentEvents.length}):
                                </p>
                                <div className="space-y-1">
                                  {studentEvents.slice(0, 2).map((event) => (
                                    <div key={event.id} className="text-xs text-orange-700 truncate">
                                      • {event.event_title}
                                      {event.booking_date && (
                                        <span className="ml-1">
                                          - {new Date(event.booking_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {studentEvents.length > 2 && (
                                    <div className="text-xs text-orange-500">
                                      +{studentEvents.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap">
                              {studentCourses.length > 0 && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {studentCourses.length} Course{studentCourses.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {studentEvents.length > 0 && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {studentEvents.length} Event{studentEvents.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(`mailto:${student.email}`)}
                              className="text-purple-600"
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
