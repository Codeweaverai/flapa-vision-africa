
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/services/eventService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Users } from 'lucide-react';

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const eventsData = data as Event[];
      setEvents(eventsData);
      
      // Fetch registration counts for each event
      const eventIds = eventsData.map(event => event.id);
      if (eventIds.length > 0) {
        await fetchRegistrationCounts(eventIds);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationCounts = async (eventIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('event_id, id')
        .in('event_id', eventIds);
      
      if (error) throw error;
      
      // Count registrations per event
      const counts: Record<string, number> = {};
      data.forEach(reg => {
        if (counts[reg.event_id]) {
          counts[reg.event_id]++;
        } else {
          counts[reg.event_id] = 1;
        }
      });
      
      setRegistrationCounts(counts);
    } catch (error) {
      console.error('Error fetching registration counts:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Event deleted successfully');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
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
    <AdminLayout title="Events Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">All Events</h2>
          <p className="text-muted-foreground">Manage your events.</p>
        </div>
        <Button asChild>
          <Link to="/admin/events/create">Create New Event</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white">
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground mb-6">Get started by creating your first event</p>
          <Button asChild>
            <Link to="/admin/events/create">Create New Event</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10 rounded-md">
                      <AvatarImage src={event.image_url || ''} alt={event.title} />
                      <AvatarFallback className="rounded-md bg-muted">EV</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(event.start_time)}</TableCell>
                  <TableCell>
                    {event.is_free ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      <span>{event.currency} {event.price}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {registrationCounts[event.id] || 0} / {event.capacity || '∞'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/events/registrations/${event.id}`}>
                        <Users className="h-4 w-4 mr-1" />
                        Registrations
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/events/edit/${event.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEvents;
