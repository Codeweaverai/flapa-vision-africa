
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
          creator_id,
          profiles(full_name)
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
              creator_id,
              profiles(full_name)
            `)
            .neq('id', currentEventId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(6);

          if (!fallbackError && fallbackData) {
            const formattedEvents = fallbackData.map(event => ({
              ...event,
              creator_name: event.profiles?.full_name || 'Unknown Creator'
            }));
            setRecommendedEvents(formattedEvents);
          }
        }
        return;
      }

      if (data) {
        const formattedEvents = data.map(event => ({
          ...event,
          creator_name: event.profiles?.full_name || 'Unknown Creator'
        }));
        setRecommendedEvents(formattedEvents);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedEvents.map((event) => (
            <Card key={event.id} className="h-full bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="relative">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-white" />
                  </div>
                )}
                <Badge className={`absolute top-3 left-3 ${
                  event.is_free 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-r from-orange-500 to-purple-600'
                }`}>
                  {event.is_free ? "Free" : (
                    <PriceDisplay 
                      amount={event.price || 0} 
                      originalCurrency={getCurrencyCode(event.currency)} 
                    />
                  )}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-3">
                  <Badge variant="outline" className="text-xs mb-2">
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </Badge>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-800">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {event.description}
                  </p>
                  <p className="text-xs text-purple-600 mb-3">
                    by {event.creator_name}
                  </p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span>{format(parseISO(event.start_time), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span>{format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{event.capacity} max attendees</span>
                    </div>
                  )}
                </div>
                
                <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  <Link to={`/event-detail/${event.id}`} className="flex items-center justify-center gap-2">
                    View Event
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
            <Link to="/events">
              View All Events
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecommendedEventsSection;
