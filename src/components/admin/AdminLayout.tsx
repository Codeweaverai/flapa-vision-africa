
import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

export interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {title && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>
            )}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0 p-6">
              {children}
            </div>
          </div>
        </div>
        <AdminFooter />
      </div>
    </div>
  );
};

export default AdminLayout;
