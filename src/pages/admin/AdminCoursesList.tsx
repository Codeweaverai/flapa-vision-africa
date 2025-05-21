
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { fetchAllCourses, deleteCourse } from '@/services/courseService';
import { Course } from '@/services/courseService';
import { CSVLink } from 'react-csv';

const AdminCoursesList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await fetchAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        await deleteCourse(courseId);
        toast.success("Course deleted successfully");
        fetchCourses(); // Refresh the list
      } catch (error) {
        console.error("Error deleting course:", error);
        toast.error("Failed to delete course");
      }
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.difficulty_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCsvData = () => {
    return courses.map(course => ({
      'Title': course.title,
      'Category': course.category,
      'Difficulty': course.difficulty_level,
      'Price': course.is_free ? 'Free' : `$${course.price}`,
      'Duration (min)': course.duration_minutes,
      'Published': course.is_published ? 'Yes' : 'No',
      'Certificate': course.certificate_enabled ? 'Yes' : 'No',
      'Created': course.created_at ? new Date(course.created_at).toLocaleDateString() : 'N/A'
    }));
  };

  return (
    <AdminLayout title="Courses">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Course Management</h1>
          <div className="flex gap-2">
            <CSVLink
              data={getCsvData()}
              filename="courses-export.csv"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </CSVLink>
            <Button 
              onClick={() => navigate('/admin/courses/create')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Courses</CardTitle>
                <CardDescription>
                  Manage and organize your courses
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No courses found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>{course.difficulty_level}</TableCell>
                        <TableCell>
                          {course.is_free ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            <Badge variant="outline">${course.price}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.is_published ? (
                            <Badge variant="default">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/courses/content/${course.id}`)}
                          >
                            Content
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            color="destructive"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCoursesList;
