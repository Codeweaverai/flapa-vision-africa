import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Search, BookOpen, Calendar, MapPin, Clock, Users, Star, Trash2 } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/lib/supabaseClient';
import { CourseWithEnrollment, EventWithRegistrations } from '@/types/eventTypes';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import WishlistButton from '@/components/wishlist/WishlistButton';

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
            )
          `)
          .in('id', courseIds)
          .eq('is_published', true);

        if (coursesError) throw coursesError;

        const coursesWithEnrollment = coursesData?.map(course => ({
          ...course,
          enrollment: course.course_enrollments?.[0] || null
        })) || [];

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
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (wishlistLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Your Wishlist is Empty</h1>
              <p className="text-muted-foreground mb-6">
                Start adding courses and events to your wishlist to keep track of what interests you
              </p>
              <div className="space-x-4">
                <Button 
                  onClick={() => navigate('/community/courses')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                >
                  Browse Courses
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/events')}
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
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 text-orange-500" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            <TabsContent value="all" className="space-y-6">
              {filteredCourses.length === 0 && filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No items found</h3>
                  <p className="text-muted-foreground">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                          <CourseWishlistCard key={course.id} course={course} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredEvents.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Events</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                          <EventWishlistCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'No courses match your search criteria'
                      : 'No courses in your wishlist yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseWishlistCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'No events match your search criteria'
                      : 'No events in your wishlist yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group bg-white">
      <CardHeader className="relative">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton 
            itemId={course.id} 
            itemType="course"
            className="bg-white/80 hover:bg-white"
          />
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={course.is_free ? 'secondary' : 'default'}>
            {course.is_free ? 'Free' : `$${course.price}`}
          </Badge>
          {course.difficulty_level && (
            <Badge variant="outline">
              {course.difficulty_level}
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-orange-600 transition-colors">
          {course.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {course.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{course.duration_minutes} min</span>
          </div>
          {course.enrollment && (
            <Badge variant="secondary">
              {course.enrollment.is_completed ? 'Completed' : 'Enrolled'}
            </Badge>
          )}
        </div>
        <Button 
          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          onClick={() => navigate(`/courses/${course.id}`)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View Course
        </Button>
      </CardContent>
    </Card>
  );
};

const EventWishlistCard: React.FC<{ event: EventWithRegistrations }> = ({ event }) => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group bg-white">
      <CardHeader className="relative">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton 
            itemId={event.id} 
            itemType="event"
            className="bg-white/80 hover:bg-white"
          />
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={event.is_free ? 'secondary' : 'default'}>
            {event.is_free ? 'Free' : `${event.currency} ${event.price}`}
          </Badge>
          <Badge variant="outline">
            {event.event_type}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-orange-600 transition-colors">
          {event.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {event.description}
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(event.start_time).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(event.start_time).toLocaleTimeString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
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
