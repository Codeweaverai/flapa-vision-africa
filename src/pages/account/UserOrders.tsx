
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Package, Users, Eye, MapPin, Clock, PlayCircle, BookOpen, Printer, ExternalLink } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  metadata?: any;
  item_id?: string;
}

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  receipt_url?: string;
  order_items: OrderItem[];
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
}

interface EventDetails {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
}

const UserOrders = () => {
  const { user } = useAuth();
  const { currentCurrency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState<{[key: string]: CourseDetails}>({});
  const [eventDetails, setEventDetails] = useState<{[key: string]: EventDetails}>({});

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      // Fetch course and event details
      await fetchItemDetails(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (orders: Order[]) => {
    const courseIds = new Set<string>();
    const eventTicketIds = new Set<string>();

    orders.forEach(order => {
      order.order_items.forEach(item => {
        if (item.item_type === 'course' && item.item_id) {
          courseIds.add(item.item_id);
        } else if (item.item_type === 'event_ticket' && item.item_id) {
          eventTicketIds.add(item.item_id);
        }
      });
    });

    // Fetch course details
    if (courseIds.size > 0) {
      try {
        const { data: courses, error } = await supabase
          .from('courses')
          .select('id, title, description, duration_minutes, difficulty_level')
          .in('id', Array.from(courseIds));
        
        if (error) {
          console.error('Error fetching courses:', error);
        } else if (courses) {
          const courseMap: {[key: string]: CourseDetails} = {};
          courses.forEach(course => {
            courseMap[course.id] = course;
          });
          setCourseDetails(courseMap);
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      }
    }

    // Fetch event details from tickets
    if (eventTicketIds.size > 0) {
      try {
        const { data: tickets, error } = await supabase
          .from('event_tickets')
          .select(`
            id,
            event_id,
            events!event_tickets_event_id_fkey (
              id, title, description, start_time, end_time, location, event_type
            )
          `)
          .in('id', Array.from(eventTicketIds));
        
        if (error) {
          console.error('Error fetching events:', error);
        } else if (tickets) {
          const eventMap: {[key: string]: EventDetails} = {};
          tickets.forEach(ticket => {
            if (ticket.events) {
              eventMap[ticket.id] = ticket.events as EventDetails;
            }
          });
          setEventDetails(eventMap);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const downloadReceipt = (receiptUrl: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    } else {
      toast.error('Receipt not available');
    }
  };

  const printTicket = (orderItem: OrderItem) => {
    // Generate ticket content for printing
    const ticketContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h1 style="color: #8B5CF6; text-align: center;">Event Ticket</h1>
        <h2>${orderItem.item_name}</h2>
        <p><strong>Quantity:</strong> ${orderItem.quantity}</p>
        <p><strong>Order ID:</strong> ${orderItem.id}</p>
        ${orderItem.metadata?.ticket_holder_names ? 
          '<p><strong>Ticket Holders:</strong></p><ul>' +
          orderItem.metadata.ticket_holder_names
            .filter((holder: any) => holder.name)
            .map((holder: any) => `<li>${holder.name}</li>`)
            .join('') + '</ul>' : ''
        }
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const navigateToCourse = (courseId: string) => {
    window.location.href = `/course/${courseId}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  My Orders
                </h1>
              </div>
              <p className="text-gray-600">Manage your course enrollments and event tickets</p>
            </div>

            {orders.length === 0 ? (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <Package className="h-20 w-20 mx-auto mb-6 text-gray-400" />
                  <h3 className="text-2xl font-semibold mb-4">No orders yet</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    When you make purchases, they will appear here.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/courses'}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
                  >
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100 border-b border-gray-200">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="space-y-3">
                          <CardTitle className="text-xl font-bold text-gray-800">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                            <Badge className={`${getStatusColor(order.payment_status)} border`}>
                              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-left lg:text-right space-y-2">
                          <div className="text-3xl font-bold text-gray-800">
                            <PriceDisplay 
                              amount={order.total_amount} 
                              originalCurrency={order.currency as any}
                            />
                          </div>
                          {currentCurrency !== order.currency && (
                            <div className="text-sm text-gray-500">
                              Original: {order.total_amount.toFixed(2)} {order.currency}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            via {order.payment_method}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <div className="space-y-0">
                        {order.order_items?.map((item, index) => {
                          const isEvent = item.item_type === 'event_ticket';
                          const isCourse = item.item_type === 'course';
                          const eventDetail = isEvent ? eventDetails[item.item_id!] : null;
                          const courseDetail = isCourse ? courseDetails[item.item_id!] : null;
                          
                          return (
                            <div 
                              key={item.id} 
                              className={`p-6 border-b border-gray-100 last:border-b-0 ${
                                isEvent ? 'bg-gradient-to-r from-orange-25 to-purple-25' : 
                                isCourse ? 'bg-gradient-to-r from-green-25 to-blue-25' : 'bg-gray-25'
                              }`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                {/* Item Details */}
                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h4 className="text-xl font-semibold text-gray-900">{item.item_name}</h4>
                                    <Badge 
                                      variant="outline" 
                                      className={`${
                                        isEvent ? 'border-orange-300 text-orange-700 bg-orange-50' : 
                                        'border-green-300 text-green-700 bg-green-50'
                                      }`}
                                    >
                                      {isEvent ? 'Event Ticket' : 'Course'}
                                    </Badge>
                                    {item.quantity > 1 && (
                                      <Badge variant="secondary" className="bg-gray-100">
                                        <Users className="h-3 w-3 mr-1" />
                                        Qty: {item.quantity}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Event Specific Details */}
                                  {isEvent && eventDetail && (
                                    <div className="bg-white/60 rounded-lg p-4 space-y-3 border border-orange-200">
                                      <h5 className="font-semibold text-orange-800 text-lg">{eventDetail.title}</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-orange-600" />
                                          <span>{new Date(eventDetail.start_time).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-orange-600" />
                                          <span>{new Date(eventDetail.start_time).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-orange-600" />
                                          <span>{eventDetail.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                                            {eventDetail.event_type}
                                          </Badge>
                                        </div>
                                      </div>
                                      {eventDetail.description && (
                                        <p className="text-gray-700 text-sm">{eventDetail.description}</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Course Specific Details */}
                                  {isCourse && courseDetail && (
                                    <div className="bg-white/60 rounded-lg p-4 space-y-3 border border-green-200">
                                      <h5 className="font-semibold text-green-800 text-lg">{courseDetail.title}</h5>
                                      <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-green-600" />
                                          <span>{Math.floor(courseDetail.duration_minutes / 60)}h {courseDetail.duration_minutes % 60}m</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="h-4 w-4 text-green-600" />
                                          <span>{courseDetail.difficulty_level}</span>
                                        </div>
                                      </div>
                                      {courseDetail.description && (
                                        <p className="text-gray-700 text-sm">{courseDetail.description}</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Ticket Holder Names */}
                                  {item.metadata?.ticket_holder_names && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <div className="text-sm font-medium text-blue-800 mb-2">
                                        Ticket Holders:
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {item.metadata.ticket_holder_names
                                          .filter((holder: any) => holder.name)
                                          .map((holder: any, holderIndex: number) => (
                                            <div key={holderIndex} className="flex items-center gap-2 text-sm text-blue-700">
                                              <Users className="h-3 w-3" />
                                              <span>{holder.name}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Price and Actions */}
                                <div className="lg:text-right space-y-4 lg:min-w-[200px]">
                                  <div className="space-y-1">
                                    <div className="text-2xl font-bold text-gray-800">
                                      <PriceDisplay 
                                        amount={item.total_price} 
                                        originalCurrency={order.currency as any}
                                      />
                                    </div>
                                    {currentCurrency !== order.currency && (
                                      <div className="text-sm text-gray-500">
                                        Original: {item.total_price.toFixed(2)} {order.currency}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex flex-col gap-2">
                                    {isEvent && (
                                      <>
                                        <Button
                                          onClick={() => printTicket(item)}
                                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                          size="sm"
                                        >
                                          <Printer className="h-4 w-4 mr-2" />
                                          Print Ticket
                                        </Button>
                                        <Button
                                          onClick={() => window.location.href = `/ticket-details/${order.id}`}
                                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                                          size="sm"
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Tickets
                                        </Button>
                                        {eventDetail && (
                                          <Button
                                            onClick={() => window.open(`/event/${eventDetail.id}`, '_blank')}
                                            variant="outline"
                                            size="sm"
                                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                          >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Event Details
                                          </Button>
                                        )}
                                      </>
                                    )}
                                    
                                    {isCourse && courseDetail && (
                                      <Button
                                        onClick={() => navigateToCourse(courseDetail.id)}
                                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                                        size="sm"
                                      >
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                        Start Learning
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Order Footer */}
                      <div className="bg-gray-50 px-6 py-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Payment Method:</span> {order.payment_method}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order.receipt_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadReceipt(order.receipt_url!)}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Receipt
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/order/${order.id}`}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Full Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserOrders;
