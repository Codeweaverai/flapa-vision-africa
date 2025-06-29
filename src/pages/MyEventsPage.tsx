
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  capacity: number;
  price: number;
  is_free: boolean;
  currency: string;
  event_type: string;
  created_at: string;
  event_bookings: {
    id: string;
    booking_code: string;
    ticket_quantity: number;
    status: string;
  }[];
}

const MyEventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_bookings!inner (
            id,
            booking_code,
            ticket_quantity,
            status
          )
        `)
        .eq('event_bookings.user_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching my events:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800', label: 'Ongoing' };
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800', label: 'Completed' };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
              <p className="text-gray-600">View all events you've registered for</p>
            </div>

            {events.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                  <p className="text-gray-600 mb-6">You haven't registered for any events yet.</p>
                  <Link to="/events">
                    <Button className="bg-gradient-to-r from-orange-500 to-purple-600">
                      Browse Events
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const eventStatus = getEventStatus(event);
                  return (
                    <Card key={event.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                      {event.image_url && (
                        <div className="h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                          <Badge className={eventStatus.color}>
                            {eventStatus.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.start_time), 'PPP p')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.event_bookings.reduce((sum, booking) => sum + booking.ticket_quantity, 0)} ticket(s)
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <Link to={`/events/${event.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Event
                            </Button>
                          </Link>
                          <Link to="/account/orders" className="flex-1">
                            <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-purple-600">
                              <Download className="h-4 w-4 mr-2" />
                              View Tickets
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyEventsPage;
