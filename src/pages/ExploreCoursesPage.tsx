import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Book, Clock, Search, Users, Compass } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  category: string;
  difficulty_level: string;
  enrollmentCount: number;
}

const ExploreCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const coursesPerPage = 9;

  useEffect(() => {
    fetchCourses();
  }, [currentPage, selectedCategory, selectedDifficulty, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Base query
      let query = supabase
        .from('courses')
        .select(`
          *,
          enrollments:course_enrollments(count)
        `)
        .eq('is_published', true);
        
      // Apply filters
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty_level', selectedDifficulty);
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      // Calculate pagination
      const from = (currentPage - 1) * coursesPerPage;
      const to = from + coursesPerPage - 1;
      
      // Get counts for pagination - fixed to create a new query instead of clone
      const countQuery = supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      // Apply the same filters to the count query
      if (selectedCategory !== 'all') {
        countQuery.eq('category', selectedCategory);
      }
      
      if (selectedDifficulty !== 'all') {
        countQuery.eq('difficulty_level', selectedDifficulty);
      }
      
      if (searchTerm) {
        countQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error getting count:", countError);
        return;
      }
      
      // Calculate total pages
      setTotalPages(Math.ceil((count || 0) / coursesPerPage));
      
      // Apply pagination to original query
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Format data
      const formattedCourses = data.map(course => ({
        ...course,
        enrollmentCount: course?.enrollments?.length || 0
      }));
      
      setCourses(formattedCourses);
      
      // Fetch unique categories and difficulties
      if (categories.length === 0) {
        const { data: categoriesData } = await supabase
          .from('courses')
          .select('category')
          .eq('is_published', true)
          .not('category', 'is', null);
        
        if (categoriesData) {
          const uniqueCategories = [...new Set(categoriesData.map(item => item.category))];
          setCategories(uniqueCategories);
        }
      }
      
      if (difficulties.length === 0) {
        const { data: difficultiesData } = await supabase
          .from('courses')
          .select('difficulty_level')
          .eq('is_published', true)
          .not('difficulty_level', 'is', null);
        
        if (difficultiesData) {
          const uniqueDifficulties = [...new Set(difficultiesData.map(item => item.difficulty_level))];
          setDifficulties(uniqueDifficulties);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  return (
    <Layout>
      <div className="bg-light-purple min-h-screen">
        <div className="container mx-auto py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Explore Courses</h1>
            <p className="text-xl text-muted-foreground">
              Browse our collection of high-quality courses to accelerate your learning journey
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Button variant="outline" asChild>
                <Link to="/explore/courses" className="flex items-center gap-2">
                  <Book className="h-4 w-4" /> All Courses
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/explore/events" className="flex items-center gap-2">
                  <Compass className="h-4 w-4" /> Explore Events
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Category</h3>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Difficulty</h3>
                    <Select 
                      value={selectedDifficulty} 
                      onValueChange={handleDifficultyChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {difficulties.map(difficulty => (
                          <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search courses..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-video w-full">
                        <Skeleton className="h-full w-full" />
                      </div>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-9 w-full" />
                      </CardFooter>
                    </Card>
                  ))
                ) : courses.length === 0 ? (
                  <div className="col-span-3 text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No courses found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                ) : (
                  courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden flex flex-col">
                      <div className="aspect-video w-full bg-muted relative">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title} 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                          <Badge variant="outline">{course.difficulty_level}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{course.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {course.duration_minutes} min
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrollmentCount} enrolled
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            {course.is_free ? (
                              <Badge variant="secondary">Free</Badge>
                            ) : (
                              <span className="font-medium">${course.price}</span>
                            )}
                          </div>
                          <Button asChild>
                            <Link to={`/learning/course/${course.id}`}>View Course</Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExploreCoursesPage;
