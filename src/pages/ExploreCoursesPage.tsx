
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, Users, Star, Search, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useCourseData } from '@/hooks/useCourseData';
import PriceDisplay from '@/components/currency/PriceDisplay';

const ExploreCoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [displayedCourses, setDisplayedCourses] = useState(6);
  
  const { courses, loading, hasMore, loadMore } = useCourseData();
  const navigate = useNavigate();

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const coursesToShow = filteredCourses.slice(0, displayedCourses);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleLoadMore = () => {
    if (displayedCourses >= filteredCourses.length && hasMore) {
      loadMore();
    }
    setDisplayedCourses(prev => prev + 6);
  };

  const categories = [
    'all', 'technology', 'business', 'design', 'marketing', 
    'development', 'data-science', 'photography', 'music', 'language'
  ];

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  if (loading && courses.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Explore Courses
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Discover high-quality courses from expert instructors. Learn new skills and advance your career with our comprehensive learning platform.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-blue-200 focus:border-purple-500"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white border-blue-200 focus:border-purple-500">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="bg-white border-blue-200 focus:border-purple-500">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                variant="outline"
                className="bg-white border-blue-200 text-purple-600 hover:bg-purple-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {Math.min(displayedCourses, filteredCourses.length)} of {filteredCourses.length} courses
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coursesToShow.map((course) => (
              <Card 
                key={course.id} 
                className="group hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-blue-200 hover:border-purple-300 hover:-translate-y-2"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={course.thumbnail_url || '/placeholder-course.jpg'}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {course.difficulty_level}
                    </Badge>
                  </div>
                  {!course.is_free && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 font-semibold">
                        <PriceDisplay amount={course.price} originalCurrency="USD" />
                      </Badge>
                    </div>
                  )}
                  {course.is_free && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 text-white">
                        FREE
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {course.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {course.summary || course.description}
                  </p>
                  
                  {/* Reviews Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {course.review_count > 0 ? (
                        <>
                          {renderStars(Math.round(course.average_rating || 0))}
                          <span className="text-sm text-gray-600">
                            {course.average_rating?.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>
                    {course.positive_percentage > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {course.positive_percentage.toFixed(0)}% positive
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span>{course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{course.student_count} student{course.student_count !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>{formatDuration(course.duration_minutes)}</span>
                    </div>
                  </div>
                  
                  {course.review_count > 0 && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Based on {course.review_count} review{course.review_count !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {course.profiles && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <img
                        src={course.profiles.avatar_url || '/default-avatar.png'}
                        alt={course.profiles.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {course.profiles.full_name}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-200"
                  >
                    View Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {(displayedCourses < filteredCourses.length || hasMore) && (
            <div className="text-center mt-12">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </div>
                ) : (
                  'Load More Courses'
                )}
              </Button>
            </div>
          )}

          {/* No Results */}
          {filteredCourses.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-blue-200">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                    ? "No courses match your current filters. Try adjusting your search."
                    : "No courses are available at the moment."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreCoursesPage;
