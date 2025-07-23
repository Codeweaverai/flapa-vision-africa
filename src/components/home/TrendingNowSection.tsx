
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Users, Star, Play, BookOpen, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Course {
  id: string;
  title: string;
  summary: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  price?: number;
  is_free: boolean;
  total_attendees?: number;
}

const TrendingNowSection = () => {
  const [trendingContent, setTrendingContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            type: 'course',
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: reviews.length,
            total_students: enrollments.length,
            popularity_score: (averageRating * reviews.length) + (enrollments.length * 2),
            course_reviews: undefined,
            course_enrollments: undefined
          };
        }).sort((a, b) => b.popularity_score - a.popularity_score);

        // Process events with stats
        const processedEvents = (eventsData || []).map(event => ({
          ...event,
          type: 'event',
          total_attendees: (event.event_bookings || []).length,
          popularity_score: (event.event_bookings || []).length * 3,
          event_bookings: undefined
        })).sort((a, b) => b.popularity_score - a.popularity_score);

        // Combine and get top trending items
        const combined = [
          ...processedCourses.slice(0, 8),
          ...processedEvents.slice(0, 4)
        ].sort((a, b) => b.popularity_score - a.popularity_score).slice(0, 12);

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

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Trending Now
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the most popular courses and events that learners are choosing right now
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden h-80">
                  <div className="bg-gray-300 h-32"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Trending Now
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most popular courses and events that learners are choosing right now
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {trendingContent.map((item, index) => (
            <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-orange-200 hover:border-orange-300 overflow-hidden h-fit">
              <div className="relative h-32 overflow-hidden">
                {(item.type === 'course' ? item.thumbnail_url : item.image_url) ? (
                  <img 
                    src={item.type === 'course' ? item.thumbnail_url : item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-purple-400 flex items-center justify-center">
                    {item.type === 'course' ? (
                      <BookOpen className="h-8 w-8 text-white opacity-80" />
                    ) : (
                      <Calendar className="h-8 w-8 text-white opacity-80" />
                    )}
                  </div>
                )}
                
                {/* Video Play Icon for courses */}
                {item.type === 'course' && (
                  <Link 
                    to={`/learning/course-detail/${item.id}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="bg-white/90 rounded-full p-2 hover:bg-white transition-colors">
                      <Play className="h-4 w-4 text-orange-600" />
                    </div>
                  </Link>
                )}

                <div className="absolute top-2 left-2">
                  <Badge 
                    variant={item.type === 'course' ? 'default' : 'secondary'}
                    className="bg-orange-100 text-orange-800 border-orange-200 text-xs"
                  >
                    {item.type === 'course' ? 'COURSE' : 'EVENT'}
                  </Badge>
                </div>
                
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    #{index + 1}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-2 p-3">
                <CardTitle className="text-sm group-hover:text-orange-600 transition-colors line-clamp-2 h-10">
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs h-8">
                  {item.type === 'course' ? item.summary : item.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 p-3">
                {item.type === 'course' ? (
                  <>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(item.duration_minutes)}
                      </div>
                      <Badge variant="outline" className="border-purple-200 text-purple-600 text-xs">
                        {item.difficulty_level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center text-gray-600">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        <span>{item.average_rating || 0}</span>
                        <span className="ml-1">({item.total_reviews || 0})</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{item.total_students || 0}</span>
                      </div>
                    </div>
                    <Link to={`/learning/course-detail/${item.id}`}>
                      <Button className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white border-0 text-xs py-1 h-8">
                        View Course
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.start_time)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{item.total_attendees || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{item.location || 'Online'}</span>
                    </div>
                    <Link to={`/event-detail/${item.id}`}>
                      <Button className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white border-0 text-xs py-1 h-8">
                        View Event
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/trending">
            <Button size="lg" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
              View All Trending
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingNowSection;
