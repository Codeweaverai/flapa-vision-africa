
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchPublishedCourses, fetchCourseStats } from '@/services/courseService';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface TrendingCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  category: string;
  creator_id: string;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
}

const TrendingNowSection = () => {
  const [trendingCourses, setTrendingCourses] = useState<TrendingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrendingCourses = async () => {
      try {
        const courses = await fetchPublishedCourses();
        
        // Get stats for each course and sort by popularity
        const coursesWithStats = await Promise.all(
          courses.slice(0, 8).map(async (course) => {
            const stats = await fetchCourseStats(course.id);
            return {
              ...course,
              ...stats
            };
          })
        );

        // Sort by total students (popularity) and rating
        const trending = coursesWithStats
          .sort((a, b) => (b.totalStudents * b.averageRating) - (a.totalStudents * a.averageRating))
          .slice(0, 6);

        setTrendingCourses(trending);
      } catch (error) {
        console.error('Error loading trending courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingCourses();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <h2 className="text-3xl md:text-4xl font-bold">Trending Now</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the most popular courses that learners are enrolling in right now
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {trendingCourses.map((course, index) => (
            <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="relative">
                {index < 3 && (
                  <Badge className="absolute top-4 left-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    #{index + 1} Trending
                  </Badge>
                )}
                <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">{course.category}</p>
                    </div>
                  )}
                </div>
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
                    <Users className="h-4 w-4" />
                    <span>{course.totalStudents}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.averageRating.toFixed(1)}</span>
                    <span>({course.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(course.duration_minutes / 60)}h</span>
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
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                    View Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/courses">
            <Button variant="outline" size="lg" className="border-2 hover:bg-primary hover:text-white">
              View All Courses
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingNowSection;
