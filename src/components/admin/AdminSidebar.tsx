
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Calendar,
  ChevronLeft,
  Users,
  Settings,
  LogOut,
  Menu,
  MessageCircle,
  FileText,
  BookOpen,
  Home,
  Image
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: MessageCircle, label: 'Consultations', path: '/admin/consultations' },
    { icon: Calendar, label: 'Events', path: '/admin/events' },
    { icon: FileText, label: 'Registrations', path: '/admin/registrations' },
    { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
    { icon: Image, label: 'Media', path: '/admin/media' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BarChart, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin-login';
  };

  return (
    <aside
      className={`bg-background border-r transition-all duration-300 h-screen flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b">
        {!collapsed && <h1 className="text-lg font-semibold">Admin Panel</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Button
                  asChild
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  size={collapsed ? "icon" : "default"}
                  className={`w-full justify-start ${isActive(item.path) ? "bg-secondary" : ""}`}
                >
                  <Link to={item.path}>
                    <item.icon size={20} className={collapsed ? "" : "mr-2"} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>

      <div className="p-2 border-t">
        {!collapsed && (
          <div className="mb-2 p-2">
            <p className="text-sm font-medium truncate">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut size={20} className={collapsed ? "" : "mr-2"} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
