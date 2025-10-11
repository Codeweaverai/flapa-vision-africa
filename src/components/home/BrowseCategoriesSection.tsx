import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, Code, Briefcase, Camera, Music, Heart, Search, TrendingUp, 
  Palette, Globe, Cpu, Smartphone, Database, Cloud, Shield, Gamepad2, 
  GraduationCap, Mic, Video, Coffee, Users2, Home, Car, Utensils, 
  BarChart3, Zap, Sparkles, ArrowRight, ArrowLeft, Play, Pause
} from 'lucide-react';

// Extended categories with all options
const categories = [
  {
    icon: Code,
    title: 'Web Development',
    description: 'Build modern web applications and websites',
    count: '180+ courses',
    searchParam: 'Web Development',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Smartphone,
    title: 'Mobile Development',
    description: 'Create iOS and Android mobile apps',
    count: '95+ courses',
    searchParam: 'Mobile Development',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Database,
    title: 'Data Science',
    description: 'Analyze and visualize complex data',
    count: '120+ courses',
    searchParam: 'Data Science',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    icon: Cloud,
    title: 'Cloud Computing',
    description: 'Master AWS, Azure, and Google Cloud',
    count: '85+ courses',
    searchParam: 'Cloud Computing',
    color: 'from-amber-500 to-amber-600'
  },
  {
    icon: Shield,
    title: 'Cybersecurity',
    description: 'Protect systems and networks',
    count: '75+ courses',
    searchParam: 'Cybersecurity',
    color: 'from-red-500 to-red-600'
  },
  {
    icon: Gamepad2,
    title: 'Game Development',
    description: 'Create engaging games and simulations',
    count: '60+ courses',
    searchParam: 'Game Development',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Briefcase,
    title: 'Business',
    description: 'Leadership and entrepreneurship skills',
    count: '150+ courses',
    searchParam: 'Business',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    icon: GraduationCap,
    title: 'Academic',
    description: 'School and university subjects',
    count: '200+ courses',
    searchParam: 'Academic',
    color: 'from-pink-500 to-pink-600'
  },
  {
    icon: Mic,
    title: 'Podcasting',
    description: 'Create and grow your podcast',
    count: '45+ courses',
    searchParam: 'Podcasting',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Video,
    title: 'Video Production',
    description: 'Film and edit professional videos',
    count: '55+ courses',
    searchParam: 'Video Production',
    color: 'from-rose-500 to-rose-600'
  },
  {
    icon: Heart,
    title: 'Personal Development',
    description: 'Self-improvement and life skills',
    count: '90+ courses',
    searchParam: 'Personal Development',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    icon: Heart,
    title: 'Health & Fitness',
    description: 'Wellness, nutrition, and exercise',
    count: '80+ courses',
    searchParam: 'Health & Fitness',
    color: 'from-red-500 to-pink-600'
  },
  {
    icon: Coffee,
    title: 'Lifestyle',
    description: 'Daily life skills and hobbies',
    count: '65+ courses',
    searchParam: 'Lifestyle',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: Users2,
    title: 'Social Media',
    description: 'Grow your online presence',
    count: '70+ courses',
    searchParam: 'Social Media',
    color: 'from-purple-500 to-fuchsia-600'
  },
  {
    icon: Home,
    title: 'Home Improvement',
    description: 'DIY projects and home maintenance',
    count: '40+ courses',
    searchParam: 'Home Improvement',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Car,
    title: 'Automotive',
    description: 'Car maintenance and repair',
    count: '35+ courses',
    searchParam: 'Automotive',
    color: 'from-gray-500 to-gray-600'
  },
  {
    icon: Utensils,
    title: 'Culinary Arts',
    description: 'Cooking and baking techniques',
    count: '50+ courses',
    searchParam: 'Culinary Arts',
    color: 'from-red-500 to-orange-600'
  },
  {
    icon: Palette,
    title: 'Graphic Design',
    description: 'Visual communication and design',
    count: '110+ courses',
    searchParam: 'Graphic Design',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    icon: Music,
    title: 'Music Production',
    description: 'Create and produce music',
    count: '60+ courses',
    searchParam: 'Music Production',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: Camera,
    title: 'Photography',
    description: 'Capture stunning images',
    count: '85+ courses',
    searchParam: 'Photography',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Palette,
    title: 'Art & Crafts',
    description: 'Creative arts and handmade crafts',
    count: '55+ courses',
    searchParam: 'Art & Crafts',
    color: 'from-amber-500 to-yellow-600'
  },
  {
    icon: Cpu,
    title: 'AI & Machine Learning',
    description: 'Artificial intelligence and ML',
    count: '95+ courses',
    searchParam: 'AI & Machine Learning',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    icon: Globe,
    title: 'Blockchain',
    description: 'Cryptocurrency and Web3',
    count: '45+ courses',
    searchParam: 'Blockchain',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: BarChart3,
    title: 'Digital Marketing',
    description: 'Online marketing strategies',
    count: '130+ courses',
    searchParam: 'Digital Marketing',
    color: 'from-green-500 to-teal-600'
  },
  {
    icon: TrendingUp,
    title: 'Professional Skills',
    description: 'Career development and workplace',
    count: '120+ courses',
    searchParam: 'Professional Skills',
    color: 'from-blue-500 to-indigo-600'
  }
];

const BrowseCategoriesSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('courses');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const scrollSpeed = 1; // pixels per frame

  // Duplicate categories for seamless infinite scroll
  const duplicatedCategories = [...categories, ...categories, ...categories];

  // Auto-scroll animation
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const animateScroll = () => {
      if (!isPlaying || !scrollContainer) return;

      scrollPosition += scrollSpeed;
      
      // Reset position when reaching the end of duplicated content
      const maxScroll = scrollContainer.scrollWidth / 3;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animateScroll);
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(animateScroll);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying]);

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

  const scrollToNext = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = 320; // Approximate card width with margin
      const newIndex = (currentIndex + 1) % categories.length;
      setCurrentIndex(newIndex);
      scrollContainer.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollToPrev = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = 320;
      const newIndex = (currentIndex - 1 + categories.length) % categories.length;
      setCurrentIndex(newIndex);
      scrollContainer.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const toggleAutoScroll = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-orange-400/20 to-pink-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Explore Categories
            </h2>
            <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-50"></div>
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-purple-500 animate-pulse" />
            <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-blue-500 animate-pulse delay-1000" />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Discover thousands of courses across diverse categories. Find your passion and accelerate your learning journey with expert-led content.
          </p>

          {/* Enhanced Search Form */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 shadow-blue-500/10">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="What do you want to learn today?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-14 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-2xl pl-12 pr-4 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-56">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-purple-400 rounded-2xl bg-white/80 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courses">🎓 Courses</SelectItem>
                      <SelectItem value="events">📅 Events</SelectItem>
                      <SelectItem value="both">🔍 Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-14 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                >
                  <Search className="h-5 w-5 mr-3" />
                  Explore
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Infinite Horizontal Scroll Section */}
        <div className="relative mb-12">
          {/* Navigation Controls */}
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">
              Popular Categories
            </h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAutoScroll}
                className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-gray-600" />
                ) : (
                  <Play className="h-4 w-4 text-gray-600" />
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToPrev}
                  className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToNext}
                  className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll Container */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-hidden py-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {duplicatedCategories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-80 transform transition-all duration-500 hover:scale-105"
                  >
                    <Link 
                      to={`/explore-courses?category=${encodeURIComponent(category.searchParam)}`}
                      className="block group"
                    >
                      <Card className="h-48 border-0 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:bg-white relative overflow-hidden">
                        {/* Gradient Border Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
                        
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 bg-gradient-to-r ${category.color} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                              <IconComponent className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300 truncate">
                                {category.title}
                              </CardTitle>
                              <CardDescription className="text-sm text-gray-500 font-medium">
                                {category.count}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 text-sm leading-relaxed line-clamp-2">
                            {category.description}
                          </p>
                          <div className="mt-3 flex items-center text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                            <span className="text-sm font-semibold">Explore</span>
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </CardContent>

                        {/* Hover Effect Glow */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 -z-10`}></div>
                      </Card>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50/90 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50/90 to-transparent pointer-events-none"></div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/40 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                2,000+
              </div>
              <div className="text-gray-600 font-medium">Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                500+
              </div>
              <div className="text-gray-600 font-medium">Instructors</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                50K+
              </div>
              <div className="text-gray-600 font-medium">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                25+
              </div>
              <div className="text-gray-600 font-medium">Categories</div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-7 text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105"
          >
            <Link to="/explore-courses" className="flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
              Explore All Categories
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BrowseCategoriesSection;
