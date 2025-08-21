import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Calendar, MapPin, Download, Eye, Ticket, BookOpen, Printer, X, FileText, QrCode, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';
import PriceDisplay from '@/components/currency/PriceDisplay';

declare global {
  interface Window {
    QRCode?: any;
  }
}

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

interface TicketData {
  id: string;
  booking_code: string;
  ticket_code: string;
  ticket_holder_name: string;
  ticket_holder_email?: string;
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
    price?: number;
  };
  status: string;
  user_name: string;
  qr_code_data: string;
  booking_id?: string;
  ticket_status?: string;
}

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<TicketData[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingTickets, setLoadingTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    script.onload = () => {
      console.log('QRCodeJS library loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load QRCodeJS library');
    };
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

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

  const fetchDetailedTickets = async (order: Order): Promise<TicketData[]> => {
    try {
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

      const ticketsWithUserInfo: TicketData[] = [];

      (detailedBookings || []).forEach(booking => {
        if (booking.generated_tickets && booking.generated_tickets.length > 0) {
          booking.generated_tickets.forEach(ticket => {
            ticketsWithUserInfo.push({
              id: ticket.id,
              booking_code: booking.booking_code,
              ticket_code: ticket.ticket_code,
              ticket_holder_name: ticket.ticket_holder_name,
              ticket_holder_email: ticket.ticket_holder_email,
              event: booking.event,
              event_ticket: booking.event_ticket,
              status: booking.status,
              user_name: order.user_name || user?.email || 'Ticket Holder',
              qr_code_data: ticket.qr_code_data || JSON.stringify({
                booking_code: booking.booking_code,
                event_title: booking.event?.title,
                ticket_code: ticket.ticket_code,
                status: booking.status
              }),
              booking_id: booking.id,
              ticket_status: ticket.ticket_status || 'active'
            });
          });
        } else {
          ticketsWithUserInfo.push({
            id: booking.id,
            booking_code: booking.booking_code,
            ticket_code: booking.booking_code,
            ticket_holder_name: order.user_name || user?.email || 'Ticket Holder',
            event: booking.event,
            event_ticket: booking.event_ticket,
            status: booking.status,
            user_name: order.user_name || user?.email || 'Ticket Holder',
            qr_code_data: JSON.stringify({
              booking_code: booking.booking_code,
              event_title: booking.event?.title,
              ticket_quantity: booking.ticket_quantity,
              status: booking.status
            }),
            booking_id: booking.id,
            ticket_status: 'active'
          });
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
    
    setTimeout(() => {
      tickets.forEach((ticket, index) => {
        const qrContainer = document.getElementById(`qr-code-${ticket.ticket_code || ticket.booking_code}-${index}`);
        if (qrContainer && window.QRCode) {
          qrContainer.innerHTML = '';
          try {
            new window.QRCode(qrContainer, {
              text: ticket.qr_code_data,
              width: 150,
              height: 150,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: window.QRCode.CorrectLevel.M
            });
          } catch (err) {
            console.error('QR Code generation error:', err);
            qrContainer.innerHTML = '<div style="width: 150px; height: 150px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">QR Code Error</div>';
          }
        } else if (qrContainer) {
          qrContainer.innerHTML = '<div style="width: 150px; height: 150px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">Loading QR...</div>';
        }
      });
    }, 100);
  };

  const handleViewSingleTicket = async (booking: any, order: Order) => {
    setLoadingTickets(prev => new Set(prev).add(booking.id));
    try {
      const tickets = await fetchDetailedTickets(order);
      const singleTicket = tickets.find(t => t.booking_id === booking.id);
      if (singleTicket) {
        setSelectedBookings([singleTicket]);
        setShowTicketModal(true);
        
        setTimeout(() => {
          const qrContainer = document.getElementById(`qr-code-${singleTicket.ticket_code || singleTicket.booking_code}-0`);
          if (qrContainer && window.QRCode) {
            qrContainer.innerHTML = '';
            try {
              new window.QRCode(qrContainer, {
                text: singleTicket.qr_code_data,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: window.QRCode.CorrectLevel.M
              });
            } catch (err) {
              console.error('QR Code generation error:', err);
              qrContainer.innerHTML = '<div style="width: 150px; height: 150px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">QR Code Error</div>';
            }
          }
        }, 100);
      }
    } finally {
      setLoadingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(booking.id);
        return newSet;
      });
    }
  };

  const handleDownloadSingleTicket = async (booking: any, order: Order) => {
    setLoadingTickets(prev => new Set(prev).add(booking.id));
    try {
      const tickets = await fetchDetailedTickets(order);
      const singleTicket = tickets.find(t => t.booking_id === booking.id);
      if (singleTicket) {
        setSelectedBookings([singleTicket]);
        setTimeout(() => {
          handleDownloadTicketsPDF();
        }, 500);
      }
    } finally {
      setLoadingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(booking.id);
        return newSet;
      });
    }
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
              @page {
                size: A4;
                margin: 15mm;
              }
              
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 0; 
                padding: 0; 
                background: white;
                color: #1f2937;
                line-height: 1.4;
              }
              
              .ticket-container { 
                page-break-after: always; 
                margin-bottom: 20px;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 180mm;
                margin: 0 auto 20px auto;
              }
              
              .ticket-container:last-child { 
                page-break-after: avoid; 
              }
              
              .ticket-header {
                background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
                padding: 30px;
                text-align: center;
                color: white;
                position: relative;
              }
              
              .ticket-header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: bold;
              }
              
              .ticket-code-badge {
                background: rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                font-size: 14px;
                font-weight: 500;
              }
              
              .ticket-content {
                padding: 30px;
              }
              
              .event-image {
                width: 120px;
                height: 120px;
                border-radius: 15px;
                object-fit: cover;
                float: left;
                margin-right: 20px;
                margin-bottom: 15px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
              }
              
              .event-title {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin: 0 0 15px 0;
                clear: both;
              }
              
              .ticket-info-badge {
                background: linear-gradient(135deg, #fef7ed, #faf5ff);
                padding: 12px 16px;
                border-radius: 10px;
                border-left: 4px solid #f97316;
                margin-bottom: 25px;
                clear: both;
              }
              
              .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 25px;
                margin-bottom: 30px;
              }
              
              .detail-item {
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              
              .detail-label {
                font-weight: bold;
                color: #374151;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .detail-value {
                color: #6b7280;
                font-size: 16px;
                line-height: 1.4;
              }
              
              .qr-section {
                text-align: center;
                padding: 25px;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-radius: 15px;
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              
              .qr-container {
                width: 140px;
                height: 140px;
                margin: 0 auto 15px;
                padding: 15px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .ticket-code {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #f97316;
                letter-spacing: 2px;
                margin-top: 10px;
              }
              
              .footer-notes {
                text-align: center;
                padding: 20px;
                border-top: 2px dashed #e5e7eb;
                color: #6b7280;
                font-size: 14px;
                line-height: 1.6;
              }
              
              .status-badge {
                background: #dcfce7;
                color: #166534;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                display: inline-block;
              }
              
              @media print {
                body { 
                  background: white !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .ticket-container {
                  box-shadow: none;
                  border: 1px solid #e5e7eb;
                  page-break-inside: avoid;
                }
                
                .ticket-header {
                  background: linear-gradient(135deg, #f97316 0%, #a855f7 100%) !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .ticket-info-badge {
                  background: linear-gradient(135deg, #fef7ed, #faf5ff) !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .qr-section {
                  background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
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
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleDownloadTicketsPDF = async () => {
    const element = document.getElementById('tickets-print-content');
    if (!element) {
      toast.error('Tickets content not found');
      return;
    }

    toast.info('Generating PDF... This may take a moment');

    const opt = {
      margin: 10,
      filename: `event-tickets-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
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
                            <PriceDisplay amount={order.total_amount} originalCurrency={order.currency} />
                          </div>
                          {getStatusBadge(order.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {/* Event Tickets Section */}
                      {order.event_bookings?.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-orange-600" />
                            Event Tickets ({order.event_bookings.length})
                          </h3>
                          <div className="space-y-4">
                            {order.event_bookings.filter(booking => booking.event && booking.event_ticket).map((booking) => (
                              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                  {booking.event?.image_url && (
                                    <div className="sm:w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={booking.event.image_url}
                                        alt={booking.event.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      {booking.event?.title || 'Event'}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                      {booking.event?.start_time && (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                          <Calendar className="h-3 w-3" />
                                          <span>{format(new Date(booking.event.start_time), 'MMM d, yyyy')}</span>
                                        </div>
                                      )}
                                      {booking.event?.location && (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                          <MapPin className="h-3 w-3" />
                                          <span>{booking.event.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="bg-orange-50 p-3 rounded border border-orange-200 mb-3">
                                      <p className="text-sm font-medium text-orange-800">
                                        {booking.event_ticket?.name || 'Standard Ticket'}
                                      </p>
                                      <p className="text-xs text-orange-600">
                                        {booking.event_ticket?.ticket_type || 'Regular'} • Qty: {booking.ticket_quantity}
                                      </p>
                                      <p className="text-xs font-mono text-orange-700 mt-1">
                                        Code: {booking.booking_code}
                                      </p>
                                    </div>
                                    
                                    {/* Individual ticket actions */}
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleViewSingleTicket(booking, order)}
                                        size="sm"
                                        className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                                        disabled={loadingTickets.has(booking.id)}
                                      >
                                        {loadingTickets.has(booking.id) ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <Eye className="h-3 w-3 mr-1" />
                                        )}
                                        View Ticket
                                      </Button>
                                      <Button
                                        onClick={() => handleDownloadSingleTicket(booking, order)}
                                        size="sm"
                                        variant="outline"
                                        disabled={loadingTickets.has(booking.id)}
                                      >
                                        {loadingTickets.has(booking.id) ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <Download className="h-3 w-3 mr-1" />
                                        )}
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Status badge */}
                                  <div className="self-start">
                                    {getStatusBadge(booking.status)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Courses Section */}
                      {order.course_enrollments?.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            Course Enrollments ({order.course_enrollments.length})
                          </h3>
                          <div className="space-y-4">
                            {order.course_enrollments.filter(enrollment => enrollment.course).map((enrollment) => (
                              <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                  {enrollment.course?.thumbnail_url && (
                                    <div className="sm:w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={enrollment.course.thumbnail_url}
                                        alt={enrollment.course.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="text-lg font-semibold text-gray-900">
                                        {enrollment.course?.title || 'Course'}
                                      </h4>
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
                          </div>
                        </div>
                      )}

                      {/* Empty state if no items */}
                      {order.event_bookings?.length === 0 && order.course_enrollments?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No items found in this order</p>
                        </div>
                      )}

                      {/* Order Summary */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Order Total:</span>
                          <span className="font-semibold">
                            <PriceDisplay amount={order.total_amount} originalCurrency={order.currency} />
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Payment Status:</span>
                          {getStatusBadge(order.payment_status)}
                        </div>
                      </div>

                      {/* Order-level Actions */}
                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button
                          onClick={() => handleViewReceipt(order)}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                        
                        {order.event_bookings?.length > 0 && (
                          <Button 
                            onClick={() => handleViewTickets(order)}
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-purple-600"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View All Tickets
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
          title={selectedBookings.length === 1 ? 'Event Ticket' : 'Event Tickets'}
          actions={
            <div className="flex gap-3">
              <Button 
                onClick={handleDownloadTicketsPDF}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {selectedBookings.length === 1 ? 'Ticket' : 'All'}
              </Button>
              <Button 
                onClick={handlePrintTickets} 
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-purple-600"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print {selectedBookings.length === 1 ? 'Ticket' : 'All'}
              </Button>
            </div>
          }
        >
          <div id="tickets-print-content" className="space-y-8 max-h-[70vh] overflow-y-auto">
            {selectedBookings.filter(ticket => ticket.event).map((ticket, index) => (
              <div key={ticket.id || index} className="ticket-container">
                {/* Header with gradient */}
                <div className="ticket-header">
                  <h1>🎫 EVENT TICKET</h1>
                  <div className="ticket-code-badge">
                    #{ticket.ticket_code || ticket.booking_code}
                  </div>
                </div>

                <div className="ticket-content">
                  {/* Event Image and Title */}
                  <div style={{ marginBottom: '25px', overflow: 'hidden' }}>
                    {ticket.event?.image_url && (
                      <img 
                        src={ticket.event.image_url} 
                        alt={ticket.event?.title || 'Event'} 
                        className="event-image"
                      />
                    )}
                    <div>
                      <h2 className="event-title">{ticket.event?.title || 'Event Title'}</h2>
                      <div className="ticket-info-badge">
                        <div style={{ fontWeight: '600', color: '#ea580c', marginBottom: '5px' }}>
                          {ticket.event_ticket?.name || 'Standard Ticket'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#7c2d12' }}>
                          {ticket.event_ticket?.ticket_type || 'Regular'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Details Grid */}
                  <div className="details-grid">
                    <div>
                      <div className="detail-item">
                        <div className="detail-label">📅 Date & Time</div>
                        <div className="detail-value">
                          {ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'EEEE, MMMM do, yyyy') : 'TBD'}<br/>
                          {ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'h:mm a') : ''} {ticket.event?.end_time ? '- ' + format(new Date(ticket.event.end_time), 'h:mm a') : ''}
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <div className="detail-label">📍 Location</div>
                        <div className="detail-value">
                          {ticket.event?.location || 'TBD'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="detail-item">
                        <div className="detail-label">👤 Ticket Holder</div>
                        <div className="detail-value">
                          {ticket.ticket_holder_name || ticket.user_name || 'Ticket Holder'}
                          {ticket.ticket_holder_email && (
                            <>
                              <br/>
                              <span style={{ fontSize: '14px' }}>{ticket.ticket_holder_email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <div className="detail-label">✅ Status</div>
                        <div>
                          <span className="status-badge">
                            {(ticket.status || 'confirmed').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="qr-section">
                    <div className="qr-container">
                      <div 
                        id={`qr-code-${ticket.ticket_code || ticket.booking_code}-${index}`} 
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                          Loading QR...
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                      Scan this code at the event entrance
                    </div>
                    <div className="ticket-code">
                      {ticket.ticket_code || ticket.booking_code}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="footer-notes">
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#374151' }}>Important:</strong> Please bring this ticket (digital or printed) to the event.
                    </div>
                    <div>
                      For questions, contact us at support@skillpulse.com
                    </div>
                  </div>
                </div>
              </div>
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
              className="bg-gradient-to-r from-orange-500 to-purple-600"
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
                    <p><strong>Total:</strong> <PriceDisplay amount={selectedOrder.total_amount} originalCurrency={selectedOrder.currency} /></p>
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
                      <p className="font-semibold">
                        <PriceDisplay amount={item.total_price} originalCurrency={selectedOrder.currency} />
                      </p>
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
