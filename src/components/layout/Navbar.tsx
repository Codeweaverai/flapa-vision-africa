import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Compass, Menu } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserNotifications } from '@/services/communityService';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotificationCount();

      // Set up realtime subscription for notifications
      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user?.id}` 
          }, 
          () => {
            loadNotificationCount();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotificationCount = async () => {
    if (!user) return;
    
    const notifications = await fetchUserNotifications(user.id);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    setUnreadNotifications(unreadCount);
  };

  const navLinks = [
    { name: 'Explore', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Learning', path: '/learning' },
    { name: 'Community', path: '/community' },
    { name: 'Media', path: '/media' },
    { name: 'Contact', path: '/contact' },
    { name: 'Help Center', path: '/help' },
    { name: 'Become a Creator', path: '/become-creator' },
  ];

  const exploreLinks = [
    { name: 'Explore Courses', path: '/explore/courses' },
    { name: 'Explore Events', path: '/explore/events' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary' : 'text-foreground';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 flex h-20 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              SkillPulse
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`${isActive(link.path)} font-medium hover:text-primary transition-colors`}
              >
                {link.name}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1">
                  <Compass className="h-4 w-4 mr-1" />
                  Explore
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {exploreLinks.map((link) => (
                  <DropdownMenuItem key={link.name} asChild>
                    <Link to={link.path}>{link.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                    variant="destructive"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-9 w-9 p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>
                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-courses')}>
                    My Courses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-events')}>
                    My Events
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/explore/courses')}>
                    Explore Courses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/explore/events')}>
                    Explore Events
                  </DropdownMenuItem>
                  {user.user_metadata?.is_creator || user.user_metadata?.role === 'creator' ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/creator/dashboard')}>
                        Creator Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/creator/payments')}>
                        Payments & Payouts
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  {user.user_metadata?.role === 'admin' ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader className="mb-4">
                <SheetTitle>
                  <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                    SkillPulse
                  </span>
                </SheetTitle>
                <SheetDescription>Navigate through our platform</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`${isActive(link.path)} font-medium text-lg py-2`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Explore</p>
                  {exploreLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`${isActive(link.path)} font-medium text-lg py-2 block`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="h-px bg-border my-2" />
                {!user && (
                  <Button asChild>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
