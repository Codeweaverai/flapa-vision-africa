
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Code, Briefcase, Camera, Music, Heart, Search } from 'lucide-react';

const categories = [
  {
    icon: BookOpen,
    title: 'Business',
    description: 'Leadership, entrepreneurship, and business skills',
    count: '150+ courses',
    searchParam: 'Business'
  },
  {
    icon: Code,
    title: 'Technology',
    description: 'Programming, web development, and IT skills',
    count: '200+ courses',
    searchParam: 'Technology'
  },
  {
    icon: Briefcase,
    title: 'Professional',
    description: 'Career development and workplace skills',
    count: '120+ courses',
    searchParam: 'Professional'
  },
  {
    icon: Camera,
    title: 'Creative',
    description: 'Design, photography, and creative arts',
    count: '80+ courses',
    searchParam: 'Creative'
  },
  {
    icon: Music,
    title: 'Arts & Music',
    description: 'Music production, performance, and fine arts',
    count: '60+ courses',
    searchParam: 'Arts'
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Fitness, nutrition, and mental health',
    count: '90+ courses',
    searchParam: 'Health'
  }
];

const BrowseCategoriesSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('courses');

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const searchParams = new URLSearchParams();
    searchParams.set('search', searchQuery);
    searchParams.set('type', searchType);
    
    if (searchType === 'courses') {
      window.location.href = `/explore-courses?${searchParams.toString()}`;
    } else {
      window.location.href = `/explore-events?${searchParams.toString()}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Browse by Category
            </h2>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Discover courses across various categories and find the perfect learning path for your goals
          </p>

          {/* Search Form */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search courses and events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 text-lg border-2 border-gray-200 focus:border-orange-400 rounded-xl"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courses">Courses</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl font-semibold"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Link 
                key={index} 
                to={`/explore-courses?category=${encodeURIComponent(category.searchParam)}`}
                className="block group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group-hover:bg-white group-hover:-translate-y-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-orange-100 to-purple-100 rounded-xl group-hover:from-orange-200 group-hover:to-purple-200 transition-all duration-300">
                        <IconComponent className="h-8 w-8 text-transparent bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text" style={{
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundImage: 'linear-gradient(to right, #f97316, #9333ea)',
                          color: 'transparent'
                        }} />
                      </div>
                      <div>
                        <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:to-purple-700">
                          {category.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500 font-medium">
                          {category.count}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
          >
            <Link to="/explore-courses">
              View All Categories
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BrowseCategoriesSection;
