
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Star, PlayCircle } from 'lucide-react';
import { fetchPastEvents, fetchEventAttendeeCount } from '@/services/eventService';
import type { Event } from '@/services/eventService';

interface PastEvent extends Event {
  attendees?: number;
  rating?: number;
  category?: string;
  featured?: boolean;
}

const PastEventsSection = () => {
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPastEvents = async () => {
      try {
        setLoading(true);
        const events = await fetchPastEvents(10);
        
        // Fetch attendee counts for each event
        const eventsWithAttendees = await Promise.all(
          events.map(async (event) => {
            const attendees = await fetchEventAttendeeCount(event.id);
            return {
              ...event,
              attendees,
              rating: parseFloat((Math.random() * 1 + 4).toFixed(1)), // Mock rating for now
              category: event.event_type || 'General',
              featured: Math.random() > 0.7 // Random featured events
            };
          })
        );
        
        setPastEvents(eventsWithAttendees);
      } catch (error) {
        console.error('Error loading past events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPastEvents();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Past Events Highlights
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Relive the moments and insights from our previous events. Watch recordings and discover what you missed.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (pastEvents.length === 0) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Past Events Highlights
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No past events available at the moment. Check back soon for exciting content!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            Past Events Highlights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Relive the moments and insights from our previous events. Watch recordings and discover what you missed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {pastEvents.map((event) => (
            <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 border-purple-100 overflow-hidden">
              <div className="relative">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-r from-purple-400 to-orange-400 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">No Image</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-purple-600 border-purple-200">
                    {event.category}
                  </Badge>
                </div>
                {event.featured && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="sm" className="bg-white/90 text-purple-600 hover:bg-white">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                  </div>
                  {event.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{event.rating}</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-purple-600 transition-colors">
                  {event.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {event.description?.substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location || 'Virtual Event'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees || 0} attended</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50" asChild>
                    <Link to={`/events/${event.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                    Watch Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50" asChild>
            <Link to="/events">
              View All Past Events
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PastEventsSection;
