import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Star, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PriceDisplay from '@/components/currency/PriceDisplay';
import WishlistButton from '@/components/wishlist/WishlistButton';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
          .limit(50);

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

  // Create infinite scroll effect by duplicating courses
  const duplicatedCourses = [...courses, ...courses, ...courses];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-left mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Featured Courses
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Discover high-quality courses designed to accelerate your learning journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-96">
                  <div className="bg-gray-300 h-40"></div>
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

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container mx-auto px-4">
        {/* Header - Left Aligned */}
        <div className="text-left mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover high-quality courses designed to accelerate your learning journey
          </p>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide space-x-6 pb-6 snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {duplicatedCourses.map((course, index) => (
              <div 
                key={`${course.id}-${index}`} 
                className="flex-none w-80 snap-start" // 320px width for 4 cards in a row
              >
                <Card className="group hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-purple-100 hover:border-purple-300 overflow-hidden h-96 flex flex-col">
                  {/* Course Thumbnail with Video Icon */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-purple-400 to-orange-400">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-white opacity-90" />
                      </div>
                    )}
                    
                    {/* Animated Orange Video Icon - Always Visible */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-orange-500/90 rounded-full p-3 shadow-lg animate-pulse-slow">
                        <Play className="h-5 w-5 text-white fill-current" />
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <Link 
                      to={`/learning/course-detail/${course.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <div className="bg-white rounded-full p-3 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                        <Play className="h-6 w-6 text-orange-600 fill-current" />
                      </div>
                    </Link>

                    {/* Wishlist Button */}
                    <div className="absolute top-3 right-3 z-20">
                      <WishlistButton 
                        itemId={course.id}
                        itemType="course"
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                      />
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 text-purple-800 border-purple-200 text-xs font-medium backdrop-blur-sm">
                        {course.category}
                      </Badge>
                    </div>

                    {/* Price/Free Badge */}
                    <div className="absolute bottom-3 right-3">
                      {course.is_free ? (
                        <Badge className="bg-green-500 text-white border-0 text-xs font-bold shadow-lg">
                          Free
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 text-white border-0 text-xs font-bold shadow-lg">
                          <PriceDisplay amount={course.price} originalCurrency="USD" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Course Content */}
                  <div className="flex-1 p-5 flex flex-col">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-base font-bold group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 leading-tight">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mt-2 text-gray-600 leading-relaxed">
                        {course.summary}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0 mt-auto space-y-3">
                      {/* Duration and Difficulty */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600 font-medium">
                          <Clock className="h-4 w-4 mr-2 text-purple-500" />
                          {formatDuration(course.duration_minutes)}
                        </div>
                        <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 text-xs font-semibold">
                          {course.difficulty_level}
                        </Badge>
                      </div>

                      {/* Reviews and Students */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-700 font-medium">
                          <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                          <span>{course.average_rating?.toFixed(1) || 0}</span>
                          <span className="ml-1 text-gray-500">({course.total_reviews || 0})</span>
                        </div>
                        <div className="flex items-center text-gray-700 font-medium">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{course.total_students || 0}</span>
                        </div>
                      </div>
                      
                      {/* View Course Button */}
                      <Link to={`/learning/course-detail/${course.id}`} className="block mt-3">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0 text-sm font-semibold py-2 h-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                          View Course
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Gradient Overlays for Better Scrolling Experience */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-purple-50 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-purple-50 to-transparent pointer-events-none"></div>
        </div>

        {/* Explore All Courses Button */}
        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl px-8">
            <Link to="/explore-courses">
              <BookOpen className="h-5 w-5 mr-2" />
              Explore All Courses
            </Link>
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </section>
  );
};

export default CoursesSection;
