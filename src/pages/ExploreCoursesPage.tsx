import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, Clock, Search, Filter, Star, Users, TrendingUp, Play, 
  Code, Smartphone, Database, Cloud, Shield, Gamepad2, Briefcase,
  GraduationCap, Mic, Video, Heart, Coffee, Users2, Home, Car,
  Utensils, Palette, Music, Camera, Cpu, Globe, BarChart3
} from 'lucide-react';
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
  reviews: {
    avg_rating: number;
    total_reviews: number;
    positive_percentage: number;
  };
  lessons_count: number;
  students_count: number;
}

// Course categories with icons matching the mobile app
const COURSE_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: BookOpen, color: 'from-orange-500 to-purple-600' },
  { value: 'web development', label: 'Web Development', icon: Code, color: 'from-blue-500 to-blue-600' },
  { value: 'mobile development', label: 'Mobile Development', icon: Smartphone, color: 'from-purple-500 to-purple-600' },
  { value: 'data science', label: 'Data Science', icon: Database, color: 'from-cyan-500 to-cyan-600' },
  { value: 'cloud computing', label: 'Cloud Computing', icon: Cloud, color: 'from-amber-500 to-amber-600' },
  { value: 'cybersecurity', label: 'Cybersecurity', icon: Shield, color: 'from-red-500 to-red-600' },
  { value: 'game development', label: 'Game Development', icon: Gamepad2, color: 'from-green-500 to-green-600' },
  { value: 'business', label: 'Business', icon: Briefcase, color: 'from-indigo-500 to-indigo-600' },
  { value: 'academic', label: 'Academic', icon: GraduationCap, color: 'from-pink-500 to-pink-600' },
  { value: 'podcasting', label: 'Podcasting', icon: Mic, color: 'from-orange-500 to-orange-600' },
  { value: 'video production', label: 'Video Production', icon: Video, color: 'from-rose-500 to-rose-600' },
  { value: 'personal development', label: 'Personal Development', icon: Heart, color: 'from-emerald-500 to-emerald-600' },
  { value: 'health & fitness', label: 'Health & Fitness', icon: Heart, color: 'from-red-500 to-pink-600' },
  { value: 'lifestyle', label: 'Lifestyle', icon: Coffee, color: 'from-amber-500 to-orange-600' },
  { value: 'social media', label: 'Social Media', icon: Users2, color: 'from-purple-500 to-purple-600' },
  { value: 'home improvement', label: 'Home Improvement', icon: Home, color: 'from-green-500 to-green-600' },
  { value: 'automotive', label: 'Automotive', icon: Car, color: 'from-gray-500 to-gray-600' },
  { value: 'culinary arts', label: 'Culinary Arts', icon: Utensils, color: 'from-red-500 to-red-600' },
  { value: 'graphic design', label: 'Graphic Design', icon: Palette, color: 'from-purple-500 to-purple-600' },
  { value: 'music production', label: 'Music Production', icon: Music, color: 'from-pink-500 to-pink-600' },
  { value: 'photography', label: 'Photography', icon: Camera, color: 'from-blue-500 to-blue-600' },
  { value: 'art & crafts', label: 'Art & Crafts', icon: Palette, color: 'from-amber-500 to-amber-600' },
  { value: 'ai & machine learning', label: 'AI & Machine Learning', icon: Cpu, color: 'from-cyan-500 to-cyan-600' },
  { value: 'blockchain', label: 'Blockchain', icon: Globe, color: 'from-amber-500 to-amber-600' },
  { value: 'digital marketing', label: 'Digital Marketing', icon: BarChart3, color: 'from-green-500 to-green-600' }
];

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Amazing Courses
              </h3>
              <p className="text-muted-foreground text-lg">
                Discovering the best learning experiences for you...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

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
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, setSearchParams]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
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

      const enhancedCourses = await Promise.all(
        coursesData.map(async (course) => {
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

          const { data: modules } = await supabase
            .from('course_modules')
            .select('id, lessons:lessons(id)')
            .eq('course_id', course.id);

          const lessonsCount = modules?.reduce((total, module) => {
            return total + (module.lessons?.length || 0);
          }, 0) || 0;

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

    const firstBatch = filtered.slice(0, COURSES_PER_LOAD);
    setDisplayedCourses(firstBatch);
    setHasMoreCourses(filtered.length > COURSES_PER_LOAD);
  };

  const loadMoreCourses = async () => {
    setLoadingMore(true);
    
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
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <h1 className="text-5xl md:text-6xl font-bold relative">
                <span className="bg-gradient-to-r from-orange-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Explore Courses
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
              Discover a wide range of courses to enhance your skills and advance your career. 
              Find the perfect course to accelerate your learning journey.
            </p>
          </div>

          {/* Category Quick Filters */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <div className="text-sm text-gray-600">
                {loading 
                  ? 'Loading...' 
                  : `${displayedCourses.length} course${displayedCourses.length !== 1 ? 's' : ''} found`
                }
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {COURSE_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-shrink-0 ${
                      selectedCategory === category.value
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                        : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search courses, topics, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-xl transition-all duration-300"
                />
              </div>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-xl transition-all duration-300">
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
                <SelectTrigger className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-xl transition-all duration-300">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-xl transition-all duration-300">
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

          {loading ? (
            <PulseLoading />
          ) : (
            <>
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
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Wishlist Button */}
                      <div className="absolute top-3 left-3 z-10">
                        <WishlistButton 
                          itemId={course.id}
                          itemType="course"
                          variant="ghost"
                          size="icon"
                          className="bg-white/80 hover:bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:scale-110"
                        />
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        {course.is_free ? (
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">
                            Free
                          </Badge>
                        ) : (
                          course.price > 0 && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg">
                              <PriceDisplay amount={course.price} originalCurrency="USD" />
                            </Badge>
                          )
                        )}
                      </div>
                      
                      {course.category && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-0">
                            {course.category}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        {course.difficulty_level && (
                          <Badge variant="outline" className="border-purple-300 text-purple-600">
                            {course.difficulty_level}
                          </Badge>
                        )}
                        {course.reviews?.avg_rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">
                              {course.reviews.avg_rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 transition-colors duration-300">
                        {course.title}
                      </CardTitle>
                      
                      {course.summary && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {course.summary}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {course.duration_minutes > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-gray-600">
                              {Math.ceil(course.duration_minutes / 60)}h
                            </span>
                          </div>
                        )}
                        
                        {course.students_count > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-gray-600">
                              {course.students_count} students
                            </span>
                          </div>
                        )}
                        
                        {course.reviews?.positive_percentage > 0 && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">
                              {Math.round(course.reviews.positive_percentage)}% positive
                            </span>
                          </div>
                        )}
                        
                        {course.lessons_count > 0 && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600">
                              {course.lessons_count} lessons
                            </span>
                          </div>
                        )}
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

              {displayedCourses.length === 0 && (
                <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
                  <div className="relative inline-block mb-6">
                    <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-10"></div>
                    <BookOpen className="h-20 w-20 text-gray-400 mx-auto relative" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">No Courses Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto text-lg">
                    Try adjusting your search criteria or browse different categories.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedDifficulty('all');
                      setPriceFilter('all');
                    }}
                    className="mt-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {hasMoreCourses && displayedCourses.length > 0 && (
                <div className="text-center">
                  <Button
                    onClick={loadMoreCourses}
                    disabled={loadingMore}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-12 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading More Courses...
                      </>
                    ) : (
                      'Load More Courses'
                    )}
                  </Button>
                  <p className="text-gray-600 mt-4">
                    Showing {displayedCourses.length} of {courses.length} courses
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default ExploreCoursesPage;
