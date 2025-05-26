
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchCourses, Course } from '@/services/courseService';
import { fetchEvents, Event } from '@/services/eventService';
import { format, parseISO } from 'date-fns';

const HomePage = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedContent = async () => {
      try {
        const [coursesData, eventsData] = await Promise.all([
          fetchCourses(),
          fetchEvents()
        ]);
        
        // Get first 3 courses and events as featured
        setFeaturedCourses(coursesData.slice(0, 3));
        setFeaturedEvents(eventsData.slice(0, 3));
      } catch (error) {
        console.error('Error loading featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedContent();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Learn, Grow, and Succeed
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover world-class courses and events designed to help you achieve your goals.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/events">View Events</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Button variant="outline" asChild>
              <Link to="/courses">View All Courses</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={course.is_free ? "secondary" : "outline"}>
                        {course.is_free ? "Free" : `$${course.price}`}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline">{course.category}</Badge>
                      <Badge variant="secondary">{course.difficulty_level}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.summary}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.ceil((course.duration_minutes || 0) / 60)} hours
                      </div>
                    </div>
                    <Button className="w-full" asChild>
                      <Link to={`/learning/course-detail/${course.id}`}>
                        View Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No featured courses available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Button variant="outline" asChild>
              <Link to="/events">View All Events</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={event.is_free ? "secondary" : "outline"}>
                        {event.is_free ? "Free" : `${event.currency} ${event.price}`}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline">
                        {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(parseISO(event.start_time), 'MMM d, yyyy h:mm a')}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {event.description}
                    </p>
                    <Button className="w-full" asChild>
                      <Link to={`/events/${event.id}`}>
                        View Event
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming events available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already advancing their careers with our courses and events.
          </p>
          <Button size="lg" asChild>
            <Link to="/account">Get Started</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
