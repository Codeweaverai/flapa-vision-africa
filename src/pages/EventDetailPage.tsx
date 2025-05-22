
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Globe, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import EventRegisterButton from '@/components/payment/EventRegisterButton';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        
        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            profiles:creator_id (username, full_name, avatar_url)
          `)
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);
        
        // Check if user is registered
        if (user) {
          const { data: regData, error: regError } = await supabase
            .from('registrations')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('event_id', id)
            .maybeSingle();
            
          if (!regError && regData && regData.status !== 'cancelled') {
            setIsRegistered(true);
          }
        }
        
        // Get registration count
        const { count, error: countError } = await supabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', id)
          .neq('status', 'cancelled');
          
        if (!countError) {
          setRegistrationCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
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
        <div className="container py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-12">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="mt-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button as={Link} to="/events" className="mt-6">
            Browse all events
          </Button>
        </div>
      </Layout>
    );
  }

  // Format dates
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  return (
    <Layout>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - event info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="capitalize">
                  {event.event_type}
                </Badge>
                {event.is_free ? (
                  <Badge variant="secondary">Free</Badge>
                ) : (
                  <Badge variant="secondary">
                    {event.currency} {event.price}
                  </Badge>
                )}
              </div>
              
              {event.image_url && (
                <div className="w-full aspect-video rounded-lg overflow-hidden mb-6">
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">About this event</h2>
                  <p className="whitespace-pre-line">{event.description}</p>
                </div>
                
                {event?.profiles && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Organizer</h2>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        {event.profiles.avatar_url ? (
                          <img 
                            src={event.profiles.avatar_url} 
                            alt={event.profiles.username || 'Organizer'} 
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{event.profiles.full_name || event.profiles.username}</p>
                        <p className="text-sm text-muted-foreground">Organizer</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - registration card */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  {event.is_free ? (
                    <h3 className="text-2xl font-bold">Free</h3>
                  ) : (
                    <h3 className="text-2xl font-bold">
                      {event.currency} {event.price}
                    </h3>
                  )}
                </div>
                
                <EventRegisterButton 
                  eventId={event.id} 
                  title={event.title}
                  isFree={event.is_free} 
                  price={event.price}
                  currency={event.currency}
                  isRegistered={isRegistered}
                  className="w-full"
                />
                
                <Separator className="my-4" />
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Date and time</p>
                      <p>{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p>
                        {format(startDate, 'h:mm a')} - {format(endDate, sameDay ? 'h:mm a' : 'h:mm a, MMM d')}
                      </p>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p>{event.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {event.online_meeting_link && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Online event</p>
                        <p>Meeting link will be provided after registration</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Attendees</p>
                      <p>{registrationCount} registered</p>
                      {event.capacity && (
                        <p>{event.capacity - registrationCount} spots left</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
