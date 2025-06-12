import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, Briefcase, Palette, TrendingUp, Heart, Music, GraduationCap, Globe, MoreHorizontal } from 'lucide-react';
const categories = [{
  name: 'Technology',
  icon: Code,
  color: 'from-orange-400 to-purple-500',
  courses: '120+ Courses'
}, {
  name: 'Business',
  icon: Briefcase,
  color: 'from-purple-400 to-orange-500',
  courses: '85+ Courses'
}, {
  name: 'Design',
  icon: Palette,
  color: 'from-orange-500 to-purple-400',
  courses: '95+ Courses'
}, {
  name: 'Marketing',
  icon: TrendingUp,
  color: 'from-purple-500 to-orange-400',
  courses: '70+ Courses'
}, {
  name: 'Health',
  icon: Heart,
  color: 'from-orange-400 to-purple-600',
  courses: '60+ Courses'
}, {
  name: 'Music',
  icon: Music,
  color: 'from-purple-400 to-orange-600',
  courses: '45+ Courses'
}, {
  name: 'Education',
  icon: GraduationCap,
  color: 'from-orange-600 to-purple-400',
  courses: '80+ Courses'
}, {
  name: 'Language',
  icon: Globe,
  color: 'from-purple-600 to-orange-400',
  courses: '55+ Courses'
}];
const BrowseCategoriesSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const getFilteredCategories = () => {
    switch (activeTab) {
      case 'popular':
        return categories.slice(0, 4);
      case 'trending':
        return categories.slice(2, 6);
      case 'new':
        return categories.slice(4, 8);
      default:
        return categories;
    }
  };
  return <section className="py-20 bg-gradient-to-br from-gray-50 via-orange-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => <div key={i} className="absolute w-3 h-3 bg-gradient-to-r from-orange-400 to-purple-500 rounded-full opacity-20 animate-pulse" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${3 + Math.random() * 2}s`
      }} />)}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Browse Our Top Categories
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore diverse learning paths designed to accelerate your growth in today's most in-demand skills
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-fit mx-auto grid-cols-4 mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-full p-2 min-h-16 ">
            <TabsTrigger value="all" className="rounded-full px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium">
              All Categories
            </TabsTrigger>
            <TabsTrigger value="popular" className="rounded-full px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium">
              Popular
            </TabsTrigger>
            <TabsTrigger value="trending" className="rounded-full px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium">
              Trending
            </TabsTrigger>
            <TabsTrigger value="new" className="rounded-full px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium">
              New
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-12">
              {getFilteredCategories().map((category, index) => {
              const IconComponent = category.icon;
              return <Card key={category.name} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <CardContent className="relative z-10 p-8 text-center">
                      <div className="mb-4">
                        <IconComponent className="h-12 w-12 text-white mx-auto group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-100 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-white/80 text-sm font-medium">
                        {category.courses}
                      </p>
                    </CardContent>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <Link to={`/explore/courses?category=${category.name.toLowerCase()}`} className="absolute inset-0 z-20">
                      <span className="sr-only">Browse {category.name} courses</span>
                    </Link>
                  </Card>;
            })}
            </div>

            {/* View All Categories Button */}
            <div className="text-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 px-10 py-4 text-lg rounded-full group">
                <Link to="/explore/courses" className="flex items-center">
                  <MoreHorizontal className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  View All Categories
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>;
};
export default BrowseCategoriesSection;