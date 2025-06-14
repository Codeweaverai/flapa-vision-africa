
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';

interface RelatedEvent {
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
}

interface RelatedEventsSectionProps {
  currentEventId: string;
  eventType: string;
}

const RelatedEventsSection: React.FC<RelatedEventsSectionProps> = ({ 
  currentEventId, 
  eventType 
}) => {
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedEvents();
  }, [currentEventId, eventType]);

  const fetchRelatedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_type', eventType)
        .neq('id', currentEventId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (error) throw error;
      setRelatedEvents(data || []);
    } catch (error) {
      console.error('Error fetching related events:', error);
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
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle>Related Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedEvents.length === 0) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle>Related Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No related events found at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle>Related {eventType.charAt(0).toUpperCase() + eventType.slice(1)} Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relatedEvents.map((event) => (
          <div key={event.id} className="flex gap-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm line-clamp-2 text-gray-800">
                  {event.title}
                </h3>
                <Badge className={`ml-2 ${
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
              
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(parseISO(event.start_time), 'MMM d')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(parseISO(event.start_time), 'h:mm a')}</span>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{event.capacity} max</span>
                  </div>
                )}
              </div>
              
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link to={`/event/${event.id}`} className="flex items-center gap-1">
                  View Details
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RelatedEventsSection;
