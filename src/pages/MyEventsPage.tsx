
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Eye, Download, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  capacity: number;
  price: number;
  is_free: boolean;
  currency: string;
  event_type: string;
  created_at: string;
  event_bookings: {
    id: string;
    booking_code: string;
    ticket_quantity: number;
    status: string;
  }[];
}

interface TicketData {
  id: string;
  booking_code: string;
  ticket_code?: string;
  status: string;
  ticket_quantity: number;
  ticket_holder_name?: string;
  ticket_holder_email?: string;
  user_name?: string;
  event?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url?: string;
  };
  event_ticket?: {
    name: string;
    ticket_type: string;
  };
}

const MyEventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTicketsDialog, setShowTicketsDialog] = useState(false);
  const [selectedEventTickets, setSelectedEventTickets] = useState<TicketData[]>([]);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_bookings!inner (
            id,
            booking_code,
            ticket_quantity,
            status
          )
        `)
        .eq('event_bookings.user_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching my events:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800', label: 'Ongoing' };
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800', label: 'Completed' };
    }
  };

  const handleViewTickets = async (event: Event) => {
    try {
      // Create ticket data from event bookings
      const ticketData: TicketData[] = event.event_bookings.map((booking, index) => ({
        id: booking.id,
        booking_code: booking.booking_code,
        ticket_code: booking.booking_code,
        status: booking.status,
        ticket_quantity: booking.ticket_quantity,
        ticket_holder_name: user?.user_metadata?.full_name || user?.email || 'Ticket Holder',
        ticket_holder_email: user?.email,
        user_name: user?.user_metadata?.full_name || user?.email,
        event: {
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          image_url: event.image_url
        },
        event_ticket: {
          name: 'Standard Ticket',
          ticket_type: 'Regular'
        }
      }));

      setSelectedEventTickets(ticketData);
      setShowTicketsDialog(true);
    } catch (error) {
      console.error('Error preparing tickets:', error);
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

  const generateTicketHTML = (ticket: TicketData, index: number) => {
    return `
      <div style="max-width: 800px; margin: 0 auto 30px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
        <!-- Header with gradient -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🎫 EVENT TICKET</h1>
          <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block;">
            <span style="font-size: 14px; font-weight: 500;">#${ticket.ticket_code || ticket.booking_code}</span>
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
                <div id="qr-code-${ticket.ticket_code || ticket.booking_code}-${index}" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 100%; height: 100%; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280;">
                    Loading QR...
                  </div>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
            <p className="text-gray-600">View all events you've registered for</p>
          </div>

          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                <p className="text-gray-600 mb-6">You haven't registered for any events yet.</p>
                <Link to="/events">
                  <Button className="bg-gradient-to-r from-orange-500 to-purple-600">
                    Browse Events
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventStatus = getEventStatus(event);
                return (
                  <Card key={event.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    {event.image_url && (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                        <Badge className={eventStatus.color}>
                          {eventStatus.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.start_time), 'PPP p')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.event_bookings.reduce((sum, booking) => sum + booking.ticket_quantity, 0)} ticket(s)
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Link to={`/event/${event.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Event
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600"
                          onClick={() => handleViewTickets(event)}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          View Tickets
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tickets Dialog */}
      <Dialog open={showTicketsDialog} onOpenChange={setShowTicketsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Event Tickets</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handlePrintTickets} className="bg-gradient-to-r from-orange-500 to-purple-600">
                <Download className="h-4 w-4 mr-2" />
                Print Tickets
              </Button>
            </div>

            <div id="tickets-print-content">
              {selectedEventTickets.map((ticket, index) => (
                <div key={ticket.id} className="ticket-container mb-8">
                  <div 
                    className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl"
                    dangerouslySetInnerHTML={{ __html: generateTicketHTML(ticket, index) }}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyEventsPage;
