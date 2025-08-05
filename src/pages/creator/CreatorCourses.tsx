
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Clock, DollarSign, Edit, FileText, MoreVertical, Plus, Trash2, Users, BarChart } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { 
  fetchCreatorCourses,
  deleteCourse as deleteCourseService
} from '@/services/courseService';

const ITEMS_PER_PAGE = 6;

const CreatorCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user, currentPage]);

  const loadCourses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await fetchCreatorCourses(user.id, ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
      setCourses(result.courses);
      setTotalCourses(result.total);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCourse = (course: any) => {
    navigate(`/creator/courses/edit/${course.id}`);
  };

  const handleManageContent = (courseId: string) => {
    navigate(`/creator/courses/${courseId}/content`);
  };

  const handleViewStudents = (courseId: string) => {
    navigate(`/creator/courses/${courseId}/students`);
  };

  const handleViewAnalytics = (courseId: string) => {
    navigate(`/creator/courses/${courseId}/analytics`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await deleteCourseService(courseId);
      setCourses(courses.filter(course => course.id !== courseId));
      toast({
        title: "Course deleted",
        description: "The course has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalCourses / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <CreatorLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Your Courses</h1>
          <Input
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="max-w-md"
          />
          <Button onClick={() => navigate('/creator/courses/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="w-24 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No courses match your search criteria.' : 'You haven\'t created any courses yet.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/creator/courses/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-24 h-16 bg-gradient-to-br from-purple-100 to-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {course.thumbnail_url ? (
                            <img 
                              src={course.thumbnail_url} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-8 w-8 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg truncate">{course.title}</h3>
                            <Badge variant={course.is_published ? "default" : "secondary"}>
                              {course.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {course.duration_minutes} min
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {course.enrollment_count || 0} enrolled
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {course.is_free ? 'Free' : `$${course.price}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageContent(course.id)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Manage Content
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewStudents(course.id)}>
                            <Users className="h-4 w-4 mr-2" />
                            View Students
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewAnalytics(course.id)}>
                            <BarChart className="h-4 w-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
