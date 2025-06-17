
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Globe, Star, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import EventDetailActions from '@/components/event/EventDetailActions';
import RelatedEventsSection from '@/components/event/RelatedEventsSection';
import RecommendedEventsSection from '@/components/event/RecommendedEventsSection';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  price?: number;
  is_free: boolean;
  currency?: string;
  image_url?: string;
  event_type: string;
  creator_id?: string;
  creator?: {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  };
}

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_creator_id_fkey(
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (data) {
        setEvent({
          ...data,
          creator: data.profiles
        });
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details');
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
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h1>
            <p className="text-gray-600">{error || 'The event you are looking for does not exist.'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image */}
              {event.image_url && (
                <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </Card>
              )}

              {/* Event Info */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600">
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </Badge>
                    <Badge className={`${
                      event.is_free 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                    }`}>
                      {event.is_free ? "Free Event" : (
                        <PriceDisplay 
                          amount={event.price || 0} 
                          originalCurrency={getCurrencyCode(event.currency)} 
                        />
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-sm font-medium text-orange-700">Date</div>
                        <div className="text-sm text-orange-600">
                          {format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium text-purple-700">Time</div>
                        <div className="text-sm text-purple-600">
                          {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-700">Location</div>
                          <div className="text-sm text-blue-600">{event.location}</div>
                        </div>
                      </div>
                    )}
                    
                    {event.capacity && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-green-700">Capacity</div>
                          <div className="text-sm text-green-600">{event.capacity} attendees</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">About This Event</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>

                  {event.online_meeting_link && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Online Event</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Meeting link will be provided after registration
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator Info */}
              {event.creator && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Event Host</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {event.creator.avatar_url ? (
                          <img 
                            src={event.creator.avatar_url} 
                            alt={event.creator.full_name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {event.creator.full_name || 'Event Host'}
                        </h4>
                        <p className="text-sm text-purple-600">Event Creator</p>
                      </div>
                    </div>
                    {event.creator.bio && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {event.creator.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Registration Actions */}
              <EventDetailActions event={event} />

              {/* Related Events */}
              <RelatedEventsSection 
                currentEventId={event.id} 
                eventType={event.event_type} 
              />
            </div>
          </div>
        </div>

        {/* Recommended Events Section */}
        <RecommendedEventsSection 
          currentEventId={event.id} 
          eventType={event.event_type} 
        />
      </div>
    </Layout>
  );
};

export default EventDetailPage;
