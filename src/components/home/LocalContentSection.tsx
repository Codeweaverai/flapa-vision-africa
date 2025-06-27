
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Users, Star, Clock, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchPublishedCourses } from '@/services/courseService';
import { fetchUpcomingEvents } from '@/services/eventService';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface LocalCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  category: string;
}

interface LocalEvent {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  is_free: boolean;
  price?: number;
}

const LocalContentSection = () => {
  const [localCourses, setLocalCourses] = useState<LocalCourse[]>([]);
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocalContent = async () => {
      try {
        // Load courses and events
        const [courses, events] = await Promise.all([
          fetchPublishedCourses(),
          fetchUpcomingEvents(6)
        ]);

        // For demo purposes, we'll show a subset as "local"
        // In a real app, you'd filter by user location
        setLocalCourses(courses.slice(0, 6));
        setLocalEvents(events);
      } catch (error) {
        console.error('Error loading local content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocalContent();
  }, []);

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-6 w-6 text-purple-500" />
            <h2 className="text-3xl md:text-4xl font-bold">Courses and Events in Your Area</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover learning opportunities and events happening near you
          </p>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localCourses.map((course) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="aspect-video bg-gradient-to-br from-purple-200 to-orange-200 rounded-t-lg flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <GraduationCap className="h-8 w-8 text-purple-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{course.category}</p>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.difficulty_level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(course.duration_minutes / 60)}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>Online</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">
                        {course.is_free ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <PriceDisplay amount={course.price} originalCurrency="USD" />
                        )}
                      </div>
                    </div>
                    
                    <Link to={`/courses/${course.id}`} className="block mt-4">
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600">
                        View Course
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localEvents.map((event) => (
                <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <div className="aspect-square md:aspect-auto md:h-full bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg md:rounded-t-none md:rounded-l-lg flex items-center justify-center">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover rounded-t-lg md:rounded-t-none md:rounded-l-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                              <Calendar className="h-8 w-8 text-orange-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{event.event_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:w-2/3 flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {event.event_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatEventDate(event.start_time)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {event.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0 flex-1 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                          {event.description}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatEventDate(event.start_time)} at {formatEventTime(event.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{event.location || 'Online Event'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold">
                            {event.is_free ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              <PriceDisplay amount={event.price || 0} originalCurrency="USD" />
                            )}
                          </div>
                        </div>
                        
                        <Link to={`/events/${event.id}`} className="block mt-4">
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600">
                            View Event
                          </Button>
                        </Link>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses">
              <Button variant="outline" size="lg" className="border-2 hover:bg-primary hover:text-white">
                Explore All Courses
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg" className="border-2 hover:bg-primary hover:text-white">
                Discover All Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocalContentSection;
