
import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, BookOpen, Calendar, Users, BarChart, Settings, DollarSign } from 'lucide-react';
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
      icon: <Rocket className="h-5 w-5 mr-2" />
    },
    {
      label: 'Courses',
      href: '/creator/courses',
      icon: <BookOpen className="h-5 w-5 mr-2" />
    },
    {
      label: 'Events',
      href: '/creator/events',
      icon: <Calendar className="h-5 w-5 mr-2" />
    },
    {
      label: 'inbox',
      href: '/inbox',
      icon: <BookOpen className="h-5 w-5 mr-2" />
    },
    {
      label: 'Students',
      href: '/creator/students',
      icon: <Users className="h-5 w-5 mr-2" />
    },
    {
      label: 'Payments',
      href: '/creator/payments',
      icon: <DollarSign className="h-5 w-5 mr-2" />
    },
    {
      label: 'Analytics',
      href: '/creator/analytics',
      icon: <BarChart className="h-5 w-5 mr-2" />
    },
    {
      label: 'Ticket Verification',
      href: '/ticket-verification',
      icon: <Calendar className="h-5 w-5 mr-2" />
    },
    {
      label: 'Settings',
      href: '/creator/settings',
      icon: <Settings className="h-5 w-5 mr-2" />
    }
  ];
  
  return (
    <Layout>
      <div className="section-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Card className="p-4">
              <div className="mb-4 flex items-center space-x-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Creator Portal</h2>
              </div>
              
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      location.pathname === item.href && "bg-primary/10 text-primary font-medium"
                    )}
                    asChild
                  >
                    <Link to={item.href}>
                      {item.icon}
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
              
              <div className="mt-8 pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/account">
                    Back to My Account
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            {title && (
              <h1 className="text-2xl font-bold mb-6">{title}</h1>
            )}
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatorLayout;
