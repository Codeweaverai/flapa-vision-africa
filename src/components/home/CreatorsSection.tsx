
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Users, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Creator {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  total_courses: number;
  total_students: number;
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
        .limit(6);

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
            average_rating: Number(avgRating.toFixed(1)),
            specialties
          };
        })
      );

      setCreators(creatorsWithStats.filter(creator => creator.total_courses > 0));
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="h-20 w-20 rounded-full bg-gray-200 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creators.map((creator) => (
              <Card key={creator.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white">
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-20 w-20 mx-auto ring-4 ring-gradient-to-r from-orange-200 to-purple-200">
                      <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-orange-100 to-purple-100">
                        {creator.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-white fill-current" />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    {creator.full_name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {creator.bio || 'Expert Instructor'}
                  </p>
                  
                  <div className="flex justify-center items-center gap-4 mb-4 text-sm text-gray-500">
                    {creator.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{creator.average_rating}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span>{creator.total_students}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span>{creator.total_courses}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {creator.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs bg-gradient-to-r from-orange-100 to-purple-100 text-gray-700 border-0">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    asChild
                    variant="outline" 
                    className="w-full border-2 border-gradient-to-r from-orange-200 to-purple-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all duration-300"
                  >
                    <Link to={`/creator/${creator.username || creator.id}`}>
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
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
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
