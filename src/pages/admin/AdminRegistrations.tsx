
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import RegistrationsTable from '@/components/admin/RegistrationsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { RegistrationItem } from '@/types/eventTypes';

const AdminRegistrations = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [eventRegistrations, setEventRegistrations] = useState<RegistrationItem[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<RegistrationItem[]>([]);
  
  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        // Fetch event registrations with related data
        const { data: eventRegs, error: eventError } = await supabase
          .from('event_bookings')
          .select(`
            *,
            events:event_id (*),
            profiles:user_id (id, full_name, email)
          `);

        if (eventError) {
          throw eventError;
        }

        // Fetch course enrollments with related data
        const { data: courseEnrolls, error: courseError } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            courses:course_id (*),
            profiles:user_id (id, full_name, email)
          `);

        if (courseError) {
          throw courseError;
        }

        // Format event registrations data
        const formattedEventRegs = eventRegs?.map(reg => ({
          id: reg.id,
          user_id: reg.user_id,
          entity_id: reg.event_id,
          created_at: reg.created_at,
          status: reg.status || 'pending',
          payment_status: reg.payment_status || 'pending',
          payment_amount: reg.payment_amount,
          payment_currency: reg.payment_currency,
          payment_method: reg.payment_method,
          payment_id: reg.payment_id,
          user_fullname: reg.profiles?.full_name || 'Unknown',
          user_email: reg.profiles?.email || 'Unknown',
          title: reg.events?.title || 'Unknown Event',
          date: reg.events ? new Date(reg.events.start_time).toLocaleDateString() : 'Unknown',
          type: 'event' as const,
          ticket_number: reg.ticket_number
        })) || [];

        // Format course enrollments data
        const formattedCourseEnrolls = courseEnrolls?.map(enroll => ({
          id: enroll.id,
          user_id: enroll.user_id,
          entity_id: enroll.course_id,
          created_at: enroll.enrollment_date || enroll.created_at,
          status: enroll.is_completed ? 'completed' : 'active',
          payment_status: enroll.payment_status || 'pending',
          payment_amount: enroll.courses?.price || 0,
          payment_currency: 'USD',
          payment_id: enroll.payment_id,
          user_fullname: enroll.profiles?.full_name || 'Unknown',
          user_email: enroll.profiles?.email || 'Unknown',
          title: enroll.courses?.title || 'Unknown Course',
          date: enroll.enrollment_date ? new Date(enroll.enrollment_date).toLocaleDateString() : 'Unknown',
          type: 'course' as const
        })) || [];

        setEventRegistrations(formattedEventRegs);
        setCourseEnrollments(formattedCourseEnrolls);
      } catch (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Registrations</h1>
        
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="events">Event Registrations</TabsTrigger>
            <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
            <TabsTrigger value="all">All Registrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Registrations</CardTitle>
                <CardDescription>
                  Manage all event registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationsTable 
                  data={eventRegistrations} 
                  loading={loading}
                  type="event"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Enrollments</CardTitle>
                <CardDescription>
                  Manage all course enrollments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationsTable 
                  data={courseEnrollments} 
                  loading={loading}
                  type="course"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Registrations</CardTitle>
                <CardDescription>
                  View all registrations and enrollments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationsTable 
                  data={[...eventRegistrations, ...courseEnrollments]} 
                  loading={loading}
                  type="all"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
