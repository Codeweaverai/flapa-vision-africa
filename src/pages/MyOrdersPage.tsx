import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Calendar, MapPin, Download, Eye, Ticket, BookOpen, Printer, X, FileText, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TicketDisplay from '@/components/tickets/TicketDisplay';
import { QRCodeSVG } from 'qrcode.react';

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
  const [selectedBookings, setSelectedBookings] = useState<any[]>([]);
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
            event:events!event_bookings_event_id_fkey (
              title,
              start_time,
              end_time,
              location,
              image_url,
              description
            ),
            event_ticket:event_tickets!event_bookings_event_ticket_id_fkey (
              name,
              ticket_type
            )
          ),
          course_enrollments (
            id,
            course:courses!course_enrollments_course_id_fkey (
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

  const fetchDetailedTickets = async (order: Order) => {
    try {
      // Get detailed event bookings with generated tickets
      const { data: detailedBookings, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events!event_bookings_event_id_fkey (
            title,
            start_time,
            end_time,
            location,
            image_url,
            description
          ),
          event_ticket:event_tickets!event_bookings_event_ticket_id_fkey (
            name,
            ticket_type,
            price
          ),
          generated_tickets (
            id,
            ticket_code,
            ticket_holder_name,
            ticket_holder_email,
            qr_code_data,
            ticket_status
          )
        `)
        .eq('order_id', order.id);

      if (error) throw error;

      const ticketsWithUserInfo = (detailedBookings || []).flatMap(booking => {
        if (booking.generated_tickets && booking.generated_tickets.length > 0) {
          // If we have generated tickets, show them individually
          return booking.generated_tickets.map(ticket => ({
            ...ticket,
            booking_id: booking.id,
            booking_code: booking.booking_code,
            event: booking.event,
            event_ticket: booking.event_ticket,
            status: booking.status,
            user_name: order.user_name || user?.email || 'Ticket Holder',
            qr_code_data: ticket.qr_code_data || JSON.stringify({
              booking_code: booking.booking_code,
              event_title: booking.event?.title,
              ticket_code: ticket.ticket_code,
              status: booking.status
            })
          }));
        } else {
          // Fallback to booking-level tickets
          return [{
            id: booking.id,
            booking_code: booking.booking_code,
            ticket_code: booking.booking_code,
            ticket_holder_name: order.user_name || user?.email || 'Ticket Holder',
            event: booking.event,
            event_ticket: booking.event_ticket,
            status: booking.status,
            ticket_quantity: booking.ticket_quantity,
            user_name: order.user_name || user?.email || 'Ticket Holder',
            qr_code_data: JSON.stringify({
              booking_code: booking.booking_code,
              event_title: booking.event?.title,
              ticket_quantity: booking.ticket_quantity,
              status: booking.status
            })
          }];
        }
      });

      return ticketsWithUserInfo;
    } catch (error) {
      console.error('Error fetching detailed tickets:', error);
      toast.error('Failed to load ticket details');
      return [];
    }
  };

  const handleViewTickets = async (order: Order) => {
    const tickets = await fetchDetailedTickets(order);
    setSelectedBookings(tickets);
    setShowTicketModal(true);
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
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

  const generateTicketHTML = (ticket: any) => {
    return `
      <div style="max-width: 800px; margin: 0 auto 30px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
        <!-- Header with gradient -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🎫 EVENT TICKET</h1>
          <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block;">
            <span style="font-size: 14px; font-weight: 500;">#{ticket.ticket_code || ticket.booking_code}</span>
          </div>
        </div>

        <div style="padding: 40px;">
          <!-- Event Image and Title -->
          <div style="display: flex; gap: 20px; margin-bottom: 30px; align-items: center;">
            ${ticket.event?.image_url ? `
              <div style="width: 120px; height: 120px; border-radius: 15px; overflow: hidden; flex-shrink: 0; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                <img src="${ticket.event.image_url}" alt="${ticket.event?.title || 'Event'}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            ` : ''}
            <div style="flex: 1;">
              <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #1f2937; font-weight: bold;">${ticket.event?.title || 'Event Title'}</h2>
              <div style="background: linear-gradient(135deg, #fef7ed, #faf5ff); padding: 12px 16px; border-radius: 10px; border-left: 4px solid #f97316;">
                <div style="font-weight: 600; color: #ea580c; margin-bottom: 5px;">${ticket.event_ticket?.name || 'Standard Ticket'}</div>
                <div style="font-size: 14px; color: #7c2d12;">${ticket.event_ticket?.ticket_type || 'Regular'}</div>
              </div>
            </div>
          </div>

          <!-- Event Details Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px;">
            <div>
              <div style="margin-bottom: 20px;">
                <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  📅 Date & Time
                </div>
                <div style="color: #6b7280; font-size: 16px; line-height: 1.4;">
                  ${ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'EEEE, MMMM do, yyyy') : 'TBD'}<br>
                  ${ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'h:mm a') : ''} ${ticket.event?.end_time ? '- ' + format(new Date(ticket.event.end_time), 'h:mm a') : ''}
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  📍 Location
                </div>
                <div style="color: #6b7280; font-size: 16px; line-height: 1.4;">
                  ${ticket.event?.location || 'TBD'}
                </div>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 20px;">
                <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  👤 Ticket Holder
                </div>
                <div style="color: #6b7280; font-size: 16px; line-height: 1.4;">
                  ${ticket.ticket_holder_name || ticket.user_name || 'Ticket Holder'}
                  ${ticket.ticket_holder_email ? `<br><span style="font-size: 14px;">${ticket.ticket_holder_email}</span>` : ''}
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="font-weight: bold; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  ✅ Status
                </div>
                <div>
                  <span style="background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${(ticket.status || 'confirmed').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- QR Code Section -->
          <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 15px; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
              <div style="width: 150px; height: 150px; margin: 0 auto; padding: 15px; background: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                <!-- QR Code placeholder - would be generated with actual QR library -->
                <div style="width: 100%; height: 100%; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">
                  QR Code
                </div>
              </div>
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Scan this code at the event entrance</div>
            <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #f97316; letter-spacing: 1px;">
              ${ticket.ticket_code || ticket.booking_code}
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; border-top: 2px dashed #e5e7eb; color: #6b7280; font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Important:</strong> Please bring this ticket (digital or printed) to the event.
            </div>
            <div>
              For questions, contact us at support@skillpulse.com
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handlePrintReceipt = () => {
    if (!selectedOrder) return;
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${selectedOrder.id.slice(0, 8)}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
            min-height: 100vh;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f97316;
          }
          .receipt-title {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #f97316, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .order-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #fef7ed, #faf5ff);
            border-radius: 8px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #7c2d12;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th,
          .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table th {
            background: linear-gradient(135deg, #f97316, #a855f7);
            color: white;
          }
          .total-section {
            text-align: right;
            padding: 20px;
            background: linear-gradient(135deg, #fef7ed, #faf5ff);
            border-radius: 8px;
            margin-top: 20px;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
          }
          @media print {
            body { background: white; }
            .receipt-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="receipt-title">RECEIPT</div>
            <p>Order #${selectedOrder.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div class="order-info">
            <div>
              <div class="info-item">
                <span class="info-label">Date:</span><br>
                ${format(new Date(selectedOrder.created_at), 'PPP')}
              </div>
              <div class="info-item">
                <span class="info-label">Customer:</span><br>
                ${selectedOrder.user_name || selectedOrder.email}
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Payment Method:</span><br>
                ${selectedOrder.payment_method}
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span><br>
                ${selectedOrder.payment_status.toUpperCase()}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.order_items.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit_price.toFixed(2)} ${selectedOrder.currency}</td>
                  <td>${item.total_price.toFixed(2)} ${selectedOrder.currency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-amount">
              Total: ${selectedOrder.total_amount.toFixed(2)} ${selectedOrder.currency}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
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
              <p className="text-gray-600">View and manage all your orders, tickets and course purchases</p>
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
                          {getStatusBadge(order.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {/* Event Bookings */}
                      {order.event_bookings?.filter(booking => booking.event && booking.event_ticket).map((booking) => (
                        <div key={booking.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0 mb-6 last:mb-0">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {booking.event?.image_url && (
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
                                  {booking.event?.title || 'Event'}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {booking.event?.start_time && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(booking.event.start_time), 'PPP p')}</span>
                                  </div>
                                )}
                                {booking.event?.location && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <span>{booking.event.location}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg mb-4 border border-orange-200">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-orange-800">{booking.event_ticket?.name || 'Standard Ticket'}</p>
                                    <p className="text-sm text-orange-600">
                                      {booking.event_ticket?.ticket_type || 'Regular'} • Quantity: {booking.ticket_quantity}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-sm text-orange-700 font-medium">
                                      Code: {booking.booking_code}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Course Enrollments */}
                      {order.course_enrollments?.filter(enrollment => enrollment.course).map((enrollment) => (
                        <div key={enrollment.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0 mb-6 last:mb-0">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {enrollment.course?.thumbnail_url && (
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
                                  {enrollment.course?.title || 'Course'}
                                </h3>
                                {getStatusBadge('completed')}
                              </div>
                              
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {enrollment.course?.description || 'No description available'}
                              </p>
                              
                              <div className="flex gap-3">
                                <Link to={`/learning/course/${enrollment.course?.id}`}>
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

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button
                          onClick={() => handleViewReceipt(order)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                        
                        {(order.event_bookings && order.event_bookings.length > 0) && (
                          <Button 
                            onClick={() => handleViewTickets(order)}
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Tickets
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Tickets Modal */}
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
          <div id="tickets-print-content" className="space-y-8 max-h-[70vh] overflow-y-auto">
            {selectedBookings.filter(ticket => ticket.event).map((ticket, index) => (
              <div key={ticket.id || index} dangerouslySetInnerHTML={{ 
                __html: generateTicketHTML(ticket) 
              }} />
            ))}
          </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal 
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Order Receipt"
          actions={
            <Button 
              onClick={handlePrintReceipt} 
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          }
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Order #{selectedOrder.id.slice(0, 8)}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Date:</strong> {format(new Date(selectedOrder.created_at), 'PPP')}</p>
                    <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
                  </div>
                  <div>
                    <p><strong>Payment:</strong> {selectedOrder.payment_method}</p>
                    <p><strong>Total:</strong> {selectedOrder.currency} {selectedOrder.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Items:</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{item.total_price.toFixed(2)} {selectedOrder.currency}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
