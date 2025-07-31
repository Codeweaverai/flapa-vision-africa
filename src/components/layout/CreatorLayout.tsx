
import React from 'react';
import Layout from './Layout';

interface CreatorLayoutProps {
  children: React.ReactNode;
}

const CreatorLayout: React.FC<CreatorLayoutProps> = ({ children }) => {
  return (
    <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-200 via-purple-200 to-primary/20">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default CreatorLayout;
