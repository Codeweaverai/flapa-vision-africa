import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  ShoppingCart, 
  Video, 
  Mail, 
  MessageSquare, 
  Mic, 
  HelpCircle, 
  Briefcase, 
  Inbox, 
  BarChart3, 
  Settings,
  Star
} from 'lucide-react';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/admin/dashboard',
      description: 'Overview and analytics'
    },
    { 
      label: 'Users', 
      icon: Users, 
      path: '/admin/users',
      description: 'User management'
    },
    { 
      label: 'Courses', 
      icon: BookOpen, 
      path: '/admin/courses',
      description: 'Course management'
    },
    { 
      label: 'Events', 
      icon: Calendar, 
      path: '/admin/events',
      description: 'Event management'
    },
    { 
      label: 'Orders', 
      icon: ShoppingCart, 
      path: '/admin/orders',
      description: 'Order management'
    },
    { 
      label: 'Reviews', 
      icon: Star, 
      path: '/admin/reviews',
      description: 'Review management'
    },
    { 
      label: 'Media', 
      icon: Video, 
      path: '/admin/media',
      description: 'Media content'
    },
    { 
      label: 'Newsletters', 
      icon: Mail, 
      path: '/admin/newsletters',
      description: 'Newsletter campaigns'
    },
    { 
      label: 'Consultations', 
      icon: MessageSquare, 
      path: '/admin/consultations',
      description: 'Consultation bookings'
    },
    { 
      label: 'Speaking', 
      icon: Mic, 
      path: '/admin/speaking',
      description: 'Speaking requests'
    },
    { 
      label: 'Contact', 
      icon: HelpCircle, 
      path: '/admin/contact-submissions',
      description: 'Contact submissions'
    },
    { 
      label: 'Careers', 
      icon: Briefcase, 
      path: '/admin/careers',
      description: 'Job applications'
    },
    { 
      label: 'Support Inbox', 
      icon: Inbox, 
      path: '/admin/support-inbox',
      description: 'Support messages'
    },
    { 
      label: 'Analytics', 
      icon: BarChart3, 
      path: '/admin/analytics',
      description: 'Platform analytics'
    },
    { 
      label: 'Settings', 
      icon: Settings, 
      path: '/admin/settings',
      description: 'System settings'
    },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-r bg-secondary">
      <div className="h-full p-4 space-y-2">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-500">Manage platform content</p>
        </div>
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
        <div className="mt-auto pt-4 border-t">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
          >
            Back to Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
