
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Download, QrCode, Printer, User, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface TicketData {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  qr_code_data: string;
  ticket_status: string;
  event_ticket_id: string;
  event: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    event_type: string;
    image_url: string;
  };
  event_ticket: {
    name: string;
    price: number;
    ticket_type: string;
  };
}

interface OrderData {
  id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    total_price: number;
    metadata?: any;
  }>;
}

const TicketDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (orderId && user) {
      loadTicketDetails();
      loadUserProfile();
    }
  }, [orderId, user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadTicketDetails = async () => {
    try {
      setLoading(true);
      
      // First get the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (orderError) throw orderError;
      setOrderData(order);

      // Get all generated tickets for this order
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          event:events (
            id, title, description, start_time, end_time, location, event_type, image_url
          ),
          event_ticket:event_tickets (
            name, price, ticket_type
          )
        `)
        .eq('order_id', orderId);

      if (ticketsError) throw ticketsError;

      const formattedTickets = ticketsData?.map(ticket => ({
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        ticket_holder_name: ticket.ticket_holder_name,
        qr_code_data: ticket.qr_code_data,
        ticket_status: ticket.ticket_status,
        event_ticket_id: ticket.event_ticket_id,
        event: ticket.event,
        event_ticket: ticket.event_ticket
      })) || [];

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const printTicket = (ticket: TicketData) => {
    const ticketContent = `
      <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 800px; background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); color: white; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 2.5rem; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">EVENT TICKET</h1>
          <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 10px; margin-top: 20px;">
            <h2 style="margin: 0; font-size: 1.8rem;">${ticket.event?.title || 'Event'}</h2>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">Event Details</h3>
            <p><strong>Date:</strong> ${ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'PPP') : 'TBD'}</p>
            <p><strong>Time:</strong> ${ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'h:mm a') : 'TBD'}</p>
            <p><strong>Location:</strong> ${ticket.event?.location || 'TBD'}</p>
            <p><strong>Type:</strong> ${ticket.event?.event_type || 'General'}</p>
          </div>
          
          <div>
            <h3 style="border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">Ticket Info</h3>
            <p><strong>Holder:</strong> ${getTicketHolderName(ticket)}</p>
            <p><strong>Ticket #:</strong> ${ticket.ticket_code}</p>
            <p><strong>Type:</strong> ${ticket.event_ticket?.ticket_type || 'Standard'}</p>
            <p><strong>Status:</strong> ${ticket.ticket_status.toUpperCase()}</p>
          </div>
        </div>
        
        <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;">
          <p style="margin: 0; font-size: 0.9rem;">Present this ticket at the venue entrance</p>
          <p style="margin: 5px 0 0 0; font-size: 0.8rem; opacity: 0.8;">Ticket Code: ${ticket.ticket_code}</p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Event Ticket - ${ticket.event?.title}</title></head>
          <body style="margin: 0; padding: 20px; background: #f0f0f0;">
            ${ticketContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadTicket = async (ticket: TicketData) => {
    try {
      // Generate tickets and get the latest version
      const { data, error } = await supabase.functions.invoke('generate-tickets', {
        body: { orderId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Ticket downloaded successfully!');
        // For now, just trigger print - in production you'd generate a PDF
        printTicket(ticket);
      } else {
        throw new Error('Failed to generate ticket');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const getTicketHolderName = (ticket: TicketData) => {
    if (ticket.ticket_holder_name && ticket.ticket_holder_name !== 'Ticket Holder 1') {
      return ticket.ticket_holder_name;
    }
    return userProfile?.full_name || userProfile?.username || user?.email || 'Guest';
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

  if (!orderData || tickets.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center shadow-xl">
            <CardContent className="pt-6">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-4">Tickets Not Found</h2>
              <p className="text-gray-600 mb-4">The tickets you're looking for don't exist or haven't been generated yet.</p>
              <Button onClick={() => window.history.back()} className="bg-gradient-to-r from-orange-500 to-purple-600">
                Go Back
              </Button>
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
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Ticket className="h-10 w-10 text-orange-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  Event Tickets
                </h1>
              </div>
              <p className="text-gray-600">Order #{orderData.id.slice(-8).toUpperCase()}</p>
            </div>

            {/* Order Summary */}
            <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Order Date:</span>
                    <p>{format(new Date(orderData.created_at), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span>
                    <p className="text-2xl font-bold text-orange-600">
                      {orderData.total_amount.toFixed(2)} {orderData.currency}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {orderData.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets */}
            <div className="space-y-8">
              {tickets.map((ticket, index) => (
                <Card key={ticket.id} className="shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-white via-orange-50 to-purple-50">
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{ticket.event?.title}</h2>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/20 text-white border-white/30">
                            Ticket #{ticket.ticket_code}
                          </Badge>
                          <Badge className={`${ticket.ticket_status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                            {ticket.ticket_status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {ticket.event_ticket?.ticket_type || 'Standard'} Ticket
                        </p>
                        <p className="text-orange-100">
                          {ticket.event_ticket?.price ? `$${ticket.event_ticket.price}` : 'Free'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                      {/* Event Details */}
                      <div className="lg:col-span-2 p-6 space-y-6">
                        {/* Event Image */}
                        {ticket.event?.image_url && (
                          <div className="mb-6">
                            <img 
                              src={ticket.event.image_url} 
                              alt={ticket.event.title}
                              className="w-full h-48 object-cover rounded-lg shadow-lg"
                            />
                          </div>
                        )}

                        {/* Event Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-orange-600 mt-1" />
                              <div>
                                <p className="font-semibold text-gray-800">Date & Time</p>
                                <p className="text-gray-600">
                                  {ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'PPP') : 'TBD'}
                                </p>
                                <p className="text-gray-600">
                                  {ticket.event?.start_time ? format(new Date(ticket.event.start_time), 'h:mm a') : 'TBD'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-purple-600 mt-1" />
                              <div>
                                <p className="font-semibold text-gray-800">Location</p>
                                <p className="text-gray-600">{ticket.event?.location || 'TBD'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <User className="h-5 w-5 text-green-600 mt-1" />
                              <div>
                                <p className="font-semibold text-gray-800">Ticket Holder</p>
                                <p className="text-gray-600 font-medium">
                                  {getTicketHolderName(ticket)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-blue-600 mt-1" />
                              <div>
                                <p className="font-semibold text-gray-800">Event Type</p>
                                <p className="text-gray-600">{ticket.event?.event_type || 'General'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Event Description */}
                        {ticket.event?.description && (
                          <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200">
                            <h4 className="font-semibold text-gray-800 mb-2">About This Event</h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {ticket.event.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* QR Code & Actions */}
                      <div className="bg-gradient-to-b from-gray-50 to-white p-6 border-l border-gray-200">
                        <div className="text-center space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                              <QrCode className="h-5 w-5" />
                              Entry Code
                            </h4>
                            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-gray-300">
                              <img 
                                src={generateQRCode(ticket.qr_code_data)} 
                                alt="QR Code"
                                className="w-32 h-32 mx-auto"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Scan at venue entrance
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Button 
                              onClick={() => printTicket(ticket)}
                              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Ticket
                            </Button>
                            
                            <Button 
                              onClick={() => downloadTicket(ticket)}
                              variant="outline"
                              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800 font-medium">Important</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Keep this ticket safe and arrive 30 minutes early
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Back Button */}
            <div className="text-center mt-8">
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetailPage;
