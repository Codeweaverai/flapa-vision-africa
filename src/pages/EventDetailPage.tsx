import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import FreeEventRegistration from '@/components/event/FreeEventRegistration'; // Import the new component
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
  Twitter,
  ArrowRight,
  Mic,
  Music,
  Palette,
  Users2,
  Globe,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';
import WishlistButton from '@/components/wishlist/WishlistButton';
import ReactMarkdown from 'react-markdown';

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
  status: 'upcoming' | 'ongoing' | 'completed';
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
  role: string;
  title: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  twitter_url: string;
  website_url: string;
  speaking_topic: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

// Role Configuration
const roleConfig = {
  keynote: {
    label: 'Keynote Speaker',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🎤',
    badgeColor: 'bg-purple-500',
    iconComponent: Mic
  },
  panelist: {
    label: 'Panelist',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '💬',
    badgeColor: 'bg-blue-500',
    iconComponent: Users2
  },
  performer: {
    label: 'Performer',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🎭',
    badgeColor: 'bg-orange-500',
    iconComponent: Music
  },
  artist: {
    label: 'Artist',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🎨',
    badgeColor: 'bg-green-500',
    iconComponent: Palette
  }
};

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Event Details
              </h3>
              <p className="text-muted-foreground text-lg">
                Gathering event information...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

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
  }, [id, user]);

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
        .eq('is_published', true)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Filter only upcoming events and limit to 3
      const now = new Date();
      const upcomingEvents = (events || [])
        .filter(event => {
          const startTime = new Date(event.start_time);
          return startTime > now;
        })
        .slice(0, 3);

      // Add status to events
      const eventsWithStatus = upcomingEvents.map(event => {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        let status: 'upcoming' | 'ongoing' | 'completed';
        
        if (now < startTime) status = 'upcoming';
        else if (now >= startTime && now <= endTime) status = 'ongoing';
        else status = 'completed';

        return {
          ...event,
          status
        };
      });

      setRecommendedEvents(eventsWithStatus);
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

  const { setRedirectAfterOTP } = useAuth(); // Add this to get the setter

  const handleAddToCart = (ticketId: string, quantity: number) => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to purchase tickets");
      // Set the redirect URL in the auth context before navigating
      setRedirectAfterOTP(`/event-detail/${id}`);
      navigate("/auth", { state: { redirectTo: `/event-detail/${id}` } });
      return;
    }

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

    // Determine location text based on event type
    const locationText = event.online_meeting_link
      ? 'Online Event'
      : event.location || 'TBD';

    googleCalendarUrl.searchParams.set('details', `Event: ${event.title}\n\n${event.online_meeting_link ? 'Type: Online Event' : 'Location:'} ${locationText}`);
    googleCalendarUrl.searchParams.set('location', locationText);

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

  const getRoleInfo = (role: string) => {
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.keynote;
  };

  const getRoleDisplayText = (role: string, speakingTopic: string) => {
    switch (role) {
      case 'performer':
        return `🎭 Performance: ${speakingTopic}`;
      case 'artist':
        return `🎨 Artistic Focus: ${speakingTopic}`;
      case 'panelist':
        return `💬 Discussion: ${speakingTopic}`;
      default:
        return `🎤 Speaking on: ${speakingTopic}`;
    }
  };

  const handleRegistrationSuccess = () => {
    // Refresh event data to update attendee count and registration status
    loadEventData();
    setIsRegistered(true);
  };

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center shadow-2xl rounded-2xl">
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
            onClick={() => navigate('/explore-events')}
            className="mb-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white hover:text-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Header - Increased image height */}
              <Card className="shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {event.image_url && (
                    <div className="h-[500px] bg-gray-200 rounded-t-2xl overflow-hidden">
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
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" style={event.online_meeting_link ? { color: 'rgb(192, 132, 252)' } : { color: 'rgb(75, 85, 99)' }} />
                        <div>
                          <p className="font-bold" style={event.online_meeting_link ? { color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' } : { color: 'rgb(75, 85, 99)' }}>
                            {format(new Date(event.start_time), 'PPP')}
                          </p>
                          <p className="text-base font-bold" style={event.online_meeting_link ? { color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' } : { color: 'rgb(75, 85, 99)' }}>
                            {format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {event.online_meeting_link ? (
                          <>
                            <Globe className="h-5 w-5" style={{ color: 'rgb(192, 132, 252)' }} /> {/* purple-500 */}
                            <div>
                              <p className="font-bold" style={{ color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' }}>Event Type</p>
                              <p className="text-base font-bold" style={{ color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' }}>Online Event</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-600">Location</p>
                              <p className="text-sm text-gray-600">{event.location}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {isRegistered && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">You're registered for this event!</span>
                          </div>
                          <Button 
                            asChild
                            variant="outline" 
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            <Link to="/my-events">
                              View My Events
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Add to Google Calendar */}
              <Card className="shadow-2xl rounded-2xl">
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
              <Card className="shadow-2xl rounded-2xl">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-orange-100 to-purple-100">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="p-6">
                    <div className="prose max-w-none prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-strong:text-gray-900 prose-em:text-gray-700">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 pl-4" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 pl-4" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                          a: ({node, ...props}) => <a className="text-orange-600 underline hover:text-orange-700" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-orange-500 pl-4 italic text-gray-600 my-4" {...props} />,
                        }}
                      >
                        {event.description}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>

                  <TabsContent value="agenda" className="p-6">
                    {event.event_agenda && event.event_agenda.length > 0 ? (
                      <div className="space-y-4">
                        {event.event_agenda.map((item) => {
                          // Find speaker for this agenda item
                          const speaker = event.keynote_speakers?.find(s => s.id === item.speaker_id);
                          const roleInfo = speaker ? getRoleInfo(speaker.role) : null;
                          
                          return (
                            <div key={item.id} className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-lg border hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-700">
                                    {format(new Date(item.start_time), 'h:mm a')} - {format(new Date(item.end_time), 'h:mm a')}
                                  </span>
                                </div>
                                {roleInfo && speaker && (
                                  <Badge className={`${roleInfo.color} text-xs`}>
                                    <span className="mr-1">{roleInfo.icon}</span>
                                    {roleInfo.label}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h4>
                              {speaker && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                    {speaker.name.charAt(0)}
                                  </div>
                                  <span className="text-sm text-gray-700 font-medium">{speaker.name}</span>
                                  {speaker.title && (
                                    <span className="text-sm text-gray-500">• {speaker.title}</span>
                                  )}
                                </div>
                              )}
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                              )}
                              {item.location && item.location !== 'Main Stage' && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  {item.location}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No agenda available yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="spotlight" className="p-6">
                    {event.keynote_speakers && event.keynote_speakers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {event.keynote_speakers.map((speaker) => {
                          const roleInfo = getRoleInfo(speaker.role);
                          const RoleIcon = roleInfo.iconComponent;
                          
                          return (
                            <div key={speaker.id} className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-lg border hover:shadow-lg transition-shadow duration-300">
                              <div className="flex flex-col md:flex-row gap-6">
                                {/* Speaker Image */}
                                <div className="flex-shrink-0">
                                  <div className="relative">
                                    {speaker.image_url ? (
                                      <img
                                        src={speaker.image_url}
                                        alt={speaker.name}
                                        className="w-32 h-32 rounded-full object-cover mx-auto md:mx-0 border-4 border-white shadow-lg"
                                      />
                                    ) : (
                                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg mx-auto md:mx-0">
                                        {speaker.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    {/* Role Badge */}
                                    <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium border ${roleInfo.color} shadow-sm flex items-center gap-1`}>
                                      <RoleIcon className="h-3 w-3" />
                                      {roleInfo.label}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Speaker Details */}
                                <div className="flex-1">
                                  <h4 className="text-xl font-bold text-gray-900 mb-2">{speaker.name}</h4>
                                  <p className="text-lg text-gray-700 mb-3">{speaker.title}</p>
                                  
                                  {/* Dynamic content based on role */}
                                  {speaker.speaking_topic && (
                                    <div className="mb-4">
                                      <span className="inline-block bg-gradient-to-r from-orange-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                                        {getRoleDisplayText(speaker.role, speaker.speaking_topic)}
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
                                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full bg-blue-50 hover:bg-blue-100"
                                        title="LinkedIn"
                                      >
                                        <Linkedin className="h-5 w-5" />
                                      </a>
                                    )}
                                    {speaker.twitter_url && (
                                      <a 
                                        href={speaker.twitter_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-full bg-sky-50 hover:bg-sky-100"
                                        title="Twitter"
                                      >
                                        <Twitter className="h-5 w-5" />
                                      </a>
                                    )}
                                    {speaker.website_url && (
                                      <a 
                                        href={speaker.website_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-full bg-gray-50 hover:bg-gray-100"
                                        title="Website"
                                      >
                                        <ExternalLink className="h-5 w-5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-12">
                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2">No participants announced yet</h3>
                        <p className="text-gray-600">Check back later for updates on speakers, performers, and panelists.</p>
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
                <Card className="shadow-2xl rounded-2xl">
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('instagram')}
                        className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white border-transparent"
                      >
                        <Instagram className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('linkedin')}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white border-blue-700"
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial('whatsapp')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500"
                      >
                        <MessageCircle className="h-4 w-4" />
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

              {/* Improved Recommended Events - Only upcoming events */}
              {recommendedEvents.length > 0 && (
                <Card className="shadow-2xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                      Recommended Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedEvents.map((recEvent) => (
                        <Card key={recEvent.id} className="group overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-0 hover:scale-[1.02] cursor-pointer"
                               onClick={() => navigate(`/event-detail/${recEvent.id}`)}>
                          <div className="relative overflow-hidden">
                            {recEvent.image_url ? (
                              <img
                                src={recEvent.image_url}
                                alt={recEvent.title}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                                <Calendar className="h-16 w-16 text-white opacity-80" />
                              </div>
                            )}
                            
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                              <Badge className={`px-2 py-1 text-xs font-semibold shadow-lg border-0 ${
                                recEvent.status === 'upcoming' 
                                  ? 'bg-green-600 text-white' 
                                  : recEvent.status === 'ongoing'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-orange-600 text-white'
                              }`}>
                                {recEvent.status === 'upcoming' ? 'Upcoming' : 
                                 recEvent.status === 'ongoing' ? 'Live' : 'Completed'}
                              </Badge>
                            </div>

                            {/* Price badge */}
                            <div className="absolute top-3 right-3">
                              <Badge className={`px-2 py-1 text-xs font-semibold shadow-lg ${
                                recEvent.is_free 
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0' 
                                  : 'bg-orange-500 hover:bg-orange-600 text-white border-0'
                              }`}>
                                {recEvent.is_free ? "Free" : (
                                  <PriceDisplay 
                                    amount={recEvent.price || 0} 
                                    originalCurrency={getCurrencyCode(recEvent.currency)} 
                                  />
                                )}
                              </Badge>
                            </div>

                            {/* Bottom overlay content */}
                            <div className="absolute bottom-3 left-3 right-3" style={recEvent.online_meeting_link ? { color: 'white' } : { color: 'white' }}>
                              <div className="flex items-center gap-2 text-sm font-bold">
                                <Calendar className="h-3 w-3" style={recEvent.online_meeting_link ? { color: 'rgb(255, 255, 255)' } : { color: 'rgb(255, 255, 255)' }} />
                                <span className="font-bold" style={recEvent.online_meeting_link ? { color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' } : {}}>
                                  {format(new Date(recEvent.start_time), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm font-bold">
                                <Clock className="h-3 w-3" style={recEvent.online_meeting_link ? { color: 'rgb(255, 255, 255)' } : { color: 'rgb(255, 255, 255)' }} />
                                <span style={recEvent.online_meeting_link ? { color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' } : {}}>
                                  {format(new Date(recEvent.start_time), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            <div className="mb-3">
                              <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                {recEvent.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-3">
                                {recEvent.description}
                              </p>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {recEvent.location && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center">
                                    {recEvent.online_meeting_link ? (
                                      <Globe className="h-3 w-3" style={{ color: 'rgb(192, 132, 252)' }} />
                                    ) : (
                                      <MapPin className="h-3 w-3 text-blue-600" />
                                    )}
                                  </div>
                                  <span className="text-sm font-bold line-clamp-1 flex-1" style={recEvent.online_meeting_link ? { color: 'rgb(126, 34, 206)' /* dark purple */, fontSize: '1.1em' } : {}}>
                                    {recEvent.online_meeting_link ? 'Online Event' : recEvent.location}
                                  </span>
                                </div>
                              )}
                              {recEvent.capacity && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center">
                                    <Users className="h-3 w-3 text-green-600" />
                                  </div>
                                  <span className="text-xs">{recEvent.capacity} max attendees</span>
                                </div>
                              )}
                            </div>
                            
                            <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group text-sm">
                              <span className="flex items-center justify-center gap-2">
                                View Event Details
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    {event.is_free ? 'Event Registration' : 'Event Tickets'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {event.is_free ? (
                    <FreeEventRegistration 
                      event={event}
                      onRegistrationSuccess={handleRegistrationSuccess}
                    />
                  ) : availableTickets.length === 0 ? (
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Stats */}
              <Card className="shadow-2xl rounded-2xl">
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

              {/* Wishlist Button Only - Removed Gift Card buttons */}
              <Card className="shadow-2xl rounded-2xl">
                <CardContent className="p-6">
                  <WishlistButton
                    itemId={event.id}
                    itemType="event"
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    showText
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Save to Wishlist
                  </WishlistButton>
                </CardContent>
              </Card>

              {/* Creator Profile Card */}
              {creator && (
                <Card className="shadow-2xl rounded-2xl">
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

                    <Button
                      onClick={() => navigate(`/creator/profile/${creator.id}`)}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold"
                    >
                      View Creator Profile
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
