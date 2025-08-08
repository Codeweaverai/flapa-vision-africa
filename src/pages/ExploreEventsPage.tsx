
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  event_type: string;
  capacity?: number;
  creator_id: string;
  is_published: boolean;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const ExploreEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
          profiles:creator_id (
            full_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      // Transform data to match expected interface
      const transformedEvents: Event[] = (data || []).map(event => {
        const profiles = event.profiles;
        
        return {
          ...event,
          profiles: profiles && 
                   typeof profiles === 'object' && 
                   profiles !== null &&
                   'full_name' in profiles ? {
            full_name: (profiles as any).full_name || 'Unknown Creator',
            avatar_url: (profiles as any).avatar_url
          } : {
            full_name: 'Unknown Creator',
            avatar_url: undefined
          }
        };
      });

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.event_type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(events.map(event => event.event_type))];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Explore Events</h1>
        <p className="text-lg text-muted-foreground">
          Discover amazing events happening near you
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-2xl font-semibold mb-4">No events found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Check back later for upcoming events'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {event.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="secondary">
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </Badge>
                  <PriceDisplay 
                    amount={event.price || 0} 
                    originalCurrency={(event.currency as any) || 'USD'} 
                    className="font-semibold"
                  />
                </div>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(event.start_time), 'PPP p')}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                  
                  {event.capacity && (
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {event.capacity} attendees max
                    </div>
                  )}
                </div>

                {event.profiles && (
                  <div className="mt-4 flex items-center">
                    {event.profiles.avatar_url && (
                      <img
                        src={event.profiles.avatar_url}
                        alt={event.profiles.full_name || 'Unknown Creator'}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    <span className="text-sm text-muted-foreground">
                      By {event.profiles?.full_name || 'Unknown Creator'}
                    </span>
                  </div>
                )}

                <div className="mt-4">
                  <Button asChild className="w-full">
                    <Link to={`/events/${event.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreEventsPage;
