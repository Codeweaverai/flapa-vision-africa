
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit2, Trash2, Users, BookOpen, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  is_published: boolean;
  certificate_enabled: boolean;
  thumbnail_url: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  course_enrollments?: { id: string }[];
}

const CreatorCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const categories = [
    'Technology',
    'Business',
    'Marketing',
    'Design',
    'Development',
    'Data Science',
    'Health & Fitness',
    'Lifestyle',
    'Language',
    'Music',
    'Photography'
  ];

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_enrollments(id)
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('creator_id', user?.id);

      if (error) throw error;
      
      setCourses(courses.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId)
        .eq('creator_id', user?.id);

      if (error) throw error;

      setCourses(courses.map(course => 
        course.id === courseId 
          ? { ...course, is_published: !currentStatus }
          : course
      ));
      
      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating course status:', error);
      toast.error('Failed to update course status');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'published' && course.is_published) ||
                         (selectedStatus === 'draft' && !course.is_published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <CreatorLayout title="My Courses">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="My Courses">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">
              Manage and track your courses
            </p>
          </div>
          <Button 
            onClick={() => navigate('/creator/courses/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Courses</span>
              </div>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Published</span>
              </div>
              <div className="text-2xl font-bold">
                {courses.filter(c => c.is_published).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Students</span>
              </div>
              <div className="text-2xl font-bold">
                {courses.reduce((sum, course) => sum + (course.course_enrollments?.length || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Free Courses</span>
              </div>
              <div className="text-2xl font-bold">
                {courses.filter(c => c.is_free).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters to see more courses.'
                  : 'Create your first course to get started.'}
              </p>
              {(!searchTerm && selectedCategory === 'all' && selectedStatus === 'all') && (
                <Button onClick={() => navigate('/creator/courses/create')}>
                  Create Your First Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="relative">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    {course.is_free && (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.summary || course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.course_enrollments?.length || 0} students
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {course.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {course.difficulty_level}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant={course.is_published ? "secondary" : "default"}
                      size="sm"
                      onClick={() => togglePublishStatus(course.id, course.is_published)}
                      className="flex-1"
                    >
                      {course.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/courses/${course.id}/content`)}
                      className="flex-1"
                    >
                      Manage Content
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
