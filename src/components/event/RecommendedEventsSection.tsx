import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';

interface RecommendedEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  price?: number;
  is_free: boolean;
  currency?: string;
  capacity?: number;
  creator_name?: string;
  average_rating?: number;
  total_reviews?: number;
}

interface RecommendedEventsSectionProps {
  currentEventId: string;
  eventType?: string;
}

const RecommendedEventsSection: React.FC<RecommendedEventsSectionProps> = ({ 
  currentEventId, 
  eventType 
}) => {
  const [recommendedEvents, setRecommendedEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedEvents();
  }, [currentEventId, eventType]);

  // Fisher-Yates shuffle algorithm for better random distribution
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchRecommendedEvents = async () => {
    try {
      // First, try to get events of the same type that are upcoming
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          location,
          event_type,
          image_url,
          price,
          is_free,
          currency,
          capacity,
          creator_id
        `)
        .neq('id', currentEventId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data: sameTypeEvents, error: sameTypeError } = await query;

      let events: any[] = [];

      if (!sameTypeError && sameTypeEvents && sameTypeEvents.length > 0) {
        events = sameTypeEvents;
      } else {
        // If no same-type events found, get any upcoming events
        const { data: allUpcomingEvents, error: allEventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            start_time,
            end_time,
            location,
            event_type,
            image_url,
            price,
            is_free,
            currency,
            capacity,
            creator_id
          `)
          .neq('id', currentEventId)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(12); // Get more events to shuffle from

        if (!allEventsError && allUpcomingEvents) {
          events = allUpcomingEvents;
        }
      }

      if (events.length > 0) {
        // Shuffle the events for better variety
        const shuffledEvents = shuffleArray(events);
        
        // Take only 6 events maximum
        const selectedEvents = shuffledEvents.slice(0, 6);
        
        const eventsWithDetails = await Promise.all(
          selectedEvents.map(async (event) => {
            // Get creator name
            let creatorName = 'Unknown Creator';
            if (event.creator_id) {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', event.creator_id)
                  .single();
                
                if (profile?.full_name) {
                  creatorName = profile.full_name;
                }
              } catch (error) {
                console.error('Error fetching creator profile:', error);
              }
            }

            // Get event ratings
            let averageRating = 0;
            let totalReviews = 0;
            try {
              const { data: reviews } = await supabase
                .from('event_reviews')
                .select('rating')
                .eq('event_id', event.id);

              if (reviews && reviews.length > 0) {
                totalReviews = reviews.length;
                averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
              }
            } catch (error) {
              console.error('Error fetching reviews:', error);
            }

            return {
              ...event,
              creator_name: creatorName,
              average_rating: averageRating,
              total_reviews: totalReviews
            };
          })
        );

        setRecommendedEvents(eventsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching recommended events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyCode = (currency?: string): CurrencyCode => {
    if (!currency) return 'USD';
    const upperCurrency = currency.toUpperCase() as CurrencyCode;
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(upperCurrency) ? upperCurrency : 'USD';
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Recommended Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover more exciting events you might be interested in
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="overflow-hidden bg-white shadow-lg border-0 animate-pulse">
                <div className="w-full h-56 bg-gray-300"></div>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-6"></div>
                  <div className="h-12 bg-gray-300 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendedEvents.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-r from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Recommended Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover more exciting events you might be interested in
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-purple-200 shadow-lg">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-gray-800">No upcoming events found</h3>
              <p className="text-gray-600 mb-4">
                Check back later for more exciting events!
              </p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                <Link to="/events">
                  Browse All Events
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-r from-orange-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-orange-500" />
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              You Might Also Like
            </h2>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover more exciting upcoming events curated just for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendedEvents.map((event) => (
            <Card key={event.id} className="group overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-0 hover:scale-[1.02]">
              <div className="relative overflow-hidden">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                    <Calendar className="h-20 w-20 text-white opacity-80" />
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Price badge */}
                <div className="absolute top-4 left-4">
                  <Badge className={`px-3 py-1 text-sm font-semibold shadow-lg ${
                    event.is_free 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white border-0'
                  }`}>
                    {event.is_free ? "Free" : (
                      <PriceDisplay 
                        amount={event.price || 0} 
                        originalCurrency={getCurrencyCode(event.currency)} 
                      />
                    )}
                  </Badge>
                </div>

                {/* Event type badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/20 hover:bg-white/30">
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </Badge>
                </div>

                {/* Rating badge */}
                {event.average_rating > 0 && (
                  <div className="absolute top-14 left-4">
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{event.average_rating.toFixed(1)}</span>
                      <span className="text-xs">({event.total_reviews})</span>
                    </Badge>
                  </div>
                )}

                {/* Bottom overlay content */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{format(parseISO(event.start_time), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{format(parseISO(event.start_time), 'h:mm a')}</span>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-xl mb-3 text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-3">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-600 mb-4">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="font-medium">by {event.creator_name}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {event.location && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm line-clamp-1 flex-1">{event.location}</span>
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm">{event.capacity} max attendees</span>
                    </div>
                  )}
                </div>
                
                <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <Link to={`/event-detail/${event.id}`} className="flex items-center justify-center gap-2">
                    View Event Details
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-white text-purple-600 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <Link to="/events" className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Explore All Upcoming Events
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecommendedEventsSection;
