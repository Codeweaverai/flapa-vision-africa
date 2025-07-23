
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Users, Star, Play, BookOpen, Calendar, MapPin, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TrendingItem {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  difficulty_level?: string;
  duration_minutes?: number;
  price?: number;
  is_free: boolean;
  thumbnail_url?: string;
  image_url?: string;
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
  total_attendees?: number;
  type: 'course' | 'event';
  start_time?: string;
  end_time?: string;
  location?: string;
  event_type?: string;
  popularity_score: number;
}

const TrendingPage = () => {
  const [trendingContent, setTrendingContent] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'courses' | 'events'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'newest'>('popularity');

  useEffect(() => {
    const fetchTrendingContent = async () => {
      try {
        // Fetch top-rated courses with most enrollments
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            course_reviews (rating),
            course_enrollments (id)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        // Fetch popular events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            event_bookings (id)
          `)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true });

        if (eventsError) throw eventsError;

        // Process courses with stats and sort by popularity
        const processedCourses = (coursesData || []).map(course => {
          const reviews = course.course_reviews || [];
          const enrollments = course.course_enrollments || [];
          
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            type: 'course' as const,
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: reviews.length,
            total_students: enrollments.length,
            popularity_score: (averageRating * reviews.length) + (enrollments.length * 2),
            course_reviews: undefined,
            course_enrollments: undefined
          };
        });

        // Process events with stats
        const processedEvents = (eventsData || []).map(event => ({
          ...event,
          type: 'event' as const,
          total_attendees: (event.event_bookings || []).length,
          popularity_score: (event.event_bookings || []).length * 3,
          event_bookings: undefined
        }));

        // Combine all content
        const combined = [...processedCourses, ...processedEvents];
        
        setTrendingContent(combined);
      } catch (error) {
        console.error('Error fetching trending content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingContent();
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredContent = trendingContent.filter(item => {
    if (filter === 'all') return true;
    return filter === 'courses' ? item.type === 'course' : item.type === 'event';
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.popularity_score - a.popularity_score;
      case 'rating':
        return (b.average_rating || 0) - (a.average_rating || 0);
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      default:
        return b.popularity_score - a.popularity_score;
    }
  });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  All Trending Content
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Discover all the trending courses and events
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96">
                    <div className="bg-gray-300 h-48"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                All Trending Content
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover all the trending courses and events that learners are choosing right now
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
            <Select value={filter} onValueChange={(value: 'all' | 'courses' | 'events') => setFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="courses">Courses Only</SelectItem>
                <SelectItem value="events">Events Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'popularity' | 'rating' | 'newest') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-center mb-8">
            <p className="text-gray-600">
              Showing {sortedContent.length} trending {filter === 'all' ? 'items' : filter}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedContent.map((item, index) => (
              <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-orange-200 hover:border-orange-300 overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  {(item.type === 'course' ? item.thumbnail_url : item.image_url) ? (
                    <img 
                      src={item.type === 'course' ? item.thumbnail_url : item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-purple-400 flex items-center justify-center">
                      {item.type === 'course' ? (
                        <BookOpen className="h-12 w-12 text-white opacity-80" />
                      ) : (
                        <Calendar className="h-12 w-12 text-white opacity-80" />
                      )}
                    </div>
                  )}
                  
                  {/* Video Play Icon for courses */}
                  {item.type === 'course' && (
                    <Link 
                      to={`/learning/course-detail/${item.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <div className="bg-white/90 rounded-full p-3 hover:bg-white transition-colors">
                        <Play className="h-6 w-6 text-orange-600" />
                      </div>
                    </Link>
                  )}

                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant={item.type === 'course' ? 'default' : 'secondary'}
                      className="bg-orange-100 text-orange-800 border-orange-200"
                    >
                      {item.type === 'course' ? 'COURSE' : 'EVENT'}
                    </Badge>
                  </div>
                  
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg group-hover:text-orange-600 transition-colors line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.type === 'course' ? item.summary : item.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {item.type === 'course' ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(item.duration_minutes || 0)}
                        </div>
                        <Badge variant="outline" className="border-purple-200 text-purple-600">
                          {item.difficulty_level}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                          <span>{item.average_rating || 0}</span>
                          <span className="ml-1">({item.total_reviews || 0})</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{item.total_students || 0}</span>
                        </div>
                      </div>
                      <Link to={`/learning/course-detail/${item.id}`}>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white border-0">
                          View Course
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(item.start_time || '')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{item.total_attendees || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{item.location || 'Online'}</span>
                      </div>
                      <Link to={`/event-detail/${item.id}`}>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white border-0">
                          View Event
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedContent.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No trending content found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TrendingPage;
