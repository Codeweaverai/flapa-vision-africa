
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { CourseWithEnrollment } from '@/types/eventTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Search, BookOpen, Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import WishlistButton from '@/components/wishlist/WishlistButton';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface SimpleEvent {
  id: string;
  title: string;
  description: string;
  date?: string;
  start_time?: string;
  location: string;
  price?: number;
  currency?: string;
  image_url?: string;
  creator_id?: string;
}

const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const { wishlistItems, loading } = useWishlist();
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [events, setEvents] = useState<SimpleEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (wishlistItems.length > 0) {
      fetchWishlistDetails();
    }
  }, [wishlistItems]);

  const fetchWishlistDetails = async () => {
    setLoadingItems(true);
    
    const courseIds = wishlistItems
      .filter(item => item.item_type === 'course')
      .map(item => item.item_id);
    
    const eventIds = wishlistItems
      .filter(item => item.item_type === 'event')
      .map(item => item.item_id);

    try {
      // Fetch courses
      if (courseIds.length > 0) {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
      }

      // Fetch events with simpler query
      if (eventIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            date,
            start_time,
            location,
            price,
            currency,
            image_url,
            creator_id
          `)
          .in('id', eventIds);

        if (eventsError) throw eventsError;
        setEvents((eventsData || []) as SimpleEvent[]);
      }
    } catch (error) {
      console.error('Error fetching wishlist details:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Please log in to view your wishlist</h1>
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <Badge variant="secondary">{wishlistItems.length} items</Badge>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search your wishlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading || loadingItems ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your wishlist...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Start adding courses and events you're interested in!</p>
            <div className="space-x-4">
              <Link to="/explore-courses">
                <Button>Browse Courses</Button>
              </Link>
              <Link to="/events">
                <Button variant="outline">Browse Events</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({wishlistItems.length})</TabsTrigger>
              <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
              <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="courses" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              {filteredCourses.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No courses in your wishlist yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {filteredEvents.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No events in your wishlist yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

const CourseCard: React.FC<{ course: CourseWithEnrollment }> = ({ course }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        {course.thumbnail_url || course.image_url ? (
          <img
            src={course.thumbnail_url || course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton itemId={course.id} itemType="course" />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{course.duration_minutes || 0} min</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            {course.is_free ? (
              <span className="text-green-600 font-medium">Free</span>
            ) : (
              <PriceDisplay 
                amount={course.price || 0} 
                className="text-green-600 font-medium"
              />
            )}
          </div>
        </div>

        <Link to={`/course/${course.id}`}>
          <Button className="w-full">View Course</Button>
        </Link>
      </CardContent>
    </Card>
  );
};

const EventCard: React.FC<{ event: SimpleEvent }> = ({ event }) => {
  const eventDate = event.date || event.start_time;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton itemId={event.id} itemType="event" />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
        
        <div className="space-y-2 mb-3 text-sm text-gray-500">
          {eventDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(eventDate).toLocaleDateString()}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <PriceDisplay 
              amount={event.price || 0} 
              originalCurrency={(event.currency as any) || 'USD'}
              className="text-green-600 font-medium"
            />
          </div>
        </div>

        <Link to={`/events/${event.id}`}>
          <Button className="w-full">View Event</Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default WishlistPage;
