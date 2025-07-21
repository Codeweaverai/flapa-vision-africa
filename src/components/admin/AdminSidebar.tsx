
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  ShoppingCart, 
  Star, 
  BarChart3, 
  Settings,
  FileText,
  Mail,
  UserCheck,
  MessageSquare,
  Phone,
  Briefcase,
  MessageCircle,
  DollarSign,
  Headphones,
  HelpCircle
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: BookOpen, label: 'Courses', href: '/admin/courses' },
    { icon: Calendar, label: 'Events', href: '/admin/events' },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: Star, label: 'Reviews', href: '/admin/reviews' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: FileText, label: 'Media', href: '/admin/media' },
    { icon: Mail, label: 'Newsletters', href: '/admin/newsletters' },
    { icon: UserCheck, label: 'Registrations', href: '/admin/registrations' },
    { icon: MessageSquare, label: 'Consultations', href: '/admin/consultations' },
    { icon: Phone, label: 'Speaking', href: '/admin/speaking' },
    { icon: Briefcase, label: 'Careers', href: '/admin/careers' },
    { icon: MessageCircle, label: 'Contact', href: '/admin/contact-submissions' },
    { icon: DollarSign, label: 'Payouts', href: '/admin/payouts' },
    { icon: Headphones, label: 'Support Inbox', href: '/admin/support-inbox' },
    { icon: HelpCircle, label: 'Help Center', href: '/admin/help-center' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="w-64 bg-white/90 backdrop-blur-sm shadow-xl border-r border-gray-200/50 h-screen overflow-y-auto">
      <div className="p-6">
        <Link to="/admin/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
        </Link>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-orange-500/10 to-purple-600/10 text-orange-600 border-l-4 border-orange-500"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-orange-500" : "text-gray-400")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
