import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Users, Calendar, Plus, UserPlus, Clock, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Course, fetchCreatorCourses, deleteCourse, updateCourse } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isPast } from 'date-fns';

const CreatorCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const coursesData = await fetchCreatorCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const success = await deleteCourse(id);
      if (success) {
        setCourses(courses.filter(course => course.id !== id));
        toast({
          title: "Course Deleted",
          description: "Course has been deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const updatedCourse = await updateCourse(course.id, {
        is_published: !course.is_published
      });
      
      if (updatedCourse) {
        setCourses(courses.map(c => c.id === course.id ? updatedCourse : c));
        toast({
          title: updatedCourse.is_published ? "Course Published" : "Course Unpublished",
          description: `${updatedCourse.title} has been ${updatedCourse.is_published ? 'published' : 'unpublished'}.`,
        });
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive"
      });
    }
  };

  return (
    <CreatorLayout title="My Courses">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">Manage your online courses</p>
        </div>
        <Button asChild>
          <Link to="/creator/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-6">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mb-2">No courses yet</CardTitle>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating your first course
                  </p>
                  <Button asChild>
                    <Link to="/creator/courses/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <div className="relative">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                      <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">
                      {course.category}
                    </Badge>
                    <Badge variant={course.is_free ? "secondary" : "outline"}>
                      {course.is_free ? "Free" : `$${course.price}`}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {Math.ceil((course.duration_minutes || 0) / 60)} hours
                  </div>
                </CardHeader>
                
                <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/creator/courses/edit/${course.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/creator/courses/${course.id}/content`}>
                      <FileText className="h-4 w-4 mr-1" />
                      Content
                    </Link>
                  </Button>

                  <Button
                    variant={course.is_published ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleTogglePublish(course)}
                  >
                    {course.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/learning/course-detail/${course.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </CreatorLayout>
  );
};

export default CreatorCourses;
