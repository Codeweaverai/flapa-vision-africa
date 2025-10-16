import React, { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, BookOpen, Calendar, Users, BarChart, Settings, DollarSign, Building2, Activity, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface CreatorLayoutProps {
  children: ReactNode;
  title?: string;
}

const CreatorLayout = ({ children, title }: CreatorLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // Check if user is a creator
      const { data, error } = await supabase
        .from('profiles')
        .select('is_creator')
        .eq('id', user.id)
        .single();
        
      if (error || !data?.is_creator) {
        navigate('/account');
      }
    };
    
    checkCreatorStatus();
  }, [user, navigate]);
  
  const navItems = [
    {
      label: 'Dashboard',
      href: '/creator/dashboard',
      icon: <Rocket className="h-5 w-5" />
    },
    {
      label: 'Courses',
      href: '/creator/courses',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      label: 'Events',
      href: '/creator/events',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      label: 'Workspaces',
      href: '/creator/workplaces',
      icon: <Building2 className="h-5 w-5" />
    },
    {
      label: 'Recent Activities',
      href: '/creator/activities',
      icon: <Activity className="h-5 w-5" />
    },
    {
      label: 'inbox',
      href: '/inbox',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      label: 'Students',
      href: '/creator/students',
      icon: <Users className="h-5 w-5" />
    },
    {
      label: 'Payments',
      href: '/creator/payments',
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      label: 'Analytics',
      href: '/creator/analytics',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      label: 'Attendee Management',
      href: '/creator/attendees',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      label: 'Ticket Verification',
      href: '/ticket-verification',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      label: 'Creator Settings',
      href: '/creator/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];
  
  // Gradient icon component
  const GradientIcon = ({ children, isActive }: { children: React.ReactNode; isActive: boolean }) => (
    <div className={cn(
      "mr-2 p-1 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 text-white",
      isActive ? "opacity-100" : "opacity-70"
    )}>
      {children}
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Decorative background elements matching other pages */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <div className="mb-4 flex items-center space-x-2">
                  <div className="rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 p-2 text-white">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Creator Portal
                  </h2>
                </div>
                
                {/* Quick Actions */}
                <div className="mb-4 space-y-2">
                  <Button
                    onClick={() => navigate('/creator/courses/create-with-ai')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Create with AI 🤖
                  </Button>
                  <Button
                    onClick={() => navigate('/creator/courses/create')}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
                
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start transition-all duration-200",
                          isActive 
                            ? "bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 text-gray-900 font-medium shadow-sm" 
                            : "hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-purple-50/50"
                        )}
                        asChild
                      >
                        <Link to={item.href}>
                          <GradientIcon isActive={isActive}>
                            {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                          </GradientIcon>
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
                
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    asChild
                  >
                    <Link to="/account">
                      Back to My Account
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 p-6">
                {title && (
                  <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatorLayout;
