
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, MessageSquare, Calendar, BookOpen, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import BulkAnnouncementModal from '@/components/creator/BulkAnnouncementModal';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  enrollment_date?: string;
  booking_date?: string;
  course_title?: string;
  event_title?: string;
  payment_status: string;
  type: 'course' | 'event';
}

const CreatorStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get course enrollments
      const { data: courseEnrollments, error: courseError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          enrollment_date,
          payment_status,
          courses!inner(
            title,
            creator_id
          )
        `)
        .eq('courses.creator_id', user.id)
        .eq('payment_status', 'completed');

      // Get event bookings
      const { data: eventBookings, error: eventError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          user_id,
          booking_date,
          payment_status,
          events!inner(
            title,
            creator_id
          )
        `)
        .eq('events.creator_id', user.id)
        .eq('payment_status', 'completed');

      if (courseError) {
        console.error('Error fetching course enrollments:', courseError);
      }
      
      if (eventError) {
        console.error('Error fetching event bookings:', eventError);
      }

      // Get unique user IDs
      const courseUserIds = courseEnrollments?.map(e => e.user_id) || [];
      const eventUserIds = eventBookings?.map(b => b.user_id) || [];
      const allUserIds = [...new Set([...courseUserIds, ...eventUserIds])];

      if (allUserIds.length === 0) {
        setStudents([]);
        return;
      }

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', allUserIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        throw profilesError;
      }

      // Get user emails from auth
      const { data: authUsers } = await supabase.functions.invoke('get-user-emails', {
        body: { user_ids: allUserIds }
      });

      const emailMap = new Map();
      if (authUsers?.users) {
        authUsers.users.forEach((user: any) => {
          emailMap.set(user.id, user.email);
        });
      }

      // Combine data
      const studentsData: Student[] = [];
      
      // Process course enrollments
      courseEnrollments?.forEach(enrollment => {
        const profile = profiles?.find(p => p.id === enrollment.user_id);
        if (profile) {
          studentsData.push({
            id: enrollment.id,
            user_id: enrollment.user_id,
            full_name: profile.full_name || profile.username || 'Unknown',
            username: profile.username || '',
            email: emailMap.get(enrollment.user_id) || '',
            enrollment_date: enrollment.enrollment_date,
            course_title: enrollment.courses.title,
            payment_status: enrollment.payment_status,
            type: 'course'
          });
        }
      });

      // Process event bookings
      eventBookings?.forEach(booking => {
        const profile = profiles?.find(p => p.id === booking.user_id);
        if (profile) {
          studentsData.push({
            id: booking.id,
            user_id: booking.user_id,
            full_name: profile.full_name || profile.username || 'Unknown',
            username: profile.username || '',
            email: emailMap.get(booking.user_id) || '',
            booking_date: booking.booking_date,
            event_title: booking.events.title,
            payment_status: booking.payment_status,
            type: 'event'
          });
        }
      });

      // Sort by most recent
      studentsData.sort((a, b) => {
        const dateA = new Date(a.enrollment_date || a.booking_date || 0);
        const dateB = new Date(b.enrollment_date || b.booking_date || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.course_title && student.course_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.event_title && student.event_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <CreatorLayout title="Students">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Students">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Students</h2>
            <p className="text-muted-foreground">
              Manage your course enrollments and event attendees
            </p>
          </div>
          <Button 
            onClick={() => setShowAnnouncementModal(true)}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Announcement
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students & Attendees ({filteredStudents.length})
            </CardTitle>
            <CardDescription>
              All students enrolled in your courses and attendees of your events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No students match your search criteria.' : 'Students will appear here once they enroll in your courses or register for your events.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div key={`${student.type}-${student.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{student.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {student.type === 'course' ? (
                            <div className="flex items-center gap-1 text-xs">
                              <BookOpen className="h-3 w-3" />
                              <span>{student.course_title}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs">
                              <Ticket className="h-3 w-3" />
                              <span>{student.event_title}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {student.type === 'course' 
                                ? new Date(student.enrollment_date!).toLocaleDateString()
                                : new Date(student.booking_date!).toLocaleDateString()
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={student.payment_status === 'completed' ? 'default' : 'secondary'}>
                        {student.payment_status}
                      </Badge>
                      <Badge variant="outline">
                        {student.type === 'course' ? 'Student' : 'Attendee'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BulkAnnouncementModal
        open={showAnnouncementModal}
        onOpenChange={setShowAnnouncementModal}
        recipientType="all_students"
        onSuccess={() => {
          toast.success('Announcement sent successfully');
        }}
      />
    </CreatorLayout>
  );
};

export default CreatorStudents;
