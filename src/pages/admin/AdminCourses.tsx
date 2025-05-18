
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Course, fetchAllCourses, deleteCourse, updateCourse } from '@/services/courseService';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const coursesData = await fetchAllCourses();
    setCourses(coursesData);
    setLoading(false);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    const success = await deleteCourse(courseToDelete.id);
    if (success) {
      setCourses(courses.filter(course => course.id !== courseToDelete.id));
      toast({
        title: "Course Deleted",
        description: `${courseToDelete.title} has been deleted successfully.`,
      });
    }
    
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const handleTogglePublish = async (course: Course) => {
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
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/admin/courses/edit/${courseId}`);
  };

  return (
    <AdminLayout title="Course Management">
      <div className="min-h-screen bg-light-purple">
        <div className="container mx-auto py-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
              <p className="text-muted-foreground">Create and manage your online courses.</p>
            </div>
            
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/admin/courses/create">
                <PlusCircle className="mr-2 h-4 w-4" />
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
                        <PlusCircle className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="mb-2">No courses yet</CardTitle>
                      <CardDescription className="mb-6">
                        Get started by creating your first course
                      </CardDescription>
                      <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link to="/admin/courses/create">
                          <PlusCircle className="mr-2 h-4 w-4" />
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
                          <span className="text-muted-foreground">No thumbnail</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={course.is_published ? "default" : "secondary"}>
                          {course.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex justify-between">
                        <Badge variant="outline">{course.category}</Badge>
                        <Badge variant="outline">{course.difficulty_level}</Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.summary}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <div className="flex text-sm text-muted-foreground mb-2">
                        <div className="mr-4">{Math.ceil(course.duration_minutes / 60)} hours</div>
                        <div>{course.price && course.price > 0 ? `$${course.price}` : "Free"}</div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditCourse(course.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant={course.is_published ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleTogglePublish(course)}
                      >
                        {course.is_published ? (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/learning/course/${course.id}`} target="_blank">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setCourseToDelete(course);
                          setDeleteDialogOpen(true);
                        }}
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
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Course</DialogTitle>
              </DialogHeader>
              <p className="py-4">
                Are you sure you want to delete <strong>{courseToDelete?.title}</strong>? 
                This will also delete all modules, lessons, and student progress data. 
                This action cannot be undone.
              </p>
              <DialogFooter className="flex space-x-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteCourse}>Delete Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
