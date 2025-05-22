
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin, Link as LinkIcon, Users } from 'lucide-react';
import { format, isPast } from 'date-fns';
import EventRegisterButton from '@/components/payment/EventRegisterButton';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  is_free: boolean;
  price?: number;
  currency?: string;
  image_url?: string;
  creator_id?: string;
  creator?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Fetch event details
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            creator:creator_id (
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);

        // Fetch registration count
        const { count: regCount, error: countError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', id);

        if (countError) throw countError;
        setRegistrationCount(regCount || 0);

        // Check if the current user is registered
        if (user) {
          const { data: regData, error: regError } = await supabase
            .from('registrations')
            .select('id, status')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .not('status', 'eq', 'cancelled')
            .single();

          if (!regError && regData) {
            setIsRegistered(true);
          }
        }
      } catch (error) {
        console.error('Error loading event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, user]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="mb-8">The event you are looking for does not exist or has been removed.</p>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const eventPassed = isPast(new Date(event.end_time));
  const eventTypeLabel = event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1);

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge>{eventTypeLabel}</Badge>
                {eventPassed && <Badge variant="secondary" className="ml-2">Past Event</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {registrationCount} registered
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold">{event.title}</h1>
            
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              {event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
            
            <div className="prose max-w-none dark:prose-invert">
              <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
              <p className="whitespace-pre-line">{event.description}</p>
            </div>
            
            {event.creator && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Organized by</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted overflow-hidden">
                    {event.creator.avatar_url ? (
                      <img 
                        src={event.creator.avatar_url} 
                        alt={event.creator.full_name || event.creator.username || 'Organizer'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                        {(event.creator.full_name || event.creator.username || 'O')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">
                      {event.creator.full_name || event.creator.username || 'Organizer'}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="text-2xl font-bold mb-6">
                    {event.is_free ? (
                      'Free'
                    ) : (
                      `${event.currency} ${event.price}`
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Date and Time</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), 'EEE, MMM d, yyyy')}
                          <br />
                          {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Location</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.location}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {event.online_meeting_link && (
                      <div className="flex items-start">
                        <LinkIcon className="h-5 w-5 mr-3 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Online Meeting</h3>
                          <p className="text-sm text-muted-foreground">
                            {isRegistered ? (
                              <a 
                                href={event.online_meeting_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Join Meeting
                              </a>
                            ) : (
                              "Link available after registration"
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {eventPassed ? (
                  <Button disabled className="w-full">Event has ended</Button>
                ) : (
                  <EventRegisterButton 
                    eventId={event.id}
                    title={event.title}
                    isFree={event.is_free}
                    price={event.price}
                    currency={event.currency}
                    isRegistered={isRegistered}
                    className="w-full"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
