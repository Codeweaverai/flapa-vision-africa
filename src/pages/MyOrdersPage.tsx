import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Calendar, MapPin, Download, Eye, Ticket, BookOpen, Printer, X, FileText, QrCode, ChevronLeft, ChevronRight, Heart, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TicketDisplay from '@/components/tickets/TicketDisplay';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@/constants/currencies';

declare global {
  interface Window {
    QRCode?: any;
  }
}

// Local interfaces and helpers
interface GiftCard {
  id: string;
  amount: number;
  currency: string;
  gift_card_code: string;
  status: string;
  expires_at: string;
  sender_name: string;
  sender_email: string;
  recipient_name: string;
  recipient_email: string;
  personal_message: string;
}

interface Order {
  id: string;
  total_amount: number;
  tax_amount: number;
  processing_fee: number;
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
      currency?: string;
    };
    event_ticket: {
      name: string;
      ticket_type: string;
      price?: number;
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
      price?: number;
    };
  }[];
  gift_cards: GiftCard[];
  user_name?: string;
}

interface OrderCard {
  key: string;
  type: 'event' | 'course' | 'gift';
  order: Order;
  items: any[];
  subtotal: number;
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

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Ticket className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Your Orders
              </h3>
              <p className="text-muted-foreground text-lg">
                Gathering your order history...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

// Helper functions
const safeCurrency = (value: string | null | undefined): CurrencyCode => {
  if (!value) return 'USD';
  const normalized = value.toString().toUpperCase();
  return SUPPORTED_CURRENCIES[normalized as CurrencyCode] ? normalized as CurrencyCode : 'USD';
};

const safeNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const obfuscateGiftCode = (code: string): string => {
  if (!code || code.length < 8) return code;
  const start = code.slice(0, 4);
  const end = code.slice(-4);
  const middle = '*'.repeat(Math.max(0, code.length - 8));
  return `${start}${middle}${end}`;
};

const computeTypeSubtotalsFull = (order: Order) => {
  const subtotals = { event: 0, course: 0, gift: 0 };
  
  // Calculate from order_items first (most reliable)
  order.order_items?.forEach(item => {
    const price = safeNumber(item.total_price);
    if (item.item_type === 'event' || item.item_type === 'event_ticket') {
      subtotals.event += price;
    } else if (item.item_type === 'course') {
      subtotals.course += price;
    } else if (item.item_type === 'gift_card') {
      subtotals.gift += price;
    }
  });

  // Fallback calculations if order_items are missing or zero
  if (subtotals.event === 0 && order.event_bookings?.length > 0) {
    order.event_bookings.forEach(booking => {
      const ticketPrice = safeNumber(booking.event_ticket?.price) || 0;
      const quantity = safeNumber(booking.ticket_quantity) || 1;
      subtotals.event += ticketPrice * quantity;
    });
  }

  if (subtotals.course === 0 && order.course_enrollments?.length > 0) {
    order.course_enrollments.forEach(enrollment => {
      const coursePrice = safeNumber(enrollment.course?.price) || 0;
      subtotals.course += coursePrice;
    });
  }

  if (subtotals.gift === 0 && order.gift_cards?.length > 0) {
    order.gift_cards.forEach(gift => {
      subtotals.gift += safeNumber(gift.amount);
    });
  }

  // Final fallback to total_amount if all subtotals are still zero
  const totalCalculated = subtotals.event + subtotals.course + subtotals.gift;
  if (totalCalculated === 0 && safeNumber(order.total_amount) > 0) {
    // Distribute total amount based on what exists
    const hasEvents = order.event_bookings?.length > 0;
    const hasCourses = order.course_enrollments?.length > 0;
    const hasGifts = order.gift_cards?.length > 0;
    
    const totalAmount = safeNumber(order.total_amount);
    
    if (hasEvents && !hasCourses && !hasGifts) {
      subtotals.event = totalAmount;
    } else if (!hasEvents && hasCourses && !hasGifts) {
      subtotals.course = totalAmount;
    } else if (!hasEvents && !hasCourses && hasGifts) {
      subtotals.gift = totalAmount;
    }
  }
  
  return subtotals;
};

const buildCards = (orders: Order[]): OrderCard[] => {
  const cards: OrderCard[] = [];
  
  orders.forEach(order => {
    const subtotals = computeTypeSubtotalsFull(order);
    
    // Create separate cards for each event booking
    if (order.event_bookings && order.event_bookings.length > 0) {
      order.event_bookings.forEach((booking, index) => {
        cards.push({
          key: `${order.id}-event-${index}`,
          type: 'event',
          order,
          items: [booking],
          subtotal: subtotals.event / order.event_bookings.length // Distribute subtotal evenly
        });
      });
    }
    
    // Course card
    if ((order.course_enrollments && order.course_enrollments.length > 0) || subtotals.course > 0) {
      cards.push({
        key: `${order.id}-course`,
        type: 'course',
        order,
        items: order.course_enrollments || [],
        subtotal: subtotals.course
      });
    }
    
    // Gift card
    if ((order.gift_cards && order.gift_cards.length > 0) || subtotals.gift > 0) {
      cards.push({
        key: `${order.id}-gift`,
        type: 'gift',
        order,
        items: order.gift_cards || [],
        subtotal: subtotals.gift
      });
    }
  });
  
  return cards;
};

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<TicketData[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedType, setSelectedType] = useState<'event' | 'course' | 'gift'>('event');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Derived data
  const cards = buildCards(orders);
  const totalPages = Math.ceil(cards.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCards = cards.slice(startIndex, endIndex);

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
              description,
              currency
            ),
            event_ticket:event_tickets!event_bookings_event_ticket_id_fkey (
              name,
              ticket_type,
              price
            )
          ),
          course_enrollments (
            id,
            course:courses!course_enrollments_course_id_fkey (
              id,
              title,
              description,
              thumbnail_url,
              creator_id,
              price
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch gift cards separately
      const orderIds = data?.map(order => order.id) || [];
      let giftCardsData: any[] = [];
      
      if (orderIds.length > 0) {
        const { data: giftCards, error: giftCardsError } = await supabase
          .from('gift_cards')
          .select('*')
          .in('order_id', orderIds);
        
        if (giftCardsError) {
          console.warn('Error fetching gift cards:', giftCardsError);
        } else {
          giftCardsData = giftCards || [];
        }
      }
      
      // Transform orders and attach gift cards with proper number coercion
      const transformedOrders: Order[] = (data || []).map(order => ({
        ...order,
        total_amount: safeNumber(order.total_amount),
        tax_amount: safeNumber(order.tax_amount || 0),
        processing_fee: safeNumber(order.processing_fee || 0),
        user_name: user?.email || 'Customer',
        gift_cards: giftCardsData.filter(gc => gc.order_id === order.id).map(gc => ({
          ...gc,
          amount: safeNumber(gc.amount)
        })),
        order_items: (order.order_items || []).map(item => ({
          ...item,
          unit_price: safeNumber(item.unit_price),
          total_price: safeNumber(item.total_price),
          quantity: safeNumber(item.quantity) || 1
        })),
        event_bookings: (order.event_bookings || []).map(booking => ({
          ...booking,
          ticket_quantity: safeNumber(booking.ticket_quantity) || 1,
          event_ticket: booking.event_ticket ? {
            ...booking.event_ticket,
            price: safeNumber(booking.event_ticket.price)
          } : booking.event_ticket
        })),
        course_enrollments: (order.course_enrollments || []).map(enrollment => ({
          ...enrollment,
          course: enrollment.course ? {
            ...enrollment.course,
            price: safeNumber(enrollment.course.price)
          } : enrollment.course
        }))
      }));
      
      console.log('Transformed orders:', transformedOrders);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Use the PulseLoading component instead of simple spinner
  if (loading) {
    return <PulseLoading />;
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      redeemed: { color: 'bg-blue-100 text-blue-800', label: 'Redeemed' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expired' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const fetchDetailedTickets = async (order: Order, bookingId?: string): Promise<TicketData[]> => {
    try {
      let query = supabase
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

      if (bookingId) {
        query = query.eq('id', bookingId);
      }

      const { data: detailedBookings, error } = await query;

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

  const handleViewTickets = async (order: Order, bookingId?: string) => {
    const tickets = await fetchDetailedTickets(order, bookingId);
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

  const handleViewReceipt = (order: Order, type: 'event' | 'course' | 'gift') => {
    setSelectedOrder(order);
    setSelectedType(type);
    setShowReceiptModal(true);
  };

  // Calculate receipt totals with tax and processing fee
  const calculateReceiptTotals = (order: Order, type: 'event' | 'course' | 'gift') => {
    const filteredItems = order.order_items.filter(item => {
      if (type === 'event') return item.item_type === 'event' || item.item_type === 'event_ticket';
      if (type === 'course') return item.item_type === 'course';
      if (type === 'gift') return item.item_type === 'gift_card';
      return true;
    });
    
    const subtotal = filteredItems.reduce((sum, item) => sum + safeNumber(item.total_price), 0);
    const taxAmount = safeNumber(order.tax_amount) || 0;
    const processingFee = safeNumber(order.processing_fee) || 0;
    const total = safeNumber(order.total_amount) || 0;
    
    return { subtotal, taxAmount, processingFee, total, filteredItems };
  };

  const handlePrintReceipt = () => {
    if (!selectedOrder) return;
    
    const { subtotal, taxAmount, processingFee, total, filteredItems } = calculateReceiptTotals(selectedOrder, selectedType);
    const orderCurrency = safeCurrency(selectedOrder.currency);
    const currencySymbol = orderCurrency === 'ZMW' ? 'K' : '$';
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${selectedOrder.id.slice(0, 8)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #fef7ed 0%, #faf5ff 100%);
            min-height: 100vh;
          }
          
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }
          
          .receipt-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: 900;
            color: rgba(249, 115, 22, 0.03);
            z-index: 0;
            white-space: nowrap;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f97316;
            position: relative;
            z-index: 1;
          }
          
          .company-logo {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #f97316, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            letter-spacing: -1px;
          }
          
          .company-subtitle {
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 20px;
          }
          
          .receipt-title {
            font-size: 36px;
            font-weight: 800;
            background: linear-gradient(135deg, #f97316, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            letter-spacing: -1px;
          }
          
          .order-type-badge {
            background: linear-gradient(135deg, #f97316, #a855f7);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 15px;
          }
          
          .order-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #fef7ed, #faf5ff);
            border-radius: 16px;
            border: 1px solid rgba(249, 115, 22, 0.1);
            position: relative;
            z-index: 1;
          }
          
          .info-item {
            margin-bottom: 12px;
          }
          
          .info-label {
            font-weight: 600;
            color: #7c2d12;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #1f2937;
            font-size: 15px;
            font-weight: 500;
          }
          
          .items-section {
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f97316;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          
          .items-table th {
            background: linear-gradient(135deg, #f97316, #a855f7);
            color: white;
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
          }
          
          .items-table tr:last-child td {
            border-bottom: none;
          }
          
          .items-table tr:hover {
            background: #fafafa;
          }
          
          .total-section {
            background: linear-gradient(135deg, #fef7ed, #faf5ff);
            padding: 30px;
            border-radius: 16px;
            border: 1px solid rgba(249, 115, 22, 0.1);
            margin-top: 30px;
            position: relative;
            z-index: 1;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 15px;
          }
          
          .total-label {
            color: #6b7280;
            font-weight: 500;
          }
          
          .total-value {
            color: #1f2937;
            font-weight: 600;
          }
          
          .total-amount {
            font-size: 28px;
            font-weight: 800;
            color: #f97316;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px dashed #e5e7eb;
          }
          
          .tax-breakdown {
            background: rgba(255,255,255,0.7);
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            border: 1px solid rgba(0,0,0,0.05);
          }
          
          .tax-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
            font-size: 14px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            position: relative;
            z-index: 1;
          }
          
          .thank-you {
            font-weight: 600;
            color: #f97316;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          @media print {
            body { 
              background: white !important;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .receipt-container { 
              box-shadow: none;
              border: 1px solid #e5e7eb;
              margin: 0;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-watermark">SKILLPULSE</div>
          
          <div class="receipt-header">
            <div class="company-logo">SkillPulse Innovations Limited</div>
            <div class="company-subtitle">Elevating Skills, Empowering Futures</div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div class="order-type-badge">${selectedType.toUpperCase()} ORDER</div>
          </div>
          
          <div class="order-info">
            <div>
              <div class="info-item">
                <div class="info-label">Order Date</div>
                <div class="info-value">${format(new Date(selectedOrder.created_at), 'PPPP')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Order Number</div>
                <div class="info-value">#${selectedOrder.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Customer</div>
                <div class="info-value">${selectedOrder.user_name || selectedOrder.email}</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="info-label">Payment Method</div>
                <div class="info-value">${selectedOrder.payment_method || 'Mobile Money'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Status</div>
                <div class="info-value">
                  <span style="color: #16a34a; font-weight: 600;">${selectedOrder.payment_status.toUpperCase()}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Currency</div>
                <div class="info-value">${orderCurrency}</div>
              </div>
            </div>
          </div>

          <div class="items-section">
            <h3 class="section-title">Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredItems.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: #1f2937;">${item.item_name}</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.item_type.replace('_', ' ').toUpperCase()}</div>
                    </td>
                    <td>${item.quantity}</td>
                    <td>${currencySymbol}${safeNumber(item.unit_price).toFixed(2)}</td>
                    <td style="font-weight: 600; color: #f97316;">${currencySymbol}${safeNumber(item.total_price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${selectedType === 'gift' && selectedOrder.gift_cards && selectedOrder.gift_cards.length > 0 ? `
            <div class="items-section">
              <h3 class="section-title">Gift Card Details</h3>
              ${selectedOrder.gift_cards.map(gift => `
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                      <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Gift Card Code</div>
                      <div style="font-family: monospace; font-weight: 600; color: #1f2937;">${obfuscateGiftCode(gift.gift_card_code)}</div>
                    </div>
                    <div>
                      <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Amount</div>
                      <div style="font-weight: 600; color: #f97316;">${currencySymbol}${safeNumber(gift.amount).toFixed(2)}</div>
                    </div>
                    <div>
                      <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Recipient</div>
                      <div style="font-weight: 500; color: #1f2937;">${gift.recipient_name}</div>
                      <div style="font-size: 12px; color: #6b7280;">${gift.recipient_email}</div>
                    </div>
                    <div>
                      <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Expires</div>
                      <div style="font-weight: 500; color: #1f2937;">${format(new Date(gift.expires_at), 'PPP')}</div>
                    </div>
                  </div>
                  ${gift.personal_message ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0;">
                      <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Personal Message</div>
                      <div style="font-style: italic; color: #475569;">"${gift.personal_message}"</div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="total-section">
            <h3 class="section-title" style="border-bottom: none; margin-bottom: 0;">Payment Summary</h3>
            
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">${currencySymbol}${subtotal.toFixed(2)}</span>
            </div>
            
            <div class="total-row">
              <span class="total-label">Tax (1.5%)</span>
              <span class="total-value">${currencySymbol}${taxAmount.toFixed(2)}</span>
            </div>

            <div class="total-row">
              <span class="total-label">Processing Fee (2.9%)</span>
              <span class="total-value">${currencySymbol}${processingFee.toFixed(2)}</span>
            </div>
            
            <div class="total-row total-amount">
              <span>Total Amount</span>
              <span>${currencySymbol}${total.toFixed(2)}</span>
            </div>
            
            <div class="tax-breakdown">
              <div class="tax-title">Fee Breakdown</div>
              <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                This receipt includes 1.5% Value Added Tax (VAT) and 2.9% payment processing fee as required by law. 
                Tax registration number: VAT-${selectedOrder.id.slice(0, 8).toUpperCase()}-SL
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div style="margin-bottom: 15px;">
              SkillPulse Innovations Limited • support@skillpulse.com<br>
              +1 (555) 123-4567 • www.skillpulse.com
            </div>
            <div>
              This receipt is computer generated and does not require a physical signature.<br>
              For questions about this receipt, please contact our support team.
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
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">View and manage all your orders, tickets and course purchases</p>
            </div>

            {cards.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
                  <p className="text-gray-600 mb-6">You haven't made any purchases yet.</p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/events">
                      <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                        <Ticket className="h-4 w-4 mr-2" />
                        Browse Events
                      </Button>
                    </Link>
                    <Link to="/courses">
                      <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Courses
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-6">
                  {paginatedCards.map((card) => {
                    const orderCurrency = safeCurrency(card.order.currency);
                    const currencySymbol = orderCurrency === 'ZMW' ? 'K' : '$';
                    
                    return (
                    <Card key={card.key} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">Order #{card.order.id.slice(0, 8)} - {card.type.toUpperCase()}</CardTitle>
                            <p className="text-orange-100">
                              {format(new Date(card.order.created_at), 'PPP')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {currencySymbol}{card.subtotal.toFixed(2)}
                            </div>
                            {getStatusBadge(card.order.payment_status)}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        {/* Event content - Show individual tickets */}
                        {card.type === 'event' && card.items.map((booking: any) => (
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
                                      {booking.event_ticket?.price && (
                                        <p className="text-sm text-orange-700 font-semibold">
                                          Price: {currencySymbol}{safeNumber(booking.event_ticket.price).toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-mono text-sm text-orange-700 font-medium">
                                        Code: {booking.booking_code}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Individual ticket actions */}
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleViewReceipt(card.order, card.type)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Receipt
                                  </Button>
                                  
                                  <Button 
                                    onClick={() => handleViewTickets(card.order, booking.id)}
                                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Ticket
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Course content */}
                        {card.type === 'course' && card.items.map((enrollment: any) => (
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

                                {enrollment.course?.price && (
                                  <p className="text-sm text-purple-700 font-semibold mb-4">
                                    Price: {currencySymbol}{safeNumber(enrollment.course.price).toFixed(2)}
                                  </p>
                                )}
                                
                                <div className="flex gap-3">
                                  <Link to={`/learning/course/${enrollment.course?.id}`}>
                                    <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Start Learning
                                    </Button>
                                  </Link>
                                  <Button
                                    onClick={() => handleViewReceipt(card.order, card.type)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Receipt
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Gift card content */}
                        {card.type === 'gift' && (
                          <div className="bg-gradient-to-r from-orange-50 via-purple-50 to-pink-50 p-6 rounded-lg border border-orange-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Gift Cards</h4>
                            <div className="space-y-4">
                              {(card.items as GiftCard[]).map((gift) => (
                                <div key={gift.id} className="bg-white p-4 rounded-lg shadow-sm">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <div className="text-xl font-semibold text-gray-900 mb-1">
                                        {currencySymbol}{safeNumber(gift.amount).toFixed(2)}
                                      </div>
                                      <p className="font-mono text-sm text-gray-600">
                                        Code: {obfuscateGiftCode(gift.gift_card_code)}
                                      </p>
                                    </div>
                                    {getStatusBadge(gift.status)}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                      <p className="text-sm text-gray-600">
                                        <strong>Recipient:</strong> {gift.recipient_name}
                                      </p>
                                      <p className="text-sm text-gray-600">{gift.recipient_email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">
                                        <strong>Expires:</strong> {format(new Date(gift.expires_at), 'PPP')}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {gift.personal_message && (
                                    <div className="bg-gray-50 p-3 rounded-md mt-3">
                                      <p className="text-sm text-gray-700">
                                        <strong>Message:</strong> {gift.personal_message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                              <Button
                                onClick={() => handleViewReceipt(card.order, card.type)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Receipt
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )})}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Enhanced Tickets Modal */}
        <Modal 
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title="Event Tickets"
          actions={
            <div className="flex gap-3">
              <Button 
                onClick={handleDownloadTicketsPDF}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={handlePrintTickets} 
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print All Tickets
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

        {/* Enhanced Receipt Modal */}
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
          {selectedOrder && (() => {
            const { subtotal, taxAmount, processingFee, total, filteredItems } = calculateReceiptTotals(selectedOrder, selectedType);
            const orderCurrency = safeCurrency(selectedOrder.currency);
            const currencySymbol = orderCurrency === 'ZMW' ? 'K' : '$';
            
            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Order #{selectedOrder.id.slice(0, 8)} - {selectedType.toUpperCase()}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Date:</strong> {format(new Date(selectedOrder.created_at), 'PPP')}</p>
                      <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
                    </div>
                    <div>
                      <p><strong>Payment:</strong> {selectedOrder.payment_method}</p>
                      <p>
                        <strong>Total:</strong> {currencySymbol}{computeTypeSubtotalsFull(selectedOrder)[selectedType].toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity} × {currencySymbol}{safeNumber(item.unit_price).toFixed(2)}</p>
                        </div>
                        <p className="font-semibold">
                          {currencySymbol}{safeNumber(item.total_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {selectedType === 'gift' && selectedOrder.gift_cards && selectedOrder.gift_cards.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold mb-2">Gift Card Details:</h5>
                      <div className="space-y-2">
                        {selectedOrder.gift_cards.map((gift) => {
                          const giftCurrency = safeCurrency(gift.currency);
                          const giftCurrencySymbol = giftCurrency === 'ZMW' ? 'K' : '$';
                          
                          return (
                          <div key={gift.id} className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Code: {obfuscateGiftCode(gift.gift_card_code)}</p>
                            <p className="text-sm text-gray-600">Recipient: {gift.recipient_name} ({gift.recipient_email})</p>
                            <p className="text-sm text-gray-600">Status: {gift.status.toUpperCase()}</p>
                            <p className="text-sm text-gray-600">Expires: {format(new Date(gift.expires_at), 'PPP')}</p>
                            <p className="font-semibold">
                              Amount: {giftCurrencySymbol}{safeNumber(gift.amount).toFixed(2)}
                            </p>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                </div>

                {/* Receipt Summary */}
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg mt-4">
                  <h4 className="font-semibold mb-3">Receipt Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (1.5%):</span>
                      <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee (2.9%):</span>
                      <span>{currencySymbol}{processingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>{currencySymbol}{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
