
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    {
      id: 'explore',
      label: 'Explore',
      icon: Home,
      path: '/',
      color: 'text-orange-500'
    },
    {
      id: 'learning',
      label: 'My Learning',
      icon: BookOpen,
      path: '/learning',
      color: 'text-purple-500'
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: ShoppingBag,
      path: '/my-orders',
      color: 'text-pink-500'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: user ? '/profile' : '/auth',
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
      <div className="mx-4 mb-4">
        <div className="bg-gradient-to-r from-orange-400 to-purple-600 rounded-full shadow-2xl backdrop-blur-lg">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-2">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center justify-center px-4 py-3 rounded-2xl transition-all duration-300 ${
                      active 
                        ? 'bg-white/20 shadow-lg transform scale-105' 
                        : 'hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    <Icon 
                      className={`h-5 w-5 mb-1 transition-colors duration-300 ${
                        active ? 'text-white' : 'text-white/70'
                      }`} 
                    />
                    <span 
                      className={`text-xs font-medium transition-colors duration-300 ${
                        active ? 'text-white' : 'text-white/70'
                      }`}
                    >
                      {item.label}
                    </span>
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
