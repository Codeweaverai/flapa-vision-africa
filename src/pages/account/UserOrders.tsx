
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Package, Ticket, Eye, Printer, FileText, PlayCircle, RefreshCw, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

interface OrderItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  item_id: string;
  metadata?: any;
}

interface EventBooking {
  id: string;
  booking_code: string;
  ticket_quantity: number;
  status: string;
  event: {
    title: string;
    description: string;
    start_time: string;
    location: string;
    image_url: string;
  };
  event_ticket: {
    name: string;
    ticket_type: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  receipt_url: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  payment_provider_id?: string;
  order_items: OrderItem[];
  event_bookings?: EventBooking[];
  course_enrollments?: Array<{
    id: string;
    course: {
      id: string;
      title: string;
      description: string;
      thumbnail_url: string;
      creator_id: string;
    };
  }>;
  user_name?: string;
}

const UserOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
      // Set up polling for pending orders
      const interval = setInterval(() => {
        checkPendingOrders();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          event_bookings (
            id,
            booking_code,
            ticket_quantity,
            status,
            event:events (
              title,
              description,
              start_time,
              location,
              image_url
            ),
            event_ticket:event_tickets (
              name,
              ticket_type
            )
          ),
          course_enrollments (
            id,
            course:courses (
              id,
              title,
              description,
              thumbnail_url,
              creator_id
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance order items with proper event and course titles
      const enhancedOrders = await Promise.all(
        (ordersData || []).map(async (order) => {
          const enhancedItems = await Promise.all(
            order.order_items.map(async (item: OrderItem) => {
              if (item.item_type === 'event_ticket') {
                try {
                  // First try to get from event_tickets table
                  const { data: ticket } = await supabase
                    .from('event_tickets')
                    .select('event_id, name, events!event_tickets_event_id_fkey(title)')
                    .eq('id', item.item_id)
                    .maybeSingle();

                  if (ticket && ticket.events) {
                    return {
                      ...item,
                      item_name: `${ticket.events.title} - ${ticket.name}`
                    };
                  }

                  // Fallback: check if item_id is actually an event_id
                  const { data: event } = await supabase
                    .from('events')
                    .select('title')
                    .eq('id', item.item_id)
                    .maybeSingle();

                  if (event) {
                    return {
                      ...item,
                      item_name: event.title
                    };
                  }
                } catch (err) {
                  console.error('Error fetching event details for item:', item.item_id, err);
                }
              } else if (item.item_type === 'course') {
                try {
                  const { data: course } = await supabase
                    .from('courses')
                    .select('title')
                    .eq('id', item.item_id)
                    .maybeSingle();

                  if (course) {
                    return {
                      ...item,
                      item_name: course.title
                    };
                  }
                } catch (err) {
                  console.error('Error fetching course details for item:', item.item_id, err);
                }
              }
              return item;
            })
          );

          return {
            ...order,
            order_items: enhancedItems,
            user_name: user?.email || 'Customer'
          };
        })
      );

      setOrders(enhancedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingOrders = async () => {
    if (!user) return;

    try {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id, payment_status, stripe_session_id, payment_provider_id')
        .eq('user_id', user.id)
        .eq('payment_status', 'pending');

      if (pendingOrders && pendingOrders.length > 0) {
        console.log('Checking pending orders:', pendingOrders.length);
        
        // Check if any payments have been completed
        for (const order of pendingOrders) {
          await verifyPaymentStatus(order.id);
        }
      }
    } catch (error) {
      console.error('Error checking pending orders:', error);
    }
  };

  const verifyPaymentStatus = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { orderId }
      });

      if (error) {
        console.error('Error verifying payment:', error);
        return;
      }

      if (data?.paymentCompleted) {
        toast.success('Payment confirmed! Your order has been updated.');
        loadOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error verifying payment status:', error);
    }
  };

  const handleRefreshOrders = async () => {
    setRefreshing(true);
    await loadOrders();
    await checkPendingOrders();
    setRefreshing(false);
    toast.success('Orders refreshed');
  };

  const handleDownloadReceipt = (receiptUrl: string) => {
    if (receiptUrl) {
      const newWindow = window.open();
      if (newWindow) {
        if (receiptUrl.startsWith('data:text/html;base64,')) {
          newWindow.document.write(atob(receiptUrl.split(',')[1]));
        } else {
          newWindow.location.href = receiptUrl;
        }
        newWindow.document.close();
      }
      toast.success('Receipt opened in new window');
    } else {
      toast.error('Receipt not available');
    }
  };

  const handlePrintTicket = (booking: EventBooking) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border: 2px solid #333; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #333; margin-bottom: 10px;">EVENT TICKET</h1>
          <h2 style="color: #666; margin-bottom: 20px;">${booking.event.title}</h2>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div style="text-align: left;">
              <strong>Date & Time:</strong><br>
              ${format(new Date(booking.event.start_time), 'PPP p')}<br><br>
              <strong>Location:</strong><br>
              ${booking.event.location}<br><br>
              <strong>Ticket Type:</strong><br>
              ${booking.event_ticket.name}
            </div>
            <div style="text-align: right;">
              <strong>Booking Code:</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #e67e22;">${booking.booking_code}</span><br><br>
              <strong>Quantity:</strong><br>
              ${booking.ticket_quantity}<br><br>
              <strong>Status:</strong><br>
              <span style="color: #27ae60;">${booking.status.toUpperCase()}</span>
            </div>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Please present this ticket (digital or printed) at the event entrance.
            </p>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleStartLearning = (courseId: string) => {
    navigate(`/learning/course/${courseId}`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
      case 'stripe':
        return 'Credit/Debit Card';
      case 'mobile_money':
      case 'pawapay':
        return 'Mobile Money';
      default:
        return method || 'Unknown';
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  My Orders
                </h1>
              </div>
              <Button 
                onClick={handleRefreshOrders} 
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {orders.length === 0 ? (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl font-semibold mb-4">No orders found</h2>
                  <p className="text-gray-600 mb-6">You haven't made any purchases yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const hasEventTickets = order.order_items.some(item => item.item_type === 'event_ticket');
                  const hasCourses = order.order_items.some(item => item.item_type === 'course');
                  const eventBookings = order.event_bookings || [];
                  
                  return (
                    <Card key={order.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </CardTitle>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {format(new Date(order.created_at), 'PPP')}
                                </span>
                              </div>
                              <Badge className={getStatusBadgeColor(order.payment_status)}>
                                {order.payment_status.toUpperCase()}
                              </Badge>
                              {order.payment_status === 'pending' && (
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  Processing
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-lg lg:text-right">
                            <div className="font-bold text-orange-600">
                              {order.total_amount.toFixed(2)} {order.currency}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              via {getPaymentMethodDisplay(order.payment_method)}
                            </div>
                            {order.updated_at !== order.created_at && (
                              <div className="text-xs text-gray-500">
                                Updated: {format(new Date(order.updated_at), 'PPp')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        {/* Order Items */}
                        <div className="mb-6">
                          <h3 className="font-semibold mb-3">Items</h3>
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium">{item.item_name}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'} • 
                                    Quantity: {item.quantity} • 
                                    Unit Price: {item.unit_price?.toFixed(2) || (item.total_price / item.quantity).toFixed(2)} {order.currency}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="font-semibold">
                                    {item.total_price.toFixed(2)} {order.currency}
                                  </div>
                                  {/* Start Learning Button for Courses */}
                                  {item.item_type === 'course' && order.payment_status === 'completed' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStartLearning(item.item_id)}
                                      className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                      <PlayCircle className="h-4 w-4 mr-1" />
                                      Start Learning
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Event Tickets Section */}
                        {hasEventTickets && eventBookings.length > 0 && (
                          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-green-800">Event Tickets</h3>
                                <Badge className="bg-green-100 text-green-800">
                                  {eventBookings.reduce((sum, booking) => sum + booking.ticket_quantity, 0)} ticket(s)
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {eventBookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-lg p-4 border border-green-200">
                                  <div className="flex gap-4">
                                    {/* Event Image */}
                                    {booking.event?.image_url && (
                                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                          src={booking.event.image_url}
                                          alt={booking.event.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Event Details */}
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-lg">{booking.event?.title || 'Event'}</h4>
                                        <Badge className={getStatusBadgeColor(booking.status)}>
                                          {booking.status}
                                        </Badge>
                                      </div>
                                      
                                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                        {booking.event?.description}
                                      </p>
                                      
                                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          {booking.event?.start_time && format(new Date(booking.event.start_time), 'PPp')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          {booking.event?.location}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm">
                                          <span className="font-medium">Ticket:</span> {booking.event_ticket?.name} • 
                                          <span className="font-medium ml-2">Qty:</span> {booking.ticket_quantity} • 
                                          <span className="font-medium ml-2">Code:</span> 
                                          <span className="font-mono text-orange-600 ml-1">{booking.booking_code}</span>
                                        </div>
                                        
                                        {order.payment_status === 'completed' && (
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => navigate(`/ticket/${booking.id}`)}
                                            >
                                              <Eye className="h-4 w-4 mr-1" />
                                              View Ticket
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => handlePrintTicket(booking)}
                                              className="bg-green-600 hover:bg-green-700"
                                            >
                                              <Printer className="h-4 w-4 mr-1" />
                                              Print
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Course Enrollments */}
                        {order.course_enrollments?.map((enrollment) => (
                          <div key={enrollment.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0 mb-6 last:mb-0">
                            <div className="flex flex-col lg:flex-row gap-6">
                              {enrollment.course.thumbnail_url && (
                                <div className="lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={enrollment.course.thumbnail_url}
                                    alt={enrollment.course.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="text-xl font-semibold text-gray-900">
                                    {enrollment.course.title}
                                  </h3>
                                  <Badge className={getStatusBadgeColor('completed')}>
                                    Enrolled
                                  </Badge>
                                </div>
                                
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                  {enrollment.course.description}
                                </p>
                                
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleStartLearning(enrollment.course.id)}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                  >
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Start Learning
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                          <Button
                            onClick={() => handleDownloadReceipt(order.receipt_url)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            disabled={!order.receipt_url}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Receipt
                          </Button>

                          {order.payment_status === 'pending' && (
                            <Button
                              onClick={() => verifyPaymentStatus(order.id)}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Check Payment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserOrders;
