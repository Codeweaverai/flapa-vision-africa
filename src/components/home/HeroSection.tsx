
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight, Star, Users, Award } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//pexels-olly-3769021.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Orange Purple Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/80 to-purple-600/80 z-10" />
      
      {/* Content */}
     <div className="relative z-20 container mx-auto px-4 text-center text-white">
  <div className="max-w-4xl mx-auto">
    <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-gray-100">
      Learn. Network. Elevate With!
    </h1>
    <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
      <span className="inline bg-gradient-to-r from-orange-200 to-purple-200 bg-clip-text text-transparent">
        SkillPulse
      </span>
    </h1>
    <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
      "Built for the Skill-Driven Generation"
       </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
  <Link to="/explore-courses">
    <Button 
      className="w-64 text-lg px-8 py-6 bg-white text-orange-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
    >
      <Play className="mr-2 h-5 w-5" />
      Start Learning Now
    </Button>
  </Link>
  <Link to="/explore-events">
    <Button 
      className="w-64 text-lg px-8 py-6 bg-white text-orange-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
    >
      Explore Events
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </Link>
</div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 mr-2" />
                <span className="text-3xl font-bold">10K+</span>
              </div>
              <p className="text-gray-200">Active Learners</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 mr-2" />
                <span className="text-3xl font-bold">500+</span>
              </div>
              <p className="text-gray-200">Expert Creators</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 mr-2" />
                <span className="text-3xl font-bold">4.9</span>
              </div>
              <p className="text-gray-200">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
      <div className="absolute bottom-40 right-20 w-32 h-32 bg-white/5 rounded-full animate-bounce" />
      <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse" />
    </section>
  );
};

export default HeroSection;
