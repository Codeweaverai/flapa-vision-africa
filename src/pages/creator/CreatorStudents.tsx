
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { 
  Users, 
  Search, 
  Download, 
  GraduationCap, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  completion_date?: string;
  is_completed: boolean;
  payment_status: string;
  course: {
    title: string;
    thumbnail_url?: string;
  };
  user: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface EventBooking {
  id: string;
  user_id: string;
  event_id: string;
  booking_date: string;
  status: string;
  payment_status: string;
  ticket_quantity: number;
  booking_code: string;
  event: {
    title: string;
    start_time: string;
    location: string;
    image_url?: string;
  };
  user: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  tickets: {
    id: string;
    ticket_code: string;
    ticket_status: string;
    check_in?: {
      id: string;
      check_in_time: string;
      checked_in_by: string;
    };
  }[];
}

const CreatorStudents = () => {
  const { user } = useAuth();
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    if (user) {
      fetchStudentData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to course enrollments changes
    const enrollmentsChannel = supabase
      .channel('course-enrollments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments'
        },
        () => {
          fetchCourseEnrollments();
        }
      )
      .subscribe();

    // Subscribe to event bookings changes
    const bookingsChannel = supabase
      .channel('event-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_bookings'
        },
        () => {
          fetchEventBookings();
        }
      )
      .subscribe();

    // Subscribe to check-ins changes
    const checkInsChannel = supabase
      .channel('check-ins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins'
        },
        () => {
          fetchEventBookings();
        }
      )
      .subscribe();

    // Subscribe to generated tickets changes
    const ticketsChannel = supabase
      .channel('generated-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_tickets'
        },
        () => {
          fetchEventBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(checkInsChannel);
      supabase.removeChannel(ticketsChannel);
    };
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCourseEnrollments(),
        fetchEventBookings()
      ]);
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseEnrollments = async () => {
    try {
      // Get all enrollments for courses created by the current user
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          course_id,
          enrollment_date,
          completion_date,
          is_completed,
          payment_status,
          courses!inner(title, thumbnail_url, creator_id)
        `)
        .eq('courses.creator_id', user?.id)
        .order('enrollment_date', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching course enrollments:', enrollmentsError);
        toast.error('Failed to load course enrollments');
        return;
      }

      if (!enrollmentsData || enrollmentsData.length === 0) {
        setCourseEnrollments([]);
        return;
      }

      // Get unique user IDs from all enrollments
      const userIds = [...new Set(enrollmentsData.map(e => e.user_id))];

      // Fetch user emails using the function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });

      if (usersError) {
        console.error('Error fetching user emails:', usersError);
        toast.error('Failed to load user data');
        return;
      }

      // Fetch profiles for additional data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to load user profiles');
        return;
      }

      // Create lookup maps
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      // Combine enrollments with user data
      const enrichedEnrollments: CourseEnrollment[] = enrollmentsData
        .map(enrollment => {
          const userAuth = usersMap.get(enrollment.user_id);
          const profile = profilesMap.get(enrollment.user_id);
          
          if (!userAuth || !profile || !enrollment.courses) return null;

          return {
            id: enrollment.id,
            user_id: enrollment.user_id,
            course_id: enrollment.course_id,
            enrollment_date: enrollment.enrollment_date,
            completion_date: enrollment.completion_date,
            is_completed: enrollment.is_completed,
            payment_status: enrollment.payment_status,
            course: {
              title: enrollment.courses.title,
              thumbnail_url: enrollment.courses.thumbnail_url
            },
            user: {
              full_name: profile.full_name || 'Unknown User',
              email: userAuth.email || '',
              avatar_url: profile.avatar_url
            }
          };
        })
        .filter(Boolean) as CourseEnrollment[];

      setCourseEnrollments(enrichedEnrollments);
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      toast.error('Failed to load course enrollments');
    }
  };

  const fetchEventBookings = async () => {
    try {
      // Get all bookings for events created by the current user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          user_id,
          event_id,
          booking_date,
          status,
          payment_status,
          ticket_quantity,
          booking_code,
          events!inner(title, start_time, location, image_url, creator_id)
        `)
        .eq('events.creator_id', user?.id)
        .order('booking_date', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching event bookings:', bookingsError);
        toast.error('Failed to load event bookings');
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setEventBookings([]);
        return;
      }

      // Get unique user IDs from all bookings
      const userIds = [...new Set(bookingsData.map(b => b.user_id))];

      // Fetch user emails
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });

      if (usersError) {
        console.error('Error fetching user emails:', usersError);
        toast.error('Failed to load user data');
        return;
      }

      // Fetch profiles for additional data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to load user profiles');
        return;
      }

      // Create lookup maps
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      // Get booking IDs for fetching tickets
      const bookingIds = bookingsData.map(booking => booking.id);

      // Fetch tickets with check-in status
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('generated_tickets')
        .select(`
          id,
          booking_id,
          ticket_code,
          ticket_status,
          check_ins(
            id,
            check_in_time,
            checked_in_by
          )
        `)
        .in('booking_id', bookingIds);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        toast.error('Failed to load tickets data');
        return;
      }

      // Group tickets by booking_id
      const ticketsByBooking = ticketsData?.reduce((acc: Record<string, any[]>, ticket: any) => {
        if (!acc[ticket.booking_id]) {
          acc[ticket.booking_id] = [];
        }
        acc[ticket.booking_id].push({
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          ticket_status: ticket.ticket_status,
          check_in: ticket.check_ins?.[0] || null
        });
        return acc;
      }, {}) || {};

      // Combine bookings with user data and tickets
      const enrichedBookings: EventBooking[] = bookingsData
        .map(booking => {
          const userAuth = usersMap.get(booking.user_id);
          const profile = profilesMap.get(booking.user_id);
          
          if (!userAuth || !profile || !booking.events) return null;

          return {
            id: booking.id,
            user_id: booking.user_id,
            event_id: booking.event_id,
            booking_date: booking.booking_date,
            status: booking.status,
            payment_status: booking.payment_status,
            ticket_quantity: booking.ticket_quantity,
            booking_code: booking.booking_code,
            event: {
              title: booking.events.title,
              start_time: booking.events.start_time,
              location: booking.events.location,
              image_url: booking.events.image_url
            },
            user: {
              full_name: profile.full_name || 'Unknown User',
              email: userAuth.email || '',
              avatar_url: profile.avatar_url
            },
            tickets: ticketsByBooking[booking.id] || []
          };
        })
        .filter(Boolean) as EventBooking[];

      setEventBookings(enrichedBookings);

    } catch (error) {
      console.error('Error fetching event bookings:', error);
      toast.error('Failed to load event registrations');
    }
  };

  const exportCourseStudents = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Course', 'Enrollment Date', 'Payment Status', 'Completion Status'],
      ...filteredCourseEnrollments.map(enrollment => [
        enrollment.user.full_name,
        enrollment.user.email,
        enrollment.course.title,
        format(new Date(enrollment.enrollment_date), 'yyyy-MM-dd'),
        enrollment.payment_status,
        enrollment.is_completed ? 'Completed' : 'In Progress'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEventAttendees = () => {
    const csvContent = [
      ['Attendee Name', 'Email', 'Event', 'Booking Date', 'Status', 'Payment Status', 'Tickets', 'Checked In', 'Check-in Rate'],
      ...filteredEventBookings.map(booking => [
        booking.user.full_name,
        booking.user.email,
        booking.event.title,
        format(new Date(booking.booking_date), 'yyyy-MM-dd'),
        booking.status,
        booking.payment_status,
        booking.tickets.length.toString(),
        booking.tickets.filter(t => t.check_in).length.toString(),
        booking.tickets.length > 0 ? `${((booking.tickets.filter(t => t.check_in).length / booking.tickets.length) * 100).toFixed(1)}%` : '0%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_attendees.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCourseEnrollments = courseEnrollments.filter(enrollment =>
    enrollment.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEventBookings = eventBookings.filter(booking =>
    booking.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCheckInBadge = (tickets: any[]) => {
    const checkedIn = tickets.filter(t => t.check_in).length;
    const total = tickets.length;
    
    if (total === 0) return <Badge variant="outline">No Tickets</Badge>;
    
    const rate = (checkedIn / total) * 100;
    
    if (rate === 100) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />All Checked In</Badge>;
    } else if (rate > 0) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        <Clock className="h-3 w-3 mr-1" />
        {checkedIn}/{total} Checked In
      </Badge>;
    } else {
      return <Badge variant="outline" className="border-red-500 text-red-700">
        <XCircle className="h-3 w-3 mr-1" />
        Not Checked In
      </Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Students & Attendees
            </h1>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={activeTab === 'courses' ? exportCourseStudents : exportEventAttendees}
                variant="outline"
                className="bg-gradient-to-r from-orange-500 to-purple-500 text-white border-0 hover:from-orange-600 hover:to-purple-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="courses" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <GraduationCap className="h-4 w-4" />
                Course Students ({filteredCourseEnrollments.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <Calendar className="h-4 w-4" />
                Event Attendees ({filteredEventBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    <Users className="h-5 w-5" />
                    Course Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourseEnrollments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No course enrollments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCourseEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={enrollment.user.avatar_url} />
                                  <AvatarFallback>
                                    {enrollment.user.full_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{enrollment.user.full_name}</div>
                                  <div className="text-sm text-gray-500">{enrollment.user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {enrollment.course.thumbnail_url && (
                                  <img 
                                    src={enrollment.course.thumbnail_url} 
                                    alt={enrollment.course.title}
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                )}
                                <span className="font-medium">{enrollment.course.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(enrollment.payment_status)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={enrollment.is_completed ? 'default' : 'secondary'}>
                                {enrollment.is_completed ? 'Completed' : 'In Progress'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {enrollment.completion_date ? (
                                <span className="text-sm text-gray-600">
                                  {format(new Date(enrollment.completion_date), 'MMM dd, yyyy')}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    <Users className="h-5 w-5" />
                    Event Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Attendee</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Booking Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Check-in Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEventBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No event registrations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEventBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={booking.user.avatar_url} />
                                  <AvatarFallback>
                                    {booking.user.full_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{booking.user.full_name}</div>
                                  <div className="text-sm text-gray-500">{booking.user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {booking.event.image_url && (
                                  <img 
                                    src={booking.event.image_url} 
                                    alt={booking.event.title}
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{booking.event.title}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {booking.event.location}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {getBookingStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(booking.payment_status)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {booking.tickets.length} Ticket{booking.tickets.length !== 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getCheckInBadge(booking.tickets)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorStudents;
