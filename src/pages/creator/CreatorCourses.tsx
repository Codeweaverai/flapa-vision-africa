import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, BookOpen, Edit, Trash2, Eye, Users, DollarSign, Clock, Star, Play, Percent, Video, Bot } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import PaginationControls from '@/components/creator/PaginationControls';
import CoursePreviewDialog from '@/components/creator/CoursePreviewDialog';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { getEditableWorkplaceIds } from '@/services/workplaceService';

const COURSES_PER_PAGE = 6; // 2 rows × 3 cards per row

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url?: string;
  is_published: boolean;
  is_free: boolean;
  price: number;
  duration_minutes: number;
  category: string;
  difficulty_level: string;
  created_at: string;
  average_rating?: number;
  review_count?: number;
}

const CreatorCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm]);

  const loadCourses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch own courses
      const { data: ownCourses, error: ownError } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch editable workplace IDs
      const editableWorkplaceIds = await getEditableWorkplaceIds();
      
      let workplaceCourses: Course[] = [];
      if (editableWorkplaceIds.length > 0) {
        const { data: wpCourses, error: wpError } = await supabase
          .from('courses')
          .select('*')
          .in('workplace_id', editableWorkplaceIds)
          .order('created_at', { ascending: false });

        if (wpError) throw wpError;
        workplaceCourses = wpCourses || [];
      }

      // Merge and remove duplicates by id
      const allCourses = [...(ownCourses || []), ...workplaceCourses];
      const uniqueCourses = allCourses.filter((course, index, self) => 
        index === self.findIndex(c => c.id === course.id)
      );

      // Fetch review data for all courses
      const coursesWithReviews = await Promise.all(
        uniqueCourses.map(async (course) => {
          const { data: reviews, error: reviewError } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          if (reviewError) {
            console.error('Error fetching reviews for course:', course.id, reviewError);
            return { ...course, average_rating: 0, review_count: 0 };
          }

          if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            return {
              ...course,
              average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
              review_count: reviews.length
            };
          }

          return { ...course, average_rating: 0, review_count: 0 };
        })
      );

      setCourses(coursesWithReviews);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      
      await loadCourses();
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleTogglePublish = async (courseId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !isPublished })
        .eq('id', courseId);

      if (error) throw error;
      
      await loadCourses();
      toast.success(`Course ${!isPublished ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleAddPreview = (course: Course) => {
    setSelectedCourse(course);
    setPreviewDialogOpen(true);
  };

  const handleCreateWithAI = () => {
    navigate('/creator/courses/create-with-ai');
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
  const endIndex = startIndex + COURSES_PER_PAGE;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  if (loading) {
    return (
      <CreatorLayout title="My Courses">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="My Courses">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-gray-600">Create and manage your online courses</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateWithAI}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
          >
            <Bot className="h-4 w-4 mr-2" />
            Create with AI 🤖
          </Button>
          <Button
            onClick={() => navigate('/creator/courses/create')}
            className="bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'No courses match your search criteria.' : 'Create your first course to get started'}
            </p>
            {!searchTerm && (
              <div className="flex gap-3">
                <Button onClick={handleCreateWithAI} variant="outline">
                  <Bot className="h-4 w-4 mr-2" />
                  Create with AI
                </Button>
                <Button onClick={() => navigate('/creator/courses/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            {paginatedCourses.map((course) => (
              <Card key={course.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
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
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={course.is_published ? "default" : "secondary"}
                      className={course.is_published ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {course.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {course.difficulty_level}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {course.title}
                  </CardTitle>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.summary || course.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Course Stats */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.ceil((course.duration_minutes || 0) / 60)}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {course.is_free ? (
                        <span>Free</span>
                      ) : (
                        <PriceDisplay amount={course.price} originalCurrency="USD" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`h-4 w-4 ${course.average_rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                      <span>
                        {course.average_rating ? course.average_rating : '0.0'}
                        {course.review_count ? ` (${course.review_count})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                      className="bg-red-500 text-white hover:bg-red-700 hover:text-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/preview`)}
                      className="bg-orange-500 text-white hover:bg-orange-700 hover:text-white"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/content`)}
                      className="bg-green-500 text-white hover:bg-green-700 hover:text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Content
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/students`)}
                      className="bg-purple-500 text-white hover:bg-purple-700 hover:text-white"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Students
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddPreview(course)}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Add Preview
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/creator/promo-codes?item_type=course&item_id=${course.id}`)}
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Promo Codes
                  </Button>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 transition-all"
                    onClick={() => handleTogglePublish(course.id, course.is_published)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {course.is_published ? "Unpublish" : "Publish"}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <CoursePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        course={selectedCourse}
        onPreviewAdded={loadCourses}
      />
    </CreatorLayout>
  );
};

export default CreatorCourses;
