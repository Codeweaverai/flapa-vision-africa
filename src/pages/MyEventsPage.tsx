import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Eye, Download, Clock, Ticket, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TicketDisplay from '@/components/tickets/TicketDisplay';

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
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Your Events
              </h3>
              <p className="text-muted-foreground text-lg">
                Gathering your event registrations...
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

const MyEventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');

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

  const handleViewTickets = async (event: Event) => {
    setSelectedEvent(event);
    
    try {
      const { data: ticketsData, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings!generated_tickets_booking_id_fkey (
            booking_code,
            event:events (
              title,
              start_time,
              end_time,
              location,
              image_url,
              description
            )
          )
        `)
        .eq('event_id', event.id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching tickets:', error);
        const mockTickets = event.event_bookings.map((booking, index) => ({
          id: `${event.id}-${index}`,
          ticket_code: booking.booking_code,
          ticket_holder_name: 'Event Attendee',
          qr_code_data: JSON.stringify({
            booking_code: booking.booking_code,
            event_title: event.title,
            ticket_quantity: booking.ticket_quantity
          }),
          ticket_status: booking.status,
          booking: {
            booking_code: booking.booking_code,
            event: {
              title: event.title,
              start_time: event.start_time,
              end_time: event.end_time,
              location: event.location,
              image_url: event.image_url,
              description: event.description
            },
            event_ticket: {
              name: 'General Admission',
              ticket_type: 'standard'
            }
          }
        }));
        setTickets(mockTickets);
      } else {
        const transformedTickets = ticketsData?.map(ticket => ({
          ...ticket,
          booking: {
            booking_code: ticket.booking?.booking_code || event.event_bookings[0]?.booking_code,
            event: ticket.booking?.event || {
              title: event.title,
              start_time: event.start_time,
              end_time: event.end_time,
              location: event.location,
              image_url: event.image_url,
              description: event.description
            },
            event_ticket: {
              name: 'General Admission',
              ticket_type: 'standard'
            }
          }
        })) || [];
        setTickets(transformedTickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      const fallbackTickets = event.event_bookings.map((booking, index) => ({
        id: `${event.id}-${index}`,
        ticket_code: booking.booking_code,
        ticket_holder_name: 'Event Attendee',
        qr_code_data: JSON.stringify({
          booking_code: booking.booking_code,
          event_title: event.title,
          ticket_quantity: booking.ticket_quantity
        }),
        ticket_status: booking.status,
        booking: {
          booking_code: booking.booking_code,
          event: {
            title: event.title,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
            image_url: event.image_url,
            description: event.description
          },
          event_ticket: {
            name: 'General Admission',
            ticket_type: 'standard'
          }
        }
      }));
      setTickets(fallbackTickets);
    }
    
    setTicketDialogOpen(true);
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      return { 
        status: 'upcoming', 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Upcoming',
        icon: '🕒'
      };
    } else if (now >= startTime && now <= endTime) {
      return { 
        status: 'ongoing', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Live Now',
        icon: '🔴'
      };
    } else {
      return { 
        status: 'completed', 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        label: 'Completed',
        icon: '✅'
      };
    }
  };

  const getTimeUntilEvent = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return events.filter(event => new Date(event.start_time) > now);
      case 'live':
        return events.filter(event => 
          new Date(event.start_time) <= now && new Date(event.end_time) >= now
        );
      case 'completed':
        return events.filter(event => new Date(event.end_time) < now);
      default:
        return events;
    }
  };

  const filteredEvents = getFilteredEvents();

  // Calculate stats
  const totalEvents = events.length;
  const upcomingEvents = events.filter(event => new Date(event.start_time) > new Date()).length;
  const liveEvents = events.filter(event => 
    new Date(event.start_time) <= new Date() && new Date(event.end_time) >= new Date()
  ).length;
  const completedEvents = events.filter(event => new Date(event.end_time) < new Date()).length;

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section - Inspired by MyCourses */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                My Events
              </h1>
              <p className="text-xl text-muted-foreground">
                Track your event registrations and manage your tickets.
              </p>
            </div>

            {/* Enhanced Stats Overview - Like MyCourses */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                        {totalEvents}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{upcomingEvents}</p>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{liveEvents}</p>
                      <p className="text-sm text-muted-foreground">Live Now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Ticket className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{completedEvents}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {events.length === 0 ? (
              <Card className="text-center py-16 max-w-2xl mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                    <Calendar className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">No Events Found</h3>
                  <p className="text-gray-600 text-lg">
                    You haven't registered for any events yet. Start exploring amazing events!
                  </p>
                  <Link to="/events">
                    <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3 text-lg h-auto">
                      <Calendar className="h-5 w-5 mr-2" />
                      Browse Events
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Enhanced Tabs Navigation - Wider and more prominent */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200 shadow-lg h-16">
                    <TabsTrigger 
                      value="upcoming"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 text-base font-semibold h-12"
                    >
                      <Clock className="h-5 w-5 mr-3" />
                      Upcoming
                      <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium min-w-8">
                        {upcomingEvents}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="live"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 text-base font-semibold h-12"
                    >
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse" />
                      Live Now
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium min-w-8">
                        {liveEvents}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="completed"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 text-base font-semibold h-12"
                    >
                      <Ticket className="h-5 w-5 mr-3" />
                      Completed
                      <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium min-w-8">
                        {completedEvents}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Upcoming Events Tab */}
                  <TabsContent value="upcoming" className="mt-8">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-gradient-to-r from-orange-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <Clock className="h-10 w-10 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
                        <p className="text-gray-600 mb-6">You don't have any upcoming events scheduled.</p>
                        <Link to="/events">
                          <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                            Find Events
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => {
                          const eventStatus = getEventStatus(event);
                          const timeUntil = getTimeUntilEvent(event.start_time);
                          
                          return (
                            <Card key={event.id} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                              {/* Event Status Ribbon */}
                              <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold border ${eventStatus.color} backdrop-blur-sm`}>
                                {eventStatus.icon} {eventStatus.label}
                              </div>
                              
                              {/* Countdown Badge for Upcoming Events */}
                              {timeUntil && (
                                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                  ⏳ {timeUntil}
                                </div>
                              )}
                              
                              {/* Event Image */}
                              <div className="relative h-56 overflow-hidden">
                                {event.image_url ? (
                                  <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-purple-200 flex items-center justify-center">
                                    <Calendar className="h-12 w-12 text-white/80" />
                                  </div>
                                )}
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                              
                              <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-orange-600 transition-colors min-h-[3.5rem]">
                                  {event.title}
                                </CardTitle>
                                
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="h-4 w-4 text-orange-500" />
                                    <span>{format(new Date(event.start_time), 'EEE, MMM d • h:mm a')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="h-4 w-4 text-purple-500" />
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Ticket className="h-4 w-4 text-blue-500" />
                                    <span>
                                      {event.event_bookings.reduce((sum, booking) => sum + booking.ticket_quantity, 0)} ticket(s)
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                <div className="flex gap-3">
                                  <Link to={`/events/${event.id}`} className="flex-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all h-11"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Details
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all h-11"
                                    onClick={() => handleViewTickets(event)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Tickets
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Live Events Tab */}
                  <TabsContent value="live" className="mt-8">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-gradient-to-r from-green-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Events</h3>
                        <p className="text-gray-600 mb-6">There are no events happening right now.</p>
                        <Link to="/events">
                          <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                            Explore Events
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => {
                          const eventStatus = getEventStatus(event);
                          
                          return (
                            <Card key={event.id} className="group relative overflow-hidden border-2 border-green-200 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                              {/* Live Badge */}
                              <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm animate-pulse">
                                🔴 LIVE NOW
                              </div>
                              
                              {/* Event Image */}
                              <div className="relative h-56 overflow-hidden">
                                {event.image_url ? (
                                  <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-green-200 to-purple-200 flex items-center justify-center">
                                    <Calendar className="h-12 w-12 text-white/80" />
                                  </div>
                                )}
                                {/* Live Pulse Overlay */}
                                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                              </div>
                              
                              <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-green-600 transition-colors min-h-[3.5rem]">
                                  {event.title}
                                </CardTitle>
                                
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="h-4 w-4 text-green-500" />
                                    <span>Happening Now • Ends {format(new Date(event.end_time), 'h:mm a')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="h-4 w-4 text-purple-500" />
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Ticket className="h-4 w-4 text-blue-500" />
                                    <span>
                                      {event.event_bookings.reduce((sum, booking) => sum + booking.ticket_quantity, 0)} ticket(s)
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                <div className="flex gap-3">
                                  <Link to={`/events/${event.id}`} className="flex-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all h-11"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Join Now
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all h-11"
                                    onClick={() => handleViewTickets(event)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Tickets
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Completed Events Tab */}
                  <TabsContent value="completed" className="mt-8">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-gradient-to-r from-purple-100 to-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <Calendar className="h-10 w-10 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Events</h3>
                        <p className="text-gray-600 mb-6">Your completed events will appear here.</p>
                        <Link to="/events">
                          <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                            Browse Events
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => {
                          const eventStatus = getEventStatus(event);
                          
                          return (
                            <Card key={event.id} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 grayscale hover:grayscale-0">
                              {/* Completed Badge */}
                              <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold border ${eventStatus.color} backdrop-blur-sm`}>
                                {eventStatus.icon} {eventStatus.label}
                              </div>
                              
                              {/* Event Image */}
                              <div className="relative h-56 overflow-hidden">
                                {event.image_url ? (
                                  <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-200 to-orange-200 flex items-center justify-center">
                                    <Calendar className="h-12 w-12 text-white/80" />
                                  </div>
                                )}
                                {/* Completed Overlay */}
                                <div className="absolute inset-0 bg-gray-400/20" />
                              </div>
                              
                              <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold line-clamp-2 text-gray-600 min-h-[3.5rem]">
                                  {event.title}
                                </CardTitle>
                                
                                <div className="space-y-3 text-sm text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ended {format(new Date(event.end_time), 'PPP')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4" />
                                    <span>
                                      {event.event_bookings.reduce((sum, booking) => sum + booking.ticket_quantity, 0)} attended
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                <div className="flex gap-3">
                                  <Link to={`/events/${event.id}`} className="flex-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 h-11"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Recap
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white h-11"
                                    onClick={() => handleViewTickets(event)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    View Tickets
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Ticket Display Dialog */}
        <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50/30 border-0 shadow-2xl">
            <DialogHeader className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Event Tickets
              </DialogTitle>
              <p className="text-gray-600">
                {selectedEvent?.title} • {selectedEvent && format(new Date(selectedEvent.start_time), 'PPP')}
              </p>
            </DialogHeader>
            <div className="space-y-6">
              {tickets.map((ticket, index) => (
                <TicketDisplay
                  key={ticket.id || index}
                  ticket={ticket}
                  showPrintStyles={false}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MyEventsPage;
