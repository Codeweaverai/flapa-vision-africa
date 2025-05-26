
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Clock, ArrowLeft, User, Globe, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import EventRegistrationButton from '@/components/payment/EventRegistrationButton';
import { fetchEventSpeakers, fetchEventAgenda, KeynoteSpeaker, EventAgenda } from '@/services/eventManagementService';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location: string;
  is_free: boolean;
  price: number;
  currency: string;
  capacity: number;
  image_url: string;
  online_meeting_link: string;
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [agenda, setAgenda] = useState<EventAgenda[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    fetchEventDetails();
    fetchRegistrationsCount();
    fetchEventSpeakers(id).then(setSpeakers);
    fetchEventAgenda(id).then(setAgenda);
    
    if (user) {
      checkUserRegistration();
    }
  }, [id, user]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setEvent(data as Event);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id);
      
      if (error) throw error;
      setRegisteredCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching registrations count:', error);
    }
  };

  const checkUserRegistration = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select()
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setIsUserRegistered(!!data);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 text-purple-800';
      case 'presentation': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'break': return 'bg-gray-100 text-gray-800';
      case 'networking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[50vh] flex justify-center items-center">
          <p>Loading event details...</p>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="section-container min-h-[50vh] flex flex-col justify-center items-center gap-4">
          <p>Event not found</p>
          <Button asChild>
            <Link to="/events">Back to Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/events" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>
        </Button>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <Badge className="mb-2">{event.event_type}</Badge>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.start_time), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location || 'Online'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{registeredCount} registered</span>
                </div>
              </div>
            </div>
            
            {event.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-8">
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                  <p className="whitespace-pre-line">{event.description}</p>
                </div>
                
                {event.online_meeting_link && isUserRegistered && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Meeting Link</h3>
                    <a 
                      href={event.online_meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {event.online_meeting_link}
                    </a>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="speakers" className="space-y-4">
                {speakers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Speaker lineup will be announced soon.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {speakers.map((speaker) => (
                      <Card key={speaker.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {speaker.image_url ? (
                              <img
                                src={speaker.image_url}
                                alt={speaker.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{speaker.name}</h3>
                              {speaker.title && (
                                <p className="text-muted-foreground text-sm">{speaker.title}</p>
                              )}
                              {speaker.speaking_topic && (
                                <Badge variant="outline" className="mt-2">
                                  {speaker.speaking_topic}
                                </Badge>
                              )}
                              
                              {speaker.bio && (
                                <p className="text-sm mt-3 text-muted-foreground line-clamp-3">
                                  {speaker.bio}
                                </p>
                              )}
                              
                              <div className="flex gap-2 mt-3">
                                {speaker.linkedin_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                                      <Linkedin className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {speaker.twitter_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                                      <Twitter className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {speaker.website_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={speaker.website_url} target="_blank" rel="noopener noreferrer">
                                      <Globe className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="agenda" className="space-y-4">
                {agenda.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Event agenda will be published soon.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {agenda
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="text-center">
                                <div className="text-sm font-medium">
                                  {format(new Date(item.start_time), 'HH:mm')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(item.end_time), 'HH:mm')}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getSessionTypeColor(item.session_type)}>
                                    {item.session_type}
                                  </Badge>
                                  {item.location && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{item.location}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <h3 className="font-semibold mb-1">{item.title}</h3>
                                
                                {item.description && (
                                  <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                                )}
                                
                                {item.keynote_speakers && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{item.keynote_speakers.name}</span>
                                    {item.keynote_speakers.title && (
                                      <span>• {item.keynote_speakers.title}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {event.is_free ? 'Free' : `${event.currency} ${event.price?.toFixed(2)}`}
                  </p>
                  
                  {event.capacity > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {event.capacity - registeredCount} spots left
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <EventRegistrationButton
                  eventId={event.id}
                  eventName={event.title}
                  isFree={event.is_free}
                  price={event.price}
                  currency={event.currency}
                  isUserRegistered={isUserRegistered}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
