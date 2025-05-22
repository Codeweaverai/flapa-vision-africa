import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, User, Users, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import EventRegistrationButton from '@/components/payment/EventRegistrationButton';
import { formatDate } from '@/lib/utils';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(0);

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
          const { data: registrationData, error: registrationError } = await supabase
            .from('event_registrations')
            .select('id, payment_status')
            .eq('user_id', user.id)
            .eq('event_id', id)
            .maybeSingle();
            
          if (!registrationError && registrationData) {
            setIsRegistered(true);
          }
        }
        
        // Get attendee count
        const { count, error: countError } = await supabase
          .from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', id);
          
        if (!countError) {
          setAttendeeCount(count || 0);
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
          <Button asChild>
            <Link to="/events">Browse all events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - event info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <p className="text-lg text-muted-foreground">{event.summary}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{event.category}</Badge>
              <Badge variant="outline">{event.format}</Badge>
              {event.is_free ? (
                <Badge variant="secondary">Free</Badge>
              ) : (
                <Badge variant="secondary">${event.price}</Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.start_date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{attendeeCount} registered</span>
              </div>
            </div>
            
            <Tabs defaultValue="details" className="mt-8">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="host">Host</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">About this event</h2>
                  <p className="whitespace-pre-line">{event.description}</p>
                </div>
                
                {event.agenda && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Agenda</h2>
                    <p className="whitespace-pre-line">{event.agenda}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="location" className="mt-4">
                <h2 className="text-xl font-semibold mb-3">Location</h2>
                
                {event.format === 'Online' ? (
                  <div className="space-y-4">
                    <p>This is an online event. Registered participants will receive a link to join.</p>
                    
                    {isRegistered && event.meeting_link && (
                      <div className="mt-4">
                        <Button asChild variant="outline">
                          <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Event
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{event.venue_name}</p>
                        <p className="text-muted-foreground">{event.address}</p>
                        {event.address_details && (
                          <p className="text-muted-foreground">{event.address_details}</p>
                        )}
                      </div>
                    </div>
                    
                    {event.google_maps_url && (
                      <div>
                        <Button asChild variant="outline" size="sm">
                          <a href={event.google_maps_url} target="_blank" rel="noopener noreferrer">
                            <MapPin className="h-4 w-4 mr-2" />
                            View on Google Maps
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="host" className="mt-4">
                <h2 className="text-xl font-semibold mb-3">Event Host</h2>
                
                {event?.profiles && (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {event.profiles.avatar_url ? (
                        <img 
                          src={event.profiles.avatar_url} 
                          alt={event.profiles.username || 'Host'} 
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{event.profiles.full_name || event.profiles.username}</p>
                      <p className="text-sm text-muted-foreground">Event Host</p>
                    </div>
                  </div>
                )}
                
                {event.host_info && (
                  <div className="mt-4">
                    <p className="whitespace-pre-line">{event.host_info}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - registration card */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                {event.image_url && (
                  <div className="aspect-video overflow-hidden rounded-md mb-4">
                    <img 
                      src={event.image_url} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="text-center">
                  {event.is_free ? (
                    <h3 className="text-2xl font-bold">Free</h3>
                  ) : (
                    <h3 className="text-2xl font-bold">${event.price}</h3>
                  )}
                </div>
                
                <EventRegistrationButton 
                  eventId={event.id} 
                  title={event.title}
                  isFree={event.is_free} 
                  price={event.price}
                  isRegistered={isRegistered}
                  className="w-full"
                />
                
                <Separator className="my-4" />
                
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Event details:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(event.start_date)}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.format === 'Online' ? 'Online Event' : event.venue_name}</span>
                    </li>
                  </ul>
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
