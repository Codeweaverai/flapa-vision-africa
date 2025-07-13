
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Star, Play } from 'lucide-react';
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
  creator_id: string;
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            course_reviews (rating),
            course_enrollments (id)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Calculate ratings and student counts
        const coursesWithStats = (data || []).map(course => {
          const reviews = course.course_reviews || [];
          const enrollments = course.course_enrollments || [];
          
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: reviews.length,
            total_students: enrollments.length,
            course_reviews: undefined,
            course_enrollments: undefined
          };
        });

        setCourses(coursesWithStats);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Featured Courses
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover high-quality courses designed to accelerate your learning journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden h-80">
                  <div className="bg-gray-300 h-32"></div>
                  <div className="p-4 space-y-2">
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

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover high-quality courses designed to accelerate your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-purple-200 hover:border-purple-300 overflow-hidden h-fit">
              <div className="relative h-32 overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white opacity-80" />
                  </div>
                )}
                
                {/* Video Play Icon */}
                <Link 
                  to={`/learning/course-detail/${course.id}`}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="bg-white/90 rounded-full p-2 hover:bg-white transition-colors">
                    <Play className="h-4 w-4 text-purple-600" />
                  </div>
                </Link>

                <div className="absolute top-2 left-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    {course.category}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  {course.is_free ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      Free
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      <PriceDisplay amount={course.price} originalCurrency="USD" />
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="pb-2 p-3">
                <CardTitle className="text-sm group-hover:text-purple-600 transition-colors line-clamp-2 h-10">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs h-8">
                  {course.summary}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(course.duration_minutes)}
                  </div>
                  <Badge variant="outline" className="border-orange-200 text-orange-600 text-xs">
                    {course.difficulty_level}
                  </Badge>
                </div>

                {/* Reviews and Students */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center text-gray-600">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    <span>{course.average_rating || 0}</span>
                    <span className="ml-1">({course.total_reviews || 0})</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{course.total_students || 0}</span>
                  </div>
                </div>
                
                <Link to={`/learning/course-detail/${course.id}`}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0 text-xs py-1 h-8">
                    View Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
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

export default CoursesSection;
