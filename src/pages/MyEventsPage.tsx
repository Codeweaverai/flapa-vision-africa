
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Video, CheckCircle, Ticket, Users, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface EventRegistration {
  id: string;
  event_id: string;
  status: string;
  created_at: string;
  events: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    event_type: string;
    location: string;
    online_meeting_link: string;
    image_url: string;
    is_free: boolean;
    price: number;
    capacity: number;
  };
}

interface GeneratedTicket {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  pdf_url: string;
  ticket_status: string;
  event_id: string;
  created_at: string;
}

const MyEventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [tickets, setTickets] = useState<GeneratedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchEventRegistrations();
    fetchGeneratedTickets();
  }, [user, navigate]);

  const fetchEventRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          event_id,
          status,
          created_at,
          events:event_id (
            id,
            title,
            description,
            start_time,
            end_time,
            event_type,
            location,
            online_meeting_link,
            image_url,
            is_free,
            price,
            capacity
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event registrations:', error);
        toast.error('Failed to load your events');
        return;
      }

      setRegistrations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const fetchGeneratedTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('generated_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (eventStartTime: string, eventEndTime: string) => {
    const now = new Date();
    const start = parseISO(eventStartTime);
    const end = parseISO(eventEndTime);

    if (isBefore(now, start)) return 'upcoming';
    if (isAfter(now, end)) return 'past';
    return 'ongoing';
  };

  const upcomingEvents = registrations.filter(reg => 
    getEventStatus(reg.events.start_time, reg.events.end_time) === 'upcoming'
  );
  
  const pastEvents = registrations.filter(reg => 
    getEventStatus(reg.events.start_time, reg.events.end_time) === 'past'
  );
  
  const ongoingEvents = registrations.filter(reg => 
    getEventStatus(reg.events.start_time, reg.events.end_time) === 'ongoing'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Events
              </h1>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Manage your event registrations, view tickets, and track your attendance.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-orange-800">{registrations.length}</p>
                    <p className="text-sm text-orange-700">Total Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-purple-800">{upcomingEvents.length}</p>
                    <p className="text-sm text-purple-700">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-pink-100 to-pink-200 border-pink-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-pink-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-pink-800">{pastEvents.length}</p>
                    <p className="text-sm text-pink-700">Attended</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Ticket className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-indigo-800">{tickets.length}</p>
                    <p className="text-sm text-indigo-700">Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-purple-200">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                All Events ({registrations.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Live Now ({ongoingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Past ({pastEvents.length})
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Tickets ({tickets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <EventGrid events={registrations} tickets={tickets} />
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              <EventGrid events={upcomingEvents} tickets={tickets} />
            </TabsContent>

            <TabsContent value="ongoing" className="mt-6">
              <EventGrid events={ongoingEvents} tickets={tickets} />
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <EventGrid events={pastEvents} tickets={tickets} />
            </TabsContent>

            <TabsContent value="tickets" className="mt-6">
              <TicketsGrid tickets={tickets} />
            </TabsContent>
          </Tabs>

          {registrations.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No events registered yet</h3>
              <p className="text-gray-600 mb-6">
                Discover and register for exciting events to expand your network.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                <Link to="/explore-events">Browse Events</Link>
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

interface EventGridProps {
  events: EventRegistration[];
  tickets: GeneratedTicket[];
}

const EventGrid = ({ events, tickets }: EventGridProps) => {
  const getEventStatus = (eventStartTime: string, eventEndTime: string) => {
    const now = new Date();
    const start = parseISO(eventStartTime);
    const end = parseISO(eventEndTime);

    if (isBefore(now, start)) return 'upcoming';
    if (isAfter(now, end)) return 'past';
    return 'ongoing';
  };

  const getEventTickets = (eventId: string) => {
    return tickets.filter(ticket => ticket.event_id === eventId);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No events in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((registration) => {
        const status = getEventStatus(registration.events.start_time, registration.events.end_time);
        const eventTickets = getEventTickets(registration.events.id);
        
        return (
          <Card key={registration.id} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-2">
            <div className="relative overflow-hidden">
              {registration.events.image_url ? (
                <img
                  src={registration.events.image_url}
                  alt={registration.events.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-white opacity-80" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                {status === 'ongoing' ? (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 animate-pulse">
                    <Video className="h-3 w-3 mr-1" />
                    Live Now
                  </Badge>
                ) : status === 'upcoming' ? (
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    Upcoming
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Past
                  </Badge>
                )}
                
                {eventTickets.length > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    <Ticket className="h-3 w-3 mr-1" />
                    {eventTickets.length}
                  </Badge>
                )}
              </div>
              
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 font-medium">
                  {registration.events.event_type.charAt(0).toUpperCase() + registration.events.event_type.slice(1)}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                {registration.events.title}
              </CardTitle>
              <p className="text-gray-600 line-clamp-3 leading-relaxed">
                {registration.events.description}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                    <Calendar className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="font-medium">{format(parseISO(registration.events.start_time), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                    <Clock className="h-3 w-3 text-orange-600" />
                  </div>
                  <span>{format(parseISO(registration.events.start_time), 'h:mm a')} - {format(parseISO(registration.events.end_time), 'h:mm a')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                    {registration.events.online_meeting_link ? (
                      <Video className="h-3 w-3 text-blue-600" />
                    ) : (
                      <MapPin className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                  <span className="line-clamp-1">
                    {registration.events.online_meeting_link ? 'Online Event' : (registration.events.location || 'Location TBA')}
                  </span>
                </div>
                
                {eventTickets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                      <Ticket className="h-3 w-3 text-green-600" />
                    </div>
                    <span>{eventTickets.length} ticket{eventTickets.length !== 1 ? 's' : ''} available</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0"
                  variant="outline"
                >
                  <Link to={`/event/${registration.events.id}`}>
                    View Details
                  </Link>
                </Button>
                
                {status === 'ongoing' && registration.events.online_meeting_link && (
                  <Button asChild className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    <a href={registration.events.online_meeting_link} target="_blank" rel="noopener noreferrer">
                      Join Live
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

interface TicketsGridProps {
  tickets: GeneratedTicket[];
}

const TicketsGrid = ({ tickets }: TicketsGridProps) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
          <Ticket className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No tickets generated yet</h3>
        <p className="text-gray-600">Your event tickets will appear here once they're generated.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-1">
          <div className="relative p-6 bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500">
            <div className="text-white">
              <div className="flex justify-between items-start mb-4">
                <Ticket className="h-8 w-8" />
                <Badge className="bg-white/20 text-white border-white/20">
                  {ticket.ticket_status}
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-2">{ticket.ticket_holder_name}</h3>
              <p className="text-white/90 font-mono text-sm">{ticket.ticket_code}</p>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="space-y-3 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Generated: {format(parseISO(ticket.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                asChild 
                className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                <Link to={`/ticket/${ticket.id}`}>
                  View Ticket
                </Link>
              </Button>
              
              {ticket.pdf_url && (
                <Button asChild variant="outline" className="flex-1">
                  <a href={ticket.pdf_url} target="_blank" rel="noopener noreferrer" download>
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyEventsPage;
