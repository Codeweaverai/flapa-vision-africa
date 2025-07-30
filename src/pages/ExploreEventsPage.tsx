
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Users, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

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
  creator_name?: string;
  event_tickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity_available: number;
    quantity_sold: number;
  }>;
  reviews?: {
    avg_rating: number;
    total_reviews: number;
  };
}

const ExploreEventsPage = () => {
  const navigate = useNavigate();
  const { currentCurrency } = useCurrency();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch events separately first
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_tickets (
            id,
            name,
            price,
            quantity_available,
            quantity_sold
          )
        `)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch creator profiles separately
      const creatorIds = [...new Set(eventsData.map(e => e.creator_id).filter(Boolean))];
      let profilesData: any[] = [];
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', creatorIds);
        
        profilesData = profiles || [];
      }

      // Fetch reviews for each event
      const eventsWithReviews = await Promise.all(
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

          // Find creator profile
          const creatorProfile = profilesData.find(p => p.id === event.creator_id);

          return {
            ...event,
            creator_name: creatorProfile?.full_name || creatorProfile?.username || 'Unknown Creator',
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews
            }
          };
        })
      );

      setEvents(eventsWithReviews);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.event_type === filterType;
    return matchesSearch && matchesType;
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
      default:
        return 0;
    }
  });

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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-orange-200">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Explore Events
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Discover amazing events and workshops from talented creators around the world.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          {sortedEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No events found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div onClick={() => navigate(`/events/${event.id}`)}>
                    {event.image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                          {event.event_type}
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 line-clamp-2">
                        {event.description}
                      </CardDescription>
                      
                      {/* Reviews Section */}
                      {event.reviews && event.reviews.total_reviews > 0 && (
                        <div className="flex items-center gap-2 mt-2">
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

                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                        {formatDate(event.start_time)}
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-orange-500" />
                        {getSoldTickets(event.event_tickets)}/{getTotalCapacity(event.event_tickets)} registered
                      </div>
                      
                      {event.creator_name && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            By: {event.creator_name}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex justify-between items-center pt-4 border-t">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-orange-500" />
                        <span className="font-bold text-lg text-gray-900">
                          <PriceDisplay amount={getMinPrice(event.event_tickets)} originalCurrency="USD" />
                        </span>
                        {event.event_tickets.length > 1 && (
                          <span className="text-sm text-gray-500 ml-1">+</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreEventsPage;
