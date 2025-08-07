
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Users, 
  DollarSign,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Settings,
  Copy,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CoursePublishButton from '@/components/creator/CoursePublishButton';
import CoursePreviewDialog from '@/components/creator/CoursePreviewDialog';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  thumbnail_url?: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  certificate_enabled?: boolean;
  creator_id?: string;
}

const CreatorCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCourse = async (courseId: string) => {
    try {
      const { data: originalCourse, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (fetchError) throw fetchError;

      const { title, description, summary, price, is_free, category, difficulty_level, duration_minutes, thumbnail_url, certificate_enabled } = originalCourse;

      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: `${title} (Copy)`,
          description,
          summary: summary || `Copy of ${title}`,
          price,
          is_free,
          category,
          difficulty_level,
          duration_minutes,
          thumbnail_url,
          certificate_enabled: certificate_enabled || false,
          creator_id: user?.id,
          is_published: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Course duplicated successfully');
      await fetchCourses();
    } catch (error) {
      console.error('Error duplicating course:', error);
      toast.error('Failed to duplicate course');
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

      toast.success('Course deleted successfully');
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const publishedCourses = courses.filter(course => course.is_published);
  const draftCourses = courses.filter(course => !course.is_published);

  if (loading) {
    return (
      <CreatorLayout title="My Courses">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="My Courses">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Courses</h2>
            <p className="text-muted-foreground">
              Create and manage your course content
            </p>
          </div>
          <Button onClick={() => navigate('/creator/courses/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Total Courses</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-2xl font-bold">{publishedCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Drafts</p>
                  <p className="text-2xl font-bold">{draftCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Paid Courses</p>
                  <p className="text-2xl font-bold">
                    {courses.filter(course => !course.is_free).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'No courses match your search criteria'
                : 'Get started by creating your first course'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/creator/courses/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant={course.is_free ? 'outline' : 'default'}>
                      {course.is_free ? 'Free' : `$${course.price}`}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3 mb-4">
                    {course.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{course.duration_minutes} min</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {course.difficulty_level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCourse(course);
                          setPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <CoursePublishButton 
                        courseId={course.id}
                        isPublished={course.is_published}
                        onStatusChange={fetchCourses} 
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/creator/courses/${course.id}/content`)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Content
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateCourse(course.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedCourse && (
          <CoursePreviewDialog
            course={selectedCourse}
            open={previewDialogOpen}
            onOpenChange={setPreviewDialogOpen}
          />
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
