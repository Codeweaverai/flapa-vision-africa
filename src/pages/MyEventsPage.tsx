
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Video, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';

interface EventRegistration {
  id: string;
  event_id: string;
  status: string;
  registered_at: string;
  attended: boolean;
  event: {
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

const MyEventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchEventRegistrations();
  }, [user, navigate]);

  const fetchEventRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          event_id,
          status,
          registered_at,
          attended,
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
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching event registrations:', error);
        toast.error('Failed to load your events');
        return;
      }

      setRegistrations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
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
    getEventStatus(reg.event.start_time, reg.event.end_time) === 'upcoming'
  );
  
  const pastEvents = registrations.filter(reg => 
    getEventStatus(reg.event.start_time, reg.event.end_time) === 'past'
  );
  
  const ongoingEvents = registrations.filter(reg => 
    getEventStatus(reg.event.start_time, reg.event.end_time) === 'ongoing'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-light-purple">
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">My Events</h1>
            <p className="text-xl text-muted-foreground">
              Manage your event registrations and attendance.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{registrations.length}</p>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{pastEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Attended</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Video className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{ongoingEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Live Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Events ({registrations.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
              <TabsTrigger value="ongoing">Live Now ({ongoingEvents.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <EventGrid events={registrations} />
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              <EventGrid events={upcomingEvents} />
            </TabsContent>

            <TabsContent value="ongoing" className="mt-6">
              <EventGrid events={ongoingEvents} />
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <EventGrid events={pastEvents} />
            </TabsContent>
          </Tabs>

          {registrations.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events registered yet</h3>
              <p className="text-muted-foreground mb-6">
                Discover and register for exciting events to expand your network.
              </p>
              <Button asChild size="lg">
                <Link to="/explore/events">Browse Events</Link>
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
}

const EventGrid = ({ events }: EventGridProps) => {
  const getEventStatus = (eventStartTime: string, eventEndTime: string) => {
    const now = new Date();
    const start = parseISO(eventStartTime);
    const end = parseISO(eventEndTime);

    if (isBefore(now, start)) return 'upcoming';
    if (isAfter(now, end)) return 'past';
    return 'ongoing';
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No events in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((registration) => {
        const status = getEventStatus(registration.event.start_time, registration.event.end_time);
        
        return (
          <Card key={registration.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              {registration.event.image_url ? (
                <img
                  src={registration.event.image_url}
                  alt={registration.event.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                  <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {status === 'ongoing' ? (
                  <Badge className="bg-red-500">
                    <Video className="h-3 w-3 mr-1" />
                    Live Now
                  </Badge>
                ) : status === 'upcoming' ? (
                  <Badge className="bg-blue-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Upcoming
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Past
                  </Badge>
                )}
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-background/80">
                  {registration.event.event_type.charAt(0).toUpperCase() + registration.event.event_type.slice(1)}
                </Badge>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="line-clamp-2">{registration.event.title}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {registration.event.description}
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(parseISO(registration.event.start_time), 'PPP')}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(parseISO(registration.event.start_time), 'p')} - {format(parseISO(registration.event.end_time), 'p')}
                </div>
                <div className="flex items-center">
                  {registration.event.online_meeting_link ? (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Online Event
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      {registration.event.location || 'Location TBA'}
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button asChild className="flex-1" variant="outline">
                  <Link to={`/events/${registration.event.id}`}>
                    View Details
                  </Link>
                </Button>
                
                {status === 'ongoing' && registration.event.online_meeting_link && (
                  <Button asChild className="flex-1">
                    <a href={registration.event.online_meeting_link} target="_blank" rel="noopener noreferrer">
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

export default MyEventsPage;
