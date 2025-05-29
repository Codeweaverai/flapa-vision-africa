
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { fetchEvents, Event } from '@/services/eventService';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMore, setShowMore] = useState<boolean>(false);
  const initialEventsCount = 8; // Show 8 events initially (2 rows of 4)

  useEffect(() => {
    const getEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await fetchEvents();
        // Filter and limit upcoming events to 20 for the homepage
        const upcomingEvents = eventsData
          .filter(event => new Date(event.start_time) > new Date())
          .slice(0, 20);
        setEvents(upcomingEvents);
        setVisibleEvents(upcomingEvents.slice(0, initialEventsCount));
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, []);

  const handleShowMore = () => {
    if (showMore) {
      // If already showing more, collapse back to initial view
      setVisibleEvents(events.slice(0, initialEventsCount));
      setShowMore(false);
    } else {
      // If showing initial view, expand to show all events
      setVisibleEvents(events);
      setShowMore(true);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-lg w-full"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No upcoming events at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleEvents.map((event) => (
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
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1" />
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
                    <div className="flex justify-between items-center mt-auto">
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
            
            {events.length > initialEventsCount && (
              <div className="flex justify-center mt-10">
                <Button 
                  onClick={handleShowMore} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  {showMore ? "Show Less" : "View More Events"}
                  <ArrowRight className={`h-4 w-4 transition-transform ${showMore ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}
          </>
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
