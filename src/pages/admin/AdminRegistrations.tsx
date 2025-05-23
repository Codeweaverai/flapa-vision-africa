
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import RegistrationsTable from '@/components/admin/RegistrationsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

// Define types for safer handling of Supabase query results
interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
  payment_id: string | null;
  phone_number?: string;
  mobile_operator?: string;
  events: {
    title: string;
    start_time: string;
    [key: string]: any;
  } | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    [key: string]: any;
  } | null;
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  is_completed: boolean;
  completion_date: string | null;
  payment_status: string;
  payment_id: string | null;
  created_at: string; // Adding this field which was causing an error
  courses: {
    title: string;
    price: number | null;
    [key: string]: any;
  } | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    [key: string]: any;
  } | null;
}

interface RegistrationData {
  id: string;
  user_id: string;
  entity_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_method: string;
  payment_id: string | null;
  user_fullname: string;
  user_email: string;
  title: string;
  date: string;
  type: 'event' | 'course';
  phone_number?: string;
  mobile_operator?: string;
}

const AdminRegistrations = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [eventRegistrations, setEventRegistrations] = useState<RegistrationData[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<RegistrationData[]>([]);
  
  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        // Fetch event registrations with related data
        const { data: eventRegs, error: eventError } = await supabase
          .from('registrations')
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

        // Format event registrations data with safer type handling
        const formattedEventRegs: RegistrationData[] = (eventRegs || []).map((reg: any) => ({
          id: reg.id,
          user_id: reg.user_id,
          entity_id: reg.event_id,
          created_at: reg.created_at,
          status: reg.status,
          payment_status: reg.payment_status,
          payment_amount: reg.payment_amount || 0,
          payment_currency: reg.payment_currency || 'USD',
          payment_method: reg.payment_method || 'Unknown',
          payment_id: reg.payment_id,
          phone_number: reg.phone_number,
          mobile_operator: reg.mobile_operator,
          user_fullname: reg.profiles?.full_name || 'Unknown',
          user_email: reg.profiles?.email || 'Unknown',
          title: reg.events?.title || 'Unknown Event',
          date: reg.events?.start_time ? new Date(reg.events.start_time).toLocaleDateString() : 'Unknown',
          type: 'event'
        }));

        // Format course enrollments data with safer type handling
        const formattedCourseEnrolls: RegistrationData[] = (courseEnrolls || []).map((enroll: any) => ({
          id: enroll.id,
          user_id: enroll.user_id,
          entity_id: enroll.course_id,
          created_at: enroll.enrollment_date || enroll.created_at,
          status: enroll.is_completed ? 'completed' : 'active',
          payment_status: enroll.payment_status,
          payment_amount: enroll.courses?.price || 0,
          payment_currency: 'USD',
          payment_method: 'Unknown',
          payment_id: enroll.payment_id,
          user_fullname: enroll.profiles?.full_name || 'Unknown',
          user_email: enroll.profiles?.email || 'Unknown',
          title: enroll.courses?.title || 'Unknown Course',
          date: enroll.enrollment_date ? new Date(enroll.enrollment_date).toLocaleDateString() : 'Unknown',
          type: 'course'
        }));

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
