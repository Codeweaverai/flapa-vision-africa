import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, User, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    {
      id: 'explore',
      icon: Home,
      path: '/',
      color: 'text-orange-500'
    },
    {
      id: 'learning',
      icon: BookOpen,
      path: '/my-courses',
      color: 'text-purple-500'
    },
    {
      id: 'wishlist',
      icon: Heart,
      path: '/wishlist',
      color: 'text-red-500'
    },
    {
      id: 'orders',
      icon: ShoppingBag,
      path: '/my-orders',
      color: 'text-pink-500'
    },
    {
      id: 'profile',
      icon: User,
      path: user ? '/account' : '/auth',
      color: 'text-indigo-500'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-2 mb-2">
        <div className="bg-gradient-to-r from-orange-400 to-purple-600 rounded-full shadow-2xl backdrop-blur-lg">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-1">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center justify-center p-2.5 rounded-full transition-all duration-300 ${
                      active 
                        ? 'bg-white/20 shadow-lg' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon 
                      className={`h-5 w-5 transition-colors duration-300 ${
                        active ? 'text-white' : 'text-white/70'
                      }`} 
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
