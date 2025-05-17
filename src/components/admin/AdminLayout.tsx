
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin-login');
  };

  return (
    <div className="flex min-h-screen bg-light-purple">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
        </div>
        
        <div className="py-4">
          <nav>
            <ul className="space-y-1">
              <li>
                <Link 
                  to="/admin" 
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-100"
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/events" 
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-100"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  Events
                </Link>
              </li>
              <li className="border-t mt-4 pt-4">
                <Link 
                  to="/admin/profile" 
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-100"
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-purple-100"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
