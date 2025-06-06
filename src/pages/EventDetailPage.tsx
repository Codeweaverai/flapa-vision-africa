import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Clock, ArrowLeft, User, Globe, Linkedin, Twitter, Video, Star, MessageCircle, CheckCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AddToCartButton from '@/components/cart/AddToCartButton';
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
  creator_id: string;
  preview_video_url?: string;
}

interface EventCreator {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
}

interface EventReview {
  id: string;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [creator, setCreator] = useState<EventCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [agenda, setAgenda] = useState<EventAgenda[]>([]);
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    fetchEventDetails();
    fetchRegistrationsCount();
    fetchEventSpeakers(id).then(setSpeakers);
    fetchEventAgenda(id).then(setAgenda);
    fetchEventReviews();
    
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
      
      // Fetch creator details
      if (data.creator_id) {
        const { data: creatorData, error: creatorError } = await supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url, username')
          .eq('id', data.creator_id)
          .single();
        
        if (!creatorError && creatorData) {
          setCreator(creatorData);
        }
      }
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

  const handleFreeRegistration = async () => {
    if (!user || !event) {
      toast.error('Please sign in to register for this event');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_bookings')
        .insert({
          user_id: user.id,
          event_id: event.id,
          payment_status: 'completed',
          status: 'confirmed'
        });

      if (error) throw error;

      toast.success('Successfully registered for the event! Your free ticket has been issued.');
      setIsUserRegistered(true);
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error('Failed to register for event');
    }
  };

  const fetchEventReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('event_reviews')
        .select(`
          id,
          user_id,
          rating,
          review,
          created_at
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user profiles separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', review.user_id)
            .single();
          
          return {
            ...review,
            profiles: profile || { full_name: 'Anonymous', avatar_url: null }
          };
        })
      );
      
      setReviews(reviewsWithProfiles);
      
      // Calculate average rating
      if (reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((sum, review) => sum + review.rating, 0) / reviewsWithProfiles.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[50vh] flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="section-container">
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/events" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>
          </Button>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Section */}
              <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <div className="relative">
                  {event.image_url && (
                    <AspectRatio ratio={16/9}>
                      <img 
                        src={event.image_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </AspectRatio>
                  )}
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <Badge className="mb-2 bg-gradient-to-r from-orange-500 to-purple-600">
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </Badge>
                    <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(event.start_time), "MMM d, yyyy")}</span>
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
                </div>
              </Card>

              {/* Preview Video */}
              {event.preview_video_url && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-orange-500" />
                      Event Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AspectRatio ratio={16/9}>
                      <video
                        src={event.preview_video_url}
                        controls
                        className="w-full h-full rounded-lg"
                        poster={event.image_url}
                      />
                    </AspectRatio>
                  </CardContent>
                </Card>
              )}
              
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="speakers">Speakers</TabsTrigger>
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle>About This Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line text-gray-700 leading-relaxed">{event.description}</p>
                      
                      {event.online_meeting_link && isUserRegistered && (
                        <div className="mt-6 bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200">
                          <h3 className="font-semibold mb-2 text-orange-800">Meeting Link</h3>
                          <a 
                            href={event.online_meeting_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-800 hover:underline break-all font-medium"
                          >
                            {event.online_meeting_link}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="speakers" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle>Keynote Speakers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {speakers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Speaker lineup will be announced soon.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {speakers.map((speaker) => (
                            <Card key={speaker.id} className="bg-gradient-to-r from-orange-50 to-purple-50">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  {speaker.image_url ? (
                                    <Avatar className="w-16 h-16">
                                      <AvatarImage src={speaker.image_url} alt={speaker.name} />
                                      <AvatarFallback>
                                        {speaker.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center">
                                      <User className="h-8 w-8 text-white" />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-800">{speaker.name}</h3>
                                    {speaker.title && (
                                      <p className="text-muted-foreground text-sm">{speaker.title}</p>
                                    )}
                                    {speaker.speaking_topic && (
                                      <Badge variant="outline" className="mt-2 border-orange-300 text-orange-700">
                                        {speaker.speaking_topic}
                                      </Badge>
                                    )}
                                    
                                    {speaker.bio && (
                                      <p className="text-sm mt-3 text-gray-600 line-clamp-3">
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
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="agenda" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle>Event Agenda</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {agenda.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Event agenda will be published soon.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {agenda
                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                            .map((item) => (
                              <Card key={item.id} className="bg-gradient-to-r from-orange-50 to-purple-50">
                                <CardContent className="p-6">
                                  <div className="flex items-start gap-4">
                                    <div className="text-center min-w-[80px]">
                                      <div className="text-lg font-bold text-orange-600">
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
                                      
                                      <h3 className="font-semibold mb-1 text-gray-800">{item.title}</h3>
                                      
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-orange-500" />
                        Event Reviews
                        {reviews.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {averageRating} ★ ({reviews.length} reviews)
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reviews.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No reviews yet. Be the first to review this event!
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.id} className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={review.profiles?.avatar_url} />
                                  <AvatarFallback>
                                    {review.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-800">
                                      {review.profiles?.full_name || 'Anonymous'}
                                    </span>
                                    <div className="flex">
                                      {renderStars(review.rating)}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{review.review}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {event.is_free ? 'Free' : `${event.currency} ${event.price?.toFixed(2)}`}
                    </p>
                    
                    {event.capacity > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {event.capacity - registeredCount} spots left
                      </p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {isUserRegistered ? (
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                      size="lg"
                      disabled
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registered ✓
                    </Button>
                  ) : event.is_free ? (
                    <Button 
                      onClick={handleFreeRegistration}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700" 
                      size="lg"
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      Get Free Ticket
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <AddToCartButton
                        itemType="event_ticket"
                        itemId={event.id}
                        itemName={event.title}
                        price={event.price}
                        eventId={event.id}
                        eventTitle={event.title}
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      />
                      <EventRegistrationButton
                        eventId={event.id}
                        eventName={event.title}
                        isFree={event.is_free}
                        price={event.price}
                        currency={event.currency}
                        isUserRegistered={isUserRegistered}
                        className="w-full"
                        variant="outline"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Creator Card */}
              {creator && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Event Creator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-600 text-white">
                          {creator.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{creator.full_name}</h3>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      </div>
                    </div>
                    
                    {creator.bio && (
                      <p className="text-sm text-gray-600 line-clamp-3">{creator.bio}</p>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                      asChild
                    >
                      <Link to={`/creator/${creator.username || creator.id}`}>
                        View Creator Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Event Stats */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Event Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="font-semibold">{registeredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-semibold">{event.capacity || 'Unlimited'}</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{averageRating}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      </div>
                    </div>
                  )}
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
