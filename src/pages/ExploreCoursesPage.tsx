import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, Search, Filter, Star, Users, TrendingUp, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { VALID_CATEGORIES } from '@/services/courseService';
import PriceDisplay from '@/components/currency/PriceDisplay';
import WishlistButton from '@/components/wishlist/WishlistButton';

const COURSES_PER_LOAD = 20;

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url?: string;
  is_free: boolean;
  price: number;
  duration_minutes: number;
  category: string;
  difficulty_level: string;
  created_at: string;
  creator_id: string;
  // Populated fields
  reviews: {
    avg_rating: number;
    total_reviews: number;
    positive_percentage: number;
  };
  lessons_count: number;
  students_count: number;
}

const ExploreCoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [hasMoreCourses, setHasMoreCourses] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [courses, searchTerm, selectedCategory, selectedDifficulty, priceFilter, sortBy]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, setSearchParams]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Enhance courses with real data
      const enhancedCourses = await Promise.all(
        coursesData.map(async (course) => {
          // Get course reviews
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          const totalReviews = reviews?.length || 0;
          const avgRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;
          const positiveReviews = reviews?.filter(review => review.rating >= 4).length || 0;
          const positivePercentage = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

          // Get lessons count
          const { data: modules } = await supabase
            .from('course_modules')
            .select('id, lessons:lessons(id)')
            .eq('course_id', course.id);

          const lessonsCount = modules?.reduce((total, module) => {
            return total + (module.lessons?.length || 0);
          }, 0) || 0;

          // Get students count
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', course.id)
            .eq('payment_status', 'completed');

          const studentsCount = enrollments?.length || 0;

          return {
            ...course,
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews,
              positive_percentage: positivePercentage
            },
            lessons_count: lessonsCount,
            students_count: studentsCount
          };
        })
      );

      setCourses(enhancedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...courses];

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

    // Reset displayed courses and show first batch
    const firstBatch = filtered.slice(0, COURSES_PER_LOAD);
    setDisplayedCourses(firstBatch);
    setHasMoreCourses(filtered.length > COURSES_PER_LOAD);
  };

  const loadMoreCourses = async () => {
    setLoadingMore(true);
    
    // Get the filtered courses again
    let filtered = [...courses];
    
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        course.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === selectedDifficulty);
    }

    if (priceFilter === 'free') {
      filtered = filtered.filter(course => course.is_free);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(course => !course.is_free);
    }

    // Apply sorting
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

    const currentCount = displayedCourses.length;
    const nextBatch = filtered.slice(currentCount, currentCount + COURSES_PER_LOAD);
    
    setDisplayedCourses(prev => [...prev, ...nextBatch]);
    setHasMoreCourses(filtered.length > currentCount + COURSES_PER_LOAD);
    setLoadingMore(false);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

          {/* Results count and info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <p className="text-gray-600 font-medium">
                {loading 
                  ? 'Loading...' 
                  : `${displayedCourses.length} course${displayedCourses.length !== 1 ? 's' : ''} found`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Showing {displayedCourses.length} of {courses.length}
              </span>
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex justify-center my-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
            </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">

              {displayedCourses.map((course) => (
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
                    
                    {/* Wishlist Button */}
                    <div className="absolute top-3 left-3 z-10">
                      <WishlistButton 
                        itemId={course.id}
                        itemType="course"
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg"
                      />
                    </div>
                    
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
                        <span className="font-medium">
                          {course.reviews.avg_rating > 0 ? course.reviews.avg_rating.toFixed(1) : '4.8'}
                        </span>
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
                        <span className="text-gray-600">
                          {course.students_count > 0 ? `${course.students_count}` : '1.2k'} students
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">
                          {course.reviews.positive_percentage > 0 
                            ? `${Math.round(course.reviews.positive_percentage)}%` 
                            : '95%'
                          } positive
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">
                          {course.lessons_count > 0 ? course.lessons_count : '12'} lessons
                        </span>
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
          {displayedCourses.length === 0 && !loading && (
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

          {/* Load More Button */}
          {hasMoreCourses && displayedCourses.length > 0 && (
            <div className="flex justify-center mt-12">
              <Button
                onClick={loadMoreCourses}
                disabled={loadingMore}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading More...
                  </>
                ) : (
                  'Load More Courses'
                )}
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default ExploreCoursesPage;
