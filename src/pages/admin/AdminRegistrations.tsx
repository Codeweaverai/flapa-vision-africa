
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, CreditCard, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import RegistrationsTable, { type RegistrationItem } from '@/components/admin/RegistrationsTable';

interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
  mobile_operator: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  events: {
    title: string;
  };
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

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
  };
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const AdminRegistrations = () => {
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      // Load event registrations
      const { data: eventRegs, error: eventError } = await supabase
        .from('registrations')
        .select(`
          *,
          events(title),
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (eventError) throw eventError;

      // Load course enrollments
      const { data: courseEnrolls, error: courseError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(title),
          profiles(full_name, email)
        `)
        .order('enrollment_date', { ascending: false });

      if (courseError) throw courseError;

      setEventRegistrations(eventRegs || []);
      setCourseEnrollments(courseEnrolls || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  // Transform event registrations to common format
  const transformedEventRegs: RegistrationItem[] = eventRegistrations.map((reg) => ({
    id: reg.id,
    user_id: reg.user_id,
    entity_id: reg.event_id,
    entity_title: reg.events?.title || 'Unknown Event',
    entity_type: 'event' as const,
    user_name: reg.profiles?.full_name || 'Unknown User',
    user_email: reg.profiles?.email || 'No email',
    created_at: reg.created_at,
    status: reg.status,
    payment_status: reg.payment_status,
    payment_amount: reg.payment_amount,
    payment_currency: reg.payment_currency,
    payment_method: reg.payment_method,
    type: 'event'
  }));

  // Transform course enrollments to common format
  const transformedCourseEnrolls: RegistrationItem[] = courseEnrollments.map((enroll) => ({
    id: enroll.id,
    user_id: enroll.user_id,
    entity_id: enroll.course_id,
    entity_title: enroll.courses?.title || 'Unknown Course',
    entity_type: 'course' as const,
    user_name: enroll.profiles?.full_name || 'Unknown User',
    user_email: enroll.profiles?.email || 'No email',
    created_at: enroll.enrollment_date,
    status: enroll.is_completed ? 'completed' : 'active',
    payment_status: enroll.payment_status,
    payment_amount: null,
    payment_currency: null,
    payment_method: null,
    type: 'course'
  }));

  const allRegistrations = [...transformedEventRegs, ...transformedCourseEnrolls];

  // Calculate statistics
  const totalRegistrations = allRegistrations.length;
  const eventCount = transformedEventRegs.length;
  const courseCount = transformedCourseEnrolls.length;
  const totalRevenue = allRegistrations.reduce((sum, reg) => 
    sum + (reg.payment_amount || 0), 0
  );

  if (loading) {
    return (
      <AdminLayout title="Registrations">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Registrations">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              All time registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Registrations</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventCount}</div>
            <p className="text-xs text-muted-foreground">
              Event sign-ups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseCount}</div>
            <p className="text-xs text-muted-foreground">
              Course enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From paid registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
          <CardDescription>
            Manage event registrations and course enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({totalRegistrations})</TabsTrigger>
              <TabsTrigger value="events">Events ({eventCount})</TabsTrigger>
              <TabsTrigger value="courses">Courses ({courseCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <RegistrationsTable 
                registrations={allRegistrations}
                onEdit={(registration) => console.log('Edit:', registration)}
                onDelete={(id) => console.log('Delete:', id)}
                onView={(registration) => console.log('View:', registration)}
              />
            </TabsContent>
            
            <TabsContent value="events" className="mt-6">
              <RegistrationsTable 
                registrations={transformedEventRegs}
                onEdit={(registration) => console.log('Edit:', registration)}
                onDelete={(id) => console.log('Delete:', id)}
                onView={(registration) => console.log('View:', registration)}
              />
            </TabsContent>
            
            <TabsContent value="courses" className="mt-6">
              <RegistrationsTable 
                registrations={transformedCourseEnrolls}
                onEdit={(registration) => console.log('Edit:', registration)}
                onDelete={(id) => console.log('Delete:', id)}
                onView={(registration) => console.log('View:', registration)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminRegistrations;
