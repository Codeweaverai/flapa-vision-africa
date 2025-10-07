import React from 'react';
import Layout from './Layout';

interface CreatorLayoutProps {
  children: React.ReactNode;
}

const CreatorLayout: React.FC<CreatorLayoutProps> = ({ children }) => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Decorative background elements matching BecomeCreatorPage */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default CreatorLayout;
