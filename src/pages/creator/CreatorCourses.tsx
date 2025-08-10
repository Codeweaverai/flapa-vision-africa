import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, Users, Play, Percent } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const CreatorCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;

      await loadCourses();
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      await loadCourses();
      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <p className="text-gray-600">Manage your courses and track enrollments</p>
        <Button
          onClick={() => navigate('/creator/courses/create')}
          className="bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-primary"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="9" x2="15" y1="9" y2="9" />
                <line x1="9" x2="15" y1="13" y2="13" />
              </svg>
            </div>
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'No courses match your search criteria.' : 'Create your first course to get started'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/creator/courses/create')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Course
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="relative overflow-hidden">
              {course.thumbnail_url && (
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${course.thumbnail_url})` }} />
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      {format(parseISO(course.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/creator/courses/${course.id}/content`)}
                    className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 ease-in-out flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    className="bg-orange-600 text-white hover:bg-orange-700 transition-colors duration-300 ease-in-out flex items-center"
                    size="sm"
                    onClick={() => navigate(`/course-detail/${course.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    className="bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300 ease-in-out flex items-center"
                    size="sm"
                    onClick={() => navigate(`/creator/courses/${course.id}/students`)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Students
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigate(`/creator/promo-codes?item_type=course&item_id=${course.id}`)}
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Promo Codes
                  </Button>
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
                    size="sm"
                    onClick={() => handleTogglePublish(course.id, course.is_published)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {course.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CreatorLayout>
  );
};

export default CreatorCourses;
