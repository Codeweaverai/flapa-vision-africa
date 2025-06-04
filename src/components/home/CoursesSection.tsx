
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, Clock, Users, Star, TrendingUp, Play, Award } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  creator_id: string;
}

interface CourseStats {
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  actualDurationHours: number;
}

const CoursesSection = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCourses();

    // Set up real-time subscription for course updates
    const channel = supabase
      .channel('featured-courses-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        () => {
          fetchFeaturedCourses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_reviews'
        },
        () => {
          // Refresh stats when reviews change
          if (featuredCourses.length > 0) {
            const courseIds = featuredCourses.map(course => course.id);
            fetchCourseStats(courseIds);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      setFeaturedCourses(courses || []);
      
      if (courses && courses.length > 0) {
        const courseIds = courses.map(course => course.id);
        await fetchCourseStats(courseIds);
      }
    } catch (error) {
      console.error('Error fetching featured courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStats = async (courseIds: string[]) => {
    const stats: Record<string, CourseStats> = {};
    
    for (const courseId of courseIds) {
      try {
        // Fetch reviews and ratings
        const { data: reviews } = await supabase
          .from('course_reviews')
          .select('rating')
          .eq('course_id', courseId);

        // Fetch total enrollments
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId);

        // Calculate actual duration from lessons
        const { data: modules } = await supabase
          .from('course_modules')
          .select(`
            lessons (duration_minutes)
          `)
          .eq('course_id', courseId);

        let totalDuration = 0;
        if (modules) {
          modules.forEach(module => {
            if (module.lessons) {
              module.lessons.forEach((lesson: any) => {
                totalDuration += lesson.duration_minutes || 0;
              });
            }
          });
        }

        const averageRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        stats[courseId] = {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews?.length || 0,
          totalStudents: enrollments?.length || 0,
          actualDurationHours: Math.round((totalDuration / 60) * 10) / 10
        };
      } catch (error) {
        console.error(`Error fetching stats for course ${courseId}:`, error);
        stats[courseId] = {
          averageRating: 0,
          totalReviews: 0,
          totalStudents: 0,
          actualDurationHours: 0
        };
      }
    }
    
    setCourseStats(stats);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Featured Courses
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our most popular and highly-rated courses designed to accelerate your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredCourses.map((course) => {
            const stats = courseStats[course.id] || {
              averageRating: 0,
              totalReviews: 0,
              totalStudents: 0,
              actualDurationHours: 0
            };

            return (
              <Card 
                key={course.id} 
                className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:scale-105"
              >
                <div className="relative">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-500">
                      <BookOpen className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3">
                    {course.is_free ? (
                      <Badge className="bg-green-500 text-white border-0 shadow-lg">
                        Free
                      </Badge>
                    ) : (
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg">
                        ${course.price}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-0">
                      {course.category}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="border-purple-300 text-purple-600">
                      {course.difficulty_level}
                    </Badge>
                    {stats.averageRating > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{stats.averageRating}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 transition-colors duration-300">
                    {course.title}
                  </CardTitle>
                  
                  <CardDescription className="line-clamp-3 text-gray-600">
                    {course.summary}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Real-time Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">
                        {stats.actualDurationHours > 0 
                          ? `${stats.actualDurationHours}h` 
                          : `${Math.ceil(course.duration_minutes / 60)}h`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-gray-600">{stats.totalStudents} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-600">
                        {stats.averageRating > 0 ? `${stats.averageRating}` : 'No reviews'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">{stats.totalReviews} reviews</span>
                    </div>
                  </div>

                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Link to={`/learning/course-detail/${course.id}`} className="flex items-center justify-center">
                      <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      View Course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg"
          >
            <Link to="/courses">
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
