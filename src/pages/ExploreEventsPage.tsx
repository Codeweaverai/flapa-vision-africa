
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Search, Filter, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  price: number;
  is_free: boolean;
  capacity: number;
  image_url: string;
  currency: string;
  creator_id: string;
  profiles?: {
    full_name: string;
  } | null;
}

const ExploreEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const eventCategories = [
    'Technology',
    'Business',
    'Design',
    'Marketing',
    'Health',
    'Education',
    'Entertainment',
    'Sports',
    'Other'
  ];

  const eventTypes = ['online', 'offline', 'hybrid'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our Event interface
      const transformedEvents: Event[] = (data || []).map(event => ({
        ...event,
        profiles: event.profiles && typeof event.profiles === 'object' && 'full_name' in event.profiles 
          ? { full_name: event.profiles.full_name }
          : null
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || event.event_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start.toDateString() === end.toDateString()) {
      return `${format(start, 'MMM dd, yyyy')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else {
      return `${format(start, 'MMM dd, h:mm a')} - ${format(end, 'MMM dd, h:mm a')}`;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'online':
        return 'bg-blue-100 text-blue-800';
      case 'offline':
        return 'bg-green-100 text-green-800';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Events</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing events happening around you. From workshops to conferences, 
            find the perfect event to expand your knowledge and network.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Events Grid - 4 per row */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search criteria.' 
                : 'Check back later for upcoming events.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <Card 
                key={event.id} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-blue-500" />
                    </div>
                  )}
                  
                  {/* Event Type Badge */}
                  <Badge 
                    className={`absolute top-3 left-3 ${getEventTypeColor(event.event_type)}`}
                  >
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </Badge>
                  
                  {/* Price Badge */}
                  <Badge 
                    className={`absolute top-3 right-3 ${
                      event.is_free ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {event.is_free ? 'Free' : `${event.currency} ${event.price}`}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600">
                    {/* Date and Time */}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-xs">
                        {formatEventTime(event.start_time, event.end_time)}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-xs line-clamp-1">
                        {event.location || 'Online Event'}
                      </span>
                    </div>

                    {/* Capacity */}
                    {event.capacity && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-xs">
                          Up to {event.capacity} attendees
                        </span>
                      </div>
                    )}

                    {/* Creator */}
                    {event.profiles?.full_name && (
                      <div className="flex items-center pt-2 border-t">
                        <span className="text-xs text-gray-500">
                          by {event.profiles.full_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-white transition-colors"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredEvents.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreEventsPage;
