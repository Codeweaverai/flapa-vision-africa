import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BookOpen, Clock, Search, Filter, Star, Users, TrendingUp, Play } from 'lucide-react';
import { Course, fetchPublishedCourses, VALID_CATEGORIES } from '@/services/courseService';
import PriceDisplay from '@/components/currency/PriceDisplay';

const COURSES_PER_PAGE = 20;

const ExploreCoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, selectedCategory, selectedDifficulty, priceFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCourses]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, setSearchParams]);

  const loadCourses = async () => {
    try {
      const coursesData = await fetchPublishedCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        course.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === selectedDifficulty);
    }

    // Price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(course => course.is_free);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(course => !course.is_free);
    }

    // Sort courses
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.is_free ? 0 : a.price) - (b.is_free ? 0 : b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.is_free ? 0 : b.price) - (a.is_free ? 0 : a.price));
        break;
      default:
        break;
    }

    setFilteredCourses(filtered);
  };

  const getPaginatedCourses = () => {
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    return filteredCourses.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Explore Courses
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover a wide range of courses to enhance your skills and advance your career. Find the perfect course to accelerate your learning journey.
            </p>
          </div>

          {/* Enhanced Filters */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-0 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search courses, topics, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {VALID_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count and pagination info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <p className="text-gray-600 font-medium">
                {loading 
                  ? 'Loading...' 
                  : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} found`
                }
              </p>
              {totalPages > 1 && (
                <p className="text-gray-500 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Showing {((currentPage - 1) * COURSES_PER_PAGE) + 1}-{Math.min(currentPage * COURSES_PER_PAGE, filteredCourses.length)} of {filteredCourses.length}
              </span>
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex justify-center my-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {getPaginatedCourses().map((course) => (
                <Card 
                  key={course.id} 
                  className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:scale-105"
                >
                  <div className="relative">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-500">
                        <BookOpen className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      {course.is_free ? (
                        <Badge className="bg-green-500 text-white border-0 shadow-lg">
                          Free
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg">
                          <PriceDisplay amount={course.price} originalCurrency="USD" />
                        </Badge>
                      )}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-0">
                        {course.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="border-purple-300 text-purple-600">
                        {course.difficulty_level}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">4.8</span>
                      </div>
                    </div>
                    
                    <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 transition-colors duration-300">
                      {course.title}
                    </CardTitle>
                    
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {course.summary}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">
                          {Math.ceil((course.duration_minutes || 0) / 60)}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600">1.2k students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">95% positive</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">12 lessons</span>
                      </div>
                    </div>

                    <Button 
                      asChild 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <Link to={`/learning/course-detail/${course.id}`} className="flex items-center justify-center">
                        <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        View Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results State */}
          {filteredCourses.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-orange-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">No courses found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Try adjusting your filters or search terms to discover amazing courses.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setPriceFilter('all');
                }}
                variant="outline"
                className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination>
                <PaginationContent className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0 p-2">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-orange-50"}
                    />
                  </PaginationItem>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNumber = i + 1;
                    const actualPage = totalPages <= 5 
                      ? pageNumber 
                      : Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    
                    return (
                      <PaginationItem key={actualPage}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(actualPage);
                          }}
                          isActive={currentPage === actualPage}
                          className={currentPage === actualPage 
                            ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700" 
                            : "hover:bg-orange-50"
                          }
                        >
                          {actualPage}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-orange-50"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default ExploreCoursesPage;
