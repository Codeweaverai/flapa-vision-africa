import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Users, Star, Play, BookOpen, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import PriceDisplay from '@/components/currency/PriceDisplay';
import WishlistButton from '@/components/wishlist/WishlistButton';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Create infinite scroll effect by duplicating content
  const duplicatedContent = [...trendingContent, ...trendingContent, ...trendingContent];

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          {/* Header with Navigation Arrows Skeleton */}
          <div className="flex items-end justify-between mb-12">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <h2 className="text-2xl md:text-3xl font-bold text-black">
                  Trending Now
                </h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl">
                Discover the most popular courses and events that learners are choosing right now
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="flex space-x-6 pb-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex-none w-80 animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[420px]">
                  <div className="bg-gray-300 h-56"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="flex justify-between mt-4">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
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
        {/* Header with Navigation Arrows */}
        <div className="flex items-end justify-between mb-12">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-black">
                Trending Now
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Discover the most popular courses and events that learners are choosing right now
            </p>
          </div>
          
          {/* Navigation Arrows */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              onClick={scrollLeft}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 hover:text-purple-600" />
            </Button>
            <Button
              onClick={scrollRight}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 shadow-sm"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 hover:text-orange-600" />
            </Button>
          </div>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide space-x-6 pb-6 snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {duplicatedContent.map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                className="flex-none w-80 snap-start"
              >
                <Card className="group hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-purple-100 hover:border-purple-300 overflow-hidden h-[420px] flex flex-col">
                  {/* Content Thumbnail with Icon */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-purple-400 to-orange-400">
                    {(item.type === 'course' ? item.thumbnail_url : item.image_url) ? (
                      <img 
                        src={item.type === 'course' ? item.thumbnail_url : item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center">
                        {item.type === 'course' ? (
                          <BookOpen className="h-14 w-14 text-white opacity-90" />
                        ) : (
                          <Calendar className="h-14 w-14 text-white opacity-90" />
                        )}
                      </div>
                    )}
                    
                    {/* Animated Orange Icon - Always Visible */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-orange-500/90 rounded-full p-4 shadow-lg animate-pulse-slow">
                        {item.type === 'course' ? (
                          <Play className="h-6 w-6 text-white fill-current" />
                        ) : (
                          <Calendar className="h-6 w-6 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <Link 
                      to={item.type === 'course' ? `/learning/course-detail/${item.id}` : `/event-detail/${item.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <div className="bg-white rounded-full p-4 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                        {item.type === 'course' ? (
                          <Play className="h-7 w-7 text-orange-600 fill-current" />
                        ) : (
                          <Calendar className="h-7 w-7 text-orange-600" />
                        )}
                      </div>
                    </Link>

                    {/* Wishlist Button for courses */}
                    {item.type === 'course' && (
                      <div className="absolute top-3 right-3 z-20">
                        <WishlistButton 
                          itemId={item.id}
                          itemType="course"
                          variant="ghost"
                          size="icon"
                          className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                        />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 text-purple-800 border-purple-200 text-xs font-medium backdrop-blur-sm">
                        {item.type === 'course' ? 'COURSE' : 'EVENT'}
                      </Badge>
                    </div>

                    {/* Trending Badge */}
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs font-bold shadow-lg">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Price/Free Badge */}
                    <div className="absolute bottom-3 left-3">
                      {item.is_free ? (
                        <Badge className="bg-green-500 text-white border-0 text-xs font-bold shadow-lg">
                          Free
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 text-white border-0 text-xs font-bold shadow-lg">
                          <PriceDisplay amount={item.price} originalCurrency="USD" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Details */}
                  <div className="flex-1 p-5 flex flex-col">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-base font-bold group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 leading-tight">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mt-2 text-gray-600 leading-relaxed">
                        {item.type === 'course' ? item.summary : item.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0 mt-auto space-y-3">
                      {/* Course Specific Details */}
                      {item.type === 'course' ? (
                        <>
                          {/* Duration and Difficulty */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600 font-medium">
                              <Clock className="h-4 w-4 mr-2 text-purple-500" />
                              {formatDuration(item.duration_minutes)}
                            </div>
                            <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 text-xs font-semibold">
                              {item.difficulty_level}
                            </Badge>
                          </div>

                          {/* Reviews and Students */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-700 font-medium">
                              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                              <span>{item.average_rating?.toFixed(1) || 0}</span>
                              <span className="ml-1 text-gray-500">({item.total_reviews || 0})</span>
                            </div>
                            <div className="flex items-center text-gray-700 font-medium">
                              <Users className="h-4 w-4 mr-2 text-blue-500" />
                              <span>{item.total_students || 0}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Event Date and Time */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600 font-medium">
                              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                              {formatDate(item.start_time)}
                            </div>
                            <div className="flex items-center text-gray-600 font-medium">
                              <Clock className="h-4 w-4 mr-1 text-orange-500" />
                              {formatTime(item.start_time)}
                            </div>
                          </div>

                          {/* Location and Attendees */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-700 font-medium">
                              <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="truncate max-w-[120px]">{item.location || 'Online'}</span>
                            </div>
                            <div className="flex items-center text-gray-700 font-medium">
                              <Users className="h-4 w-4 mr-2 text-green-500" />
                              <span>{item.total_attendees || 0}</span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* View Button */}
                      <Link 
                        to={item.type === 'course' ? `/learning/course-detail/${item.id}` : `/event-detail/${item.id}`} 
                        className="block mt-3"
                      >
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0 text-sm font-semibold py-2 h-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                          {item.type === 'course' ? 'View Course' : 'View Event'}
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Link to="/trending">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl px-8">
              View All Trending
            </Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </section>
  );
};

export default TrendingNowSection;
