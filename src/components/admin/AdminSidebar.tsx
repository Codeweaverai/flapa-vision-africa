
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  ShoppingCart, 
  Star, 
  PlayCircle, 
  Mail, 
  BarChart3, 
  Settings, 
  MessageSquare, 
  Phone, 
  Mic, 
  Briefcase, 
  HeadphonesIcon,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Payouts', href: '/admin/payouts', icon: DollarSign },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Media', href: '/admin/media', icon: PlayCircle },
  { name: 'Newsletters', href: '/admin/newsletters', icon: Mail },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Contact', href: '/admin/contact-submissions', icon: MessageSquare },
  { name: 'Consultations', href: '/admin/consultations', icon: Phone },
  { name: 'Speaking', href: '/admin/speaking', icon: Mic },
  { name: 'Careers', href: '/admin/careers', icon: Briefcase },
  { name: 'Support Inbox', href: '/admin/support-inbox', icon: HeadphonesIcon },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          Admin Panel
        </h2>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
