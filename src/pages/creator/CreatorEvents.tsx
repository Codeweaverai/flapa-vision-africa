
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Edit, Trash2, Eye, Users, MapPin, Clock, Ticket, UserCheck, Settings, Play } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import PaginationControls from '@/components/creator/PaginationControls';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { getEditableWorkplaceIds } from '@/services/workplaceService';

const EVENTS_PER_PAGE = 6;

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  created_at: string;
  is_published: boolean;
  thumbnail_url: string;
  registration_end_date: string;
  category: string;
  is_free: boolean;
  price: number;
}

const CreatorEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch own events
      const { data: ownEvents, error: ownError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch editable workplace IDs
      const editableWorkplaceIds = await getEditableWorkplaceIds();
      
      let workplaceEvents: Event[] = [];
      if (editableWorkplaceIds.length > 0) {
        const { data: wpEvents, error: wpError } = await supabase
          .from('events')
          .select('*')
          .in('workplace_id', editableWorkplaceIds)
          .order('created_at', { ascending: false });

        if (wpError) throw wpError;
        workplaceEvents = wpEvents || [];
      }

      // Merge and remove duplicates by id
      const allEvents = [...(ownEvents || []), ...workplaceEvents];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );

      setEvents(uniqueEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      await loadEvents();
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleTogglePublish = async (eventId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !isPublished })
        .eq('id', eventId);

      if (error) throw error;
      
      await loadEvents();
      toast.success(`Event ${!isPublished ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <CreatorLayout title="My Events">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="My Events">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-gray-600">Create and manage your events</p>
        </div>
        <Button
          onClick={() => navigate('/creator/events/create')}
          className="bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No events yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'No events match your search criteria.' : 'Create your first event to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/creator/events/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            {paginatedEvents.map((event) => (
              <Card key={event.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {event.thumbnail_url ? (
                    <img
                      src={event.thumbnail_url}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={event.is_published ? "default" : "secondary"}
                      className={event.is_published ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}
                    >
                      {event.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {event.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{event.capacity}</span>
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {event.title}
                  </CardTitle>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(event.start_time), 'MMM dd, yyyy HH:mm')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <div className="flex items-center gap-1">
                      {event.is_free ? (
                        <span className="font-medium text-green-600">Free</span>
                      ) : (
                        <PriceDisplay amount={event.price} originalCurrency="USD" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/edit`)}
                      className="bg-red-500 text-white hover:bg-red-700 hover:text-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="bg-orange-500 text-white hover:bg-orange-700 hover:text-white"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/agenda`)}
                      className="bg-green-500 text-white hover:bg-green-700 hover:text-white"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Agenda
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/speakers`)}
                      className="bg-purple-500 text-white hover:bg-purple-700 hover:text-white"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Speakers
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/creator/events/${event.id}/tickets`)}
                  >
                    <Ticket className="h-4 w-4 mr-1" />
                    Manage Tickets
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/creator/attendee-management`)}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Attendees
                  </Button>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 transition-all"
                    onClick={() => handleTogglePublish(event.id, event.is_published)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {event.is_published ? "Unpublish" : "Publish"}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Event
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </CreatorLayout>
  );
};

export default CreatorEvents;
