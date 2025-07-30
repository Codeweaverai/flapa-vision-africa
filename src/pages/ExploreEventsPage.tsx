
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Search, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { useCurrency } from '@/contexts/CurrencyContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface EventReview {
  id: string;
  rating: number;
  review: string;
  user_id: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  price: number;
  is_free: boolean;
  capacity: number;
  event_type: string;
  creator_id: string;
  currency: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  reviews?: EventReview[];
  average_rating?: number;
  review_count?: number;
  attendee_count?: number;
}

const ExploreEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory, selectedType]);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (
            full_name,
            avatar_url
          )
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch reviews for each event
      const eventsWithReviews = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: reviews } = await supabase
            .from('event_reviews')
            .select('*')
            .eq('event_id', event.id);

          // Calculate average rating and review count
          const reviewCount = reviews?.length || 0;
          const averageRating = reviewCount > 0 
            ? reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            : 0;

          // Get attendee count from bookings
          const { count: attendeeCount } = await supabase
            .from('event_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('payment_status', 'completed');

          return {
            ...event,
            reviews,
            average_rating: averageRating,
            review_count: reviewCount,
            attendee_count: attendeeCount || 0
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

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedType);
    }

    setFilteredEvents(filtered);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="container mx-auto px-4 py-8">
          {/* Header with gradient title */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-600 bg-clip-text text-transparent">
              Explore Events
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Discover amazing events, workshops, and experiences happening around you. Join communities and expand your knowledge.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-orange-200 focus:border-purple-500"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-white border-orange-200 focus:border-purple-500">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                }}
                variant="outline"
                className="bg-white border-orange-200 text-purple-600 hover:bg-purple-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Card 
                key={event.id} 
                className="group hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-orange-200 hover:border-purple-300 hover:-translate-y-2"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={event.image_url || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      {event.event_type}
                    </Badge>
                  </div>
                  {!event.is_free && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 font-semibold">
                        <PriceDisplay amount={event.price} originalCurrency={event.currency as any} />
                      </Badge>
                    </div>
                  )}
                  {event.is_free && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 text-white">
                        FREE
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {event.description}
                  </p>
                  
                  {/* Reviews Section */}
                  {event.review_count > 0 && (
                    <div className="flex items-center gap-2">
                      {renderStars(Math.round(event.average_rating || 0))}
                      <span className="text-sm text-gray-600">
                        {event.average_rating?.toFixed(1)} ({event.review_count} review{event.review_count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>{formatDate(event.start_time)} at {formatTime(event.start_time)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{event.attendee_count} attendee{event.attendee_count !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </span>
                    </div>
                  </div>
                  
                  {event.profiles && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <img
                        src={event.profiles.avatar_url || '/default-avatar.png'}
                        alt={event.profiles.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {event.profiles.full_name}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold transition-all duration-200"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-orange-200">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedType !== 'all'
                    ? "No events match your current filters. Try adjusting your search."
                    : "No upcoming events are available at the moment."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreEventsPage;
