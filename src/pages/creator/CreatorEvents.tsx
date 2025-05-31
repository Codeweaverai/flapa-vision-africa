
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Users, Calendar, Plus, UserPlus, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Event, fetchCreatorEvents, deleteEvent } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isPast } from 'date-fns';

const CreatorEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const eventsData = await fetchCreatorEvents(user.id);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const success = await deleteEvent(id);
      if (success) {
        setEvents(events.filter(event => event.id !== id));
        toast({
          title: "Event Deleted",
          description: "Event has been deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'webinar':
        return 'Online Webinar';
      case 'in-person':
        return 'In-Person Event';
      case 'mentorship':
        return 'Mentorship Session';
      default:
        return type;
    }
  };

  return (
    <CreatorLayout title="My Events">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">Manage your events and workshops</p>
        </div>
        <Button asChild>
          <Link to="/creator/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-6">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mb-2">No events yet</CardTitle>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating your first event
                  </p>
                  <Button asChild>
                    <Link to="/creator/events/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Event
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            events.map((event) => {
              const isPastEvent = isPast(new Date(event.end_time || event.start_time));
              
              return (
                <Card key={event.id} className={isPastEvent ? 'opacity-70' : ''}>
                  <div className="relative">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={isPastEvent ? "outline" : "default"}
                      >
                        {isPastEvent ? "Past Event" : "Upcoming"}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline">
                        {getEventTypeLabel(event.event_type)}
                      </Badge>
                      <Badge variant={event.is_free ? "secondary" : "outline"}>
                        {event.is_free ? "Free" : `${event.currency?.toUpperCase()} ${event.price}`}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(parseISO(event.start_time), 'MMM d, yyyy h:mm a')}
                    </div>
                  </CardHeader>
                  
                  <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/creator/events/edit/${event.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/creator/events/${event.id}/speakers`}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Speakers
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/creator/events/${event.id}/agenda`}>
                        <Clock className="h-4 w-4 mr-1" />
                        Agenda
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/creator/events/eventregistrations/${event.id}`}>
                        <Users className="h-4 w-4 mr-1" />
                        Registrations
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/events/${event.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}
    </CreatorLayout>
  );
};

export default CreatorEvents;
