
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Globe, Star, User, MessageSquare, Calendar as CalendarIcon, HelpCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import EventDetailActions from '@/components/event/EventDetailActions';
import RelatedEventsSection from '@/components/event/RelatedEventsSection';
import RecommendedEventsSection from '@/components/event/RecommendedEventsSection';
import EventReviewsTab from '@/components/event/EventReviewsTab';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  price?: number;
  is_free: boolean;
  currency?: string;
  image_url?: string;
  event_type: string;
  creator_id?: string;
  creator?: {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface KeynoteSpeaker {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  speaking_topic?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  speaker_id?: string;
  location?: string;
  session_type: string;
  speaker?: {
    name: string;
    title?: string;
  };
}

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [keynoteSpeakers, setKeynoteSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchRegistrationStatus();
      fetchRegistrationCount();
      fetchKeynoteSpeakers();
      fetchAgenda();
      fetchReviewsStats();
    }
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch creator profile separately
        let creator = {};
        if (data.creator_id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, bio')
              .eq('id', data.creator_id)
              .single();
            
            if (profile) {
              creator = profile;
            }
          } catch (error) {
            console.error('Error fetching creator profile:', error);
          }
        }

        setEvent({
          ...data,
          creator
        });
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationStatus = async () => {
    if (!user || !eventId) {
      setIsRegistered(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking registration status:', error);
      }

      setIsRegistered(!!data);
    } catch (error) {
      console.error('Error in fetchRegistrationStatus:', error);
      setIsRegistered(false);
    }
  };

  const fetchRegistrationCount = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('ticket_quantity')
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (error) throw error;

      const total = data?.reduce((sum, booking) => sum + (booking.ticket_quantity || 0), 0) || 0;
      setRegistrationCount(total);
    } catch (error) {
      console.error('Error fetching registration count:', error);
    }
  };

  const fetchKeynoteSpeakers = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('keynote_speakers')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setKeynoteSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching keynote speakers:', error);
    }
  };

  const fetchAgenda = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_agenda')
        .select(`
          *,
          keynote_speakers(name, title)
        `)
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedAgenda = data?.map(item => ({
        ...item,
        speaker: item.keynote_speakers || undefined
      })) || [];

      setAgenda(formattedAgenda);
    } catch (error) {
      console.error('Error fetching agenda:', error);
    }
  };

  const fetchReviewsStats = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_reviews')
        .select('rating')
        .eq('event_id', eventId);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / total;
        
        setTotalReviews(total);
        setAverageRating(average);
      } else {
        setTotalReviews(0);
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching reviews stats:', error);
      setTotalReviews(0);
      setAverageRating(0);
    }
  };

  const getCurrencyCode = (currency?: string): CurrencyCode => {
    if (!currency) return 'USD';
    const upperCurrency = currency.toUpperCase() as CurrencyCode;
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(upperCurrency) ? upperCurrency : 'USD';
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h1>
            <p className="text-gray-600">{error || 'The event you are looking for does not exist.'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image */}
              {event.image_url && (
                <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </Card>
              )}

              {/* Event Info */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600">
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </Badge>
                    <Badge className={`${
                      event.is_free 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                    }`}>
                      {event.is_free ? "Free Event" : (
                        <PriceDisplay 
                          amount={event.price || 0} 
                          originalCurrency={getCurrencyCode(event.currency)} 
                        />
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-sm font-medium text-orange-700">Date</div>
                        <div className="text-sm text-orange-600">
                          {format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium text-purple-700">Time</div>
                        <div className="text-sm text-purple-600">
                          {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-700">Location</div>
                          <div className="text-sm text-blue-600">{event.location}</div>
                        </div>
                      </div>
                    )}
                    
                    {event.capacity && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-green-700">Capacity</div>
                          <div className="text-sm text-green-600">{event.capacity} attendees</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">About This Event</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>

                  {event.online_meeting_link && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Online Event</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Meeting link will be provided after registration
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabs for additional content */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="speakers">
                      <User className="h-4 w-4 mr-2" />
                      Speakers
                    </TabsTrigger>
                    <TabsTrigger value="agenda">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Agenda
                    </TabsTrigger>
                    <TabsTrigger value="reviews">
                      <Star className="h-4 w-4 mr-2" />
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger value="faq">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      FAQ
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Event Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">What to Expect</h4>
                        <p className="text-gray-600">
                          Join us for an engaging {event.event_type} that will provide valuable insights and networking opportunities.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Who Should Attend</h4>
                        <p className="text-gray-600">
                          This event is perfect for professionals, students, and anyone interested in learning more about the topic.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="speakers" className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Keynote Speakers</h3>
                    {keynoteSpeakers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {keynoteSpeakers.map((speaker) => (
                          <Card key={speaker.id} className="overflow-hidden bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="bg-gradient-to-r from-orange-400 to-purple-600 p-1">
                              <div className="bg-white rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                  {speaker.image_url ? (
                                    <img
                                      src={speaker.image_url}
                                      alt={speaker.name}
                                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                  ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white">
                                      {speaker.name.charAt(0)}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-800 mb-1">{speaker.name}</h4>
                                    {speaker.title && (
                                      <p className="text-purple-600 font-medium mb-3">{speaker.title}</p>
                                    )}
                                    {speaker.speaking_topic && (
                                      <div className="mb-3">
                                        <span className="inline-block bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                          {speaker.speaking_topic}
                                        </span>
                                      </div>
                                    )}
                                    {speaker.bio && (
                                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{speaker.bio}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Social Links */}
                                {(speaker.linkedin_url || speaker.twitter_url || speaker.website_url) && (
                                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                    {speaker.linkedin_url && (
                                      <Button variant="outline" size="sm" asChild className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                                        <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                                          LinkedIn
                                        </a>
                                      </Button>
                                    )}
                                    {speaker.twitter_url && (
                                      <Button variant="outline" size="sm" asChild className="bg-cyan-50 hover:bg-cyan-100 border-cyan-200">
                                        <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                                          Twitter
                                        </a>
                                      </Button>
                                    )}
                                    {speaker.website_url && (
                                      <Button variant="outline" size="sm" asChild className="bg-green-50 hover:bg-green-100 border-green-200">
                                        <a href={speaker.website_url} target="_blank" rel="noopener noreferrer">
                                          Website
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Speaker information will be updated soon.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="agenda" className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Event Agenda</h3>
                    {agenda.length > 0 ? (
                      <div className="space-y-4">
                        {agenda.map((item) => (
                          <div key={item.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{item.title}</h4>
                              <Badge variant="outline">
                                {format(parseISO(item.start_time), 'h:mm a')} - {format(parseISO(item.end_time), 'h:mm a')}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-gray-600 mb-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {item.speaker && (
                                <span>Speaker: {item.speaker.name}</span>
                              )}
                              {item.location && (
                                <span>Location: {item.location}</span>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {item.session_type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Detailed agenda will be available soon.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="p-6">
                    <EventReviewsTab 
                      eventId={event.id} 
                      averageRating={averageRating}
                      totalReviews={totalReviews}
                    />
                  </TabsContent>

                  <TabsContent value="faq" className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">What should I bring to the event?</h4>
                        <p className="text-gray-600">
                          Please bring a valid ID and your ticket confirmation. If this is a workshop, we recommend bringing a notebook and pen.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Is there parking available?</h4>
                        <p className="text-gray-600">
                          Yes, complimentary parking is available on-site for all attendees.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">What is the cancellation policy?</h4>
                        <p className="text-gray-600">
                          Tickets can be cancelled up to 48 hours before the event for a full refund.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Will food be provided?</h4>
                        <p className="text-gray-600">
                          Light refreshments and networking lunch will be provided for all attendees.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator Info */}
              {event.creator && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Event Host</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {event.creator.avatar_url ? (
                          <img 
                            src={event.creator.avatar_url} 
                            alt={event.creator.full_name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {event.creator.full_name || 'Event Host'}
                        </h4>
                        <p className="text-sm text-purple-600">Event Creator</p>
                      </div>
                    </div>
                    {event.creator.bio && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {event.creator.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Registration Actions - Now includes Add to Cart */}
              <EventDetailActions 
                event={event} 
                isRegistered={isRegistered}
                registrationCount={registrationCount}
              />

              {/* Related Events */}
              <RelatedEventsSection 
                currentEventId={event.id} 
                eventType={event.event_type} 
              />
            </div>
          </div>
        </div>

        {/* Recommended Events Section */}
        <RecommendedEventsSection 
          currentEventId={event.id} 
          eventType={event.event_type} 
        />
      </div>
    </Layout>
  );
};

export default EventDetailPage;
