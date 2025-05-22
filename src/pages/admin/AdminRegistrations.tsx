
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegistrationsTable from '@/components/admin/RegistrationsTable';

interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_amount?: number;
  payment_currency?: string;
  created_at?: string;
  event?: {
    title: string;
  };
  profiles?: {
    full_name?: string;
    username?: string;
    email?: string;
  };
}

interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrollment_date?: string;
  is_completed?: boolean;
  payment_status?: string;
  courses?: {
    title: string;
  };
  profiles?: {
    full_name?: string;
    username?: string;
    email?: string;
  };
}

interface AdminCombinedRegistration {
  id: string;
  type: 'event' | 'course';
  title: string;
  date: string;
  user_name: string;
  user_email: string;
  event_id?: string;
  user_id: string;
  status?: string;
  payment_status?: string;
}

const AdminRegistrations = () => {
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [courseEnrollments, setCoursEnrollments] = useState<CourseEnrollment[]>([]);
  const [combinedRegistrations, setCombinedRegistrations] = useState<AdminCombinedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        // Fetch event registrations with related event and user data
        const { data: eventRegs, error: eventError } = await supabase
          .from('registrations')
          .select('*, events(*), profiles(*)') as { data: EventRegistration[], error: any };

        if (eventError) throw eventError;

        // Fetch course enrollments with related course and user data
        const { data: courseEnrols, error: courseError } = await supabase
          .from('course_enrollments')
          .select('*, courses(*), profiles(*)') as { data: CourseEnrollment[], error: any };

        if (courseError) throw courseError;

        setEventRegistrations(eventRegs || []);
        setCoursEnrollments(courseEnrols || []);

        // Combine and format registrations
        const combined: AdminCombinedRegistration[] = [
          ...eventRegs.map(reg => ({
            id: reg.id,
            type: 'event' as const,
            event_id: reg.event_id,
            user_id: reg.user_id,
            title: reg.event?.title || 'Unknown Event',
            date: reg.created_at || new Date().toISOString(),
            user_name: reg.profiles?.full_name || reg.profiles?.username || 'Unknown User',
            user_email: reg.profiles?.email || 'No email',
            status: reg.status,
            payment_status: reg.payment_status
          })),
          ...courseEnrols.map(enrol => ({
            id: enrol.id,
            type: 'course' as const,
            course_id: enrol.course_id,
            user_id: enrol.user_id,
            title: enrol.courses?.title || 'Unknown Course',
            date: enrol.enrollment_date || new Date().toISOString(),
            user_name: enrol.profiles?.full_name || enrol.profiles?.username || 'Unknown User',
            user_email: enrol.profiles?.email || 'No email',
            status: enrol.is_completed ? 'completed' : 'in progress',
            payment_status: enrol.payment_status
          }))
        ];

        setCombinedRegistrations(combined);
      } catch (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const updateRegistrationStatus = async (id: string, type: 'event' | 'course', status: string) => {
    try {
      if (type === 'event') {
        const { error } = await supabase
          .from('registrations')
          .update({ status })
          .eq('id', id);
        
        if (error) throw error;

        setEventRegistrations(prev =>
          prev.map(reg => (reg.id === id ? { ...reg, status } : reg))
        );
      } else {
        // For courses, we handle differently based on status
        let updateData = {};
        if (status === 'completed') {
          updateData = { is_completed: true };
        } else if (status === 'paid') {
          updateData = { payment_status: 'paid' };
        } else if (status === 'cancelled') {
          updateData = { payment_status: 'cancelled' };
        }

        const { error } = await supabase
          .from('course_enrollments')
          .update(updateData)
          .eq('id', id);
        
        if (error) throw error;

        setCoursEnrollments(prev =>
          prev.map(enrol => (enrol.id === id ? { ...enrol, ...updateData } : enrol))
        );
      }

      // Update the combined registrations
      setCombinedRegistrations(prev => {
        return prev.map(reg => {
          if (reg.id === id && reg.type === type) {
            if (type === 'event') {
              return { ...reg, status };
            } else {
              if (status === 'completed') {
                return { ...reg, status: 'completed' };
              } else if (status === 'paid' || status === 'cancelled') {
                return { ...reg, payment_status: status };
              }
            }
          }
          return reg;
        });
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast.error('Failed to update status');
      return Promise.reject(error);
    }
  };

  const filteredRegistrations = activeTab === 'all' 
    ? combinedRegistrations 
    : combinedRegistrations.filter(reg => reg.type === activeTab);

  return (
    <AdminLayout>
      <div className="container p-6">
        <h1 className="text-3xl font-bold mb-6">Registrations & Enrollments</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="event">Events</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading registrations...</p>
          </div>
        ) : (
          <RegistrationsTable 
            registrations={filteredRegistrations} 
            onUpdateStatus={updateRegistrationStatus}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
