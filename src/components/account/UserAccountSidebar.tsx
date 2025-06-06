import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User, BookOpen, Calendar, MessageSquare, Settings, Package } from 'lucide-react';

const UserAccountSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: User, label: 'Profile', path: '/account/profile' },
    { icon: BookOpen, label: 'My Courses', path: '/account/courses' },
    { icon: Calendar, label: 'My Events', path: '/account/events' },
    { icon: Package, label: 'My Orders', path: '/account/orders' }, // Add this line
    { icon: MessageSquare, label: 'Consultations', path: '/account/consultations' },
    { icon: Settings, label: 'Settings', path: '/account/settings' },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-r bg-secondary">
      <div className="h-full p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center p-2 rounded-md hover:bg-accent ${location.pathname === item.path ? 'bg-accent font-medium' : ''}`}
          >
            <item.icon className="w-5 h-5 mr-2" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UserAccountSidebar;
