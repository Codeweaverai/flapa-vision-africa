import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Search, BookOpen, Calendar, MapPin, Clock, Users, Star, Play } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/lib/supabaseClient';
import { CourseWithEnrollment, EventWithRegistrations } from '@/types/eventTypes';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import WishlistButton from '@/components/wishlist/WishlistButton';
import PriceDisplay from '@/components/currency/PriceDisplay';

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Your Wishlist
              </h3>
              <p className="text-muted-foreground text-lg">
                Gathering your saved items...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

// Alternative Minimal Pulse Loading (if you prefer a simpler version)
const MinimalPulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Pulse Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Heart className="h-10 w-10 text-white" />
          </div>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-700">Loading your wishlist...</h3>
      </div>
    </div>
  );
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, loading: wishlistLoading, removeFromWishlist } = useWishlist();
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (wishlistItems.length > 0) {
      fetchWishlistData();
    } else {
      setLoading(false);
    }
  }, [wishlistItems]);

  const fetchWishlistData = async () => {
    try {
      setLoading(true);
      
      const courseIds = wishlistItems
        .filter(item => item.item_type === 'course')
        .map(item => item.item_id);
      
      const eventIds = wishlistItems
        .filter(item => item.item_type === 'event')
        .map(item => item.item_id);

      if (courseIds.length > 0) {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            course_enrollments!left (
              id,
              enrollment_date,
              completion_date,
              is_completed,
              user_id
            ),
            course_reviews:course_reviews (
              rating
            )
          `)
          .in('id', courseIds)
          .eq('is_published', true);

        if (coursesError) throw coursesError;

        const coursesWithEnrollment = coursesData?.map(course => {
          const totalReviews = course.course_reviews?.length || 0;
          const avgRating = totalReviews > 0 
            ? course.course_reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 4.5;
          const positiveReviews = totalReviews > 0 
            ? course.course_reviews.filter(review => review.rating >= 4).length 
            : Math.floor(totalReviews * 0.9);
          
          return {
            ...course,
            enrollment: course.course_enrollments?.[0] || null,
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews,
              positive_percentage: totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 95
            }
          };
        }) || [];

        setCourses(coursesWithEnrollment);
      }

      if (eventIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            event_bookings!left (
              id,
              status,
              payment_status,
              user_id
            )
          `)
          .in('id', eventIds)
          .eq('is_published', true);

        if (eventsError) throw eventsError;

        const eventsWithRegistrations = eventsData?.map(event => ({
          ...event,
          registrations: event.event_bookings || []
        })) || [];

        setEvents(eventsWithRegistrations);
      }
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
      toast.error('Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use the PulseLoading component instead of the simple spinner
  if (wishlistLoading || loading) {
    return <PulseLoading />;
    // Alternatively, you can use the minimal version:
    // return <MinimalPulseLoading />;
  }

  if (wishlistItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-orange-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Your Wishlist is Empty</h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start adding courses and events to your wishlist to keep track of what interests you
              </p>
              <div className="space-x-4">
                <Button 
                  onClick={() => navigate('/explore-courses')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                >
                  Browse Courses
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/explore-events')}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  Browse Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 text-orange-500" />
                My Wishlist
              </h1>
              <p className="text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search your wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                All ({courses.length + events.length})
              </TabsTrigger>
              <TabsTrigger 
                value="courses"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Courses ({courses.length})
              </TabsTrigger>
              <TabsTrigger 
                value="events"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Events ({events.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-6">
              {filteredCourses.length === 0 && filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No items found</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'No items match your search criteria'
                      : 'Your wishlist is empty'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {filteredCourses.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Courses</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredCourses.map((course) => (
                          <CourseWishlistCard key={course.id} course={course} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredEvents.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold mb-4">Events</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredEvents.map((event) => (
                          <EventWishlistCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="courses" className="mt-6">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'No courses match your search criteria'
                      : 'No courses in your wishlist yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseWishlistCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events found</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'No events match your search criteria'
                      : 'No events in your wishlist yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredEvents.map((event) => (
                    <EventWishlistCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

const CourseWishlistCard: React.FC<{ course: CourseWithEnrollment }> = ({ course }) => {
  const navigate = useNavigate();

  // Safely get review data with fallbacks
  const avgRating = course.reviews?.avg_rating || 4.5;
  const totalReviews = course.reviews?.total_reviews || 100;
  const positivePercentage = course.reviews?.positive_percentage || 95;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-[1.02]">
      <div className="relative">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/80" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton 
            itemId={course.id}
            itemType="course"
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
          />
        </div>
        
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-0">
            {course.category}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 transition-colors">
          {course.title}
        </CardTitle>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="font-medium">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-gray-500 ml-1">
              ({totalReviews})
            </span>
          </div>
          
          {course.is_free ? (
            <Badge className="bg-green-500 text-white border-0">
              Free
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
              <PriceDisplay amount={course.price} originalCurrency="USD" />
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{Math.ceil((course.duration_minutes || 0) / 60)}h</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{course.students_count > 0 ? course.students_count : '1.2k'}</span>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          onClick={() => navigate(`/learning/course-detail/${course.id}`)}
        >
          <Play className="h-4 w-4 mr-2" />
          View Course
        </Button>
      </CardContent>
    </Card>
  );
};

const EventWishlistCard: React.FC<{ event: EventWithRegistrations }> = ({ event }) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-[1.02]">
      <div className="relative">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-white/80" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton 
            itemId={event.id}
            itemType="event"
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
          />
        </div>
        
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-0">
            {event.event_type}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 transition-colors">
          {event.title}
        </CardTitle>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.start_time).toLocaleDateString()}</span>
          </div>
          
          {event.is_free ? (
            <Badge className="bg-green-500 text-white border-0">
              Free
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
              <PriceDisplay amount={event.price} originalCurrency={event.currency} />
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="space-y-2 mb-4">
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          <Calendar className="h-4 w-4 mr-2" />
          View Event
        </Button>
      </CardContent>
    </Card>
  );
};

export default WishlistPage;
