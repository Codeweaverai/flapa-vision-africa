
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
  DollarSign,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  { name: 'Help Center', href: '/admin/help-center', icon: HelpCircle },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-gradient-to-b from-orange-50 via-purple-50 to-pink-50 shadow-lg border-r border-orange-200/50">
      <div className="p-6 border-b border-orange-200/30">
        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          SkillPulse
        </h2>
      </div>
      
      <ScrollArea className="h-[calc(100vh-100px)]">
        <nav className="mt-6 pb-6">
          <div className="px-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-3 mb-2 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 hover:text-orange-700 hover:shadow-md hover:transform hover:scale-102'
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 transition-transform duration-200",
                    isActive ? "text-white" : "text-orange-600 group-hover:text-orange-700"
                  )} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white opacity-80"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </ScrollArea>
    </div>
  );
};

export default AdminSidebar;
