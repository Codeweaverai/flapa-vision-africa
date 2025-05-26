
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, Globe, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { Event } from '@/services/eventService';
import { KeynoteSpeaker, EventAgenda } from '@/services/eventManagementService';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [agenda, setAgenda] = useState<EventAgenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEventDetails();
    }
  }, [id]);

  const loadEventDetails = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch speakers
      const { data: speakersData, error: speakersError } = await supabase
        .from('keynote_speakers')
        .select('*')
        .eq('event_id', id)
        .order('order_index', { ascending: true });

      if (!speakersError) {
        setSpeakers(speakersData || []);
      }

      // Fetch agenda
      const { data: agendaData, error: agendaError } = await supabase
        .from('event_agenda')
        .select(`
          *,
          keynote_speakers (
            id,
            name,
            title
          )
        `)
        .eq('event_id', id)
        .order('start_time', { ascending: true });

      if (!agendaError) {
        setAgenda(agendaData || []);
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
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
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
              <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="mb-8">
          {event.image_url && (
            <div className="w-full h-64 mb-6 rounded-lg overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Badge variant="outline" className="mb-2">
                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                </Badge>
                <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
                <p className="text-lg text-muted-foreground">{event.description}</p>
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">
                        {format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3 text-primary" />
                      <p>{event.location}</p>
                    </div>
                  )}
                  
                  {event.online_meeting_link && (
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-3 text-primary" />
                      <p>Online Event</p>
                    </div>
                  )}
                  
                  {event.capacity && (
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-3 text-primary" />
                      <p>Max {event.capacity} attendees</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold">
                        {event.is_free ? 'Free' : `${event.currency} ${event.price}`}
                      </span>
                    </div>
                    <Button className="w-full" size="lg">
                      Register for Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Speakers Section */}
        {speakers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Keynote Speakers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {speakers.map((speaker) => (
                  <div key={speaker.id} className="text-center">
                    {speaker.image_url ? (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg">{speaker.name}</h3>
                    {speaker.title && (
                      <p className="text-muted-foreground mb-2">{speaker.title}</p>
                    )}
                    {speaker.speaking_topic && (
                      <p className="text-sm text-primary">{speaker.speaking_topic}</p>
                    )}
                    {speaker.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{speaker.bio}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agenda Section */}
        {agenda.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Event Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agenda.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 text-center">
                      <div className="font-semibold">
                        {format(parseISO(item.start_time), 'h:mm a')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(item.end_time), 'h:mm a')}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      {item.description && (
                        <p className="text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">{item.session_type}</Badge>
                        {item.location && (
                          <span className="flex items-center text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {item.location}
                          </span>
                        )}
                        {item.keynote_speakers && (
                          <span className="flex items-center text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {item.keynote_speakers.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default EventDetailPage;
