
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
  } | null;
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

      // Build query for courses
      let query = supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Add pagination if specified
      if (limit && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data: coursesData, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      const processedCourses: CourseData[] = [];
      
      // Process each course individually with explicit typing
      if (coursesData) {
        for (let i = 0; i < coursesData.length; i++) {
          const course = coursesData[i];
          
          try {
            // Fetch creator profile separately
            const profileQuery = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', course.creator_id)
              .maybeSingle();

            // Fetch reviews
            const reviewsQuery = await supabase
              .from('course_reviews')
              .select('*')
              .eq('course_id', course.id);

            // Fetch lesson count
            const lessonsQuery = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            // Fetch student count (enrollments)
            const enrollmentsQuery = await supabase
              .from('course_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            const profileData = profileQuery.data;
            const reviews = reviewsQuery.data || [];
            const lessonCount = lessonsQuery.count || 0;
            const studentCount = enrollmentsQuery.count || 0;

            // Calculate review statistics
            const reviewCount = reviews.length;
            const averageRating = reviewCount > 0 
              ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
              : 0;

            // Calculate positive percentage (4+ star reviews)
            const positiveReviews = reviews.filter(review => review.rating >= 4).length;
            const positivePercentage = reviewCount > 0 ? (positiveReviews / reviewCount) * 100 : 0;

            // Create the processed course object with explicit type
            const processedCourse: CourseData = {
              id: course.id,
              title: course.title,
              description: course.description,
              summary: course.summary,
              thumbnail_url: course.thumbnail_url,
              price: course.price,
              is_free: course.is_free,
              category: course.category,
              difficulty_level: course.difficulty_level,
              duration_minutes: course.duration_minutes,
              creator_id: course.creator_id,
              is_published: course.is_published,
              profiles: profileData ? {
                full_name: profileData.full_name || '',
                avatar_url: profileData.avatar_url || ''
              } : null,
              reviews: reviews,
              average_rating: averageRating,
              review_count: reviewCount,
              lesson_count: lessonCount,
              student_count: studentCount,
              positive_percentage: positivePercentage
            };

            processedCourses.push(processedCourse);
          } catch (error) {
            console.error(`Error processing course ${course.id}:`, error);
            // Skip this course and continue with others
          }
        }
      }

      if (loadMore) {
        setCourses(prev => [...prev, ...processedCourses]);
      } else {
        setCourses(processedCourses);
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
