import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, DollarSign, Users, Star, Filter, Search, 
  ChevronDown, Heart, Zap, Music, Mic, Gamepad2, Utensils, 
  Camera, Mountain, Martini, Theater, GraduationCap, Ticket,
  Plane, Lightbulb, Microscope, Castle, Car, Beaker, Building2,
  Dumbbell, Palmtree
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import Layout from '@/components/layout/Layout';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  event_type: string;
  creator_id: string;
  capacity?: number;
  creator_name: string;
  creator_avatar?: string;
  creator_username?: string;
  event_tickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity_available: number;
    quantity_sold: number;
  }>;
  reviews: {
    avg_rating: number;
    total_reviews: number;
  };
  status: 'upcoming' | 'ongoing' | 'completed';
  is_free: boolean;
}

// Modern event categories matching the mobile app
const EVENT_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Calendar, color: 'from-gray-500 to-gray-600' },
  { value: 'webinar', label: 'Webinar', icon: Users, color: 'from-blue-500 to-cyan-600' },
  { value: 'conferences', label: 'Conferences', icon: Building2, color: 'from-purple-500 to-indigo-600' },
  { value: 'live-music', label: 'Live Music', icon: Music, color: 'from-pink-500 to-rose-600' },
  { value: 'sports-events', label: 'Sports Events', icon: Dumbbell, color: 'from-green-500 to-emerald-600' },
  { value: 'night-life', label: 'Night Life', icon: Martini, color: 'from-purple-500 to-pink-600' },
  { value: 'concerts', label: 'Concerts', icon: Theater, color: 'from-orange-500 to-red-600' },
  { value: 'comedy-shows', label: 'Comedy Shows', icon: Mic, color: 'from-yellow-500 to-amber-600' },
  { value: 'business-events', label: 'Business Events', icon: Building2, color: 'from-blue-500 to-indigo-600' },
  { value: 'wellness-events', label: 'Wellness Events', icon: Zap, color: 'from-green-500 to-teal-600' },
  { value: 'summit', label: 'Summit', icon: Mountain, color: 'from-gray-500 to-blue-600' },
  { value: 'picnic', label: 'Picnic', icon: Palmtree, color: 'from-green-500 to-lime-600' },
  { value: 'workshops', label: 'Workshops', icon: GraduationCap, color: 'from-purple-500 to-blue-600' },
  { value: 'festivals', label: 'Festivals', icon: Ticket, color: 'from-orange-500 to-yellow-600' },
  { value: 'gaming-events', label: 'Gaming Events', icon: Gamepad2, color: 'from-green-500 to-emerald-600' },
  { value: 'food-drink', label: 'Food & Drink', icon: Utensils, color: 'from-red-500 to-orange-600' },
  { value: 'art-exhibitions', label: 'Art Exhibitions', icon: Camera, color: 'from-pink-500 to-purple-600' },
  { value: 'travel-events', label: 'Travel Events', icon: Plane, color: 'from-blue-500 to-cyan-600' },
  { value: 'tech-meetups', label: 'Tech Meetups', icon: Lightbulb, color: 'from-blue-500 to-indigo-600' },
  { value: 'science-fairs', label: 'Science Fairs', icon: Microscope, color: 'from-purple-500 to-blue-600' },
  { value: 'cultural-events', label: 'Cultural Events', icon: Castle, color: 'from-amber-500 to-orange-600' },
  { value: 'auto-shows', label: 'Auto Shows', icon: Car, color: 'from-gray-500 to-red-600' },
  { value: 'science-events', label: 'Science Events', icon: Beaker, color: 'from-purple-500 to-pink-600' },
  { value: 'community-events', label: 'Community Events', icon: Users, color: 'from-green-500 to-blue-600' }
];

const EVENTS_PER_PAGE = 8;

const ExploreEventsPage = () => {
  const navigate = useNavigate();
  const { currentCurrency } = useCurrency();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('upcoming');
  const [displayCount, setDisplayCount] = useState(EVENTS_PER_PAGE);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const creatorIds = [...new Set(eventsData.map(event => event.creator_id).filter(Boolean))];
      
      // Fetch profiles with avatar URLs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', creatorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const eventIds = eventsData.map(event => event.id);
      const { data: tickets } = await supabase
        .from('event_tickets')
        .select('id, name, price, quantity_available, quantity_sold, event_id')
        .in('event_id', eventIds);

      const eventsWithData = await Promise.all(
        eventsData.map(async (event) => {
          const { data: reviews } = await supabase
            .from('event_reviews')
            .select('rating')
            .eq('event_id', event.id);

          const totalReviews = reviews?.length || 0;
          const avgRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

          const eventProfile = profiles?.find(p => p.id === event.creator_id);
          const eventTickets = tickets?.filter(t => t.event_id === event.id) || [];
          const is_free = eventTickets.length === 0 || Math.min(...eventTickets.map(t => t.price)) === 0;

          const now = new Date();
          const startTime = new Date(event.start_time);
          const endTime = new Date(event.end_time);
          let status: 'upcoming' | 'ongoing' | 'completed';
          
          if (now < startTime) status = 'upcoming';
          else if (now >= startTime && now <= endTime) status = 'ongoing';
          else status = 'completed';

          return {
            ...event,
            creator_name: eventProfile?.full_name || eventProfile?.username || 'Unknown Creator',
            creator_avatar: eventProfile?.avatar_url || null,
            creator_username: eventProfile?.username || null,
            event_tickets: eventTickets,
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews
            },
            status,
            is_free
          };
        })
      );

      setEvents(eventsWithData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'upcoming':
        const statusOrder = { 'upcoming': 0, 'ongoing': 1, 'completed': 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      
      case 'date':
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      
      case 'title':
        return a.title.localeCompare(b.title);
      
      case 'price':
        const aMinPrice = Math.min(...a.event_tickets.map(t => t.price));
        const bMinPrice = Math.min(...b.event_tickets.map(t => t.price));
        return aMinPrice - bMinPrice;
      
      case 'rating':
        return b.reviews.avg_rating - a.reviews.avg_rating;
      
      default:
        return 0;
    }
  });

  const displayedEvents = sortedEvents.slice(0, displayCount);
  const hasMore = displayCount < sortedEvents.length;

  const getMinPrice = (tickets: Event['event_tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    return Math.min(...tickets.map(t => t.price));
  };

  const getTotalCapacity = (tickets: Event['event_tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => sum + ticket.quantity_available, 0);
  };

  const getSoldTickets = (tickets: Event['event_tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => sum + ticket.quantity_sold, 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">Upcoming</Badge>;
      case 'ongoing':
        return <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg animate-pulse">Live Now</Badge>;
      case 'completed':
        return <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-lg">Completed</Badge>;
      default:
        return null;
    }
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="text-sm text-gray-600 ml-1 font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + EVENTS_PER_PAGE);
  };

  // Handle card click (excluding wishlist button)
  const handleCardClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  // Enhanced Loading Animation with Gradient Rings
  const LoadingAnimation = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Outer Ring */}
          <div className="w-20 h-20 border-4 border-transparent border-t-orange-500 border-r-purple-600 rounded-full animate-spin"></div>
          {/* Middle Ring */}
          <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-b-purple-500 border-l-orange-400 rounded-full animate-spin animation-delay-200"></div>
          {/* Inner Ring */}
          <div className="absolute top-4 left-4 w-12 h-12 border-4 border-transparent border-t-purple-400 border-r-orange-300 rounded-full animate-spin animation-delay-400"></div>
          {/* Center Dot */}
          <div className="absolute top-7 left-7 w-6 h-6 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          Loading Amazing Events...
        </p>
        <p className="mt-2 text-gray-600">Discovering the best experiences for you</p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16">
          {/* Enhanced Header */}
          <div className="text-center mb-16">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <h1 className="text-6xl md:text-7xl font-bold relative">
                <span className="bg-gradient-to-r from-orange-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Explore Events
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
              Discover incredible events, workshops, and experiences from talented creators worldwide. 
              Your next adventure awaits.
            </p>
          </div>

          {/* Category Quick Filters */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <div className="text-sm text-gray-600">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {EVENT_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => setFilterType(category.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-shrink-0 ${
                      filterType === category.value
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                        : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-12">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search events, topics, creators, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white/80 border-gray-200 rounded-xl focus:bg-white transition-all duration-300 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="min-w-[180px]">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl transition-all duration-300 hover:bg-white focus:ring-2 focus:ring-orange-500/20">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <SelectValue placeholder="Event Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Live Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[160px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl transition-all duration-300 hover:bg-white focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming First</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Events Grid */}
          {sortedEvents.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-10"></div>
                <Calendar className="h-20 w-20 text-gray-400 mx-auto relative" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">No Events Found</h3>
              <p className="text-gray-600 max-w-md mx-auto text-lg">
                Try adjusting your search criteria or browse different categories.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="mt-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
                {displayedEvents.map((event) => (
                  <Card key={event.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:scale-[1.02]">
                    <div className="relative">
                      {/* Event Image with Click Handler */}
                      <div 
                        className="relative h-56 overflow-hidden cursor-pointer" 
                        onClick={() => handleCardClick(event.id)}
                      >
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-purple-200 to-pink-300 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-white drop-shadow-lg" />
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Status and Type Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          {getStatusBadge(event.status)}
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm font-medium">
                            {event.event_type}
                          </Badge>
                        </div>

                        {/* Event Date Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/30">
                          <div className="text-sm font-bold text-gray-900">
                            {formatDate(event.start_time)}
                          </div>
                        </div>

                        {/* Wishlist Button */}
                        <div className="absolute top-4 right-4 z-20">
                          <WishlistButton 
                            itemId={event.id}
                            itemType="event"
                            variant="ghost"
                            size="icon"
                            iconOnly
                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-0 hover:text-red-500"
                          />
                        </div>
                      </div>

                      {/* Card Content with Click Handler */}
                      <div 
                        className="cursor-pointer" 
                        onClick={() => handleCardClick(event.id)}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                            {event.title}
                          </CardTitle>
                          
                          {/* Creator with Avatar */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Avatar className="h-6 w-6 border border-orange-200">
                              <AvatarImage 
                                src={event.creator_avatar || undefined} 
                                alt={event.creator_name}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white text-xs font-bold">
                                {event.creator_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">by {event.creator_name}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Event Reviews */}
                          {event.reviews.total_reviews > 0 && (
                            <div className="flex items-center justify-between">
                              {renderStarRating(event.reviews.avg_rating)}
                              <span className="text-xs text-gray-500 font-medium">
                                {event.reviews.total_reviews} review{event.reviews.total_reviews !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {/* Event Details */}
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                              <span className="truncate font-medium">{event.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                            <span className="font-medium">{getSoldTickets(event.event_tickets)}/{getTotalCapacity(event.event_tickets)} registered</span>
                          </div>
                        </CardContent>

                        <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-1 text-orange-500" />
                            <span className="font-bold text-xl text-gray-900">
                              {event.is_free ? (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                  Free
                                </span>
                              ) : (
                                <PriceDisplay amount={getMinPrice(event.event_tickets)} originalCurrency="USD" />
                              )}
                            </span>
                            {!event.is_free && event.event_tickets.length > 1 && (
                              <span className="text-sm text-gray-500 ml-1 font-medium">+</span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(event.id);
                            }}
                          >
                            {event.status === 'completed' ? 'View Event' : 'Register Now'}
                          </Button>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Enhanced Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={loadMore}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-12 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    Load More Events
                    <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
                  </Button>
                  <p className="text-gray-600 mt-4">
                    Showing {displayedEvents.length} of {sortedEvents.length} events
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreEventsPage;
