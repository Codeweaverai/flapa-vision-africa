
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Users, Star, Filter, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import Layout from '@/components/layout/Layout';

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
}

const EVENTS_PER_PAGE = 6;

const ExploreEventsPage = () => {
  const navigate = useNavigate();
  const { currentCurrency } = useCurrency();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [displayCount, setDisplayCount] = useState(EVENTS_PER_PAGE);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch all events (not just upcoming)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Get creator profiles
      const creatorIds = [...new Set(eventsData.map(event => event.creator_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', creatorIds);

      // Get event tickets
      const eventIds = eventsData.map(event => event.id);
      const { data: tickets } = await supabase
        .from('event_tickets')
        .select('id, name, price, quantity_available, quantity_sold, event_id')
        .in('event_id', eventIds);

      // Fetch reviews for each event
      const eventsWithData = await Promise.all(
        eventsData.map(async (event) => {
          const { data: reviews, error: reviewsError } = await supabase
            .from('event_reviews')
            .select('rating')
            .eq('event_id', event.id);

          if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
          }

          const totalReviews = reviews?.length || 0;
          const avgRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

          const eventProfile = profiles?.find(p => p.id === event.creator_id);
          const eventTickets = tickets?.filter(t => t.event_id === event.id) || [];

          // Determine event status
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
            event_tickets: eventTickets,
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews
            },
            status
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
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Live Now</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      default:
        return null;
    }
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + EVENTS_PER_PAGE);
  };

  if (loading) {
    return (
      <Layout>
          <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-orange-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Explore Events
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Discover amazing events and workshops from talented creators around the world. Join live sessions, network with professionals, and expand your horizons.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-12">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for events, topics, or creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white/80 border-gray-200 rounded-xl focus:bg-white transition-colors"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="min-w-[180px]">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Event Type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[180px]">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Event Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Live Now</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[160px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                Upcoming Events
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                Live Now
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                Completed
              </span>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {sortedEvents.length} Events Found
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Showing {Math.min(displayCount, sortedEvents.length)} of {sortedEvents.length} results
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-semibold text-blue-600">
                        {sortedEvents.filter(e => e.status === 'upcoming').length}
                      </span>
                      <span className="text-gray-500 ml-1">Upcoming</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-600">
                        {sortedEvents.filter(e => e.status === 'ongoing').length}
                      </span>
                      <span className="text-gray-500 ml-1">Live</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">
                        {sortedEvents.filter(e => e.status === 'completed').length}
                      </span>
                      <span className="text-gray-500 ml-1">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {sortedEvents.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30">
              <div className="mb-6">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  We couldn't find any events matching your criteria. Try adjusting your search or filters.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {displayedEvents.map((event) => (
                  <Card key={event.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:scale-[1.02]">
                    <div onClick={() => navigate(`/events/${event.id}`)}>
                      {/* Event Image */}
                      <div className="relative h-56 overflow-hidden">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-purple-300 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-white" />
                          </div>
                        )}
                        
                        {/* Status and Type Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          {getStatusBadge(event.status)}
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm">
                            {event.event_type}
                          </Badge>
                        </div>

                        {/* Event Date Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatDate(event.start_time)}
                          </div>
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {event.title}
                        </CardTitle>
                        
                        {/* Creator */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">
                              {event.creator_name.charAt(0)}
                            </span>
                          </div>
                          <span>by {event.creator_name}</span>
                        </div>

                        <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed">
                          {event.description}
                        </p>
                        
                        {/* Reviews */}
                        {event.reviews && event.reviews.total_reviews > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.round(event.reviews?.avg_rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              {event.reviews.avg_rating.toFixed(1)} ({event.reviews.total_reviews} review{event.reviews.total_reviews !== 1 ? 's' : ''})
                            </span>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Event Details */}
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                          <span>{getSoldTickets(event.event_tickets)}/{getTotalCapacity(event.event_tickets)} registered</span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-orange-500" />
                          <span className="font-bold text-xl text-gray-900">
                            <PriceDisplay amount={getMinPrice(event.event_tickets)} originalCurrency="USD" />
                          </span>
                          {event.event_tickets.length > 1 && (
                            <span className="text-sm text-gray-500 ml-1">+</span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg"
                        >
                          {event.status === 'completed' ? 'View Event' : 'Register Now'}
                        </Button>
                      </CardFooter>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={loadMore}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-12 py-4 text-lg shadow-xl"
                  >
                    Load More Events
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
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
