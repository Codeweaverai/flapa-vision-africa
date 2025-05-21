
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Search, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  is_free: boolean;
  price?: number;
  currency?: string;
  image_url?: string;
  registrationCount: number;
}

const ExploreEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventsPerPage = 9;

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedType, dateFilter, searchTerm]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Base query
      let query = supabase
        .from('events')
        .select(`
          *,
          registrations:registrations(count)
        `);
        
      // Apply filters
      if (selectedType !== 'all') {
        query = query.eq('event_type', selectedType);
      }
      
      // Date filter
      const now = new Date();
      if (dateFilter === 'upcoming') {
        query = query.gt('start_time', now.toISOString());
      } else if (dateFilter === 'past') {
        query = query.lt('start_time', now.toISOString());
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }
      
      // Calculate pagination
      const from = (currentPage - 1) * eventsPerPage;
      const to = from + eventsPerPage - 1;
      
      // Get counts for pagination
      const { count } = await query.count();
      
      // Apply pagination
      const { data, error } = await query
        .order('start_time', { ascending: true })
        .range(from, to);

      if (error) throw error;
      
      // Calculate total pages
      setTotalPages(Math.ceil((count || 0) / eventsPerPage));

      // Format data
      const formattedEvents = data.map(event => ({
        ...event,
        registrationCount: event?.registrations?.length || 0
      }));
      
      setEvents(formattedEvents);
      
      // Fetch unique event types
      if (eventTypes.length === 0) {
        const { data: typesData } = await supabase
          .from('events')
          .select('event_type')
          .not('event_type', 'is', null);
        
        if (typesData) {
          const uniqueTypes = [...new Set(typesData.map(item => item.event_type))];
          setEventTypes(uniqueTypes);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const formatEventDate = (start: string, end?: string) => {
    try {
      const startDate = new Date(start);
      if (!end) return format(startDate, 'MMM d, yyyy • h:mm a');
      
      const endDate = new Date(end);
      // Same day
      if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        return `${format(startDate, 'MMM d, yyyy')} • ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
      }
      
      // Different days
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } catch (e) {
      return 'Date unavailable';
    }
  };
  
  const isUpcoming = (date: string) => {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate > now;
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Events</h1>
          <p className="text-xl text-muted-foreground">
            Discover upcoming events, workshops, and webinars
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Event Type</h3>
                  <Select 
                    value={selectedType} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {eventTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="mb-2 text-sm font-medium">Date</h3>
                  <Select 
                    value={dateFilter} 
                    onValueChange={handleDateFilterChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="upcoming">Upcoming Events</SelectItem>
                      <SelectItem value="past">Past Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video w-full">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))
              ) : events.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No events found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-video w-full bg-muted relative">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                      )}
                      {isUpcoming(event.start_time) && (
                        <Badge className="absolute top-2 right-2">Upcoming</Badge>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatEventDate(event.start_time, event.end_time)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {event.registrationCount} {event.capacity ? `/ ${event.capacity}` : ''}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          {event.is_free ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            <span className="font-medium">{event.currency} {event.price}</span>
                          )}
                        </div>
                        <Button asChild>
                          <Link to={`/events/${event.id}`}>View Event</Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
            
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExploreEventsPage;
