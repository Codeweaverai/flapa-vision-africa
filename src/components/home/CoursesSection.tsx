import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Clock, Users, Star, Play, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
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
  creator_name?: string;
  creator_avatar?: string;
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // First, fetch courses without the complex join
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (coursesError) throw coursesError;

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Fetch additional data separately
        const courseIds = coursesData.map(course => course.id);
        const creatorIds = [...new Set(coursesData.map(course => course.creator_id).filter(Boolean))];

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('course_reviews')
          .select('course_id, rating')
          .in('course_id', courseIds);

        // Fetch enrollments
        const { data: enrollmentsData } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .in('course_id', courseIds);

        // Fetch creator profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', creatorIds);

        // Combine all data
        const coursesWithStats = coursesData.map(course => {
          const courseReviews = reviewsData?.filter(review => review.course_id === course.id) || [];
          const courseEnrollments = enrollmentsData?.filter(enrollment => enrollment.course_id === course.id) || [];
          const creatorProfile = profilesData?.find(profile => profile.id === course.creator_id);

          const averageRating = courseReviews.length > 0 
            ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length 
            : 0;

          return {
            ...course,
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: courseReviews.length,
            total_students: courseEnrollments.length,
            creator_name: creatorProfile?.full_name || creatorProfile?.username || 'Unknown Creator',
            creator_avatar: creatorProfile?.avatar_url || null
          };
        });

        setCourses(coursesWithStats);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="text-sm text-gray-600 ml-1 font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
                Featured Courses
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Discover high-quality courses designed to accelerate your learning journey
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex space-x-6 pb-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex-none w-80 animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[480px]">
                  <div className="bg-gray-300 h-56"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="flex justify-between mt-4">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
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
        {/* Header with Navigation Arrows */}
        <div className="flex items-end justify-between mb-12">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
              Featured Courses
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Discover high-quality courses designed to accelerate your learning journey
            </p>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={scrollLeft}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 hover:text-purple-600" />
            </Button>
            <Button
              onClick={scrollRight}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 shadow-sm"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 hover:text-orange-600" />
            </Button>
          </div>
        </div>

        {/* Horizontal Scrolling Container */}
        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-10"></div>
              <BookOpen className="h-20 w-20 text-gray-400 mx-auto relative" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Courses Available</h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              Check back soon for new courses and learning opportunities.
            </p>
          </div>
        ) : (
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
                  className="flex-none w-80 snap-start"
                >
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:scale-[1.02]">
                    <div className="relative">
                      {/* Course Thumbnail */}
                      <div className="relative h-56 overflow-hidden cursor-pointer">
                        {course.thumbnail_url ? (
                          <>
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Orange-Purple Gradient Video Icon with Pulse Animation - Always Visible on Images */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Outer Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                                {/* Middle Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                                {/* Main Icon Container */}
                                <div className="relative bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-2xl animate-pulse-slow transform hover:scale-110 transition-transform duration-300">
                                  <Play className="h-8 w-8 text-white fill-current" />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-purple-200 to-pink-300 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-500">
                            {/* Animated Video Icon with Orange-Purple Gradient for Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Outer Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                                {/* Middle Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                                {/* Main Icon Container */}
                                <div className="relative bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-2xl animate-pulse-slow transform hover:scale-110 transition-transform duration-300">
                                  <Play className="h-8 w-8 text-white fill-current" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Category and Difficulty Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm font-medium">
                            {course.category}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg font-medium">
                            {course.difficulty_level}
                          </Badge>
                        </div>

                        {/* Duration Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/30">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {formatDuration(course.duration_minutes)}
                          </div>
                        </div>

                        {/* Wishlist Button */}
                        <div className="absolute bottom-4 right-4 z-20">
                          <WishlistButton 
                            itemId={course.id}
                            itemType="course"
                            variant="ghost"
                            size="icon"
                            iconOnly
                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-0 hover:text-red-500"
                          />
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="cursor-pointer">
                        <CardHeader className="pb-3">
                          {/* Course Title - Truncated to only one line */}
                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors duration-300 leading-tight">
                            {course.title}
                          </CardTitle>
                          
                          {/* Creator with Avatar */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Avatar className="h-6 w-6 border border-orange-200">
                              <AvatarImage 
                                src={course.creator_avatar || undefined} 
                                alt={course.creator_name}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white text-xs font-bold">
                                {course.creator_name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">by {course.creator_name}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Course Summary */}
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {course.summary}
                          </p>

                          {/* Course Reviews */}
                          {course.total_reviews && course.total_reviews > 0 && (
                            <div className="flex items-center justify-between">
                              {renderStarRating(course.average_rating || 0)}
                              <span className="text-xs text-gray-500 font-medium">
                                {course.total_reviews} review{course.total_reviews !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {/* Students Count */}
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                            <span className="font-medium">{course.total_students || 0} students enrolled</span>
                          </div>
                        </CardContent>

                        <CardContent className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-1 text-orange-500" />
                            <span className="font-bold text-xl text-gray-900">
                              {course.is_free ? (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                  Free
                                </span>
                              ) : (
                                <PriceDisplay amount={course.price} originalCurrency="USD" />
                              )}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                            asChild
                          >
                            <Link to={`/learning/course-detail/${course.id}`}>
                              <Play className="h-4 w-4 mr-1 text-white fill-current" />
                              Enroll Now
                            </Link>
                          </Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-12">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl px-8"
          >
            <Link to="/explore-courses" className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Explore All Courses
            </Link>
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />
    </section>
  );
};

export default CoursesSection;
