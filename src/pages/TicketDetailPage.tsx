
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Download, QrCode, ArrowLeft, User, Ticket, PrinterIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface TicketDetails {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  qr_code_data: string;
  ticket_status: string;
  booking: {
    id: string;
    ticket_quantity: number;
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
  };
}

interface UserProfile {
  full_name: string;
  username: string;
}

const TicketDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketDetails[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      
      // Get order items for this order
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('item_type', 'event_ticket');

      if (orderError) throw orderError;

      if (!orderItems || orderItems.length === 0) {
        toast.error('No event tickets found for this order');
        return;
      }

      // Get event bookings for these order items
      const { data: bookings, error: bookingError } = await supabase
        .from('event_bookings')
        .select(`
          id,
          ticket_quantity,
          event:events (
            id, title, description, start_time, end_time, location, event_type, image_url
          )
        `)
        .eq('order_id', orderId);

      if (bookingError) throw bookingError;

      if (!bookings || bookings.length === 0) {
        toast.error('No bookings found for this order');
        return;
      }

      // Get generated tickets for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: generatedTickets, error: ticketError } = await supabase
        .from('generated_tickets')
        .select('*')
        .in('booking_id', bookingIds);

      if (ticketError) throw ticketError;

      // Combine ticket data with booking and event info
      const ticketDetails: TicketDetails[] = generatedTickets?.map(ticket => {
        const booking = bookings.find(b => b.id === ticket.booking_id);
        return {
          ...ticket,
          booking: booking!
        };
      }) || [];

      setTickets(ticketDetails);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const printTicket = (ticket: TicketDetails) => {
    const ticketContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f97316 0%, #8b5cf6 100%); padding: 20px; border-radius: 15px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">EVENT TICKET</h1>
          <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px;">
            <span style="font-size: 14px; font-weight: bold;">#{ticket.ticket_code}</span>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.95); color: #1f2937; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 24px;">${ticket.booking.event.title}</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <strong>📅 Date:</strong><br>
              ${format(new Date(ticket.booking.event.start_time), 'PPP')}
            </div>
            <div>
              <strong>🕒 Time:</strong><br>
              ${format(new Date(ticket.booking.event.start_time), 'h:mm a')}
            </div>
            <div style="grid-column: 1 / -1;">
              <strong>📍 Location:</strong><br>
              ${ticket.booking.event.location}
            </div>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <strong>🎫 Ticket Holder:</strong><br>
            ${ticket.ticket_holder_name || userProfile?.full_name || userProfile?.username || 'Guest'}
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px;">
          <p style="margin: 0; font-size: 12px;">Present this ticket at the event entrance</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Ticket ID: ${ticket.id}</p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Event Ticket - ${ticket.booking.event.title}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f3f4f6; }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            ${ticketContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadTicket = (ticket: TicketDetails) => {
    // For now, just print - in future could generate PDF
    printTicket(ticket);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (tickets.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-16 pb-16">
                  <Ticket className="h-20 w-20 mx-auto mb-6 text-gray-400" />
                  <h3 className="text-2xl font-semibold mb-4">No Tickets Found</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    We couldn't find any event tickets for this order.
                  </p>
                  <Button 
                    onClick={() => navigate('/account/orders')}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const event = tickets[0].booking.event;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/account/orders')}
                className="mb-4 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Ticket className="h-10 w-10 text-primary" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                    Event Tickets
                  </h1>
                </div>
                <p className="text-gray-600">Your tickets for {event.title}</p>
              </div>
            </div>

            {/* Event Info Card */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {event.image_url && (
                    <div className="lg:w-1/3">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-48 lg:h-32 object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{event.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="text-gray-600">{format(new Date(event.start_time), 'PPP')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="font-medium">Time</p>
                          <p className="text-gray-600">{format(new Date(event.start_time), 'h:mm a')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-gray-600">{event.location}</p>
                        </div>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-gray-700 mt-4">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tickets */}
            <div className="space-y-6">
              {tickets.map((ticket, index) => (
                <Card key={ticket.id} className="shadow-2xl border-0 bg-white overflow-hidden">
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2">EVENT TICKET #{index + 1}</h3>
                        <div className="bg-white/20 px-3 py-1 rounded-full inline-block">
                          <span className="text-sm font-medium">#{ticket.ticket_code}</span>
                        </div>
                      </div>
                      <Badge 
                        className={`${
                          ticket.ticket_status === 'active' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        } border-0`}
                      >
                        {ticket.ticket_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Ticket Details */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-5 w-5 text-orange-600" />
                            <span className="font-semibold text-gray-800">Ticket Holder</span>
                          </div>
                          <p className="text-lg font-medium text-gray-900">
                            {ticket.ticket_holder_name || userProfile?.full_name || userProfile?.username || 'Guest'}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Event Type</span>
                              <p className="text-gray-900">{event.event_type}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Ticket ID</span>
                              <p className="text-gray-900 font-mono">{ticket.id.slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR Code and Actions */}
                      <div className="text-center space-y-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                          <QrCode className="h-24 w-24 mx-auto text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">QR Code for Entry</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            onClick={() => printTicket(ticket)}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                          >
                            <PrinterIcon className="h-4 w-4 mr-2" />
                            Print Ticket
                          </Button>
                          <Button
                            onClick={() => downloadTicket(ticket)}
                            variant="outline"
                            className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Ticket
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Important Notes */}
            <Card className="mt-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Important Notes
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Please arrive 30 minutes before the event starts</li>
                  <li>• Keep your ticket safe - it's your proof of entry</li>
                  <li>• Present your ticket (printed or digital) at the event entrance</li>
                  <li>• No refunds or exchanges allowed</li>
                  <li>• Contact support if you have any issues</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetailPage;
