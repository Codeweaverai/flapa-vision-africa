
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CourseReview {
  id: string;
  rating: number;
  review_text: string;
  user_id: string;
  created_at: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  creator_id: string;
  is_published: boolean;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  reviews?: CourseReview[];
  average_rating?: number;
  review_count?: number;
  lesson_count?: number;
  student_count?: number;
  positive_percentage?: number;
}

export const useCourseData = (limit?: number, offset?: number) => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchCourses = async (loadMore = false) => {
    try {
      setLoading(true);
      
      // Get total count first
      const { count: totalCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      setTotal(totalCount || 0);

      // Build query
      let query = supabase
        .from('courses')
        .select(`
          *,
          profiles:creator_id (
            full_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Add pagination if specified
      if (limit && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data: coursesData, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      // Fetch additional data for each course
      const coursesWithData = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Fetch reviews
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('*')
            .eq('course_id', course.id);

          // Fetch lesson count
          const { count: lessonCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Fetch student count (enrollments)
          const { count: studentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Calculate review statistics
          const reviewCount = reviews?.length || 0;
          const averageRating = reviewCount > 0 
            ? reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            : 0;

          // Calculate positive percentage (4+ star reviews)
          const positiveReviews = reviews?.filter(review => review.rating >= 4).length || 0;
          const positivePercentage = reviewCount > 0 ? (positiveReviews / reviewCount) * 100 : 0;

          return {
            ...course,
            reviews,
            average_rating: averageRating,
            review_count: reviewCount,
            lesson_count: lessonCount || 0,
            student_count: studentCount || 0,
            positive_percentage: positivePercentage
          };
        })
      );

      if (loadMore) {
        setCourses(prev => [...prev, ...coursesWithData]);
      } else {
        setCourses(coursesWithData);
      }

      // Check if there are more courses to load
      if (limit && offset !== undefined) {
        setHasMore((offset + limit) < (totalCount || 0));
      }

    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const loadMore = () => {
    if (hasMore && !loading && limit && offset !== undefined) {
      fetchCourses(true);
    }
  };

  return {
    courses,
    loading,
    hasMore,
    total,
    loadMore,
    refetch: () => fetchCourses()
  };
};
