
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Event } from '@/services/eventService';
import { toast } from 'sonner';
import EventRegistrationDialog from '@/components/event/EventRegistrationDialog';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
      if (user) {
        checkRegistrationStatus();
      }
    }
  }, [id, user]);

  const fetchEvent = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsRegistered(!!data);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleRegistrationSuccess = () => {
    setIsRegistered(true);
    toast.success('Registration successful!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
              <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const isEventPast = new Date(event.start_time) < new Date();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              {event.image_url && (
                <div className="w-full h-64 overflow-hidden rounded-t-lg">
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={event.is_free ? "secondary" : "default"}>
                    {event.is_free ? 'Free Event' : `${event.currency} ${event.price}`}
                  </Badge>
                  <Badge variant="outline">{event.event_type}</Badge>
                  {isEventPast && <Badge variant="destructive">Past Event</Badge>}
                </div>
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <CardDescription className="text-lg">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {event.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Capacity</p>
                          <p className="text-sm text-muted-foreground">{event.capacity} attendees</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {event.online_meeting_link && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Online Meeting Link</p>
                    <Button variant="outline" asChild>
                      <a href={event.online_meeting_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Meeting
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Event Registration</CardTitle>
                {!event.is_free && (
                  <CardDescription>
                    Price: {event.currency} {event.price}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isEventPast ? (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">This event has already ended.</p>
                  </div>
                ) : isRegistered ? (
                  <div className="text-center p-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">You're registered!</p>
                      <p className="text-green-600 text-sm mt-1">
                        We'll send you event details closer to the date.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setRegistrationOpen(true)}
                  >
                    {event.is_free ? 'Register for Free' : 'Register Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EventRegistrationDialog
        event={event}
        user={user}
        isOpen={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </Layout>
  );
};

export default EventDetailPage;
