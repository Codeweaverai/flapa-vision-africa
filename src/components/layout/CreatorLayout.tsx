
import React from 'react';
import Layout from './Layout';

interface CreatorLayoutProps {
  children: React.ReactNode;
}

const CreatorLayout: React.FC<CreatorLayoutProps> = ({ children }) => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default CreatorLayout;
