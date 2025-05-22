
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Calendar,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  Mic
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  href,
  active,
}) => {
  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Admin Panel
        </h2>
        <div className="space-y-1">
          <SidebarItem
            icon={<Home className="h-4 w-4" />}
            label="Dashboard"
            href="/admin"
            active={location.pathname === '/admin'}
          />
          <SidebarItem
            icon={<BarChart className="h-4 w-4" />}
            label="Analytics"
            href="/admin/analytics"
            active={location.pathname === '/admin/analytics'}
          />
          <SidebarItem
            icon={<Users className="h-4 w-4" />}
            label="Users"
            href="/admin/users"
            active={location.pathname === '/admin/users'}
          />
          <SidebarItem
            icon={<Calendar className="h-4 w-4" />}
            label="Events"
            href="/admin/events"
            active={location.pathname.startsWith('/admin/events')}
          />
          <SidebarItem
            icon={<BookOpen className="h-4 w-4" />}
            label="Courses"
            href="/admin/courses"
            active={location.pathname.startsWith('/admin/courses')}
          />
          <SidebarItem
            icon={<FileText className="h-4 w-4" />}
            label="Media"
            href="/admin/media"
            active={location.pathname.startsWith('/admin/media')}
          />
          <SidebarItem
            icon={<MessageSquare className="h-4 w-4" />}
            label="Consultations"
            href="/admin/consultations"
            active={location.pathname === '/admin/consultations'}
          />
          <SidebarItem
            icon={<Mic className="h-4 w-4" />}
            label="Speaking"
            href="/admin/speaking"
            active={location.pathname === '/admin/speaking'}
          />
          <SidebarItem
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            href="/admin/settings"
            active={location.pathname === '/admin/settings'}
          />
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
