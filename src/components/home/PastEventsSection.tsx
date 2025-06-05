
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star, Eye } from 'lucide-react';
import { Event, fetchEvents } from '@/services/eventService';
import { format, parseISO, isBefore } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const PastEventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await fetchEvents();
      // Filter for past events only
      const pastEvents = eventsData
        .filter(event => isBefore(parseISO(event.start_time), new Date()))
        .slice(0, 3); // Show only 3 events
      setEvents(pastEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
              Past Events Highlights
            </h2>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-purple-400 to-orange-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Relive the moments from our successful events and discover the value we've delivered to our community
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-100 to-orange-100 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No past events</h3>
            <p className="text-gray-600 mb-6">Our event history will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2"
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
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 via-orange-500 to-pink-500 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-white opacity-80" />
                      </div>
                    </AspectRatio>
                  )}
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge 
                      variant="outline" 
                      className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 font-medium"
                    >
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-gray-600 to-gray-800 text-white border-0 font-semibold">
                      Completed
                    </Badge>
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Success Indicator */}
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <Star className="h-4 w-4 fill-current" />
                      <span>Success</span>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-orange-600 group-hover:bg-clip-text transition-all duration-300">
                    {event.title}
                  </CardTitle>
                  <p className="text-gray-600 line-clamp-3 leading-relaxed">
                    {event.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-gradient-to-r from-purple-100 to-orange-100">
                        <Calendar className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="font-medium">{format(parseISO(event.start_time), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-gradient-to-r from-purple-100 to-orange-100">
                        <Clock className="h-3 w-3 text-orange-600" />
                      </div>
                      <span>{format(parseISO(event.start_time), 'h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-gradient-to-r from-purple-100 to-orange-100">
                        <MapPin className="h-3 w-3 text-red-600" />
                      </div>
                      <span className="line-clamp-1">
                        {event.online_meeting_link ? 'Online Event' : (event.location || 'Location TBA')}
                      </span>
                    </div>
                    
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-gradient-to-r from-purple-100 to-orange-100">
                          <Users className="h-3 w-3 text-green-600" />
                        </div>
                        <span>Max {event.capacity} attendees</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    asChild 
                    variant="outline"
                    className="w-full border-2 border-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 hover:border-purple-300 text-gray-700 hover:text-purple-700 rounded-xl h-12 font-semibold text-base group"
                  >
                    <Link to={`/event/${event.id}`} className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Event Details
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
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
            className="bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
          >
            <Link to="/events" className="flex items-center gap-2">
              View All Past Events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PastEventsSection;
