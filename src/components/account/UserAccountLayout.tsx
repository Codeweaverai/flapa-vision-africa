import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Book, 
  Calendar, 
  Phone, 
  User, 
  Settings, 
  LayoutDashboard,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface UserAccountLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const UserAccountLayout: React.FC<UserAccountLayoutProps> = ({ 
  children,
  activeTab = 'profile'
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: 'My Courses',
      href: '/account/courses',
      icon: Book,
      id: 'courses',
    },
    {
      name: 'My Events',
      href: '/account/events',
      icon: Calendar,
      id: 'events',
    },
    {
      name: 'My Consultations',
      href: '/account/consultations',
      icon: Phone,
      id: 'consultations',
    },
    {
      name: 'Profile',
      href: '/account/profile',
      icon: User,
      id: 'profile',
    },
    {
      name: 'Settings',
      href: '/account/settings',
      icon: Settings,
      id: 'settings',
    },
  ];

  const handleCreatorDashboardClick = async () => {
    try {
      // Check if user is a creator
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_creator')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (profile?.is_creator) {
        navigate('/creator');
      } else {
        // If not a creator, show modal or navigate to creator application page
        toast.info('You need to become a creator to access the creator dashboard');
        navigate('/account/settings?apply=creator');
      }
    } catch (error) {
      console.error('Error checking creator status:', error);
      toast.error('Failed to verify creator status');
    }
  };

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Dashboard Button */}
          <Button 
            onClick={handleCreatorDashboardClick}
            className="w-full justify-start bg-light-purple hover:bg-light-purple/80"
          >
            <LayoutDashboard className="h-5 w-5 mr-2" /> 
            Creator Dashboard
          </Button>
          
          {/* Navigation */}
          <div className="bg-white/30 p-4 rounded-lg border shadow-sm space-y-2">
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive ? "" : "text-muted-foreground"}`}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </div>
          
          {/* Subscription Card */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-medium mb-2">Your Subscription</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Free Account
            </p>
            <Button size="sm" className="w-full" variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-white px-6 py-8 rounded-lg border shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default UserAccountLayout;
