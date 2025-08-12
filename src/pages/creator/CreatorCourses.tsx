import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, BookOpen, Users, Star, DollarSign, Eye, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import CreatorLayout from '@/components/layout/CreatorLayout';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  is_published: boolean;
  created_at: string;
  enrollment_count?: number;
  average_rating?: number;
  total_reviews?: number;
}

const CreatorCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance courses with additional stats
      const enhancedCourses = await Promise.all(
        (data || []).map(async (course) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact' })
            .eq('course_id', course.id);

          // Get reviews and calculate average rating
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          const averageRating = reviews && reviews.length > 0 
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            enrollment_count: enrollmentCount || 0,
            average_rating: averageRating,
            total_reviews: reviews?.length || 0
          };
        })
      );

      setCourses(enhancedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">
              Manage your courses and track their performance
            </p>
          </div>
          <Button 
            onClick={() => navigate('/creator/courses/create')}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>{course.enrollment_count} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>${course.price}</span>
                    </div>
                    {course.average_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{course.average_rating.toFixed(1)} ({course.total_reviews})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span>Analytics</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/content`)}
                      className="flex-1"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Content
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first course to start sharing your knowledge
            </p>
            <Button 
              onClick={() => navigate('/creator/courses/create')}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
