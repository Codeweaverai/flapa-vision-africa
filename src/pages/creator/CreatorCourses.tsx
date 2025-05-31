import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, BookOpen, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/layout/CreatorLayout';
import { Course, fetchCreatorCourses, deleteCourse } from '@/services/courseService';
import CoursePreviewDialog from '@/components/creator/CoursePreviewDialog';

const CreatorCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await fetchCreatorCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
        toast.success('Course deleted successfully');
        loadCourses(); // Refresh the course list
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course');
      }
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">My Courses</h2>
            <p className="text-muted-foreground">Manage and edit your created courses here.</p>
          </div>
          <Button asChild>
            <Link to="/creator/courses/create">Create New Course</Link>
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="h-40 w-full object-cover rounded-md"
                />
              ) : (
                <div className="h-40 bg-gray-100 rounded-md" />
              )}
              
              <CardContent className="flex-1 p-6">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.summary}</CardDescription>
                </CardHeader>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button asChild size="sm">
                    <Link to={`/creator/courses/${course.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/creator/courses/${course.id}/content`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Content
                    </Link>
                  </Button>
                  <CoursePreviewDialog 
                    courseId={course.id} 
                    onPreviewUpdated={() => loadCourses()}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCourse(course.id)}
                        className="focus:bg-destructive/5 text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/course/${course.id}`}>
                          View Course
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center">Loading courses...</div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center">
            No courses created yet. <Link to="/creator/courses/create">Create one now!</Link>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
