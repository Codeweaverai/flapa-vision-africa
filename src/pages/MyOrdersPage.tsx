import React, { useState, useEffect, useRef } from 'react';
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
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@/constants/currencies';
import { currencyService } from '@/services/currencyService';

// React PDF Components
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';

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

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2pt solid #000000',
    paddingBottom: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  companyDetails: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.4,
  },
  ReceiptTitleSection: {
    alignItems: 'flex-end',
  },
  ReceiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000000',
  },
  ReceiptBadge: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '4pt 8pt',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
  ReceiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#666666',
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#000000',
  },
  statusBadge: {
    padding: '2pt 6pt',
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },
  itemsTable: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    padding: 8,
    borderBottom: '1pt solid #000000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #E0E0E0',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  colDescription: {
    flex: 3,
    textAlign: 'left',
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colUnitPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colAmount: {
    flex: 1.5,
    textAlign: 'right',
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  itemName: {
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  itemType: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
  },
  giftCardsSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 4,
  },
  giftCard: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    border: '1pt solid #E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  giftCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  giftMessage: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1pt dashed #E0E0E0',
    fontSize: 8,
    color: '#666666',
  },
  totalsSection: {
    marginBottom: 20,
  },
  totalsGrid: {
    width: '40%',
    marginLeft: 'auto',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '6pt 0',
    borderBottom: '1pt solid #E0E0E0',
  },
  grandTotal: {
    borderTop: '2pt solid #000000',
    marginTop: 6,
    paddingTop: 8,
    fontSize: 12,
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ReceiptFooter: {
    borderTop: '2pt solid #000000',
    paddingTop: 15,
    alignItems: 'center',
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  footerNotes: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 1.4,
  },
});

// Professional Receipt PDF Component
const ReceiptPDF: React.FC<{
  selectedOrder: Order;
  selectedType: 'event' | 'course' | 'gift';
  subtotal: number;
  taxAmount: number;
  processingFee: number;
  total: number;
  filteredItems: any[];
}> = ({ selectedOrder, selectedType, subtotal, taxAmount, processingFee, total, filteredItems }) => {
  
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

  // Use currencyService for proper currency formatting
  const formatCurrencyForPDF = (amount: number, currency: CurrencyCode): string => {
    return currencyService.formatCurrency(amount, currency);
  };

  const orderCurrency = safeCurrency(selectedOrder.currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>SKILLPULSE INNOVATIONS LIMITED</Text>
            <Text style={styles.companyDetails}>
              Elevating Skills, Empowering Futures
              {"\n"}
              support@skillpulse.cloud | +260976972874
              {"\n"}
              www.skillpulse.cloud
            </Text>
          </View>
          <View style={styles.ReceiptTitleSection}>
            <Text style={styles.ReceiptTitle}>RECEIPT</Text>
            <Text style={styles.ReceiptBadge}>{selectedType.toUpperCase()} ORDER</Text>
          </View>
        </View>

        {/* Receipt Details */}
        <View style={styles.ReceiptDetails}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>BILL TO:</Text>
            <Text style={styles.customerName}>
              {selectedOrder.user_name || selectedOrder.email}
            </Text>
            <Text>{selectedOrder.email}</Text>
          </View>
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>RECEIPT NO:</Text>
              <Text style={styles.detailValue}>
                #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DATE ISSUED:</Text>
              <Text style={styles.detailValue}>
                {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PAYMENT STATUS:</Text>
              <Text style={styles.detailValue}>
                {selectedOrder.payment_status.toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PAYMENT METHOD:</Text>
              <Text style={styles.detailValue}>
                {selectedOrder.payment_method || 'Mobile Money'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDescription}>
              <Text style={styles.headerText}>DESCRIPTION</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.headerText}>QTY</Text>
            </View>
            <View style={styles.colUnitPrice}>
              <Text style={styles.headerText}>UNIT PRICE</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.headerText}>AMOUNT</Text>
            </View>
          </View>

          {/* Table Rows */}
          {filteredItems.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {}
              ]}
            >
              <View style={styles.colDescription}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemType}>
                  {item.item_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.colQty}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={styles.colUnitPrice}>
                <Text>{formatCurrencyForPDF(safeNumber(item.unit_price), orderCurrency)}</Text>
              </View>
              <View style={styles.colAmount}>
                <Text>{formatCurrencyForPDF(safeNumber(item.total_price), orderCurrency)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Gift Card Details */}
        {selectedType === 'gift' && selectedOrder.gift_cards && selectedOrder.gift_cards.length > 0 && (
          <View style={styles.giftCardsSection}>
            <Text style={styles.sectionTitle}>GIFT CARD DETAILS</Text>
            {selectedOrder.gift_cards.map((gift) => (
              <View key={gift.id} style={styles.giftCard}>
                <View style={styles.giftCardRow}>
                  <Text>Gift Card Code:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {obfuscateGiftCode(gift.gift_card_code)}
                  </Text>
                </View>
                <View style={styles.giftCardRow}>
                  <Text>Amount:</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrencyForPDF(safeNumber(gift.amount), safeCurrency(gift.currency))}
                  </Text>
                </View>
                <View style={styles.giftCardRow}>
                  <Text>Recipient:</Text>
                  <Text>
                    {gift.recipient_name} ({gift.recipient_email})
                  </Text>
                </View>
                <View style={styles.giftCardRow}>
                  <Text>Expires:</Text>
                  <Text>{format(new Date(gift.expires_at), 'dd/MM/yyyy')}</Text>
                </View>
                {gift.personal_message && (
                  <View style={styles.giftMessage}>
                    <Text>Personal Message:</Text>
                    <Text>"{gift.personal_message}"</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsGrid}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text>{formatCurrencyForPDF(subtotal, "USD")}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax (1.5%):</Text>
              <Text>{formatCurrencyForPDF(taxAmount, "USD")}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Processing Fee (2.9%):</Text>
              <Text>{formatCurrencyForPDF(processingFee, "USD")}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={{ fontWeight: 'bold' }}>TOTAL AMOUNT:</Text>
              <Text style={styles.grandTotalAmount}>
                {formatCurrencyForPDF(total, orderCurrency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.ReceiptFooter}>
          <Text style={styles.thankYou}>Thank you for your business!</Text>
          <View style={styles.footerNotes}>
            <Text>This is a computer-generated receipt and does not require a physical signature.</Text>
            <Text>Tax Registration Number: VAT-{selectedOrder.id.slice(0, 8).toUpperCase()}-SL</Text>
            <Text>For questions about this receipt, please contact our support team at support@skillpulse.cloud</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

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

// Native file download utility
const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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

  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsGeneratingPDF(true);
      
      const { subtotal, taxAmount, processingFee, total, filteredItems } = calculateReceiptTotals(selectedOrder, selectedType);
      
      const blob = await pdf(
        <ReceiptPDF
          selectedOrder={selectedOrder}
          selectedType={selectedType}
          subtotal={subtotal}
          taxAmount={taxAmount}
          processingFee={processingFee}
          total={total}
          filteredItems={filteredItems}
        />
      ).toBlob();
      
      downloadPDF(blob, `receipt-${selectedOrder.id.slice(0, 8)}.pdf`);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate receipt');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Use the PulseLoading component instead of simple spinner
  if (loading) {
    return <PulseLoading />;
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
                            <PriceDisplay 
                              amount={card.subtotal} 
                              originalCurrency="USD"
                              className="text-2xl font-bold text-white"
                            />
                            {getStatusBadge(card.order.payment_status)}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        {/* Event content - Show individual tickets */}
                        {card.type === 'event' && card.items.map((booking: any) => {
                          const eventCurrency = safeCurrency(booking.event?.currency || card.order.currency);
                          return (
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
                                          Price: <PriceDisplay 
                                            amount={safeNumber(booking.event_ticket.price)} 
                                            originalCurrency={eventCurrency}
                                            className="inline"
                                          />
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
                                  
                                  <Link to="/my-events">
                                    <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View in My Events
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )})}

                        {/* Course content */}
                        {card.type === 'course' && card.items.map((enrollment: any) => {
                          const courseCurrency = safeCurrency(card.order.currency);
                          return (
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
                                    Price: <PriceDisplay 
                                      amount={safeNumber(enrollment.course.price)} 
                                      originalCurrency={courseCurrency}
                                      className="inline"
                                    />
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
                        )})}

                        {/* Gift card content */}
                        {card.type === 'gift' && (
                          <div className="bg-gradient-to-r from-orange-50 via-purple-50 to-pink-50 p-6 rounded-lg border border-orange-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Gift Cards</h4>
                            <div className="space-y-4">
                              {(card.items as GiftCard[]).map((gift) => {
                                const giftCurrency = safeCurrency(gift.currency || card.order.currency);
                                return (
                                <div key={gift.id} className="bg-white p-4 rounded-lg shadow-sm">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <PriceDisplay 
                                        amount={safeNumber(gift.amount)} 
                                        originalCurrency="USD"
                                        className="text-xl font-semibold text-gray-900 mb-1"
                                      />
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
                              )})}
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

        {/* Simplified Tickets Modal - Just for viewing basic info */}
        <Modal 
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title="Event Tickets"
          actions={
            <Button 
              onClick={() => setShowTicketModal(false)}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-blue-600"
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedBookings.filter(ticket => ticket.event).map((ticket, index) => (
              <div key={ticket.id || index} className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{ticket.event?.title || 'Event'}</h3>
                  {getStatusBadge(ticket.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Ticket Holder:</strong> {ticket.ticket_holder_name || ticket.user_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Ticket Type:</strong> {ticket.event_ticket?.name || 'Standard'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Booking Code:</strong> {ticket.booking_code}
                    </p>
                    {ticket.ticket_code && (
                      <p className="text-sm text-gray-600">
                        <strong>Ticket Code:</strong> {ticket.ticket_code}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <Link to="/my-events">
                    <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Manage in My Events
                    </Button>
                  </Link>
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
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </>
              )}
            </Button>
          }
        >
          {selectedOrder && (() => {
            const { subtotal, taxAmount, processingFee, total, filteredItems } = calculateReceiptTotals(selectedOrder, selectedType);
            const orderCurrency = safeCurrency(selectedOrder.currency);
            
            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Receipt #{selectedOrder.id.slice(0, 8)} - {selectedType.toUpperCase()}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Date:</strong> {format(new Date(selectedOrder.created_at), 'PPP')}</p>
                      <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
                    </div>
                    <div>
                      <p><strong>Payment:</strong> {selectedOrder.payment_method}</p>
                      <p>
                        <strong>Total:</strong> <PriceDisplay 
                          amount={computeTypeSubtotalsFull(selectedOrder)[selectedType]} 
                          originalCurrency="USD"
                          className="font-semibold"
                        />
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
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × <PriceDisplay 
                              amount={safeNumber(item.unit_price)} 
                              originalCurrency="USD"
                              className="inline"
                            />
                          </p>
                        </div>
                        <PriceDisplay 
                          amount={safeNumber(item.total_price)} 
                          originalCurrency="USD"
                          className="font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {selectedType === 'gift' && selectedOrder.gift_cards && selectedOrder.gift_cards.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold mb-2">Gift Card Details:</h5>
                      <div className="space-y-2">
                        {selectedOrder.gift_cards.map((gift) => {
                          const giftCurrency = safeCurrency(gift.currency || selectedOrder.currency);
                          return (
                          <div key={gift.id} className="p-3 bg-gray-50 rounded">
                            <p className="font-medium">Code: {obfuscateGiftCode(gift.gift_card_code)}</p>
                            <p className="text-sm text-gray-600">Recipient: {gift.recipient_name} ({gift.recipient_email})</p>
                            <p className="text-sm text-gray-600">Status: {gift.status.toUpperCase()}</p>
                            <p className="text-sm text-gray-600">Expires: {format(new Date(gift.expires_at), 'PPP')}</p>
                            <PriceDisplay 
                              amount={safeNumber(gift.amount)} 
                              originalCurrency="USD"
                              className="font-semibold"
                            />
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
                      <PriceDisplay 
                        amount={subtotal} 
                        originalCurrency="USD"
                        className="font-medium"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (1.5%):</span>
                      <PriceDisplay 
                        amount={taxAmount} 
                        originalCurrency="USD"
                        className="font-medium"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee (2.9%):</span>
                      <PriceDisplay 
                        amount={processingFee} 
                        originalCurrency="USD"
                        className="font-medium"
                      />
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total:</span>
                      <PriceDisplay 
                        amount={total} 
                        originalCurrency={orderCurrency}
                        className="font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 text-center">
                    Click "Download Receipt" to get a professional PDF version of this receipt
                  </p>
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
