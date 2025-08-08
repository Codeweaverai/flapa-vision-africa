
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Clock, Users, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { format } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url?: string;
  price: number;
  currency: string;
  max_attendees: number;
  category: string;
  creator_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  } | null;
  event_registrations?: Array<{ id: string }>;
}

const ExploreEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          ),
          event_registrations (id)
        `)
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Transform data to ensure proper structure
      const transformedData = data?.map(event => ({
        ...event,
        profiles: event.profiles || null,
        event_registrations: event.event_registrations || []
      })) || [];

      setEvents(transformedData);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    const matchesPrice = priceFilter === 'all' ||
                        (priceFilter === 'free' && event.price === 0) ||
                        (priceFilter === 'paid' && event.price > 0);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const categories = [...new Set(events.map(event => event.category))];

  if (loading) {
    return (
      <Layout>
        <div className="section-container py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Events</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing events, workshops, and conferences happening in your area and online.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search events, creators, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free Events</SelectItem>
              <SelectItem value="paid">Paid Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {event.image_url && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/90">
                      {event.category}
                    </Badge>
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {event.description}
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(event.event_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {event.start_time} - {event.end_time}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.event_registrations?.length || 0} / {event.max_attendees} registered
                    </span>
                  </div>

                  {event.profiles?.full_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">by {event.profiles.full_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {event.price === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <PriceDisplay amount={event.price} currency={event.currency} />
                    )}
                  </div>
                  
                  <Button asChild>
                    <Link to={`/events/${event.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Calendar className="h-16 w-16 mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria to find more events.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExploreEventsPage;
