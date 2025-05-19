
import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  Mic, 
  Settings, 
  LogOut,
  Menu,
  X,
  PenSquare
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string; // Added title as an optional prop
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Get user avatar and initials
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setUserAvatar(user.user_metadata.avatar_url);
    }
  }, [user]);

  // Get user initials for avatar fallback
  const getUserInitials = (): string => {
    if (!user) return 'U';
    
    const name = user.user_metadata?.full_name || user.email || '';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Check if user is an admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        // Admin role check would go here if needed
      } else {
        navigate('/admin/login');
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  const navigationItems = [
    { name: 'Dashboard', icon: <Home className="h-4 w-4 mr-3" />, path: '/admin' },
    { name: 'Users', icon: <Users className="h-4 w-4 mr-3" />, path: '/admin/users' },
    { name: 'Events', icon: <Calendar className="h-4 w-4 mr-3" />, path: '/admin/events' },
    { name: 'Courses', icon: <BookOpen className="h-4 w-4 mr-3" />, path: '/admin/courses' },
    { name: 'Quizzes', icon: <PenSquare className="h-4 w-4 mr-3" />, path: '/admin/quizzes' },
    { name: 'Registrations', icon: <ClipboardList className="h-4 w-4 mr-3" />, path: '/admin/registrations' },
    { name: 'Consultations', icon: <MessageSquare className="h-4 w-4 mr-3" />, path: '/admin/consultations' },
    { name: 'Speaking', icon: <Mic className="h-4 w-4 mr-3" />, path: '/admin/speaking' },
    { name: 'Settings', icon: <Settings className="h-4 w-4 mr-3" />, path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar className="border-r w-64 h-screen fixed">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-1">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Manage your content</p>
          </div>
          <Separator />
          <div className="py-4">
            <nav className="space-y-1 px-3">
              {navigationItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={`w-full justify-start mb-1 ${
                      isActive(item.path) ? "bg-secondary" : ""
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={userAvatar || ''} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium truncate max-w-[120px]">
                    {user?.user_metadata?.full_name || user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground">Admin</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Sidebar>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title || 'Admin Panel'}</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-20 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-background transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-16 pb-4 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 px-3 py-2">
              {navigationItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={`w-full justify-start mb-1 ${
                      isActive(item.path) ? "bg-secondary" : ""
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={userAvatar || ''} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium truncate max-w-[120px]">
                    {user?.user_metadata?.full_name || user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground">Admin</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <div className="pt-4 md:pt-0">
          {/* Mobile padding to account for fixed header */}
          <div className="md:hidden h-16"></div>
          {title && (
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
