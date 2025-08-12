
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, CreditCard, TrendingUp, Download, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import RegistrationsTable, { type RegistrationItem } from '@/components/admin/RegistrationsTable';

interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrollment_date: string;
  is_completed: boolean;
  payment_status: string;
  payment_id: string | null;
  completion_date: string | null;
  courses: {
    title: string;
  } | null;
  user_profile: {
    full_name: string;
    email: string;
  } | null;
}

interface EventBooking {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_currency: string | null;
  phone_number: string | null;
  booking_date: string;
  events: {
    title: string;
  } | null;
  user_profile: {
    full_name: string;
    email: string;
  } | null;
}

const AdminRegistrations = () => {
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      // Load course enrollments with user profiles joined via user_id
      const { data: enrollmentsData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(title),
          user_profile:profiles!course_enrollments_user_id_fkey(full_name, email)
        `)
        .order('enrollment_date', { ascending: false });

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError);
        toast.error('Failed to load course enrollments');
      } else {
        setCourseEnrollments(enrollmentsData || []);
      }

      // Load event bookings with user profiles joined via user_id
      const { data: bookingsData, error: bookingError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events(title),
          user_profile:profiles!event_bookings_user_id_fkey(full_name, email)
        `)
        .order('booking_date', { ascending: false });

      if (bookingError) {
        console.error('Booking error:', bookingError);
        toast.error('Failed to load event bookings');
      } else {
        setEventBookings(bookingsData || []);
      }

    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  // Transform course enrollments to common format
  const transformedEnrollments: RegistrationItem[] = courseEnrollments.map((enrollment) => ({
    id: enrollment.id,
    user_id: enrollment.user_id,
    entity_id: enrollment.course_id,
    entity_title: enrollment.courses?.title || 'Unknown Course',
    entity_type: 'course' as const,
    user_name: enrollment.user_profile?.full_name || 'Unknown User',
    user_email: enrollment.user_profile?.email || 'No email',
    created_at: enrollment.enrollment_date,
    status: enrollment.is_completed ? 'completed' : 'active',
    payment_status: enrollment.payment_status,
    payment_amount: null,
    payment_currency: null,
    payment_method: null,
    type: 'course'
  }));

  // Transform event bookings to common format
  const transformedBookings: RegistrationItem[] = eventBookings.map((booking) => ({
    id: booking.id,
    user_id: booking.user_id,
    entity_id: booking.event_id,
    entity_title: booking.events?.title || 'Unknown Event',
    entity_type: 'event' as const,
    user_name: booking.user_profile?.full_name || 'Unknown User',
    user_email: booking.user_profile?.email || 'No email',
    created_at: booking.booking_date,
    status: booking.status,
    payment_status: booking.payment_status,
    payment_amount: booking.payment_amount,
    payment_currency: booking.payment_currency,
    payment_method: null,
    type: 'event'
  }));

  const allRegistrations = [...transformedEnrollments, ...transformedBookings];

  // Calculate statistics
  const totalRegistrations = allRegistrations.length;
  const enrollmentCount = transformedEnrollments.length;
  const bookingCount = transformedBookings.length;
  const totalRevenue = allRegistrations.reduce((sum, reg) => 
    sum + (reg.payment_amount || 0), 0
  );

  const generateReport = async () => {
    try {
      const reportData = {
        generated_at: new Date().toISOString(),
        total_registrations: totalRegistrations,
        course_enrollments: enrollmentCount,
        event_bookings: bookingCount,
        total_revenue: totalRevenue,
        registrations: allRegistrations
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <AdminLayout title="Registrations">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </AdminLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <AdminLayout title="Registrations">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs opacity-80">
                All time registrations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
              <CalendarDays className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollmentCount}</div>
              <p className="text-xs opacity-80">
                Course sign-ups
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-400 to-purple-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Bookings</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingCount}</div>
              <p className="text-xs opacity-80">
                Event bookings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-400 to-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs opacity-80">
                From paid registrations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={generateReport}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>

        {/* Registrations Table */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              All Registrations
            </CardTitle>
            <CardDescription>
              Manage course enrollments and event bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-orange-100 to-purple-100">
                <TabsTrigger value="all">All ({totalRegistrations})</TabsTrigger>
                <TabsTrigger value="courses">Courses ({enrollmentCount})</TabsTrigger>
                <TabsTrigger value="events">Events ({bookingCount})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <RegistrationsTable 
                  registrations={allRegistrations}
                  onEdit={(registration) => console.log('Edit:', registration)}
                  onDelete={(id) => console.log('Delete:', id)}
                  onView={(registration) => console.log('View:', registration)}
                />
              </TabsContent>
              
              <TabsContent value="courses" className="mt-6">
                <RegistrationsTable 
                  registrations={transformedEnrollments}
                  onEdit={(registration) => console.log('Edit:', registration)}
                  onDelete={(id) => console.log('Delete:', id)}
                  onView={(registration) => console.log('View:', registration)}
                />
              </TabsContent>
              
              <TabsContent value="events" className="mt-6">
                <RegistrationsTable 
                  registrations={transformedBookings}
                  onEdit={(registration) => console.log('Edit:', registration)}
                  onDelete={(id) => console.log('Delete:', id)}
                  onView={(registration) => console.log('View:', registration)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AdminLayout>
    </div>
  );
};

export default AdminRegistrations;
