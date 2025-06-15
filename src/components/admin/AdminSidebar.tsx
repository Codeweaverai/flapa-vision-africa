
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
  Briefcase,
  Package,
  MessageSquareMore,
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <BarChart3 className="mr-2 h-4 w-4" /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="mr-2 h-4 w-4" /> },
    { name: 'Orders', path: '/admin/orders', icon: <Package className="mr-2 h-4 w-4" /> },
    { name: 'Events', path: '/admin/events', icon: <CalendarDays className="mr-2 h-4 w-4" /> },
    { name: 'Users', path: '/admin/users', icon: <Users className="mr-2 h-4 w-4" /> },
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { name: 'Media', path: '/admin/media', icon: <FileText className="mr-2 h-4 w-4" /> },
    { name: 'Support Inbox', path: '/admin/support-inbox', icon: <MessageSquareMore className="mr-2 h-4 w-4" /> },
    { name: 'Consultations', path: '/admin/consultations', icon: <PhoneCall className="mr-2 h-4 w-4" /> },
    { name: 'Speaking', path: '/admin/speaking', icon: <Mic className="mr-2 h-4 w-4" /> },
    { name: 'Careers', path: '/admin/careers', icon: <Briefcase className="mr-2 h-4 w-4" /> },
    { name: 'Registrations', path: '/admin/registrations', icon: <ClipboardCheck className="mr-2 h-4 w-4" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-orange-500 via-purple-500 to-purple-600 shadow-xl">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-white/20">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-orange-100 text-sm mt-1">Management Dashboard</p>
        </div>
        
        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                  : 'text-orange-100 hover:bg-white/10 hover:text-white hover:shadow-md'
              }`}
            >
              <span className={isActive(item.path) ? 'text-white' : 'text-orange-200'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-white/20">
          <div className="text-orange-100 text-xs text-center">
            © 2024 Learning Platform
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
