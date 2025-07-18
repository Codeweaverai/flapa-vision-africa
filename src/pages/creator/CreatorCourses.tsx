
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Eye, 
  Users, 
  DollarSign, 
  Clock, 
  BookOpen, 
  MoreVertical,
  Search,
  Filter,
  Play,
  Tag,
  Settings,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CoursePreviewDialog from '@/components/creator/CoursePreviewDialog';

interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  is_published: boolean;
  thumbnail_url?: string;
  certificate_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CourseStats {
  enrollments: number;
  revenue: number;
  completions: number;
  averageRating: number;
}

const CreatorCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);

      // Fetch stats for each course
      const stats: Record<string, CourseStats> = {};
      for (const course of coursesData || []) {
        try {
          // Get enrollments count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get revenue (sum of payments for this course)
          const { data: payments } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('course_id', course.id)
            .eq('payment_status', 'completed');

          const revenue = payments?.reduce((sum, payment) => sum + (course.price || 0), 0) || 0;

          // Get completions
          const { count: completionCount } = await supabase
            .from('course_progress')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('progress_percentage', 100);

          // Get average rating
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          const avgRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;

          stats[course.id] = {
            enrollments: enrollmentCount || 0,
            revenue,
            completions: completionCount || 0,
            averageRating: Math.round(avgRating * 10) / 10
          };
        } catch (error) {
          console.error(`Error fetching stats for course ${course.id}:`, error);
          stats[course.id] = {
            enrollments: 0,
            revenue: 0,
            completions: 0,
            averageRating: 0
          };
        }
      }

      setCourseStats(stats);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && course.is_published) ||
                         (statusFilter === 'draft' && !course.is_published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(courses.map(course => course.category))];

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">Manage and track your course content</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
            <Link to="/creator/courses/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
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
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const stats = courseStats[course.id] || {
                enrollments: 0,
                revenue: 0,
                completions: 0,
                averageRating: 0
              };

              return (
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
                        <BookOpen className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewCourse(course)}>
                            <Play className="h-4 w-4 mr-2" />
                            Preview Video
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/courses/${course.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Course
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/courses/${course.id}/content`}>
                              <FileText className="h-4 w-4 mr-2" />
                              Content
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/promo-codes?courseId=${course.id}`}>
                              <Tag className="h-4 w-4 mr-2" />
                              Promo Codes
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.summary}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{stats.enrollments} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>${stats.revenue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>{Math.ceil(course.duration_minutes / 60)}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        <span>{stats.completions} completed</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/creator/courses/${course.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/creator/courses/${course.id}/content`}>
                          <FileText className="h-4 w-4 mr-1" />
                          Content
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPreviewCourse(course)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No courses found' 
                  : 'No courses created yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search filters.'
                  : 'Create your first course to start sharing your knowledge.'}
              </p>
              {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  <Link to="/creator/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Course Preview Dialog */}
        <CoursePreviewDialog
          course={previewCourse}
          isOpen={!!previewCourse}
          onClose={() => setPreviewCourse(null)}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
