
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/services/eventService';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Edit, Trash2, Plus, CalendarCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data);
          if (data) {
            fetchEvents();
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Cast the event_type to ensure it meets the type constraints
      const typedEvents = data?.map(event => ({
        ...event,
        event_type: event.event_type as 'webinar' | 'in-person' | 'mentorship'
      })) as Event[];
      
      setEvents(typedEvents || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const handleDelete = async (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete);
      
      if (error) {
        throw error;
      }
      
      setEvents(events.filter(event => event.id !== eventToDelete));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-center">
            <p className="text-lg">Loading events...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isAdmin === false) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have admin permissions to access this page.
          </AlertDescription>
        </Alert>
        <p className="text-center my-8">
          Please contact the site administrator if you believe this is an error.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="events">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Events Management</h2>
          <Button onClick={() => navigate('/admin/events/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground mt-2">
              Start by creating your first event.
            </p>
            <Button onClick={() => navigate('/admin/events/create')} className="mt-4">
              Create Event
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.start_time), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={new Date(event.start_time) > new Date() ? 'default' : 'secondary'}>
                        {new Date(event.start_time) > new Date() ? 'Upcoming' : 'Past'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event
                and all related registrations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
