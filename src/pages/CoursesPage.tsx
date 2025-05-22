
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Fetch only published courses
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
          
        const { data: coursesData, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setCourses(coursesData as Course[]);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(coursesData?.map(course => course.category))
        ).filter(Boolean) as string[];
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Filter courses based on search term and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = !categoryFilter || course.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
          <p className="text-muted-foreground">Discover and enroll in high-quality courses</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
          
          <Select 
            value={categoryFilter} 
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No courses found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={course.thumbnail_url || '/placeholder.svg'} 
                    alt={course.title}
                    className="object-cover w-full h-full transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <Badge variant={course.price > 0 ? "default" : "outline"}>
                      {course.price > 0 ? `$${course.price}` : 'Free'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-3">{course.description}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                    <Badge variant="outline">{formatDuration(course.duration_minutes)}</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/courses/${course.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CoursesPage;
