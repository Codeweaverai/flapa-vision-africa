
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Users, BookOpen, Award, Globe, Mail, Loader2 } from 'lucide-react';
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

      const creatorsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', profile.id)
            .eq('is_published', true);

          const { count: studentCount } = await supabase
            .from('course_enrollments')
            .select(`
              *,
              courses!inner(creator_id)
            `, { count: 'exact', head: true })
            .eq('courses.creator_id', profile.id);

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

          const { data: courses } = await supabase
            .from('courses')
            .select('category')
            .eq('creator_id', profile.id)
            .eq('is_published', true);

          const specialties = courses 
            ? [...new Set(courses.map(course => course.category))].slice(0, 2)
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
    <section className="py-16 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Learn from Expert <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Creators</span>
            </h2>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of students learning from industry professionals and thought leaders
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {creators.slice(0, 10).map((creator) => (
              <Card key={creator.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-105 overflow-hidden">
                <CardContent className="p-3 text-center">
                  <div className="relative mb-3">
                    <Avatar className="h-10 w-10 mx-auto ring-2 ring-orange-200">
                      <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                      <AvatarFallback className="text-xs font-semibold bg-gradient-to-r from-orange-100 to-purple-100 text-orange-700">
                        {creator.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Star className="h-1.5 w-1.5 text-white fill-current" />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-xs mb-1 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent line-clamp-1">
                    {creator.full_name}
                  </h3>
                  
                  <div className="flex justify-center items-center gap-2 mb-2 text-xs text-gray-500">
                    {creator.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{creator.average_rating}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5 text-orange-500" />
                      <span className="text-xs">{creator.total_students}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-2.5 w-2.5 text-purple-500" />
                      <span className="text-xs">{creator.total_courses}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {creator.specialties.slice(0, 1).map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs bg-gradient-to-r from-orange-100 to-purple-100 text-gray-700 border-0 px-1.5 py-0 h-4 text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    asChild
                    size="sm"
                    className="w-full text-xs h-7 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 transition-all duration-300 shadow-sm hover:shadow-md"
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
        
        <div className="text-center mt-10">
          <Button 
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
