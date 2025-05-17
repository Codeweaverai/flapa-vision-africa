
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { fetchEvents, Event } from '@/services/eventService';
import { Calendar, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await fetchEvents();
        // Only show the next 2 upcoming events
        const upcomingEvents = eventsData
          .filter(event => new Date(event.start_time) > new Date())
          .slice(0, 2);
        setEvents(upcomingEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, []);

  return (
    <section className="bg-light-purple py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-4">
            Upcoming <span className="text-gradient">Events</span>
          </h2>
          <p className="text-lg max-w-3xl mx-auto">
            Connect with Mbolela Pule through interactive webinars, mentorship sessions, 
            and in-person events focused on business growth, technology, and African entrepreneurship.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-slate-200 rounded-lg w-full max-w-3xl"></div>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {events.map((event) => (
              <Card key={event.id} className="bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-all overflow-hidden">
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                          <Clock className="h-4 w-4 ml-3 mr-1" />
                          <span>{format(new Date(event.start_time), 'h:mm a')}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge>{event.event_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 mb-4">
                    {event.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span className="text-sm">{event.is_free ? 'Free' : `${event.price} ${event.currency || 'ZMW'}`}</span>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/events`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No upcoming events at the moment.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link to="/events">Browse All Events</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
