
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Course {
  id: string;
  title: string;
  summary: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
}

interface RecommendedCoursesProps {
  currentCourseId: string;
  category?: string;
}

const RecommendedCourses = ({ currentCourseId, category }: RecommendedCoursesProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedCourses = async () => {
      try {
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .neq('id', currentCourseId)
          .limit(3);

        // If we have a category, prioritize courses from the same category
        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // If we don't have enough courses from the same category, fetch more
        if (data && data.length < 3) {
          const { data: moreCourses, error: moreError } = await supabase
            .from('courses')
            .select('*')
            .eq('is_published', true)
            .neq('id', currentCourseId)
            .limit(3 - data.length)
            .order('created_at', { ascending: false });

          if (!moreError && moreCourses) {
            setCourses([...data, ...moreCourses]);
          } else {
            setCourses(data || []);
          }
        } else {
          setCourses(data || []);
        }
      } catch (error) {
        console.error('Error fetching recommended courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedCourses();
  }, [currentCourseId, category]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            Recommended Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-96">
                  <div className="bg-gray-300 h-48"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
          Recommended Courses
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-purple-200 hover:border-purple-300 overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white opacity-80" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    {course.category}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  {course.is_free ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Free
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <PriceDisplay amount={course.price} originalCurrency="USD" />
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="pb-4">
                <CardTitle className="text-lg group-hover:text-purple-600 transition-colors line-clamp-2">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {course.summary}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(course.duration_minutes)}
                  </div>
                  <Badge variant="outline" className="border-orange-200 text-orange-600">
                    {course.difficulty_level}
                  </Badge>
                </div>
                
                <Link to={`/learning/course-detail/${course.id}`}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0">
                    View Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0">
            <Link to="/explore-courses">
              <BookOpen className="h-5 w-5 mr-2" />
              Explore All Courses
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecommendedCourses;
