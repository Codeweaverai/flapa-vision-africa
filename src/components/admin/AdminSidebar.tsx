
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Users,
  BookOpen,
  FileText,
  PhoneCall,
  Settings,
  Mic,
  ClipboardCheck,
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <BarChart3 className="mr-2 h-4 w-4" /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="mr-2 h-4 w-4" /> },
    { name: 'Events', path: '/admin/events', icon: <CalendarDays className="mr-2 h-4 w-4" /> },
    { name: 'Users', path: '/admin/users', icon: <Users className="mr-2 h-4 w-4" /> },
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { name: 'Media', path: '/admin/media', icon: <FileText className="mr-2 h-4 w-4" /> },
    { name: 'Consultations', path: '/admin/consultations', icon: <PhoneCall className="mr-2 h-4 w-4" /> },
    { name: 'Speaking', path: '/admin/speaking', icon: <Mic className="mr-2 h-4 w-4" /> },
    { name: 'Registrations', path: '/admin/registrations', icon: <ClipboardCheck className="mr-2 h-4 w-4" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="h-screen w-64 border-r bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b dark:border-gray-800">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-md ${
                isActive(item.path)
                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
