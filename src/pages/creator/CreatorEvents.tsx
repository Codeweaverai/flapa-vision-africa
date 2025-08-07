import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, MapPin, Users, Edit, Trash2, Eye, UserCheck, CalendarIcon, Ticket, Percent, Play } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/services/eventService';
import PaginationControls from '@/components/creator/PaginationControls';

const EVENTS_PER_PAGE = 6;

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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;

      await loadEvents();
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleTogglePublish = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      await loadEvents();
      toast.success(`Event ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return null;
    }
  };

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
        <p className="text-gray-600">Manage your events and track Attendees</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {paginatedEvents.map((event) => (
              <Card key={event.id} className="relative overflow-hidden">
                {event.image_url && (
                  <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }} />
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                        {getStatusBadge(getEventStatus(event))}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(parseISO(event.start_time), 'MMM d, yyyy')}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      {event.capacity && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {event.capacity} capacity
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={event.is_free ? 'secondary' : 'default'}>
                      {event.is_free ? 'Free' : `$${event.price}`}
                    </Badge>
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                       className="bg-red-600 text-white hover:bg-red-700 transition-colors duration-300 ease-in-out flex items-center"
                      size="sm" onClick={() => navigate(`/creator/events/${event.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                       className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 ease-in-out flex items-center"
                      size="sm" onClick={() => navigate(`/event-detail/${event.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                       className="bg-orange-600 text-white hover:bg-orange-700 transition-colors duration-300 ease-in-out flex items-center" size="sm" 
                      onClick={() => navigate(`/creator/attendees`)}
                      >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Attendees
                    </Button>
                    <Button 
                     className="bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300 ease-in-out flex items-center" size="sm"
                      onClick={() => navigate(`/creator/events/${event.id}/agenda`)}
                      >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Agenda
                    </Button>
                       <Button
                    className="bg-green-600 text-white hover:bg-green-700 transition-colors duration-300 ease-in-out flex items-center"
                    size="sm"
                    onClick={() => navigate(`/creator/events/${event.id}/speakers`)}
                    >
                    <Users className="h-4 w-4 mr-1" />
                    Speakers
                    </Button>
 
                    <Button 
                       className="bg-pink-600 text-white hover:bg-pink-700 transition-colors duration-300 ease-in-out flex items-center"
                      size="sm" onClick={() => navigate(`/creator/events/${event.id}/tickets`)}>
                      <Ticket className="h-4 w-4 mr-1" />
                      Tickets
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigate(`/creator/promo-codes?item_type=event&item_id=${event.id}`)}
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Promo Codes
                  </Button>

                  {/* ✅ Publish / Unpublish Button */}
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
                    size="sm"
                    onClick={() => handleTogglePublish(event.id, event.is_published)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {event.is_published ? 'Unpublish' : 'Publish'}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
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

