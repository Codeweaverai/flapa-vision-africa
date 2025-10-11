import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, Code, Briefcase, Camera, Music, Heart, TrendingUp, 
  Palette, Globe, Cpu, Smartphone, Database, Cloud, Shield, Gamepad2, 
  GraduationCap, Mic, Video, Coffee, Users2, Home, Car, Utensils, 
  BarChart3, Zap, Sparkles, ArrowRight, ArrowLeft, Play, Pause,
  Calendar, Users, Ticket, Music2, Mic2, GamepadIcon, UtensilsCrossed,
  Dumbbell, Mountain, Palmtree, Martini, Castle, CarFront, Plane,
  CameraIcon, Theater, GraduationCap as GradCap, Building2,
  Lightbulb, Microscope, TestTube, Beaker
} from 'lucide-react';

// Course categories (existing)
const courseCategories = [
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
  }
];

// New event categories
const eventCategories = [
  {
    icon: Users,
    title: 'Webinar',
    description: 'Interactive online seminars and workshops',
    count: '120+ events',
    searchParam: 'Webinar',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Building2,
    title: 'Conferences',
    description: 'Professional gatherings and industry events',
    count: '85+ events',
    searchParam: 'Conferences',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    icon: Music2,
    title: 'Live Music',
    description: 'Concerts, gigs, and musical performances',
    count: '200+ events',
    searchParam: 'Live Music',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: Dumbbell,
    title: 'Sports Events',
    description: 'Games, tournaments, and athletic competitions',
    count: '150+ events',
    searchParam: 'Sports Events',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Martini,
    title: 'Night Life',
    description: 'Clubs, bars, and evening entertainment',
    count: '95+ events',
    searchParam: 'Night Life',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: Theater,
    title: 'Concerts',
    description: 'Live performances and music festivals',
    count: '180+ events',
    searchParam: 'Concerts',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: Mic2,
    title: 'Comedy Shows',
    description: 'Stand-up comedy and improv performances',
    count: '65+ events',
    searchParam: 'Comedy Shows',
    color: 'from-yellow-500 to-amber-600'
  },
  {
    icon: Briefcase,
    title: 'Business Events',
    description: 'Networking and professional development',
    count: '110+ events',
    searchParam: 'Business Events',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    icon: Heart,
    title: 'Wellness Events',
    description: 'Yoga, meditation, and health workshops',
    count: '75+ events',
    searchParam: 'Wellness Events',
    color: 'from-green-500 to-teal-600'
  },
  {
    icon: Mountain,
    title: 'Summit',
    description: 'Leadership and industry peak events',
    count: '45+ events',
    searchParam: 'Summit',
    color: 'from-gray-500 to-blue-600'
  },
  {
    icon: Palmtree,
    title: 'Picnic',
    description: 'Outdoor gatherings and social events',
    count: '60+ events',
    searchParam: 'Picnic',
    color: 'from-green-500 to-lime-600'
  },
  {
    icon: GradCap,
    title: 'Workshops',
    description: 'Hands-on learning and skill-building sessions',
    count: '90+ events',
    searchParam: 'Workshops',
    color: 'from-purple-500 to-blue-600'
  },
  {
    icon: Ticket,
    title: 'Festivals',
    description: 'Cultural celebrations and community events',
    count: '70+ events',
    searchParam: 'Festivals',
    color: 'from-orange-500 to-yellow-600'
  },
  {
    icon: GamepadIcon,
    title: 'Gaming Events',
    description: 'Esports tournaments and gaming conventions',
    count: '55+ events',
    searchParam: 'Gaming Events',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: UtensilsCrossed,
    title: 'Food & Drink',
    description: 'Culinary experiences and tasting events',
    count: '85+ events',
    searchParam: 'Food & Drink',
    color: 'from-red-500 to-orange-600'
  },
  {
    icon: CameraIcon,
    title: 'Art Exhibitions',
    description: 'Gallery shows and creative displays',
    count: '50+ events',
    searchParam: 'Art Exhibitions',
    color: 'from-pink-500 to-purple-600'
  },
  {
    icon: Plane,
    title: 'Travel Events',
    description: 'Adventure trips and exploration gatherings',
    count: '40+ events',
    searchParam: 'Travel Events',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Lightbulb,
    title: 'Tech Meetups',
    description: 'Technology discussions and innovation talks',
    count: '95+ events',
    searchParam: 'Tech Meetups',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    icon: Microscope,
    title: 'Science Fairs',
    description: 'Research presentations and scientific displays',
    count: '35+ events',
    searchParam: 'Science Fairs',
    color: 'from-purple-500 to-blue-600'
  },
  {
    icon: Castle,
    title: 'Cultural Events',
    description: 'Heritage celebrations and traditional gatherings',
    count: '65+ events',
    searchParam: 'Cultural Events',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: CarFront,
    title: 'Auto Shows',
    description: 'Vehicle exhibitions and automotive events',
    count: '30+ events',
    searchParam: 'Auto Shows',
    color: 'from-gray-500 to-red-600'
  },
  {
    icon: Beaker,
    title: 'Science Events',
    description: 'Experiments, demonstrations, and discoveries',
    count: '45+ events',
    searchParam: 'Science Events',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: Calendar,
    title: 'Community Events',
    description: 'Local gatherings and neighborhood activities',
    count: '120+ events',
    searchParam: 'Community Events',
    color: 'from-green-500 to-blue-600'
  }
];

const BrowseCategoriesSection = () => {
  // Course categories state
  const [coursePlaying, setCoursePlaying] = useState(true);
  const [courseCurrentIndex, setCourseCurrentIndex] = useState(0);
  const courseScrollContainerRef = useRef<HTMLDivElement>(null);
  const courseScrollSpeed = 1;

  // Event categories state
  const [eventPlaying, setEventPlaying] = useState(true);
  const [eventCurrentIndex, setEventCurrentIndex] = useState(0);
  const eventScrollContainerRef = useRef<HTMLDivElement>(null);
  const eventScrollSpeed = 1;

  // Duplicate categories for seamless infinite scroll
  const duplicatedCourseCategories = [...courseCategories, ...courseCategories, ...courseCategories];
  const duplicatedEventCategories = [...eventCategories, ...eventCategories, ...eventCategories];

  // Course auto-scroll animation
  useEffect(() => {
    const scrollContainer = courseScrollContainerRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const animateScroll = () => {
      if (!coursePlaying || !scrollContainer) return;

      scrollPosition += courseScrollSpeed;
      
      const maxScroll = scrollContainer.scrollWidth / 3;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animateScroll);
    };

    if (coursePlaying) {
      animationId = requestAnimationFrame(animateScroll);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [coursePlaying]);

  // Event auto-scroll animation
  useEffect(() => {
    const scrollContainer = eventScrollContainerRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const animateScroll = () => {
      if (!eventPlaying || !scrollContainer) return;

      scrollPosition += eventScrollSpeed;
      
      const maxScroll = scrollContainer.scrollWidth / 3;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animateScroll);
    };

    if (eventPlaying) {
      animationId = requestAnimationFrame(animateScroll);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [eventPlaying]);

  // Course navigation
  const scrollCourseToNext = () => {
    const scrollContainer = courseScrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = 320;
      const newIndex = (courseCurrentIndex + 1) % courseCategories.length;
      setCourseCurrentIndex(newIndex);
      scrollContainer.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollCourseToPrev = () => {
    const scrollContainer = courseScrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = 320;
      const newIndex = (courseCurrentIndex - 1 + courseCategories.length) % courseCategories.length;
      setCourseCurrentIndex(newIndex);
      scrollContainer.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  // Event navigation
  const scrollEventToNext = () => {
    const scrollContainer = eventScrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = 320;
      const newIndex = (eventCurrentIndex + 1) % eventCategories.length;
      setEventCurrentIndex(newIndex);
      scrollContainer.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollEventToPrev = () => {
    const scrollContainer = eventScrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = 320;
      const newIndex = (eventCurrentIndex - 1 + eventCategories.length) % eventCategories.length;
      setEventCurrentIndex(newIndex);
      scrollContainer.scrollTo({
        left: newIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const toggleCourseAutoScroll = () => {
    setCoursePlaying(!coursePlaying);
  };

  const toggleEventAutoScroll = () => {
    setEventPlaying(!eventPlaying);
  };

  const CategoryCard = ({ category, type }: { category: any; type: 'course' | 'event' }) => {
    const IconComponent = category.icon;
    const linkUrl = type === 'course' 
      ? `/explore-courses?category=${encodeURIComponent(category.searchParam)}`
      : `/explore-events?category=${encodeURIComponent(category.searchParam)}`;

    return (
      <div className="flex-shrink-0 w-80 transform transition-all duration-500 hover:scale-105">
        <Link to={linkUrl} className="block group">
          <Card className="h-48 border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:bg-white relative overflow-hidden border border-gray-100">
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
              <div className="mt-3 flex items-center text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
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
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Light Orange Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-orange-100/40 to-purple-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-orange-100/40 to-pink-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Course Categories Section */}
        <div className="relative mb-16">
          {/* Navigation Controls */}
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">
              Popular Course Categories
            </h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCourseAutoScroll}
                className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all duration-300"
              >
                {coursePlaying ? (
                  <Pause className="h-4 w-4 text-gray-600" />
                ) : (
                  <Play className="h-4 w-4 text-gray-600" />
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollCourseToPrev}
                  className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollCourseToNext}
                  className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all duration-300"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll Container */}
          <div className="relative">
            <div
              ref={courseScrollContainerRef}
              className="flex gap-6 overflow-x-hidden py-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {duplicatedCourseCategories.map((category, index) => (
                <CategoryCard key={index} category={category} type="course" />
              ))}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {courseCategories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCourseCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === courseCurrentIndex 
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Event Categories Section */}
        <div className="relative mb-12">
          {/* Navigation Controls */}
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">
              Popular Event Categories
            </h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleEventAutoScroll}
                className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all duration-300"
              >
                {eventPlaying ? (
                  <Pause className="h-4 w-4 text-gray-600" />
                ) : (
                  <Play className="h-4 w-4 text-gray-600" />
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollEventToPrev}
                  className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollEventToNext}
                  className="h-10 w-10 rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all duration-300"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll Container */}
          <div className="relative">
            <div
              ref={eventScrollContainerRef}
              className="flex gap-6 overflow-x-hidden py-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {duplicatedEventCategories.map((category, index) => (
                <CategoryCard key={index} category={category} type="event" />
              ))}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {eventCategories.map((_, index) => (
              <button
                key={index}
                onClick={() => setEventCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === eventCurrentIndex 
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-orange-50/50 rounded-3xl p-8 shadow-lg border border-orange-100 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                2,000+
              </div>
              <div className="text-gray-600 font-medium">Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                1,500+
              </div>
              <div className="text-gray-600 font-medium">Events</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                50K+
              </div>
              <div className="text-gray-600 font-medium">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                40+
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
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-12 py-7 text-lg font-semibold rounded-2xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-105"
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
