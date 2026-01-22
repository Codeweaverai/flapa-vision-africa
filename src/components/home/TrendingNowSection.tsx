import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Clock, Users, Star, Play, BookOpen, Calendar, MapPin, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
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
  creator_id: string;
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
  creator_name?: string;
  creator_avatar?: string;
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
  creator_id: string;
  creator_name?: string;
  creator_avatar?: string;
  event_tickets?: Array<{
    id: string;
    name: string;
    price: number;
    quantity_available: number;
    quantity_sold: number;
  }>;
}

const TrendingNowSection = () => {
  const [trendingContent, setTrendingContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchTrendingContent = async () => {
      try {
        // Fetch courses with creator profiles
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true });

        if (eventsError) throw eventsError;

        // Get creator IDs for both courses and events
        const courseCreatorIds = [...new Set(coursesData?.map(course => course.creator_id).filter(Boolean) || [])];
        const eventCreatorIds = [...new Set(eventsData?.map(event => event.creator_id).filter(Boolean) || [])];
        const allCreatorIds = [...new Set([...courseCreatorIds, ...eventCreatorIds])];

        // Fetch creator profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', allCreatorIds);

        // Fetch additional data for courses
        const courseIds = coursesData?.map(course => course.id) || [];
        const { data: courseReviews } = await supabase
          .from('course_reviews')
          .select('course_id, rating')
          .in('course_id', courseIds);

        const { data: courseEnrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .in('course_id', courseIds);

        // Fetch additional data for events
        const eventIds = eventsData?.map(event => event.id) || [];
        const { data: eventBookings } = await supabase
          .from('event_bookings')
          .select('event_id')
          .in('event_id', eventIds);

        const { data: eventTickets } = await supabase
          .from('event_tickets')
          .select('id, name, price, quantity_available, quantity_sold, event_id')
          .in('event_id', eventIds);

        // Process courses with stats
        const processedCourses = (coursesData || []).map(course => {
          const reviews = courseReviews?.filter(review => review.course_id === course.id) || [];
          const enrollments = courseEnrollments?.filter(enrollment => enrollment.course_id === course.id) || [];
          const creatorProfile = profilesData?.find(profile => profile.id === course.creator_id);
          
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            type: 'course',
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: reviews.length,
            total_students: enrollments.length,
            creator_name: creatorProfile?.full_name || creatorProfile?.username || 'Unknown Creator',
            creator_avatar: creatorProfile?.avatar_url || null,
            popularity_score: (averageRating * reviews.length) + (enrollments.length * 2)
          };
        }).sort((a, b) => b.popularity_score - a.popularity_score);

        // Process events with stats
        const processedEvents = (eventsData || []).map(event => {
          const bookings = eventBookings?.filter(booking => booking.event_id === event.id) || [];
          const tickets = eventTickets?.filter(ticket => ticket.event_id === event.id) || [];
          const creatorProfile = profilesData?.find(profile => profile.id === event.creator_id);
          
          const is_free = tickets.length === 0 || Math.min(...tickets.map(t => t.price)) === 0;
          const minPrice = tickets.length > 0 ? Math.min(...tickets.map(t => t.price)) : 0;

          return {
            ...event,
            type: 'event',
            total_attendees: bookings.length,
            creator_name: creatorProfile?.full_name || creatorProfile?.username || 'Unknown Creator',
            creator_avatar: creatorProfile?.avatar_url || null,
            event_tickets: tickets,
            is_free,
            price: minPrice,
            popularity_score: bookings.length * 3
          };
        }).sort((a, b) => b.popularity_score - a.popularity_score);

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
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalCapacity = (tickets: any[]) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => sum + ticket.quantity_available, 0);
  };

  const getSoldTickets = (tickets: any[]) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => sum + ticket.quantity_sold, 0);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollLeft();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollRight();
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="text-sm text-gray-600 ml-1 font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
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
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[480px]">
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
        {trendingContent.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-10"></div>
              <TrendingUp className="h-20 w-20 text-gray-400 mx-auto relative" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Trending Content</h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              Check back soon for trending courses and events.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide space-x-6 pb-6 snap-x snap-mandatory"
              tabIndex={0}
              onKeyDown={handleKeyDown}
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
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:scale-[1.02]">
                    <div className="relative">
                      {/* Content Thumbnail */}
                      <div className="relative h-56 overflow-hidden cursor-pointer">
                        {(item.type === 'course' ? item.thumbnail_url : item.image_url) ? (
                          <>
                            <img
                              src={item.type === 'course' ? item.thumbnail_url : item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Orange-Purple Gradient Icon with Pulse Animation */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Outer Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                                {/* Middle Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                                {/* Main Icon Container */}
                                <div className="relative bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-2xl animate-pulse-slow transform hover:scale-110 transition-transform duration-300">
                                  {item.type === 'course' ? (
                                    <Play className="h-8 w-8 text-white fill-current" />
                                  ) : (
                                    <Calendar className="h-8 w-8 text-white" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-purple-200 to-pink-300 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-500">
                            {/* Animated Icon with Orange-Purple Gradient */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Outer Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                                {/* Middle Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                                {/* Main Icon Container */}
                                <div className="relative bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-2xl animate-pulse-slow transform hover:scale-110 transition-transform duration-300">
                                  {item.type === 'course' ? (
                                    <Play className="h-8 w-8 text-white fill-current" />
                                  ) : (
                                    <Calendar className="h-8 w-8 text-white" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Type and Trending Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg font-medium">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            #{index + 1}
                          </Badge>
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm font-medium">
                            {item.type === 'course' ? item.category : item.event_type}
                          </Badge>
                        </div>

                        {/* Content Specific Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/30">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            {item.type === 'course' ? (
                              <>
                                <Clock className="h-4 w-4 text-orange-500" />
                                {formatDuration(item.duration_minutes)}
                              </>
                            ) : (
                              <>
                                <Calendar className="h-4 w-4 text-orange-500" />
                                {formatDate(item.start_time)}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Wishlist Button */}
                        <div className="absolute bottom-4 right-4 z-20">
                          <WishlistButton 
                            itemId={item.id}
                            itemType={item.type}
                            variant="ghost"
                            size="icon"
                            iconOnly
                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-0 hover:text-red-500"
                          />
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="cursor-pointer">
                        <CardHeader className="pb-3">
                          {/* Title - Truncated to only one line for both courses and events */}
                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors duration-300 leading-tight">
                            {item.title}
                          </CardTitle>
                          
                          {/* Creator with Avatar */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Avatar className="h-6 w-6 border border-orange-200">
                              <AvatarImage 
                                src={item.creator_avatar || undefined} 
                                alt={item.creator_name}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white text-xs font-bold">
                                {item.creator_name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">by {item.creator_name}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Content Summary */}
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {item.type === 'course' ? item.summary : item.description}
                          </p>

                          {/* Content Specific Details */}
                          {item.type === 'course' ? (
                            <>
                              {/* Course Reviews */}
                              {item.type === 'course' && item.total_reviews && item.total_reviews > 0 ? (
                                <div className="flex items-center justify-between">
                                  {renderStarRating(item.average_rating || 0)}
                                  <span className="text-xs text-gray-500 font-medium">
                                    {item.total_reviews} review{item.total_reviews !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              ) : item.type === 'course' ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                      New
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {/* Students Count */}
                              {item.type === 'course' ? (
                                item.total_students && item.total_students > 0 ? (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                                    <span className="font-medium">{item.total_students} students enrolled</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                                    <span className="font-medium">On Demand</span>
                                  </div>
                                )
                              ) : null}
                            </>
                          ) : (
                            <>
                              {/* Event Time */}
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                                <span className="font-medium">{formatTime(item.start_time)}</span>
                              </div>

                              {/* Event Location and Attendees */}
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                                  <span className="truncate font-medium">{item.location}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                                  <span className="font-medium">{getSoldTickets(item.event_tickets)}/{getTotalCapacity(item.event_tickets)}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>

                        <CardContent className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-1 text-orange-500" />
                            <span className="font-bold text-xl text-gray-900">
                              {item.is_free ? (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                  Free
                                </span>
                              ) : (
                                <PriceDisplay amount={item.price} originalCurrency="USD" />
                              )}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                            asChild
                          >
                            <Link to={item.type === 'course' ? `/learning/course-detail/${item.id}` : `/events/${item.id}`}>
                              {item.type === 'course' ? (
                                <>
                                  <Play className="h-4 w-4 mr-1 text-white fill-current" />
                                  Enroll Now
                                </>
                              ) : (
                                'View Event'
                              )}
                            </Link>
                          </Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-12">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl px-8"
          >
            <Link to="/trending" className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              View All Trending
            </Link>
          </Button>
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
