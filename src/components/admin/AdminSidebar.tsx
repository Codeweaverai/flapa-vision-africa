
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Mic, 
  MessageSquare, 
  Settings,
  Layers,
  FileCheck,
  FileText
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const menuItems = [
    { icon: LayoutDashboard, text: 'Dashboard', path: '/admin' },
    { icon: Calendar, text: 'Events', path: '/admin/events' },
    { icon: FileCheck, text: 'Registrations', path: '/admin/registrations' },
    { icon: Users, text: 'Users', path: '/admin/users' },
    { icon: Mic, text: 'Speaking', path: '/admin/speaking' },
    { icon: MessageSquare, text: 'Consultations', path: '/admin/consultations' },
    { icon: Layers, text: 'Courses', path: '/admin/courses' },
    { icon: FileText, text: 'Media', path: '/admin/media' },
    { icon: Settings, text: 'Settings', path: '/admin/settings' },
  ];
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-xl font-semibold">Admin Portal</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to site
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
