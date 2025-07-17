
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  Book, 
  Users, 
  DollarSign,
  Settings,
  PlayCircle,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

const CreatorCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

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
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(course =>
        course.id === courseId ? { ...course, is_published: !currentStatus } : course
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
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && course.is_published) ||
                         (filterStatus === 'draft' && !course.is_published);
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(courses.map(course => course.category))];

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">Manage your course content and settings</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
            <Link to="/creator/courses/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Book className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {courses.length === 0 
                  ? "You haven't created any courses yet. Start building your first course!"
                  : "No courses match your current filters."}
              </p>
              {courses.length === 0 && (
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  <Link to="/creator/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-lg transition-shadow">
                {/* Course Thumbnail */}
                {course.thumbnail_url && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={course.is_published ? "default" : "outline"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="secondary">{course.category}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {course.summary || course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      0 students
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {course.is_free ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/creator/courses/${course.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/creator/courses/${course.id}/content`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Content
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/learning/course/${course.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Course
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublishStatus(course.id, course.is_published)}
                      className="flex-1"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {course.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>

                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/creator/promo-codes?item_type=course&item_id=${course.id}`}>
                      <Percent className="h-4 w-4 mr-2" />
                      Promo Codes
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCourse(course.id)}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </Button>
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
