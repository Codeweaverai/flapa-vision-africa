import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Search, MapPin, Users, Video, Filter, ArrowRight, Star } from 'lucide-react';
import { Event, fetchEvents, VALID_EVENT_TYPES } from '@/services/eventService';
import { format, parseISO, isAfter } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PriceDisplay from '@/components/currency/PriceDisplay';

const ExploreEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedType, priceFilter, timeFilter, sortBy]);

  const loadEvents = async () => {
    try {
      const eventsData = await fetchEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedType);
    }

    // Price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(event => event.is_free);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(event => !event.is_free);
    }

    // Time filter
    const now = new Date();
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(event => isAfter(parseISO(event.start_time), now));
    } else if (timeFilter === 'past') {
      filtered = filtered.filter(event => !isAfter(parseISO(event.start_time), now));
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          const priceA = a.is_free ? 0 : (a.price || 0);
          const priceB = b.is_free ? 0 : (b.price || 0);
          return priceA - priceB;
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setPriceFilter('all');
    setTimeFilter('all');
    setSortBy('date');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Explore Events
              </h1>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover amazing workshops, webinars, and conferences to accelerate your professional growth and connect with industry experts.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Search */}
              <div className="lg:col-span-5 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search events, topics, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 border-gray-100 focus:border-orange-300 rounded-xl"
                />
              </div>
              
              {/* Filters */}
              <div className="lg:col-span-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-12 border-2 border-gray-100 rounded-xl">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {VALID_EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="h-12 border-2 border-gray-100 rounded-xl">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free">Free Events</SelectItem>
                    <SelectItem value="paid">Paid Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="h-12 border-2 border-gray-100 rounded-xl">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-1">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="h-12 w-full border-2 border-gray-100 rounded-xl hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Sort and Results */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <span className="text-gray-600 font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 border-gray-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-gray-600">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    Loading events...
                  </div>
                ) : (
                  <span className="font-medium">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms to find more events.</p>
              <Button onClick={clearFilters} className="bg-gradient-to-r from-orange-500 to-purple-600">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden">
                    {event.image_url ? (
                      <AspectRatio ratio={16/9}>
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </AspectRatio>
                    ) : (
                      <AspectRatio ratio={16/9}>
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                          <Calendar className="h-16 w-16 text-white opacity-80" />
                        </div>
                      </AspectRatio>
                    )}
                    
                    {/* Overlay Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge 
                        variant="outline" 
                        className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 font-medium"
                      >
                        {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="absolute top-4 right-4">
                      <Badge 
                        className={`${
                          event.is_free 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-r from-orange-500 to-purple-600'
                        } text-white border-0 font-semibold`}
                      >
                        {event.is_free ? "Free" : <PriceDisplay amount={event.price || 0} originalCurrency="USD" />}
                      </Badge>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                      {event.title}
                    </CardTitle>
                    <p className="text-gray-600 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-sm text-gray-600 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                          <Calendar className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="font-medium">{format(parseISO(event.start_time), 'MMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                          <Clock className="h-3 w-3 text-orange-600" />
                        </div>
                        <span>{format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                          {event.online_meeting_link ? (
                            <Video className="h-3 w-3 text-blue-600" />
                          ) : (
                            <MapPin className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <span className="line-clamp-1">
                          {event.online_meeting_link ? 'Online Event' : (event.location || 'Location TBA')}
                        </span>
                      </div>
                      
                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                            <Users className="h-3 w-3 text-green-600" />
                          </div>
                          <span>Max {event.capacity} attendees</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      asChild 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 rounded-xl h-12 font-semibold text-base group"
                    >
                      <Link to={`/event/${event.id}`} className="flex items-center justify-center gap-2">
                        View Event Details
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Featured Events CTA */}
          {!loading && filteredEvents.length > 0 && (
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
                <p className="text-lg opacity-90 mb-6">
                  Join our community to get notified about new events and exclusive opportunities.
                </p>
                <Button 
                  asChild
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8"
                >
                  <Link to="/community">Join Community</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default ExploreEventsPage;
