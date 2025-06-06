import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Eye, Package, Ticket, CreditCard, MapPin, Clock, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  receipt_url?: string;
  created_at: string;
  stripe_payment_intent_id?: string;
  receipt_generated_at?: string;
  order_items: Array<{
    id: string;
    item_type: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    item_id: string;
  }>;
}

interface Enrollment {
  id: string;
  course_id: string;
  payment_status: string;
  enrollment_date: string;
  courses: {
    id: string;
    title: string;
    thumbnail_url?: string;
    price: number;
  };
}

interface EventBooking {
  id: string;
  event_id: string;
  payment_status: string;
  booking_date: string;
  payment_amount: number;
  payment_currency: string;
  ticket_quantity: number;
  status: string;
  events: {
    id: string;
    title: string;
    start_time: string;
    location?: string;
  };
  generated_tickets?: Array<{
    id: string;
    ticket_code: string;
    ticket_holder_name: string;
    qr_code_data: string;
    ticket_status: string;
  }>;
}

const UserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllOrders();
    }
  }, [user]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch traditional orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders error:', ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Fetch course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            thumbnail_url,
            price
          )
        `)
        .eq('user_id', user?.id)
        .order('enrollment_date', { ascending: false });

      if (enrollmentsError) {
        console.error('Enrollments error:', enrollmentsError);
      } else {
        setEnrollments(enrollmentsData || []);
      }

      // Fetch event bookings with tickets
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select(`
          *,
          events (
            id,
            title,
            start_time,
            location
          ),
          generated_tickets (
            id,
            ticket_code,
            ticket_holder_name,
            qr_code_data,
            ticket_status
          )
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false });

      if (bookingsError) {
        console.error('Bookings error:', bookingsError);
      } else {
        setEventBookings(bookingsData || []);
      }

    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'confirmed': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'pending': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      case 'failed': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const downloadTicket = async (ticketId: string, ticketCode: string) => {
    try {
      // Generate a simple ticket PDF or open ticket view
      const ticketUrl = `/ticket/${ticketId}`;
      window.open(ticketUrl, '_blank');
      toast.success('Ticket opened in new tab');
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const downloadReceipt = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  const totalItems = orders.length + enrollments.length + eventBookings.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0) + 
                   enrollments.reduce((sum, enrollment) => sum + (enrollment.courses?.price || 0), 0) +
                   eventBookings.reduce((sum, booking) => sum + booking.payment_amount, 0);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="section-container py-12">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-0 bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (totalItems === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="section-container py-12">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gradient bg-gradient-to-r from-orange-400 to-purple-600 mb-6" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  No orders yet
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  You haven't made any purchases yet. Start exploring our amazing courses and events!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/explore/courses'}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    Browse Courses
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/explore/events'}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    Browse Events
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="section-container py-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4">
                My Orders
              </h1>
              <p className="text-gray-600 text-lg">
                Track your purchases and access your content
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Package className="h-5 w-5 text-orange-500" />
                <span className="text-gray-700 font-medium">{totalItems} total orders</span>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="space-y-6">
              {/* Event Bookings with Tickets */}
              {eventBookings.map((booking) => (
                <Card key={booking.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Ticket className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-800">
                            Event Tickets - {booking.events?.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.booking_date), 'PPP')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(booking.status)} border font-medium px-3 py-1`}>
                          {booking.status === 'confirmed' ? '✓ Confirmed' : booking.status}
                        </Badge>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
                          {booking.payment_currency} {booking.payment_amount}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200/50 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-lg">{booking.events?.title}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-white">
                              🎫 {booking.ticket_quantity} Ticket{booking.ticket_quantity > 1 ? 's' : ''}
                            </Badge>
                            {booking.events?.start_time && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(booking.events.start_time), 'PPP')}</span>
                              </div>
                            )}
                            {booking.events?.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span>{booking.events.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generated Tickets */}
                      {booking.generated_tickets && booking.generated_tickets.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-sm mb-3">Your Tickets:</h5>
                          <div className="grid gap-2">
                            {booking.generated_tickets.map((ticket, index) => (
                              <div key={ticket.id} className="bg-white p-3 rounded-lg border border-blue-200 flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{ticket.ticket_holder_name}</p>
                                  <p className="text-sm text-gray-600">Code: {ticket.ticket_code}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs mt-1 ${
                                      ticket.ticket_status === 'active' 
                                        ? 'border-green-300 text-green-700' 
                                        : 'border-gray-300 text-gray-700'
                                    }`}
                                  >
                                    {ticket.ticket_status}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={() => downloadTicket(ticket.id, ticket.ticket_code)}
                                  >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    View Ticket
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Course Enrollments */}
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-blue-100 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-800">
                            Course Enrollment
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(enrollment.enrollment_date), 'PPP')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(enrollment.payment_status)} border font-medium px-3 py-1`}>
                          ✓ Enrolled
                        </Badge>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-2">
                          ${enrollment.courses?.price || 0}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-r from-green-400 to-blue-600">
                            {enrollment.courses?.thumbnail_url ? (
                              <img 
                                src={enrollment.courses.thumbnail_url} 
                                alt={enrollment.courses.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Eye className="w-8 h-8 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg">{enrollment.courses?.title || 'Course'}</h4>
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-white mt-2">
                              📚 Course
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                            onClick={() => window.location.href = `/learning/course/${enrollment.courses?.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Continue Learning
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Traditional Orders */}
              {orders.map((order) => (
                <Card key={order.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-800">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(order.created_at), 'PPP')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(order.payment_status)} border font-medium px-3 py-1`}>
                          {order.payment_status === 'completed' ? '✓ Completed' : order.payment_status}
                        </Badge>
                        <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mt-2">
                          ${order.total_amount}
                        </p>
                        <p className="text-sm text-gray-500">{order.currency}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center">
                                {item.item_type === 'course' ? <Eye className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 text-lg">{item.item_name}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className="border-orange-300 text-orange-700 bg-white"
                                  >
                                    {item.item_type === 'course' ? '📚 Course' : '🎫 Event Ticket'}
                                  </Badge>
                                  {item.quantity > 1 && (
                                    <span className="text-sm text-gray-600 font-medium">
                                      Qty: {item.quantity}
                                    </span>
                                  )}
                                  <span className="text-sm text-gray-500">
                                    ${item.unit_price} each
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold text-gray-800">${item.total_price}</p>
                              {item.item_type === 'course' && order.payment_status === 'completed' && (
                                <Button 
                                  size="sm" 
                                  className="mt-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                  onClick={() => window.location.href = `/learning/course/${item.item_id}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Access Course
                                </Button>
                              )}
                              {item.item_type === 'event_ticket' && order.payment_status === 'completed' && (
                                <Button 
                                  size="sm" 
                                  className="mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                  onClick={() => window.location.href = `/events/${item.item_id}`}
                                >
                                  <Ticket className="w-4 h-4 mr-2" />
                                  View Event
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Footer with Receipt */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CreditCard className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Payment Method:</span>
                          <Badge variant="outline" className="border-purple-300 text-purple-700 bg-white">
                            {order.payment_method}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span>
                            {format(new Date(order.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                      
                      {order.receipt_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          onClick={() => downloadReceipt(order.receipt_url!)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Card */}
            <Card className="border-0 bg-gradient-to-r from-orange-100 to-purple-100 shadow-xl">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {totalItems}
                    </p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      ${totalSpent.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {orders.filter(order => order.payment_status === 'completed').length + enrollments.length + eventBookings.length}
                    </p>
                    <p className="text-sm text-gray-600">Completed Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserOrders;
