
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Clock, Search, Filter, Star, CalendarDays, History } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';

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
  creator_name?: string;
}

const ExploreEventsPage = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const eventTypes = ['online', 'offline', 'hybrid'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      const eventsWithCreators = await Promise.all(
        (eventsData || []).map(async (event) => {
          if (event.creator_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', event.creator_id)
              .single();
            
            return {
              ...event,
              creator_name: profile?.full_name || 'Unknown Creator'
            };
          }
          return {
            ...event,
            creator_name: 'Unknown Creator'
          };
        })
      );
      
      setAllEvents(eventsWithCreators);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = (tab: string) => {
    const now = new Date();
    let filteredByTime = allEvents;
    
    if (tab === 'upcoming') {
      filteredByTime = allEvents.filter(event => new Date(event.start_time) > now);
    } else if (tab === 'past') {
      filteredByTime = allEvents.filter(event => new Date(event.end_time) < now);
    }
    
    return filteredByTime.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || event.event_type === selectedType;
      
      return matchesSearch && matchesType;
    });
  };

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

  const renderEventGrid = (events: Event[]) => {
    if (events.length === 0) {
      return (
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
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event) => (
          <Card 
            key={event.id} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white/95 backdrop-blur-sm border border-orange-200 hover:border-purple-300"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <div className="relative h-48 overflow-hidden">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-200 to-purple-200 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-orange-600" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <Badge 
                className={`absolute top-3 left-3 ${getEventTypeColor(event.event_type)} shadow-sm`}
              >
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </Badge>
              
              <Badge 
                className={`absolute top-3 right-3 shadow-sm ${
                  event.is_free 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                }`}
              >
                {event.is_free ? 'Free' : `${event.currency} ${event.price}`}
              </Badge>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {event.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="text-xs">
                    {formatEventTime(event.start_time, event.end_time)}
                  </span>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-xs line-clamp-1">
                    {event.location || 'Online Event'}
                  </span>
                </div>

                {event.capacity && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-orange-500" />
                    <span className="text-xs">
                      Up to {event.capacity} attendees
                    </span>
                  </div>
                )}

                {event.creator_name && (
                  <div className="flex items-center pt-2 border-t border-orange-100">
                    <span className="text-xs text-gray-500">
                      by {event.creator_name}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/event-detail/${event.id}`);
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Gradient */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              <h1 className="text-4xl font-bold mb-4">Explore Events</h1>
            </div>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Discover amazing events happening around you. From workshops to conferences, 
              find the perfect event to expand your knowledge and network.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-purple-400"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="border-orange-200 focus:border-purple-400">
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

              <Button 
                variant="outline" 
                className="w-full border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Event Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm border border-orange-200">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                All Events
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Past Events
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {renderEventGrid(getFilteredEvents('all'))}
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-6">
              {renderEventGrid(getFilteredEvents('upcoming'))}
            </TabsContent>
            
            <TabsContent value="past" className="mt-6">
              {renderEventGrid(getFilteredEvents('past'))}
            </TabsContent>
          </Tabs>

          {/* Load More Button */}
          {getFilteredEvents(activeTab).length > 0 && (
            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 hover:from-orange-600 hover:to-purple-700 shadow-lg"
              >
                Load More Events
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreEventsPage;
