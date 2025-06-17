
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, BookOpen, Users, Search, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';

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

const CreatorsPage = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('students');

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    filterAndSortCreators();
  }, [creators, searchTerm, sortBy]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      
      // Get all creators
      const { data: creatorsData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          bio
        `)
        .eq('is_creator', true);

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

      // Filter out creators with no courses or events
      const activeCreators = creatorsWithStats.filter(creator => creator.total_courses > 0 || creator.total_events > 0);
      setCreators(activeCreators);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCreators = () => {
    let filtered = creators.filter(creator =>
      creator.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort creators
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'students':
          return b.total_students - a.total_students;
        case 'courses':
          return b.total_courses - a.total_courses;
        case 'events':
          return b.total_events - a.total_events;
        case 'rating':
          return b.average_rating - a.average_rating;
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        default:
          return b.total_students - a.total_students;
      }
    });

    setFilteredCreators(filtered);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Our Expert Creators
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover talented creators sharing their knowledge and expertise
              </p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Our Expert Creators
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover talented creators sharing their knowledge and expertise with students worldwide
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-orange-300"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-white/80 backdrop-blur-sm border-purple-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="students">Most Students</SelectItem>
                <SelectItem value="courses">Most Courses</SelectItem>
                <SelectItem value="events">Most Events</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Creators Grid */}
          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => (
                <Card key={creator.id} className="h-full bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center h-full">
                      <Avatar className="w-20 h-20 mb-4 ring-4 ring-purple-100">
                        <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                          {creator.full_name?.split(' ').map(n => n[0]).join('') || 'CR'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">
                        {creator.full_name || 'Anonymous Creator'}
                      </h3>
                      
                      {creator.bio && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
                          {creator.bio}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 w-full mb-4">
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-orange-600">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm font-medium">{creator.total_courses}</span>
                          </div>
                          <div className="text-xs text-orange-500 text-center mt-1">Courses</div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-blue-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">{creator.total_events}</span>
                          </div>
                          <div className="text-xs text-blue-500 text-center mt-1">Events</div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg col-span-2">
                          <div className="flex items-center justify-center gap-1 text-purple-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">{creator.total_students}</span>
                          </div>
                          <div className="text-xs text-purple-500 text-center mt-1">Students</div>
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
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 mt-auto"
                      >
                        <Link to={`/creator/profile/${creator.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-purple-200">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">No creators found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No creators are available at the moment.'}
                </p>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {filteredCreators.length > 0 && (
            <div className="mt-16 text-center">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {filteredCreators.length}
                  </div>
                  <div className="text-gray-600">Expert Creators</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {filteredCreators.reduce((sum, creator) => sum + creator.total_courses, 0)}
                  </div>
                  <div className="text-gray-600">Total Courses</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {filteredCreators.reduce((sum, creator) => sum + creator.total_events, 0)}
                  </div>
                  <div className="text-gray-600">Total Events</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    {filteredCreators.reduce((sum, creator) => sum + creator.total_students, 0).toLocaleString()}
                  </div>
                  <div className="text-gray-600">Students Taught</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreatorsPage;
