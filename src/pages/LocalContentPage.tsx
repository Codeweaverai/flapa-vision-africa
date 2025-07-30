
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Star, Search, Filter, ChevronDown, Globe } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/utils';
import Layout from '@/components/layout/Layout';

interface LocalContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  creator_name: string;
  location: string;
  image_url?: string;
  created_at: string;
  rating: number;
  total_reviews: number;
  price?: number;
  is_free: boolean;
}

const CONTENT_PER_PAGE = 6;

const LocalContentPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<LocalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [displayCount, setDisplayCount] = useState(CONTENT_PER_PAGE);

  useEffect(() => {
    fetchLocalContent();
  }, []);

  const fetchLocalContent = async () => {
    try {
      // For demo purposes, we'll show local events and courses
      // In a real implementation, this would be filtered by user's location
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, description, location, image_url, created_at, event_type, creator_id, is_free, price')
        .not('location', 'is', null)
        .order('created_at', { ascending: false });

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, description, created_at, creator_id, is_free, price, thumbnail_url, category')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Get creator profiles
      const allItems = [...(eventsData || []), ...(coursesData || [])];
      const creatorIds = [...new Set(allItems.map(item => item.creator_id).filter(Boolean))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', creatorIds);

      // Transform events
      const transformedEvents: LocalContent[] = (eventsData || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        content_type: 'event',
        creator_name: profiles?.find(p => p.id === event.creator_id)?.full_name || 'Unknown Creator',
        location: event.location || 'Online',
        image_url: event.image_url,
        created_at: event.created_at,
        rating: 4.5 + Math.random() * 0.5, // Demo ratings
        total_reviews: Math.floor(Math.random() * 50) + 5,
        price: event.price || 0,
        is_free: event.is_free || false
      }));

      // Transform courses as local content
      const transformedCourses: LocalContent[] = (coursesData || []).map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        content_type: 'course',
        creator_name: profiles?.find(p => p.id === course.creator_id)?.full_name || 'Unknown Creator',
        location: 'Online', // Courses are typically online
        image_url: course.thumbnail_url,
        created_at: course.created_at,
        rating: 4.0 + Math.random() * 1.0, // Demo ratings
        total_reviews: Math.floor(Math.random() * 100) + 10,
        price: course.price || 0,
        is_free: course.is_free || false
      }));

      setContent([...transformedEvents, ...transformedCourses]);
    } catch (error) {
      console.error('Error fetching local content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.content_type === filterType;
    const matchesLocation = filterLocation === 'all' || item.location.toLowerCase().includes(filterLocation.toLowerCase());
    return matchesSearch && matchesType && matchesLocation;
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'price_low':
        return (a.price || 0) - (b.price || 0);
      case 'price_high':
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  const displayedContent = sortedContent.slice(0, displayCount);
  const hasMore = displayCount < sortedContent.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + CONTENT_PER_PAGE);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-orange-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-orange-200">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Local Content
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Discover amazing local events, courses, and content from creators in your area. Connect with your community and learn from local experts.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-12">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search local content, creators, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white/80 border-gray-200 rounded-xl focus:bg-white transition-colors"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="min-w-[160px]">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Content Type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="event">Events</SelectItem>
                      <SelectItem value="course">Courses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[160px]">
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Location" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="nairobi">Nairobi</SelectItem>
                      <SelectItem value="kampala">Kampala</SelectItem>
                      <SelectItem value="dar">Dar es Salaam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="min-w-[160px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-14 bg-white/80 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {sortedContent.length} Local Items Found
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Showing {Math.min(displayCount, sortedContent.length)} of {sortedContent.length} results
                  </p>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <Globe className="h-5 w-5" />
                  <span className="font-semibold">Your Local Area</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {sortedContent.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30">
              <div className="mb-6">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Local Content Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  We couldn't find any local content matching your criteria. Try adjusting your search or filters.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterLocation('all');
                }}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {displayedContent.map((item) => (
                  <Card key={item.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:scale-[1.02]">
                    <div onClick={() => navigate(item.content_type === 'event' ? `/events/${item.id}` : `/learning/course-detail/${item.id}`)}>
                      {/* Content Image */}
                      <div className="relative h-56 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-purple-300 flex items-center justify-center">
                            {item.content_type === 'event' ? (
                              <Calendar className="h-12 w-12 text-white" />
                            ) : (
                              <Globe className="h-12 w-12 text-white" />
                            )}
                          </div>
                        )}
                        
                        {/* Content Type Badge */}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm">
                            {item.content_type === 'event' ? 'Event' : 'Course'}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {item.title}
                        </CardTitle>
                        
                        {/* Creator */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">
                              {item.creator_name.charAt(0)}
                            </span>
                          </div>
                          <span>by {item.creator_name}</span>
                        </div>

                        <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed">
                          {item.description}
                        </p>
                        
                        {/* Reviews */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round(item.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.rating.toFixed(1)} ({item.total_reviews} review{item.total_reviews !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Location */}
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        
                        {/* Date for events */}
                        {item.content_type === 'event' && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <span className="font-bold text-xl text-gray-900">
                            {item.is_free || !item.price ? 'Free' : `$${item.price}`}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg"
                        >
                          {item.content_type === 'event' ? 'View Event' : 'View Course'}
                        </Button>
                      </CardFooter>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={loadMore}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-12 py-4 text-lg shadow-xl"
                  >
                    Load More Content
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LocalContentPage;
