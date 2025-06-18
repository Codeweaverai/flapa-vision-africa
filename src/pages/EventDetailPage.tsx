import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Globe, Star, User, MessageSquare, Calendar as CalendarIcon, HelpCircle, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import EventReviewsTab from '@/components/event/EventReviewsTab';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';
import { useAuth } from '@/contexts/AuthContext';
import TicketTypeSelector from '@/components/event/TicketTypeSelector';
import SocialMediaShare from '@/components/event/SocialMediaShare';

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
  const navigate = useNavigate();
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

  const handleViewCreatorProfile = () => {
    if (event?.creator_id) {
      navigate(`/creator/profile/${creator.id}`);
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || event.online_meeting_link || '')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleShare = (platform: string) => {
    if (!event) return;
    
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    const shareText = `Check out this event: ${event.title}`;
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Copy to clipboard for Instagram
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('Link copied to clipboard! You can now share it on Instagram.');
        return;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
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
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {event.creator.bio}
                      </p>
                    )}
                    <Button 
                      onClick={handleViewCreatorProfile}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Add to Google Calendar Button */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-4">
                  <Button 
                    onClick={handleAddToGoogleCalendar}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Add to Google Calendar
                  </Button>
                </CardContent>
              </Card>

              {/* Event Details Card */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium text-orange-700">Date</div>
                      <div className="text-sm text-orange-600">
                        {format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-purple-700">Time</div>
                      <div className="text-sm text-purple-600">
                        {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-blue-700">Location</div>
                        <div className="text-sm text-blue-600">{event.location}</div>
                      </div>
                    </div>
                  )}
                  
                  {event.capacity && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-green-700">Capacity</div>
                        <div className="text-sm text-green-600">{event.capacity} attendees</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <Users className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Registered</div>
                      <div className="text-sm text-gray-600">{registrationCount} attendees</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Events */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Related Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <h4 className="font-medium text-sm text-gray-800">AI & Machine Learning Summit</h4>
                      <p className="text-xs text-gray-600 mt-1">Dec 15, 2024 • Online</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <h4 className="font-medium text-sm text-gray-800">Tech Entrepreneurship Workshop</h4>
                      <p className="text-xs text-gray-600 mt-1">Dec 20, 2024 • Lusaka</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <h4 className="font-medium text-sm text-gray-800">Digital Marketing Masterclass</h4>
                      <p className="text-xs text-gray-600 mt-1">Dec 25, 2024 • Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Sharing */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Share Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 p-3 hover:bg-green-50 hover:border-green-200 transition-colors"
                    >
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.258-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 p-3 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('instagram')}
                      className="flex items-center gap-2 p-3 hover:bg-pink-50 hover:border-pink-200 transition-colors"
                    >
                      <svg className="h-5 w-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058 1.644.07 4.849.07 3.259 0 3.668-.014 4.947-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-2 p-3 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <svg className="h-5 w-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Ticket Selection */}
              <TicketTypeSelector 
                eventId={event.id} 
                currency={getCurrencyCode(event.currency)} 
              />
            </div>
          </div>

          {/* Static Related Events Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-4">
                Related Events
              </h2>
              <p className="text-gray-600">Discover more events you might like</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Related events will be loaded here - keeping existing implementation */}
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="mt-8">
            <SocialMediaShare 
              eventTitle={event.title}
              eventUrl={`/events/${event.id}`}
              eventDescription={event.description}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
