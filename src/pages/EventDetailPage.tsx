import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EventReviewsTab from '@/components/event/EventReviewsTab';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket,
  Share2,
  Heart,
  ArrowLeft,
  CheckCircle,
  Info,
  CalendarPlus,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  MessageSquare,
  ExternalLink,
  Twitter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  event_type: string;
  is_free: boolean;
  price: number;
  currency: string;
  capacity: number;
  online_meeting_link: string;
  creator_id: string;
  event_tickets: EventTicket[];
  event_agenda: AgendaItem[];
  keynote_speakers: Speaker[];
  _count?: {
    event_bookings: number;
  };
}

interface SimpleEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  event_type: string;
  is_free: boolean;
  price: number;
  currency: string;
  capacity: number;
  online_meeting_link: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

interface EventTicket {
  id: string;
  name: string;
  description: string;
  price: number;
  ticket_type: string;
  quantity_available: number;
  quantity_sold: number;
  is_active: boolean;
  early_bird_end_date: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  speaker_id: string;
  location: string;
  session_type: string;
}

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  twitter_url: string;
  speaking_topic: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const [recommendedEvents, setRecommendedEvents] = useState<SimpleEvent[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (id) {
      loadEventData();
      loadRecommendedEvents();
      loadReviewStats();
    }
  }, [id]);

  const getCurrencyCode = (currency?: string): CurrencyCode => {
    if (!currency) return 'USD';
    const upperCurrency = currency.toUpperCase() as CurrencyCode;
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(upperCurrency) ? upperCurrency : 'USD';
  };

  const loadEventData = async () => {
    try {
      setLoading(true);

      // Load event with related data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          event_tickets!event_tickets_event_id_fkey (*),
          event_agenda (*),
          keynote_speakers (*)
        `)
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

      setEvent(eventData);

      // Load creator profile
      if (eventData.creator_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', eventData.creator_id)
          .single();

        setCreator(creatorData);
      }

      // Check if user is registered
      if (user) {
        const { data: booking } = await supabase
          .from('event_bookings')
          .select('id')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .single();

        setIsRegistered(!!booking);
      }

    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedEvents = async () => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .neq('id', id)
        .limit(3);

      if (error) throw error;
      setRecommendedEvents(events || []);
    } catch (error) {
      console.error('Error loading recommended events:', error);
    }
  };

  const loadReviewStats = async () => {
    try {
      const { data, error } = await supabase
        .from('event_reviews')
        .select('rating')
        .eq('event_id', id);

      if (error) throw error;

      if (data && data.length > 0) {
        const avgRating = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avgRating);
        setTotalReviews(data.length);
      }
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const handleAddToCart = (ticketId: string, quantity: number) => {
    const ticket = event?.event_tickets.find(t => t.id === ticketId);
    if (!ticket || !event) return;

    if (quantity > ticket.quantity_available - ticket.quantity_sold) {
      toast.error('Not enough tickets available');
      return;
    }

    addToCart({
      itemId: ticketId,
      itemType: 'event_ticket',
      itemName: `${event.title} - ${ticket.name}`,
      price: ticket.price,
      quantity: quantity
    });

    toast.success(`${quantity} ticket(s) added to cart`);
  };

  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  const addToGoogleCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('dates', `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`);
    googleCalendarUrl.searchParams.set('details', `Event: ${event.title}\n\nLocation: ${event.location || 'TBD'}`);
    googleCalendarUrl.searchParams.set('location', event.location || '');

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this event: ${event?.title}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  const sendMessage = () => {
    if (!creator) return;
    navigate(`/inbox?to=${creator.id}&subject=Regarding ${event?.title}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Event Not Found</h2>
              <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/events')} className="bg-gradient-to-r from-orange-500 to-purple-600">
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const availableTickets = event.event_tickets.filter(ticket => 
    ticket.is_active && (ticket.quantity_available - ticket.quantity_sold) > 0
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Header */}
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  {event.image_url && (
                    <div className="h-64 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="bg-gradient-to-r from-orange-100 to-purple-100">{event.event_type}</Badge>
                      {event.is_free && <Badge className="bg-green-500">Free</Badge>}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{format(new Date(event.start_time), 'PPP')}</p>
                          <p className="text-sm">
                            {format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    {isRegistered && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">You're registered for this event!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Add to Google Calendar */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <Button 
                    onClick={addToGoogleCalendar}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Add to Google Calendar
                  </Button>
                </CardContent>
              </Card>

              {/* Functional Tabs */}
              <Card className="shadow-lg">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-orange-100 to-purple-100">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="speakers">Speakers</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">{event.description}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="agenda" className="p-6">
                    {event.event_agenda && event.event_agenda.length > 0 ? (
                      <div className="space-y-4">
                        {event.event_agenda.map((item) => (
                          <div key={item.id} className="border-l-4 border-gradient-to-b from-orange-500 to-purple-600 pl-4 bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-r-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-700">
                                {format(new Date(item.start_time), 'h:mm a')} - {format(new Date(item.end_time), 'h:mm a')}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No agenda available yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="speakers" className="p-6">
                    {event.keynote_speakers && event.keynote_speakers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {event.keynote_speakers.map((speaker) => (
                          <div key={speaker.id} className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-lg border">
                            <div className="flex flex-col md:flex-row gap-6">
                              {speaker.image_url && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={speaker.image_url}
                                    alt={speaker.name}
                                    className="w-32 h-32 rounded-full object-cover mx-auto md:mx-0"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-gray-900 mb-2">{speaker.name}</h4>
                                <p className="text-lg text-gray-700 mb-3">{speaker.title}</p>
                                {speaker.speaking_topic && (
                                  <div className="mb-4">
                                    <span className="inline-block bg-gradient-to-r from-orange-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                      Speaking on: {speaker.speaking_topic}
                                    </span>
                                  </div>
                                )}
                                {speaker.bio && (
                                  <p className="text-gray-600 mb-4 leading-relaxed">{speaker.bio}</p>
                                )}
                                
                                {/* Social Links */}
                                <div className="flex gap-3">
                                  {speaker.linkedin_url && (
                                    <a 
                                      href={speaker.linkedin_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <Linkedin className="h-5 w-5" />
                                    </a>
                                  )}
                                  {speaker.twitter_url && (
                                    <a 
                                      href={speaker.twitter_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-600 transition-colors"
                                    >
                                      <Twitter className="h-5 w-5" />
                                    </a>
                                  )}
                                  {speaker.website_url && (
                                    <a 
                                      href={speaker.website_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                      <ExternalLink className="h-5 w-5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No speakers announced yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="p-6">
                    <EventReviewsTab 
                      eventId={event.id}
                      averageRating={averageRating}
                      totalReviews={totalReviews}
                    />
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Creator Card */}
              {creator && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Event Creator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={creator.avatar_url} />
                        <AvatarFallback>
                          {creator.full_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{creator.full_name}</h4>
                        {creator.bio && (
                          <p className="text-gray-600 text-sm mt-1">{creator.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Social Share Icons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('facebook')}
                        className="flex-1"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('instagram')}
                        className="flex-1"
                      >
                        <Instagram className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('linkedin')}
                        className="flex-1"
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('whatsapp')}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={sendMessage}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Events */}
              {recommendedEvents.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Recommended Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recommendedEvents.map((recEvent) => (
                        <div key={recEvent.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                             onClick={() => navigate(`/events/${recEvent.id}`)}>
                          {recEvent.image_url && (
                            <img
                              src={recEvent.image_url}
                              alt={recEvent.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <h5 className="font-medium text-sm mb-1">{recEvent.title}</h5>
                          <p className="text-xs text-gray-600">
                            {format(new Date(recEvent.start_time), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="shadow-lg sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Event Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableTickets.length === 0 ? (
                    <div className="text-center py-6">
                      <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No tickets available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableTickets.map((ticket) => {
                        const available = ticket.quantity_available - ticket.quantity_sold;
                        const selectedQty = selectedTickets[ticket.id] || 0;
                        
                        return (
                          <div key={ticket.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{ticket.name}</h4>
                                <p className="text-2xl font-bold text-orange-600">
                                  <PriceDisplay 
                                    amount={ticket.price} 
                                    originalCurrency={getCurrencyCode(event.currency)} 
                                  />
                                </p>
                              </div>
                              <Badge variant="outline">{available} left</Badge>
                            </div>
                            
                            {ticket.description && (
                              <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                            )}
                            
                            {!isRegistered && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border rounded">
                                  <button
                                    onClick={() => updateTicketQuantity(ticket.id, selectedQty - 1)}
                                    className="px-3 py-1 hover:bg-gray-100"
                                    disabled={selectedQty <= 0}
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 border-x">{selectedQty}</span>
                                  <button
                                    onClick={() => updateTicketQuantity(ticket.id, selectedQty + 1)}
                                    className="px-3 py-1 hover:bg-gray-100"
                                    disabled={selectedQty >= available}
                                  >
                                    +
                                  </button>
                                </div>
                                <Button
                                  onClick={() => handleAddToCart(ticket.id, selectedQty || 1)}
                                  disabled={selectedQty === 0}
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600"
                                >
                                  Add to Cart
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Stats */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Type</span>
                    <span className="font-medium">{event.event_type}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">{event.capacity || 'Unlimited'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium">English</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
