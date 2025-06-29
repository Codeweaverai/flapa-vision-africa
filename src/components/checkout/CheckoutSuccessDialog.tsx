
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, MapPin, Ticket, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface CheckoutSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

interface EventBooking {
  id: string;
  booking_code: string;
  status: string;
  ticket_quantity: number;
  event: {
    id: string;
    title: string;
    start_time: string;
    location: string;
  };
  event_ticket: {
    name: string;
    ticket_type: string;
  };
}

interface CourseEnrollment {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
  };
}

const CheckoutSuccessDialog: React.FC<CheckoutSuccessDialogProps> = ({
  isOpen,
  onClose,
  orderId
}) => {
  // Fetch event bookings
  const { data: eventBookings = [] } = useQuery({
    queryKey: ['event-bookings', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events (
            id,
            title,
            start_time,
            location
          ),
          event_ticket:event_tickets (
            name,
            ticket_type
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data as EventBooking[];
    },
    enabled: !!orderId && isOpen
  });

  // Fetch course enrollments
  const { data: courseEnrollments = [] } = useQuery({
    queryKey: ['course-enrollments', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses (
            id,
            title,
            thumbnail_url
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!orderId && isOpen
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Thank you for your purchase! Your payment has been processed successfully.
            </p>
          </div>

          {/* Event Bookings */}
          {eventBookings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Event Tickets
              </h3>
              {eventBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-purple-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{booking.event.title}</h4>
                    <Badge className="bg-green-500">
                      {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(booking.event.start_time), 'PPP p')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.event.location}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-medium">
                        {booking.event_ticket.name} • Quantity: {booking.ticket_quantity}
                      </span>
                      <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                        {booking.booking_code}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Course Enrollments */}
          {courseEnrollments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Enrollments
              </h3>
              {courseEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-4">
                    {enrollment.course.thumbnail_url && (
                      <img
                        src={enrollment.course.thumbnail_url}
                        alt={enrollment.course.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{enrollment.course.title}</h4>
                      <Badge className="bg-green-500 mt-1">Enrolled</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Link to="/account/orders" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                View My Orders
              </Button>
            </Link>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue Shopping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutSuccessDialog;
