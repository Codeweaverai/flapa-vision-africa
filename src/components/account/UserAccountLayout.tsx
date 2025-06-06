
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAccountSidebar from './UserAccountSidebar';
import Layout from '@/components/layout/Layout';

interface UserAccountLayoutProps {
  children: React.ReactNode;
}

const UserAccountLayout: React.FC<UserAccountLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar */}
          <UserAccountSidebar />
          
          {/* Main Content */}
          <div className="bg-white px-6 py-8 rounded-lg border shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserAccountLayout;
