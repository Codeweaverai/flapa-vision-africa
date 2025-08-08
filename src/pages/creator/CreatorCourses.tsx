
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Copy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import CoursePublishButton from '@/components/creator/CoursePublishButton';
import CoursePreviewDialog from '@/components/creator/CoursePreviewDialog';

interface Course {
  id: string;
  title: string;
  description: string;
  summary?: string;
  price: number;
  is_free: boolean;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  creator_id: string;
  is_published: boolean;
  certificate_enabled?: boolean;
  created_at: string;
}

const CreatorCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCourse = async (course: Course) => {
    if (!user) return;

    try {
      const duplicatedCourse = {
        title: `${course.title} (Copy)`,
        description: course.description,
        summary: course.summary || course.description.substring(0, 200) + '...',
        price: course.price,
        is_free: course.is_free,
        category: course.category,
        difficulty_level: course.difficulty_level,
        duration_minutes: course.duration_minutes,
        thumbnail_url: course.thumbnail_url,
        creator_id: user.id,
        is_published: false,
        certificate_enabled: course.certificate_enabled || false
      };

      const { error } = await supabase
        .from('courses')
        .insert([duplicatedCourse]);

      if (error) throw error;

      toast.success('Course duplicated successfully');
      await loadCourses();
    } catch (error) {
      console.error('Error duplicating course:', error);
      toast.error('Failed to duplicate course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Course deleted successfully');
      await loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleStatusChange = async () => {
    await loadCourses();
  };

  const handlePreviewCourse = (course: Course) => {
    setSelectedCourse(course);
    setPreviewOpen(true);
  };

  return (
    <CreatorLayout title="My Courses">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <Button onClick={() => navigate('/creator/courses/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              {/* Placeholder for icon */}
            </div>
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Create and manage your online courses
            </p>
            <Button onClick={() => navigate('/creator/courses/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              {course.thumbnail_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {course.summary || course.description}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {course.is_free ? 'Free' : `$${course.price}`}
                  </Badge>
                </div>
              </CardHeader>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <CoursePublishButton 
                      courseId={course.id}
                      isPublished={course.is_published}
                      onStatusChange={handleStatusChange} 
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateCourse(course)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CoursePreviewDialog
        course={selectedCourse}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onPreviewAdded={() => {
          console.log('Preview added for course:', selectedCourse?.id);
        }}
      />
    </CreatorLayout>
  );
};

export default CreatorCourses;
