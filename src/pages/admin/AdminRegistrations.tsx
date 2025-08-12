import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Mail, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  average_rating?: number;
  total_reviews?: number;
  enrollment_count?: number;
  creator: {
    full_name: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location?: string;
  start_time: string;
  end_time: string;
  price: number;
  average_rating?: number;
  total_reviews?: number;
  registration_count?: number;
  creator: {
    full_name: string;
  };
}

interface Creator {
  id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  total_courses?: number;
  total_events?: number;
  average_rating?: number;
  total_students?: number;
}

interface Newsletter {
  id: string;
  subject: string;
  body_html: string;
  status: string;
  created_at: string;
  sent_at?: string;
  total_recipients?: number;
  successful_sends?: number;
  failed_sends?: number;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

interface RegistrationItem {
  id: string;
  user_id: string;
  entity_id: string;
  entity_title: string;
  entity_type: 'course' | 'event';
  user_name: string;
  user_email: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
  type: string;
}

const AdminRegistrations = () => {
  const [courseEnrollments, setCourseEnrollments] = useState<RegistrationItem[]>([]);
  const [eventBookings, setEventBookings] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      
      // Load course enrollments with profiles
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses!inner(title),
          user_profile:profiles!course_enrollments_user_id_fkey(full_name, email)
        `)
        .order('enrollment_date', { ascending: false });

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError);
      } else if (enrollments) {
        const formattedEnrollments: RegistrationItem[] = enrollments.map((enrollment: any) => ({
          id: enrollment.id,
          user_id: enrollment.user_id,
          entity_id: enrollment.course_id,
          entity_title: enrollment.courses?.title || 'Unknown Course',
          entity_type: 'course' as const,
          user_name: enrollment.user_profile?.full_name || 'Unknown User',
          user_email: enrollment.user_profile?.email || 'No email',
          created_at: enrollment.enrollment_date,
          status: enrollment.is_completed ? 'completed' : 'active',
          payment_status: enrollment.payment_status || 'pending',
          payment_amount: null,
          payment_currency: null,
          payment_method: null,
          type: 'Course'
        }));
        setCourseEnrollments(formattedEnrollments);
      }

      // Load event bookings with profiles  
      const { data: bookings, error: bookingError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events!inner(title),
          user_profile:profiles!event_bookings_user_id_fkey(full_name, email)
        `)
        .order('booking_date', { ascending: false });

      if (bookingError) {
        console.error('Booking error:', bookingError);
      } else if (bookings) {
        const formattedBookings: RegistrationItem[] = bookings.map((booking: any) => ({
          id: booking.id,
          user_id: booking.user_id,
          entity_id: booking.event_id,
          entity_title: booking.events?.title || 'Unknown Event',
          entity_type: 'event' as const,
          user_name: booking.user_profile?.full_name || 'Unknown User',
          user_email: booking.user_profile?.email || 'No email',
          created_at: booking.booking_date,
          status: booking.status || 'pending',
          payment_status: booking.payment_status || 'pending',
          payment_amount: booking.payment_amount || 0,
          payment_currency: booking.payment_currency || 'USD',
          payment_method: booking.mobile_operator || null,
          type: 'Event'
        }));
        setEventBookings(formattedBookings);
      }

    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const allRegistrations = [...courseEnrollments, ...eventBookings].sort((a, b) => (new Date(b.created_at)).getTime() - (new Date(a.created_at)).getTime());

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
              Registrations Management
            </h1>
            <p className="text-gray-600 mt-2">
              View and manage all course enrollments and event bookings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRegistrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">{registration.type}</TableCell>
                          <TableCell>{registration.entity_title}</TableCell>
                          <TableCell>{registration.user_name}</TableCell>
                          <TableCell>{registration.user_email}</TableCell>
                          <TableCell>{new Date(registration.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{registration.status}</TableCell>
                          <TableCell>{registration.payment_status}</TableCell>
                          <TableCell>{registration.payment_amount}</TableCell>
                          <TableCell>{registration.payment_method}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
