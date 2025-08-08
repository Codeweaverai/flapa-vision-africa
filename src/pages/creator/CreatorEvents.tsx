import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Copy, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { CoursePublishButton } from '@/components/creator/CoursePublishButton';

interface Event {
  id: string;
  title: string;
  description: string;
  location?: string;
  start_time: string;
  end_time: string;
  price: number;
  is_free: boolean;
  capacity?: number;
  event_type: string;
  image_url?: string;
  creator_id: string;
  created_at: string;
  updated_at?: string;
  registrations_count?: number;
}

const CreatorEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateEvent = async (event: Event) => {
    if (!user) return;

    try {
      const duplicatedEvent = {
        title: `${event.title} (Copy)`,
        description: event.description,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        price: event.price,
        is_free: event.is_free,
        capacity: event.capacity,
        event_type: event.event_type,
        image_url: event.image_url,
        creator_id: user.id
        // Remove is_published as it doesn't exist in the events table
      };

      const { error } = await supabase
        .from('events')
        .insert([duplicatedEvent]);

      if (error) throw error;

      toast.success('Event duplicated successfully');
      await loadEvents();
    } catch (error) {
      console.error('Error duplicating event:', error);
      toast.error('Failed to duplicate event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event deleted successfully');
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  return (
    <CreatorLayout title="My Events">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Events</h2>
        <Button onClick={() => navigate('/creator/events/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No events yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first event
            </p>
            <Button onClick={() => navigate('/creator/events/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateEvent(event)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <div className="p-6">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {event.description}
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={event.start_time > new Date().toISOString() ? "default" : "secondary"}
                    >
                      {event.start_time > new Date().toISOString() ? "Upcoming" : "Past"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {event.registrations_count || 0} registered
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/tickets`)}
                    >
                      Tickets
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/speakers`)}
                    >
                      Speakers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/agenda`)}
                    >
                      Agenda
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </CreatorLayout>
  );
};

export default CreatorEvents;
