import { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import { CommunitySidebar } from './CommunitySidebar';

interface CommunityLayoutProps {
  children: ReactNode;
}

const CommunityLayout = ({ children }: CommunityLayoutProps) => {
  return (
    <Layout>
      <div className="bg-gradient-to-br from-orange-50/50 via-purple-50/50 to-pink-50/50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Skillpulse Community
            </h1>
            <p className="text-gray-600">Connect, learn, and grow together</p>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex gap-6 w-full">
            {/* Left Sidebar */}
            <div className="hidden lg:block shrink-0">
              <CommunitySidebar />
            </div>

            {/* Main Feed Area - Increased width */}
            <div className="flex-1 min-w-0 lg:max-w-4xl mx-auto lg:mx-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityLayout;
