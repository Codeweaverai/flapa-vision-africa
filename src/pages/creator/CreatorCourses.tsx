
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Clock, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import PaginationControls from '@/components/creator/PaginationControls';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  enrollment_count?: number;
  average_rating?: number;
  review_count?: number;
  lesson_count?: number;
}

const ITEMS_PER_PAGE = 6; // 2 rows of 3 cards each

const CreatorCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCreatorCourses();
    }
  }, [user, currentPage]);

  const fetchCreatorCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get total count
      const { count: totalCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      setTotalCourses(totalCount || 0);

      // Get paginated courses
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (coursesError) throw coursesError;

      // Fetch additional data for each course
      const coursesWithData = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get reviews
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('*')
            .eq('course_id', course.id);

          // Get lesson count
          const { count: lessonCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          const reviewCount = reviews?.length || 0;
          const averageRating = reviewCount > 0 
            ? reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            : 0;

          return {
            ...course,
            enrollment_count: enrollmentCount || 0,
            average_rating: averageRating,
            review_count: reviewCount,
            lesson_count: lessonCount || 0
          };
        })
      );

      setCourses(coursesWithData);
    } catch (error) {
      console.error('Error fetching creator courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCourses / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && currentPage === 1) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
              <p className="text-gray-600">Manage and track your course content</p>
            </div>
            <Button
              onClick={() => navigate('/creator/courses/create')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Course
            </Button>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-blue-200">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start creating your first course to share your knowledge with students.
                </p>
                <Button
                  onClick={() => navigate('/creator/courses/create')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card 
                    key={course.id}
                    className="group hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-blue-200 hover:border-purple-300 hover:-translate-y-2"
                  >
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={course.thumbnail_url || '/placeholder-course.jpg'}
                        alt={course.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge 
                          variant={course.is_published ? "default" : "secondary"}
                          className={course.is_published ? "bg-green-500" : "bg-gray-500"}
                        >
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      {!course.is_free && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-semibold">
                            <PriceDisplay amount={course.price} originalCurrency="USD" />
                          </Badge>
                        </div>
                      )}
                      {course.is_free && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white">
                            FREE
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                        {course.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {course.summary || course.description}
                      </p>

                      {/* Stats Section */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600">{course.lesson_count}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">{course.enrollment_count}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600">{formatDuration(course.duration_minutes)}</span>
                        </div>
                      </div>

                      {/* Reviews */}
                      {course.review_count > 0 && (
                        <div className="flex items-center gap-2">
                          {renderStars(Math.round(course.average_rating || 0))}
                          <span className="text-sm text-gray-600">
                            {course.average_rating?.toFixed(1)} ({course.review_count})
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => navigate(`/courses/${course.id}`)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={totalCourses}
                />
              )}
            </>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
