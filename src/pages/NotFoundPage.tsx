
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const NotFoundPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* Floating 404 Image */}
          <div className="mb-8 relative">
            <div className="w-64 h-64 mx-auto mb-6 relative">
              <img 
                src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//3959810.jpg" 
                alt="404 Not Found" 
                className="w-full h-full object-contain rounded-2xl shadow-2xl animate-bounce"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
            
            {/* Floating 404 Text */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="text-8xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                404
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Oops! Page Not Found
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow-sm">
              The page you're looking for seems to have wandered off into the digital wilderness. 
              Don't worry, we'll help you find your way back to learning!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-orange-50 hover:text-orange-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Link to="/courses">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore Courses
                </Link>
              </Button>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <p className="text-white/80 text-sm mb-4">Popular destinations:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link 
                  to="/courses" 
                  className="text-white/90 hover:text-white text-sm underline hover:no-underline transition-all duration-200 hover:scale-105 transform"
                >
                  My Learning
                </Link>
                <span className="text-white/60">•</span>
                <Link 
                  to="/events" 
                  className="text-white/90 hover:text-white text-sm underline hover:no-underline transition-all duration-200 hover:scale-105 transform"
                >
                  Events
                </Link>
                <span className="text-white/60">•</span>
                <Link 
                  to="/profile" 
                  className="text-white/90 hover:text-white text-sm underline hover:no-underline transition-all duration-200 hover:scale-105 transform"
                >
                  Profile
                </Link>
                <span className="text-white/60">•</span>
                <Link 
                  to="/contact" 
                  className="text-white/90 hover:text-white text-sm underline hover:no-underline transition-all duration-200 hover:scale-105 transform"
                >
                  Help Center
                </Link>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-16 w-12 h-12 bg-orange-300/30 rounded-full animate-bounce delay-200"></div>
          <div className="absolute bottom-20 left-16 w-16 h-16 bg-purple-300/30 rounded-full animate-pulse delay-500"></div>
          <div className="absolute bottom-40 right-10 w-8 h-8 bg-pink-300/40 rounded-full animate-bounce delay-700"></div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
