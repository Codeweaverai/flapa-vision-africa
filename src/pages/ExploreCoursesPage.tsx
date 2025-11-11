import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, Clock, Search, Filter, Star, Users, TrendingUp, Play, 
  Code, Smartphone, Database, Cloud, Shield, Gamepad2, Briefcase,
  GraduationCap, Mic, Video, Heart, Coffee, Users2, Home, Car,
  Utensils, Palette, Music, Camera, Cpu, Globe, BarChart3, ChevronLeft, ChevronRight, DollarSign
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
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
  creator_name?: string;
  creator_avatar?: string;
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

// Fixed Pulse Loading Component - Removed Layout wrapper
const PulseLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 py-12">
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
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      // Get creator IDs
      const creatorIds = [...new Set(coursesData.map(course => course.creator_id).filter(Boolean))];

      // Fetch creator profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', creatorIds);

      // Fetch additional data for courses
      const courseIds = coursesData.map(course => course.id);
      const { data: courseReviews } = await supabase
        .from('course_reviews')
        .select('course_id, rating')
        .in('course_id', courseIds);

      const { data: courseEnrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .in('course_id', courseIds);

      const enhancedCourses = coursesData.map(course => {
        const reviews = courseReviews?.filter(review => review.course_id === course.id) || [];
        const enrollments = courseEnrollments?.filter(enrollment => enrollment.course_id === course.id) || [];
        const creatorProfile = profilesData?.find(profile => profile.id === course.creator_id);
        
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
          : 0;

        return {
          ...course,
          average_rating: Math.round(averageRating * 10) / 10,
          total_reviews: reviews.length,
          total_students: enrollments.length,
          creator_name: creatorProfile?.full_name || creatorProfile?.username || 'Unknown Creator',
          creator_avatar: creatorProfile?.avatar_url || null
        };
      });

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

  const scrollCategoryLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollCategoryRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="text-sm text-gray-600 ml-1 font-medium">({rating.toFixed(1)})</span>
      </div>
    );
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

          {/* Enhanced Category Quick Filters with Horizontal Scroll and Arrows */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={scrollCategoryLeft}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 hover:text-purple-600" />
                </Button>
                <Button
                  onClick={scrollCategoryRight}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 shadow-sm"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 hover:text-orange-600" />
                </Button>
              </div>
            </div>
            <div 
              ref={categoryScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {COURSE_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-medium transition-all duration-300 flex-shrink-0 w-40 snap-start ${
                      selectedCategory === category.value
                        ? `bg-gradient-to-r ${category.color} text-white shadow-2xl transform scale-105`
                        : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-xl border border-gray-200/50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${
                      selectedCategory === category.value 
                        ? 'bg-white/20' 
                        : 'bg-gray-100/80'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        selectedCategory === category.value ? 'text-white' : `text-${category.color.split('-')[1]}-500`
                      }`} />
                    </div>
                    <span className="text-sm font-semibold text-center leading-tight">
                      {category.label}
                    </span>
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
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:scale-[1.02]"
                  >
                    <div className="relative">
                      {/* Course Thumbnail */}
                      <div className="relative h-56 overflow-hidden cursor-pointer">
                        {course.thumbnail_url ? (
                          <>
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Orange-Purple Gradient Video Icon with Pulse Animation */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Outer Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                                {/* Middle Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                                {/* Main Icon Container */}
                                <div className="relative bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-2xl animate-pulse-slow transform hover:scale-110 transition-transform duration-300">
                                  <Play className="h-8 w-8 text-white fill-current" />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-purple-200 to-pink-300 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-500">
                            {/* Animated Video Icon with Orange-Purple Gradient */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Outer Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
                                {/* Middle Pulse Ring */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                                {/* Main Icon Container */}
                                <div className="relative bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 shadow-2xl animate-pulse-slow transform hover:scale-110 transition-transform duration-300">
                                  <Play className="h-8 w-8 text-white fill-current" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Category and Difficulty Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm font-medium">
                            {course.category}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg font-medium">
                            {course.difficulty_level}
                          </Badge>
                        </div>

                        {/* Duration Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/30">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {formatDuration(course.duration_minutes)}
                          </div>
                        </div>

                        {/* Wishlist Button */}
                        <div className="absolute bottom-4 right-4 z-20">
                          <WishlistButton 
                            itemId={course.id}
                            itemType="course"
                            variant="ghost"
                            size="icon"
                            iconOnly
                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-0 hover:text-red-500"
                          />
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                            {course.title}
                          </CardTitle>
                          
                          {/* Creator with Avatar */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Avatar className="h-6 w-6 border border-orange-200">
                              <AvatarImage 
                                src={course.creator_avatar || undefined} 
                                alt={course.creator_name}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white text-xs font-bold">
                                {course.creator_name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">by {course.creator_name}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Course Summary */}
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {course.summary}
                          </p>

                          {/* Course Reviews */}
                          {course.total_reviews && course.total_reviews > 0 && (
                            <div className="flex items-center justify-between">
                              {renderStarRating(course.average_rating || 0)}
                              <span className="text-xs text-gray-500 font-medium">
                                {course.total_reviews} review{course.total_reviews !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {/* Students Count */}
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                            <span className="font-medium">{course.total_students || 0} students enrolled</span>
                          </div>
                        </CardContent>

                        <CardContent className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-1 text-orange-500" />
                            <span className="font-bold text-xl text-gray-900">
                              {course.is_free ? (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                  Free
                                </span>
                              ) : (
                                <PriceDisplay amount={course.price} originalCurrency="USD" />
                              )}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                            asChild
                          >
                            <Link to={`/learning/course-detail/${course.id}`}>
                              <Play className="h-4 w-4 mr-1 text-white fill-current" />
                              Enroll Now
                            </Link>
                          </Button>
                        </CardContent>
                      </div>
                    </div>
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

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </div>
  );
};

export default ExploreCoursesPage;
