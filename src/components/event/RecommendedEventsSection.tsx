
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star } from 'lucide-react';
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

  const fetchRecommendedEvents = async () => {
    try {
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
        .order('start_time', { ascending: true })
        .limit(6);

      // If event type is provided, prioritize events of the same type
      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recommended events:', error);
        
        // If no events of same type found, get any upcoming events
        if (eventType) {
          const { data: fallbackData, error: fallbackError } = await supabase
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
            .limit(6);

          if (!fallbackError && fallbackData) {
            const eventsWithCreators = await fetchCreatorNames(fallbackData);
            setRecommendedEvents(eventsWithCreators);
          }
        }
        return;
      }

      if (data) {
        const eventsWithCreators = await fetchCreatorNames(data);
        setRecommendedEvents(eventsWithCreators);
      }
    } catch (error) {
      console.error('Error fetching recommended events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorNames = async (events: any[]) => {
    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
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

        return {
          ...event,
          creator_name: creatorName
        };
      })
    );

    return eventsWithCreators;
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Recommended Events
          </h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (recommendedEvents.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-r from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Recommended Events
          </h2>
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-purple-200">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-gray-800">No upcoming events</h3>
              <p className="text-gray-600">
                Check back later for more exciting events!
              </p>
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Recommended Events
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover more exciting events you might be interested in
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
              Explore All Events
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecommendedEventsSection;
