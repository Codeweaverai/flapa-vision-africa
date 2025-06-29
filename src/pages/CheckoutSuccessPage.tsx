
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, MapPin, Ticket, BookOpen, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const success = searchParams.get('success');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (success === 'true' && (sessionId || orderId)) {
      processSuccessfulPayment();
    } else {
      setLoading(false);
    }
  }, [user, sessionId, orderId, success]);

  const processSuccessfulPayment = async () => {
    try {
      setLoading(true);

      // If we have a session_id, call verify-payment
      if (sessionId) {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, paymentStatus: 'completed' }
        });

        if (verifyError) {
          console.error('Payment verification error:', verifyError);
          toast.error('Payment verification failed');
          return;
        }

        console.log('Payment verified:', verifyData);
      }

      // Fetch order details if we have orderId
      if (orderId) {
        await fetchOrderDetails(orderId);
      }

    } catch (error) {
      console.error('Error processing successful payment:', error);
      toast.error('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderIdParam: string) => {
    try {
      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderIdParam)
        .single();

      if (orderError) throw orderError;
      setOrderDetails(order);

      // Fetch event bookings
      const { data: bookings, error: bookingsError } = await supabase
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
        .eq('order_id', orderIdParam);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        setEventBookings(bookings as EventBooking[]);
      }

      // Fetch course enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses (
            id,
            title,
            thumbnail_url
          )
        `)
        .eq('order_id', orderIdParam);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else {
        setCourseEnrollments(enrollments as CourseEnrollment[]);
      }

    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  if (success !== 'true') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-4">Payment Failed</h2>
              <p className="text-gray-600 mb-4">Your payment was not successful. Please try again.</p>
              <Link to="/cart">
                <Button className="bg-gradient-to-r from-orange-500 to-purple-600">
                  Return to Cart
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <Card className="mb-8 text-center">
              <CardContent className="pt-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600">
                  Thank you for your purchase! Your payment has been processed successfully.
                </p>
                {orderDetails && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Order ID: {orderDetails.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      Total: {orderDetails.currency} {orderDetails.total_amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Bookings */}
            {eventBookings.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Event Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            )}

            {/* Course Enrollments */}
            {courseEnrollments.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <Link to={`/learning/course/${enrollment.course.id}`}>
                          <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                            Start Learning
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link to="/account/orders">
                <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  View My Orders
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSuccessPage;
