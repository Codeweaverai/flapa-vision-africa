
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { fetchEvents, Event } from '@/services/eventService';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const FeaturedEventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await fetchEvents();
        // Get featured upcoming events (limit to 8)
        const upcomingEvents = eventsData
          .filter(event => new Date(event.start_time) > new Date())
          .slice(0, 8);
        setEvents(upcomingEvents);
      } catch (error) {
        console.error('Error loading featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, []);

  if (loading) {
    return (
      <section className="bg-light-purple py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">
              Featured <span className="text-gradient">Events</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-lg w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="bg-light-purple py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">
              Featured <span className="text-gradient">Events</span>
            </h2>
            <p className="text-lg max-w-3xl mx-auto">
              No upcoming events at the moment. Check back soon for exciting new events!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-light-purple py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-4">
            Featured <span className="text-gradient">Events</span>
          </h2>
          <p className="text-lg max-w-3xl mx-auto">
            Join Mbolela Pule in upcoming events focused on business growth, 
            technology, and African entrepreneurship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-all overflow-hidden h-full">
              {event.image_url && (
                <div className="w-full">
                  <AspectRatio ratio={16/9}>
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover" 
                    />
                  </AspectRatio>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={event.is_free ? "secondary" : "default"}>
                    {event.is_free ? 'Free' : 'Paid'}
                  </Badge>
                  <Badge variant="outline">{event.event_type}</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center mt-2 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center mt-1 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{format(new Date(event.start_time), 'h:mm a')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center mt-1 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 mb-4 text-sm">
                  {event.description}
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center text-sm">
                    {!event.is_free && (
                      <span className="font-semibold">
                        {event.currency} {event.price}
                      </span>
                    )}
                    {event.capacity && (
                      <div className="flex items-center ml-2">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{event.capacity} spots</span>
                      </div>
                    )}
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/events/${event.id}`}>Register</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link to="/events">View All Events</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventsSection;
