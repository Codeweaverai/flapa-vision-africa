
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PaginationControls from './PaginationControls';
import { BookOpen, Users, Star, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  enrollments_count?: number;
  avg_rating?: number;
}

interface CreatorCoursePaginationProps {
  onEditCourse?: (courseId: string) => void;
  onViewContent?: (courseId: string) => void;
  onPublishToggle?: (courseId: string, isPublished: boolean) => void;
}

const COURSES_PER_PAGE = 8; // 2 rows with 4 cards each

const CreatorCoursePagination: React.FC<CreatorCoursePaginationProps> = ({
  onEditCourse,
  onViewContent,
  onPublishToggle
}) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Fetch additional stats for each course
      const coursesWithStats = await Promise.all(
        coursesData.map(async (course) => {
          // Get enrollment count
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', course.id)
            .eq('payment_status', 'completed');

          // Get average rating
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          const avgRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

          return {
            ...course,
            enrollments_count: enrollments?.length || 0,
            avg_rating: avgRating
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(courses.length / COURSES_PER_PAGE);
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
  const endIndex = startIndex + COURSES_PER_PAGE;
  const currentCourses = courses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
        <p className="text-gray-600 mb-6">Create your first course to start sharing your knowledge.</p>
        <Button asChild>
          <Link to="/creator/courses/create">
            <BookOpen className="h-4 w-4 mr-2" />
            Create Course
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentCourses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-600" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <Badge
                  variant={course.is_published ? "default" : "secondary"}
                  className={course.is_published ? "bg-green-500" : "bg-yellow-500"}
                >
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              
              <div className="absolute top-2 left-2">
                {course.is_free ? (
                  <Badge className="bg-green-500 text-white">
                    Free
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500 text-white">
                    <PriceDisplay amount={course.price} originalCurrency="USD" />
                  </Badge>
                )}
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-xs">
                  {course.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {course.difficulty_level}
                </Badge>
              </div>
              
              <CardTitle className="text-lg line-clamp-2">
                {course.title}
              </CardTitle>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {course.description}
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course.enrollments_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                  <span>{course.avg_rating ? course.avg_rating.toFixed(1) : '0.0'}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {Math.ceil((course.duration_minutes || 0) / 60)}h
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onEditCourse?.(course.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onViewContent?.(course.id)}
                  >
                    Content
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant={course.is_published ? "secondary" : "default"}
                  className="w-full"
                  onClick={() => onPublishToggle?.(course.id, course.is_published)}
                >
                  {course.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CreatorCoursePagination;
