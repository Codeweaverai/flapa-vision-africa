
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Download, Printer, QrCode, User, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import html2pdf from 'html2pdf.js';

interface BookingData {
  id: string;
  booking_code: string;
  event: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url: string;
    event_type: string;
  };
  event_ticket: {
    name: string;
    ticket_type: string;
    price: number;
  };
  user: {
    full_name: string;
    email: string;
  };
}

const TicketViewPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId && user) {
      loadBookingDetails();
    }
  }, [bookingId, user]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events (
            id, title, description, start_time, end_time, location, image_url, event_type
          ),
          event_ticket:event_tickets (
            name, ticket_type, price
          )
        `)
        .eq('id', bookingId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      setBooking({
        ...data,
        user: {
          full_name: profile?.full_name || user?.email || 'Guest',
          email: user?.email || ''
        }
      });
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const printTicket = () => {
    window.print();
  };

  const downloadAsPDF = () => {
    const element = document.getElementById('ticket-content');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `ticket-${booking?.booking_code}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
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

  if (!booking) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center shadow-xl">
            <CardContent className="pt-6">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-4">Ticket Not Found</h2>
              <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
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
          <div className="max-w-2xl mx-auto">
            {/* Print Styles */}
            <style jsx>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #ticket-content, #ticket-content * {
                  visibility: visible;
                }
                #ticket-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100% !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mb-6 no-print">
              <Button onClick={printTicket} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Printer className="h-4 w-4 mr-2" />
                Print Ticket
              </Button>
              <Button onClick={downloadAsPDF} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Ticket Content */}
            <div id="ticket-content">
              <Card className="bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Ticket className="h-8 w-8" />
                      <h1 className="text-2xl font-bold">Event Ticket</h1>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <h2 className="text-xl font-semibold mb-2">{booking.event.title}</h2>
                      <p className="text-orange-100">Booking Code: {booking.booking_code}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-8">
                  {/* Event Image */}
                  {booking.event.image_url && (
                    <div className="mb-6">
                      <img 
                        src={booking.event.image_url} 
                        alt={booking.event.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Event Details */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Event Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-700">Date</p>
                            <p className="text-orange-600">{format(new Date(booking.event.start_time), 'PPP')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-purple-700">Time</p>
                            <p className="text-purple-600">{format(new Date(booking.event.start_time), 'h:mm a')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg md:col-span-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-700">Location</p>
                            <p className="text-blue-600">{booking.event.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Attendee Info */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Attendee Information
                        </h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {booking.user.full_name}</p>
                          <p><span className="font-medium">Email:</span> {booking.user.email}</p>
                          <p><span className="font-medium">Ticket Type:</span> {booking.event_ticket.ticket_type.charAt(0).toUpperCase() + booking.event_ticket.ticket_type.slice(1)}</p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code & Important Info */}
                    <div className="flex flex-col items-center space-y-6">
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                          <QrCode className="h-5 w-5" />
                          Entry Code
                        </h3>
                        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-gray-300">
                          <img 
                            src={generateQRCode(booking.booking_code)} 
                            alt="QR Code"
                            className="w-32 h-32 mx-auto"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Scan at venue entrance
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                        <h4 className="font-semibold text-yellow-800 mb-2">Important</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Arrive 30 minutes early</li>
                          <li>• Bring valid ID</li>
                          <li>• Keep this ticket safe</li>
                          <li>• No refunds or exchanges</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketViewPage;
