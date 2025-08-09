
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star } from 'lucide-react';
import { Event, fetchEvents } from '@/services/eventService';
import { format, parseISO, isAfter } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PriceDisplay from '@/components/currency/PriceDisplay';

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await fetchEvents();
      // Filter for upcoming events only
      const upcomingEvents = eventsData
        .filter(event => isAfter(parseISO(event.start_time), new Date()))
        .slice(0, 15); // Show 15 events for 3 rows of 5
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Upcoming Events
            </h2>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join our exclusive events, workshops, and webinars designed to accelerate your professional growth
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(15)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-3">
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No upcoming events</h3>
            <p className="text-gray-600 mb-6">Check back soon for new events and workshops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-white hover:-translate-y-1"
              >
                <div className="relative overflow-hidden">
                  {event.image_url ? (
                    <AspectRatio ratio={16/9}>
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </AspectRatio>
                  ) : (
                    <AspectRatio ratio={16/9}>
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-white opacity-80" />
                      </div>
                    </AspectRatio>
                  )}
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant="outline" 
                      className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 font-medium text-xs"
                    >
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <Badge 
                      className={`${
                        event.is_free 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-r from-orange-500 to-purple-600'
                      } text-white border-0 font-semibold text-xs`}
                    >
                      {event.is_free ? "Free" : (
                        <PriceDisplay 
                          amount={event.price} 
                          originalCurrency={event.currency as any || 'USD'} 
                        />
                      )}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2 p-3">
                  <CardTitle className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {event.title}
                  </CardTitle>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0 p-3">
                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-purple-600" />
                      <span className="font-medium">{format(parseISO(event.start_time), 'MMM d')}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-orange-600" />
                      <span>{format(parseISO(event.start_time), 'h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-600" />
                      <span className="line-clamp-1 text-xs">
                        {event.online_meeting_link ? 'Online' : (event.location || 'TBA')}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 rounded-lg h-8 font-semibold text-xs group"
                  >
                    <Link to={`/events/${event.id}`} className="flex items-center justify-center gap-1">
                      View Details
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
          >
            <Link to="/events" className="flex items-center gap-2">
              Explore All Events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
