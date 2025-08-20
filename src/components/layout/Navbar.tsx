import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Menu, 
  ShoppingCart, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  BookOpen, 
  Calendar, 
  Users, 
  MessageSquare,
  Home,
  GraduationCap,
  Briefcase,
  Mic,
  UserCheck,
  Camera,
  Play,
  Building,
  HelpCircle,
  FileText,
  Heart,
  DollarSign,
  BarChart3,
  Shield,
  Compass
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import CurrencySwitcher from '@/components/currency/CurrencySwitcher';
import CartIcon from '@/components/cart/CartIcon';
import InboxIcon from '@/components/inbox/InboxIcon';
import { 
  initializeNotificationSound, 
  setupNotificationListener, 
  setupInboxMessageListener 
} from '@/services/notificationService';

// Add missing notification service function with error handling
const fetchUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching notifications:', error);
    return [];
  }
};

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    initializeNotificationSound();

    if (user) {
      loadNotificationCount();
      fetchUserProfile();

      try {
        const unsubscribeNotifications = setupNotificationListener(user.id, (notification) => {
          console.log('New notification:', notification);
          loadNotificationCount();
        });

        const unsubscribeMessages = setupInboxMessageListener(user.id, async (message) => {
          console.log('New inbox message:', message);
          
          // Create notification for new message with proper error handling
          try {
            const { error } = await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                content: `New message: ${message.subject}`,
                type: 'message',
                related_id: message.id
              });

            if (error) {
              console.error('Error creating notification:', error);
            }
          } catch (error) {
            console.error('Network error creating notification:', error);
          }
        });

        // Subscribe to community notifications with error handling
        const communityChannel = supabase
          .channel('community-notifications')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, () => {
            loadNotificationCount();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to notifications');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to notifications channel');
            }
          });
        
        return () => {
          try {
            unsubscribeNotifications();
            unsubscribeMessages();
            supabase.removeChannel(communityChannel);
          } catch (error) {
            console.error('Error cleaning up subscriptions:', error);
          }
        };
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name, username')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Network error in fetchUserProfile:', error);
    }
  };

  const loadNotificationCount = async () => {
    if (!user) return;
    
    try {
      const notifications = await fetchUserNotifications(user.id);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Error loading notification count:', error);
      setUnreadNotifications(0);
    }
  };

  const navLinks = [
    { name: 'Explore', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'My Learning', path: '/my-courses' },
    { name: 'Community', path: '/community' },
    { name: 'Help Center', path: '/help' },
    { name: 'Become a Creator', path: '/become-creator' },
  
  ];

  const exploreLinks = [
    { name: 'Explore Courses', path: '/explore-courses' },
    { name: 'Explore Events', path: '/explore-events' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
              <CartIcon />
              <InboxIcon />
              <CurrencySwitcher />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all duration-200"
                onClick={() => navigate('/community?tab=notifications')}
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 animate-pulse"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-9 w-9 p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userProfile?.avatar_url || "https://github.com/shadcn.png"} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                        {userProfile?.full_name?.charAt(0) || user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-courses')}>
                    My Learning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                    My Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/gift-cards')}>
                   Buy Gift Cards
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/explore-courses')}>
                    Explore Courses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/explore-events')}>
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
            <>
              <CurrencySwitcher />
              
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow hover:shadow-md">
               <Link 
                to="/auth"
                 className="flex items-center justify-center w-full h-full px-4 py-2"
                >
                Sign In
                </Link>
              </Button>
            </>
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
                 <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow hover:shadow-md">
  <Link 
    to="/auth" 
    onClick={() => setIsMenuOpen(false)}
    className="flex items-center justify-center w-full h-full px-4 py-2"
  >
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
