
import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

export interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
