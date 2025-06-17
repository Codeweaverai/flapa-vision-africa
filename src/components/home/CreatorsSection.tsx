
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Star, BookOpen, Users, Award, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

interface Creator {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  total_courses: number;
  total_events: number;
  total_students: number;
  average_rating: number;
  total_reviews: number;
}

const CreatorsSection = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      
      // Get all creators with published courses or events
      const { data: creatorsData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          bio
        `)
        .eq('is_creator', true)
        .limit(12);

      if (error) {
        console.error('Error fetching creators:', error);
        return;
      }

      if (!creatorsData) return;

      // Calculate stats for each creator
      const creatorsWithStats = await Promise.all(
        creatorsData.map(async (creator) => {
          // Get published courses count
          const { data: coursesData } = await supabase
            .from('courses')
            .select('id')
            .eq('creator_id', creator.id)
            .eq('is_published', true);

          // Get events count
          const { data: eventsData } = await supabase
            .from('events')
            .select('id')
            .eq('creator_id', creator.id);

          const totalCourses = coursesData?.length || 0;
          const totalEvents = eventsData?.length || 0;

          if (totalCourses === 0 && totalEvents === 0) {
            return {
              ...creator,
              total_courses: 0,
              total_events: 0,
              total_students: 0,
              average_rating: 0,
              total_reviews: 0
            };
          }

          const courseIds = coursesData?.map(c => c.id) || [];
          const eventIds = eventsData?.map(e => e.id) || [];

          // Get total students (enrollments + event bookings)
          let totalStudents = 0;

          if (courseIds.length > 0) {
            const { data: enrollmentsData } = await supabase
              .from('course_enrollments')
              .select('id')
              .in('course_id', courseIds)
              .eq('payment_status', 'completed');
            
            totalStudents += enrollmentsData?.length || 0;
          }

          if (eventIds.length > 0) {
            const { data: bookingsData } = await supabase
              .from('event_bookings')
              .select('ticket_quantity')
              .in('event_id', eventIds)
              .eq('payment_status', 'completed');
            
            const eventStudents = bookingsData?.reduce((sum, booking) => sum + (booking.ticket_quantity || 0), 0) || 0;
            totalStudents += eventStudents;
          }

          // Get reviews and calculate average rating (only from courses)
          let averageRating = 0;
          let totalReviews = 0;

          if (courseIds.length > 0) {
            const { data: reviewsData } = await supabase
              .from('course_reviews')
              .select('rating')
              .in('course_id', courseIds);

            totalReviews = reviewsData?.length || 0;
            if (totalReviews > 0) {
              averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
            }
          }

          return {
            ...creator,
            total_courses: totalCourses,
            total_events: totalEvents,
            total_students: totalStudents,
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: totalReviews
          };
        })
      );

      // Filter out creators with no courses or events and sort by total students
      const activeCreators = creatorsWithStats
        .filter(creator => creator.total_courses > 0 || creator.total_events > 0)
        .sort((a, b) => b.total_students - a.total_students);

      setCreators(activeCreators);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-purple-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Meet Our Expert Creators
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn from industry professionals and subject matter experts
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (creators.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-r from-purple-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            Meet Our Expert Creators
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn from industry professionals and subject matter experts who are passionate about sharing their knowledge
          </p>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {creators.map((creator) => (
                <CarouselItem key={creator.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Card className="h-full bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="w-20 h-20 mb-4 ring-4 ring-purple-100">
                          <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-orange-500 text-white">
                            {creator.full_name?.split(' ').map(n => n[0]).join('') || 'CR'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <h3 className="font-semibold text-lg mb-2 text-gray-900">
                          {creator.full_name || 'Anonymous Creator'}
                        </h3>
                        
                        {creator.bio && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {creator.bio}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 w-full mb-4">
                          <div className="bg-purple-50 p-2 rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-purple-600">
                              <BookOpen className="w-3 h-3" />
                              <span className="text-xs font-medium">{creator.total_courses}</span>
                            </div>
                            <div className="text-xs text-purple-500 text-center">Courses</div>
                          </div>
                          
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-blue-600">
                              <Calendar className="w-3 h-3" />
                              <span className="text-xs font-medium">{creator.total_events}</span>
                            </div>
                            <div className="text-xs text-blue-500 text-center">Events</div>
                          </div>
                          
                          <div className="bg-orange-50 p-2 rounded-lg col-span-2">
                            <div className="flex items-center justify-center gap-1 text-orange-600">
                              <Users className="w-3 h-3" />
                              <span className="text-xs font-medium">{creator.total_students}</span>
                            </div>
                            <div className="text-xs text-orange-500 text-center">Students</div>
                          </div>
                        </div>

                        {creator.average_rating > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{creator.average_rating}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {creator.total_reviews} reviews
                            </Badge>
                          </div>
                        )}

                        <Button 
                          asChild 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600"
                        >
                          <Link to={`/creator/profile/${creator.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-12 bg-white/90 hover:bg-white shadow-lg border-purple-200" />
            <CarouselNext className="hidden sm:flex -right-12 bg-white/90 hover:bg-white shadow-lg border-purple-200" />
          </Carousel>
        </div>

        <div className="text-center mt-8">
          <Button 
            asChild 
            variant="outline" 
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Link to="/creators">
              View All Creators
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
