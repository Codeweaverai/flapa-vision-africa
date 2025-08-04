
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Users, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Creator {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  total_courses: number;
  total_students: number;
  total_events: number;
  average_rating: number;
  specialties: string[];
}

const CreatorsSection = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      // Fetch creators using is_creator field instead of role
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          bio,
          is_creator
        `)
        .eq('is_creator', true)
        .limit(10);

      if (error) throw error;

      // For each creator, get their course stats
      const creatorsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get course count
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', profile.id)
            .eq('is_published', true);

          // Get event count
          const { count: eventCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', profile.id);

          // Get total students (enrollments)
          const { count: studentCount } = await supabase
            .from('course_enrollments')
            .select(`
              *,
              courses!inner(creator_id)
            `, { count: 'exact', head: true })
            .eq('courses.creator_id', profile.id);

          // Get average rating
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select(`
              rating,
              courses!inner(creator_id)
            `)
            .eq('courses.creator_id', profile.id);

          const avgRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;

          // Get course categories as specialties
          const { data: courses } = await supabase
            .from('courses')
            .select('category')
            .eq('creator_id', profile.id)
            .eq('is_published', true);

          const specialties = courses 
            ? [...new Set(courses.map(course => course.category))].slice(0, 3)
            : [];

          return {
            id: profile.id,
            full_name: profile.full_name || profile.username || 'Creator',
            username: profile.username || '',
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            total_courses: courseCount || 0,
            total_students: studentCount || 0,
            total_events: eventCount || 0,
            average_rating: Number(avgRating.toFixed(1)),
            specialties
          };
        })
      );

      setCreators(creatorsWithStats.filter(creator => creator.total_courses > 0 || creator.total_events > 0));
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Learn from Expert <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Creators</span>
            </h2>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of students learning from industry professionals and thought leaders
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="animate-pulse h-80">
                <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {creators.map((creator) => (
              <Card key={creator.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden h-80 flex flex-col">
                {/* Upper half with gradient background and profile image */}
                <div className="h-40 bg-gradient-to-br from-orange-500 to-purple-600 relative flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-lg overflow-hidden ring-4 ring-white/30 shadow-xl">
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {creator.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                    </div>
                    {creator.average_rating > 0 && (
                        <div className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-1 shadow-lg">
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-800">{creator.average_rating}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Lower half with creator info */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                      {creator.full_name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                      {creator.bio || 'Expert instructor passionate about sharing knowledge and helping students succeed.'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-orange-500" />
                        <span>{creator.total_courses} courses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-purple-500" />
                        <span>{creator.total_events} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span>{creator.total_students}</span>
                      </div>
                    </div>
                    
                    {creator.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {creator.specialties.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-orange-100 to-purple-100 text-gray-700 border-0">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    asChild
                    className="w-full mt-3 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link to={`/creator/profile/${creator.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Button 
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Link to="/creators">
              Browse All Creators
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
