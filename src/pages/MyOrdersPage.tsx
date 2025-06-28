
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Download, Eye, Ticket, BookOpen, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode.react';

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
  user_profile: {
    full_name: string;
  };
}

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
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
          ),
          user_profile:profiles!orders_user_id_fkey (
            full_name
          )
        `)
        .eq('user_id', user?.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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

  const handleViewTicket = (booking: any, order: Order) => {
    setSelectedTicket({
      ...booking,
      order,
      user_name: order.user_profile?.full_name || user?.email || 'Ticket Holder'
    });
    setShowTicketModal(true);
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  };

  const handlePrintTicket = () => {
    const printContent = document.getElementById('ticket-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Event Ticket</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .ticket { max-width: 600px; margin: 0 auto; border: 2px solid #333; }
              .ticket-header { background: linear-gradient(135deg, #f97316, #a855f7); color: white; padding: 20px; text-align: center; }
              .ticket-body { padding: 30px; background: white; }
              .qr-section { text-align: center; margin: 20px 0; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
              .detail-item { margin-bottom: 10px; }
              .detail-label { font-weight: bold; color: #666; }
              .detail-value { color: #333; margin-top: 5px; }
              .terms { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
              @media print { body { margin: 0; } }
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

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Order Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .receipt { max-width: 600px; margin: 0 auto; }
              .receipt-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
              .receipt-body { background: white; }
              .order-details { margin: 20px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .items-table th { background-color: #f5f5f5; font-weight: bold; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              @media print { body { margin: 0; } }
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
                              
                              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{booking.event_ticket.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {booking.event_ticket.ticket_type} • Quantity: {booking.ticket_quantity}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-sm text-gray-600">
                                      Code: {booking.booking_code}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-3">
                                <Button 
                                  onClick={() => handleViewTicket(booking, order)}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Ticket
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

                      {/* Order Actions */}
                      <div className="flex gap-3 mt-6 pt-6 border-t">
                        <Button
                          variant="outline"
                          onClick={() => handleViewReceipt(order)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold">Event Ticket</h2>
                <div className="flex gap-2">
                  <Button onClick={handlePrintTicket} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowTicketModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div id="ticket-print-content">
                <div className="ticket">
                  <div className="ticket-header">
                    <h1 className="text-3xl font-bold mb-2">SkillPulse Event Ticket</h1>
                    <p className="text-lg opacity-90">Your gateway to amazing experiences</p>
                  </div>
                  
                  <div className="ticket-body">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {selectedTicket.event.title}
                      </h2>
                      <p className="text-gray-600">{selectedTicket.event.description}</p>
                    </div>

                    <div className="details-grid">
                      <div>
                        <div className="detail-item">
                          <div className="detail-label">Date & Time</div>
                          <div className="detail-value">
                            {format(new Date(selectedTicket.event.start_time), 'PPP')}
                            <br />
                            {format(new Date(selectedTicket.event.start_time), 'p')} - {format(new Date(selectedTicket.event.end_time), 'p')}
                          </div>
                        </div>
                        
                        <div className="detail-item">
                          <div className="detail-label">Venue</div>
                          <div className="detail-value">{selectedTicket.event.location}</div>
                        </div>
                        
                        <div className="detail-item">
                          <div className="detail-label">Ticket Type</div>
                          <div className="detail-value">{selectedTicket.event_ticket.name}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="detail-item">
                          <div className="detail-label">Ticket Holder</div>
                          <div className="detail-value">{selectedTicket.user_name}</div>
                        </div>
                        
                        <div className="detail-item">
                          <div className="detail-label">Booking Code</div>
                          <div className="detail-value font-mono text-lg">{selectedTicket.booking_code}</div>
                        </div>
                        
                        <div className="detail-item">
                          <div className="detail-label">Order ID</div>
                          <div className="detail-value">#{selectedTicket.order.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="qr-section">
                      <div className="detail-label mb-3">Scan QR Code for Entry</div>
                      <div className="flex justify-center">
                        <QRCode 
                          value={JSON.stringify({
                            booking_code: selectedTicket.booking_code,
                            event_id: selectedTicket.event.id,
                            order_id: selectedTicket.order.id,
                            ticket_type: selectedTicket.event_ticket.name
                          })}
                          size={150}
                          level="M"
                        />
                      </div>
                    </div>

                    <div className="terms">
                      <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This ticket is non-transferable and non-refundable</li>
                        <li>Please arrive 30 minutes before the event starts</li>
                        <li>Valid photo ID required for entry</li>
                        <li>Event organizers reserve the right to refuse entry</li>
                        <li>Keep this ticket safe - lost tickets will not be replaced</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold">Order Receipt</h2>
                <div className="flex gap-2">
                  <Button onClick={handlePrintReceipt} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowReceiptModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div id="receipt-print-content">
                <div className="receipt p-6">
                  <div className="receipt-header">
                    <h1 className="text-3xl font-bold text-gray-800">SkillPulse</h1>
                    <p className="text-lg text-gray-600 mt-2">Order Receipt</p>
                    <div className="mt-4">
                      <p className="text-sm"><strong>Order ID:</strong> #{selectedOrder.id.slice(0, 8)}</p>
                      <p className="text-sm"><strong>Date:</strong> {format(new Date(selectedOrder.created_at), 'PPP')}</p>
                      <p className="text-sm"><strong>Customer:</strong> {selectedOrder.user_profile?.full_name || selectedOrder.email}</p>
                    </div>
                  </div>
                  
                  <div className="receipt-body">
                    <div className="order-details">
                      <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
                      <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
                    </div>

                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Type</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.order_items.map(item => (
                          <tr key={item.id}>
                            <td>{item.item_name}</td>
                            <td>{item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'}</td>
                            <td>{item.quantity}</td>
                            <td>{selectedOrder.currency} {item.unit_price.toFixed(2)}</td>
                            <td>{selectedOrder.currency} {item.total_price.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan={4}><strong>Total Amount</strong></td>
                          <td><strong>{selectedOrder.currency} {selectedOrder.total_amount.toFixed(2)}</strong></td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-6 text-center text-sm text-gray-600">
                      <p>Thank you for your purchase!</p>
                      <p>For support, contact us at support@skillpulse.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
