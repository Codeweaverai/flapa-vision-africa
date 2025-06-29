import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Calendar, MapPin, Download, Eye, Ticket, BookOpen, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TicketDisplay from '@/components/tickets/TicketDisplay';

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  email: string;
  order_items: {
    id: string;
    item_name: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    item_id: string;
  }[];
  event_bookings: {
    id: string;
    booking_code: string;
    ticket_quantity: number;
    status: string;
    event: {
      title: string;
      start_time: string;
      end_time: string;
      location: string;
      image_url: string;
      description: string;
    };
    event_ticket: {
      name: string;
      ticket_type: string;
    };
  }[];
  course_enrollments: {
    id: string;
    course: {
      id: string;
      title: string;
      description: string;
      thumbnail_url: string;
      creator_id: string;
    };
  }[];
  user_name?: string;
}

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<any[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
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
              start_time,
              end_time,
              location,
              image_url,
              description
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
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedOrders = data?.map(order => ({
        ...order,
        user_name: user?.email || 'Customer'
      })) || [];
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleViewTickets = async (booking: any, order: Order) => {
    try {
      // Fetch generated tickets for this booking
      const { data: tickets, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings!inner (
            booking_code,
            event:events (
              title,
              start_time,
              end_time,
              location,
              image_url,
              description
            ),
            event_ticket:event_tickets (
              name,
              ticket_type
            )
          )
        `)
        .eq('booking_id', booking.id);

      if (error) throw error;

      const ticketsWithUserInfo = tickets?.map(ticket => ({
        ...ticket,
        booking: {
          ...ticket.booking,
          user_name: order.user_name || user?.email || 'Ticket Holder'
        }
      })) || [];

      setSelectedTickets(ticketsWithUserInfo);
      setShowTicketModal(true);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    }
  };

  const handlePrintTickets = () => {
    const printContent = document.getElementById('tickets-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Event Tickets</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
                min-height: 100vh;
              }
              .ticket-container { 
                page-break-after: always; 
                margin-bottom: 40px; 
              }
              .ticket-container:last-child { 
                page-break-after: avoid; 
              }
              @media print { 
                body { 
                  margin: 0; 
                  background: white;
                }
                .ticket-container { 
                  margin-bottom: 0; 
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">View and manage your event tickets and course purchases</p>
            </div>

            {orders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
                  <p className="text-gray-600 mb-6">You haven't made any purchases yet.</p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/events">
                      <Button className="bg-gradient-to-r from-orange-500 to-red-600">
                        <Ticket className="h-4 w-4 mr-2" />
                        Browse Events
                      </Button>
                    </Link>
                    <Link to="/courses">
                      <Button variant="outline" className="border-purple-300 text-purple-700">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Courses
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">Order #{order.id.slice(0, 8)}</CardTitle>
                          <p className="text-orange-100">
                            {format(new Date(order.created_at), 'PPP')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {order.currency} {order.total_amount.toFixed(2)}
                          </div>
                          <Badge className="bg-green-500 text-white">Paid</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {/* Event Bookings */}
                      {order.event_bookings?.map((booking) => (
                        <div key={booking.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0 mb-6 last:mb-0">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {booking.event.image_url && (
                              <div className="lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={booking.event.image_url}
                                  alt={booking.event.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {booking.event.title}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(new Date(booking.event.start_time), 'PPP p')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{booking.event.location}</span>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg mb-4 border border-orange-200">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-orange-800">{booking.event_ticket.name}</p>
                                    <p className="text-sm text-orange-600">
                                      {booking.event_ticket.ticket_type} • Quantity: {booking.ticket_quantity}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-sm text-orange-700 font-medium">
                                      Code: {booking.booking_code}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-3">
                                <Button 
                                  onClick={() => handleViewTickets(booking, order)}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Tickets
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

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
                                {getStatusBadge('completed')}
                              </div>
                              
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {enrollment.course.description}
                              </p>
                              
                              <div className="flex gap-3">
                                <Link to={`/learning/course/${enrollment.course.id}`}>
                                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Start Learning
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tickets Modal */}
        <Modal 
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title="Event Tickets"
          actions={
            <Button 
              onClick={handlePrintTickets} 
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All Tickets
            </Button>
          }
        >
          <div id="tickets-print-content" className="space-y-8">
            {selectedTickets.map((ticket, index) => (
              <div key={ticket.id}>
                <TicketDisplay ticket={ticket} showPrintStyles={true} />
                {index < selectedTickets.length - 1 && <div className="h-8"></div>}
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
