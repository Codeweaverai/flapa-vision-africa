
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PaginationControls from './PaginationControls';
import { Calendar, MapPin, Users, Star, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  event_type: string;
  capacity?: number;
  created_at: string;
  bookings_count?: number;
  avg_rating?: number;
  total_revenue?: number;
}

interface CreatorEventPaginationProps {
  onEditEvent?: (eventId: string) => void;
  onViewRegistrations?: (eventId: string) => void;
  onManageTickets?: (eventId: string) => void;
}

const EVENTS_PER_PAGE = 8; // 2 rows with 4 cards each

const CreatorEventPagination: React.FC<CreatorEventPaginationProps> = ({
  onEditEvent,
  onViewRegistrations,
  onManageTickets
}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch additional stats for each event
      const eventsWithStats = await Promise.all(
        eventsData.map(async (event) => {
          // Get bookings count
          const { data: bookings } = await supabase
            .from('event_bookings')
            .select('id, payment_amount')
            .eq('event_id', event.id)
            .eq('payment_status', 'completed');

          // Get average rating
          const { data: reviews } = await supabase
            .from('event_reviews')
            .select('rating')
            .eq('event_id', event.id);

          const avgRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

          // Calculate total revenue
          const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.payment_amount || 0), 0) || 0;

          return {
            ...event,
            bookings_count: bookings?.length || 0,
            avg_rating: avgRating,
            total_revenue: totalRevenue
          };
        })
      );

      setEvents(eventsWithStats);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const currentEvents = events.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isUpcoming = (date: string) => new Date(date) > new Date();
  const isPast = (date: string) => new Date(date) < new Date();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
        <p className="text-gray-600 mb-6">Create your first event to start hosting amazing experiences.</p>
        <Button asChild>
          <Link to="/creator/events/create">
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-600" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <Badge
                  variant={isUpcoming(event.start_time) ? "default" : "secondary"}
                  className={isUpcoming(event.start_time) ? "bg-green-500" : isPast(event.end_time) ? "bg-gray-500" : "bg-blue-500"}
                >
                  {isUpcoming(event.start_time) ? 'Upcoming' : isPast(event.end_time) ? 'Past' : 'Live'}
                </Badge>
              </div>
              
              <div className="absolute top-2 left-2">
                <Badge className="bg-orange-500 text-white">
                  {event.event_type}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">
                {event.title}
              </CardTitle>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(event.start_time)}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{event.bookings_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                  <span>{event.avg_rating ? event.avg_rating.toFixed(1) : '0.0'}</span>
                </div>
                <div className="flex items-center text-green-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">
                    <PriceDisplay amount={event.total_revenue || 0} originalCurrency="USD" />
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEditEvent?.(event.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onViewRegistrations?.(event.id)}
                  >
                    Attendees
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="default"
                  className="w-full"
                  onClick={() => onManageTickets?.(event.id)}
                >
                  Manage Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CreatorEventPagination;
